import type { WorkoutHistory } from '../../types';

export type EvolutionLog = {
  id?: string; history_id: string; exercise_id: string; exercise_name_snapshot?: string;
  exercises?: { name?: string }; weight_achieved?: unknown; reps_achieved?: unknown;
  set_type?: string; is_warmup?: boolean;
};
export type EvolutionPoint = {
  historyId: string; date: string; partial: boolean; load: number | null; reps: number | null;
  estimatedMax: number | null; volume: number; sets: number; bestRepsAtLoad: number | null;
};
export type EvolutionExercise = { id: string; name: string; points: EvolutionPoint[] };
export type EvolutionPeriod = 30 | 90 | 'all';
export type EvolutionMetric = 'load' | 'reps' | 'estimatedMax' | 'volume';
const numeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
export function buildEvolution(history: WorkoutHistory[], logs: EvolutionLog[]): EvolutionExercise[] {
  const sessions = new Map(history.filter(h => h.completed_at && Number.isFinite(Date.parse(h.completed_at))).map(h => [h.id, h]));
  const groups = new Map<string, EvolutionExercise>();
  const seen = new Set<string>();
  for (const log of logs) {
    const session = sessions.get(log.history_id);
    if (!session || !log.exercise_id || log.is_warmup || log.set_type === 'warmup') continue;
    if (log.id && seen.has(log.id)) continue;
    if (log.id) seen.add(log.id);
    let exercise = groups.get(log.exercise_id);
    if (!exercise) {
      exercise = { id: log.exercise_id, name: log.exercise_name_snapshot || log.exercises?.name || 'Exercício sem nome', points: [] };
      groups.set(log.exercise_id, exercise);
    }
    let point = exercise.points.find(p => p.historyId === session.id);
    if (!point) {
      point = { historyId: session.id, date: session.completed_at!, partial: Boolean(session.partial), load: null, reps: null, estimatedMax: null, volume: 0, sets: 0, bestRepsAtLoad: null };
      exercise.points.push(point);
    }
    const weight = numeric(log.weight_achieved), reps = numeric(log.reps_achieved);
    if (reps === null || reps <= 0 || !Number.isInteger(reps)) continue;
    point.sets += 1;
    point.reps = Math.max(point.reps ?? 0, reps);
    if (weight === null || weight <= 0) continue;
    point.volume += weight * reps;
    if (point.load === null || weight > point.load || (weight === point.load && reps > (point.bestRepsAtLoad ?? 0))) {
      point.load = weight; point.bestRepsAtLoad = reps;
    }
    // Epley is an estimate, shown separately and restricted to short sets.
    if (reps <= 12) point.estimatedMax = Math.max(point.estimatedMax ?? 0, reps === 1 ? weight : weight * (1 + reps / 30));
  }
  return [...groups.values()].map(e => ({ ...e, points: e.points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.historyId.localeCompare(b.historyId)) }))
    .sort((a, b) => Date.parse(b.points.at(-1)!.date) - Date.parse(a.points.at(-1)!.date));
}
export function inEvolutionPeriod(date: string, period: EvolutionPeriod, now: number) {
  const time = Date.parse(date);
  return Number.isFinite(time) && time <= now && (period === 'all' || time >= now - period * 86400000);
}
export function periodPoints(exercise: EvolutionExercise, period: EvolutionPeriod, now: number) {
  return exercise.points.filter(p => inEvolutionPeriod(p.date, period, now));
}
export function evolutionChange(points: EvolutionPoint[], metric: EvolutionMetric): number | null {
  const comparable = points.filter(p => p[metric] !== null && (metric !== 'volume' || p.load !== null));
  if (comparable.length < 2) return null;
  return Number(comparable.at(-1)![metric]) - Number(comparable[0][metric]);
}
export function evolutionRecord(points: EvolutionPoint[], metric: EvolutionMetric): EvolutionPoint | null {
  const usable = points.filter(p => p[metric] !== null && (metric !== 'volume' || p.load !== null));
  return usable.reduce<EvolutionPoint | null>((best, p) => !best || Number(p[metric]) > Number(best[metric]) ? p : best, null);
}
