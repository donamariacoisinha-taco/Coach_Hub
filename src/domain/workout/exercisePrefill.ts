import { planSetCount } from './planColumns';
import { type PrefillSet } from './setPersistence';

export type { PrefillSet };

export type PrefillExercise = {
  exercise_id: string;
  sets_json?: PrefillSet[] | null;
  sets?: number | null;
  reps?: number | string | null;
  weight?: number | string | null;
  rest_time?: number | null;
  default_rpe?: number | null;
};

/** A log is identified only by exercise_id. Plan and position are not part of the key. */
export type ExercisePerformanceLog = {
  exercise_id: string;
  set_number?: number | null;
  weight: number;
  reps: number;
  rpe?: number | null;
  rest_time?: number | null;
  created_at?: string | null;
  category_id?: string | null;
  history_id?: string | null;
};

/** The sets stored on this exercise. Another row's prescription is never consulted. */
export function ownPrescriptionSets(exercise: PrefillExercise): PrefillSet[] {
  const listed = Array.isArray(exercise.sets_json) ? exercise.sets_json : [];
  if (listed.length > 0) return listed.map((set) => ({ ...set }));
  const count = Math.max(1, Math.trunc(Number(exercise.sets) || 3));
  return Array.from({ length: count }, () => ({
    reps: exercise.reps ?? '12',
    weight: Number(exercise.weight ?? 0),
    rest_time: Number(exercise.rest_time ?? 60),
    rpe: Number(exercise.default_rpe ?? 8),
  }));
}

function loggedAt(log: ExercisePerformanceLog): number {
  const parsed = Date.parse(log.created_at || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Newest log of each exercise, from any plan. */
export function latestLogByExerciseId(logs: ExercisePerformanceLog[]): Map<string, ExercisePerformanceLog> {
  const map = new Map<string, ExercisePerformanceLog>();
  for (const log of logs) {
    if (!log?.exercise_id) continue;
    const previous = map.get(log.exercise_id);
    if (!previous || loggedAt(log) >= loggedAt(previous)) map.set(log.exercise_id, log);
  }
  return map;
}

function isPlaceholderSet(set: PrefillSet | undefined): boolean {
  if (!set) return true;
  return Number(set.weight ?? 0) === 0 && String(set.reps ?? '12') === '12';
}

/** Sets from the newest session of this exercise only, ordered by set number. */
export function lastSessionSetsForExercise(logs: ExercisePerformanceLog[], exerciseId: string): ExercisePerformanceLog[] {
  const mine = logs.filter((log) => log?.exercise_id === exerciseId);
  if (!mine.length) return [];
  let newestId = mine[0].history_id || '';
  let newestAt = loggedAt(mine[0]);
  for (const log of mine) {
    const at = loggedAt(log);
    if (at >= newestAt) {
      newestAt = at;
      newestId = log.history_id || '';
    }
  }
  return mine
    .filter((log) => (log.history_id || '') === newestId)
    .sort((a, b) => Number(a.set_number || 0) - Number(b.set_number || 0));
}

/**
 * Set N comes from set N of the last session of this exercise_id.
 * Without a log, a saved prescription wins over the empty 0x12 placeholder.
 * The ficha decides how many sets exist. A longer log or prescription is clipped.
 */
export function prefillExercise(
  exercise: PrefillExercise,
  log: ExercisePerformanceLog | ExercisePerformanceLog[] | null | undefined,
  prescription?: PrefillSet[] | null,
): PrefillSet[] {
  const session = Array.isArray(log)
    ? lastSessionSetsForExercise(log, exercise.exercise_id)
    : (log && log.exercise_id === exercise.exercise_id ? [log] : []);
  const saved = Array.isArray(prescription) && prescription.length > 0 ? prescription : null;
  const plan = Array.isArray(exercise.sets_json) && exercise.sets_json.length > 0 ? exercise.sets_json : null;
  const count = planSetCount(exercise, 1);
  return Array.from({ length: count }, (_, index) => {
    const planned = plan?.[index] || saved?.[index] || ownPrescriptionSets({ ...exercise, sets: 1, sets_json: null })[0];
    const logged = session.find((row) => row.set_number != null && Number(row.set_number) === index + 1)
      || (index === 0 ? session.find((row) => row.set_number == null) : undefined);
    if (logged && logged.exercise_id === exercise.exercise_id) {
      return {
        ...planned,
        weight: Number(logged.weight),
        reps: Number(logged.reps),
        rpe: Number(logged.rpe ?? planned.rpe ?? 8),
        rest_time: logged.rest_time ?? planned.rest_time ?? 60,
      };
    }
    if (saved?.[index] && isPlaceholderSet(plan?.[index])) return { ...saved[index] };
    if (!plan && saved?.[index]) return { ...saved[index] };
    return { ...planned };
  });
}

/** 10% only when there is a load to reduce. Otherwise the tip must not appear. */
export function applyPreventiveReduction<T extends PrefillSet>(sets: T[], factor = 0.9): { sets: T[]; applied: boolean } {
  if (!sets.some((set) => Number(set.weight) > 0)) return { sets, applied: false };
  return {
    applied: true,
    sets: sets.map((set) => ({
      ...set,
      weight: Math.round(Number(set.weight) * factor * 10) / 10,
    })),
  };
}

/** Last session of one exercise, taken from a local history list (guest). */
export function sessionLogsFromHistory(
  entries: { id?: string | null; completed_at?: string | null; workout_sets_logs?: Array<Record<string, unknown>> | null }[] | null | undefined,
  exerciseId: string,
): ExercisePerformanceLog[] {
  const logs: ExercisePerformanceLog[] = [];
  for (const entry of entries || []) {
    for (const set of entry.workout_sets_logs || []) {
      if (String(set?.exercise_id || '') !== exerciseId) continue;
      logs.push({
        exercise_id: exerciseId,
        history_id: entry.id || undefined,
        set_number: set.set_number == null ? null : Number(set.set_number),
        weight: Number(set.weight_achieved ?? set.weight ?? 0),
        reps: Number(set.reps_achieved ?? set.reps ?? 0),
        rpe: set.rpe == null ? null : Number(set.rpe),
        created_at: typeof set.created_at === 'string' ? set.created_at : entry.completed_at,
      });
    }
  }
  return lastSessionSetsForExercise(logs, exerciseId);
}

/** What the preparation screen and the next-exercise line should show. */
export function previewExerciseLine(
  exercise: PrefillExercise,
  log?: ExercisePerformanceLog | ExercisePerformanceLog[] | null,
  prescription?: PrefillSet[] | null,
): { sets: number; reps: string; weight: number } {
  const filled = prefillExercise(exercise, log, prescription);
  const first = filled[0];
  const reps = first?.reps != null && String(first.reps) !== '' ? String(first.reps) : '12';
  const weight = Number(first?.weight ?? 0);
  return {
    sets: filled.length,
    reps,
    weight: Number.isFinite(weight) ? weight : 0,
  };
}

/** Same exercise_id keeps the same prefill after the list is reordered. */
export function prefillPlan(
  exercises: PrefillExercise[],
  logs: ExercisePerformanceLog[] | Map<string, ExercisePerformanceLog>,
): PrefillSet[][] {
  const byId = logs instanceof Map ? logs : latestLogByExerciseId(logs);
  return exercises.map((exercise) => prefillExercise(exercise, byId.get(exercise.exercise_id) ?? null));
}
