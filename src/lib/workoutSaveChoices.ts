import { SetType } from '../types';
/** Preserve per-series targets; only completed performance overrides them. */
export function resolveSavedSets(exercise: any, performance: any[], completed: Set<number>) {
  const count = exercise.sets_json?.length || exercise.sets || 3;
  return Array.from({ length: count }, (_, index) => {
    const target = exercise.sets_json?.[index] || {};
    const source = completed.has(index) && performance[index] ? performance[index] : target;
    return {
      reps: String(source.reps ?? target.reps ?? exercise.reps ?? '10'),
      weight: Number(source.weight ?? target.weight ?? exercise.weight ?? 0),
      rest_time: Number(source.rest_time ?? target.rest_time ?? exercise.rest_time ?? 60),
      rpe: Number(source.rpe ?? target.rpe ?? exercise.default_rpe ?? 8),
      type: source.type ?? target.type ?? SetType.NORMAL,
    };
  });
}

export function canReplaceBeforeFirstSet(index: number, currentIndex: number,
  completedByExercise: Record<number, Set<number>>, currentCompleted: Set<number>, pendingSet: number | null = null) {
  return !(completedByExercise[index]?.size || (index === currentIndex && (currentCompleted.size || pendingSet !== null)));
}
