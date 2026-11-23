import { prefillSetsFromLast, type PrefillSet } from './setPersistence';

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

/**
 * Latest log of this exercise_id, otherwise this exercise's own prescription.
 * A log whose id does not match is ignored, even if it was loaded for the previous row.
 */
export function prefillExercise(
  exercise: PrefillExercise,
  log: ExercisePerformanceLog | null | undefined,
): PrefillSet[] {
  const planned = ownPrescriptionSets(exercise);
  if (!log || log.exercise_id !== exercise.exercise_id) return planned;
  return prefillSetsFromLast(planned, {
    weight: Number(log.weight),
    reps: Number(log.reps),
    rpe: Number(log.rpe ?? planned[0]?.rpe ?? 8),
    rest_time: log.rest_time,
  });
}

/** Same exercise_id keeps the same prefill after the list is reordered. */
export function prefillPlan(
  exercises: PrefillExercise[],
  logs: ExercisePerformanceLog[] | Map<string, ExercisePerformanceLog>,
): PrefillSet[][] {
  const byId = logs instanceof Map ? logs : latestLogByExerciseId(logs);
  return exercises.map((exercise) => prefillExercise(exercise, byId.get(exercise.exercise_id) ?? null));
}
