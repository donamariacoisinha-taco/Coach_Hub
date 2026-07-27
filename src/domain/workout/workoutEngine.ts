import { WorkoutHistory } from '../../types';

export interface SessionInitResult {
  historyId: string;
  startTime: number;
  currentIndex: number;
  currentSet: number;
}

const safeParseDate = (dateValue: unknown): number => {
  if (!dateValue) return Date.now();
  const parsed = new Date(dateValue as string | number | Date).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const safeInteger = (value: unknown, fallback: number, minimum: number): number => {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, parsed);
};

const requireHistoryId = (value: unknown): string => {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error('Sessão não pôde ser iniciada (ID do Histórico Ausente)');
  return normalized;
};

export const workoutEngine = {
  initializeSession(
    partialSession: any | null,
    newHistory: WorkoutHistory | null,
  ): SessionInitResult {
    if (partialSession?.history_id) {
      return {
        historyId: requireHistoryId(partialSession.history_id),
        startTime: safeParseDate(partialSession.start_time),
        currentIndex: safeInteger(partialSession.current_index, 0, 0),
        currentSet: safeInteger(partialSession.current_set, 1, 1),
      };
    }

    if (!newHistory) {
      throw new Error('Sessão não pôde ser iniciada (Histórico Ausente)');
    }

    return {
      historyId: requireHistoryId(newHistory.id),
      startTime: safeParseDate(newHistory.created_at),
      currentIndex: 0,
      currentSet: 1,
    };
  },

  calculateQualityScore(exercises: any[], muscles: string[]): number | null {
    if (exercises.length === 0) return null;

    const hasCompound = exercises.some(exercise => exercise.type?.toLowerCase().includes('composto'));
    const muscleVariety = muscles.length;
    const volumePerMuscle = exercises.length / (muscleVariety || 1);

    let score = 70;
    if (hasCompound) score += 15;
    if (muscleVariety > 1) score += 10;
    if (volumePerMuscle > 2 && volumePerMuscle < 5) score += 5;

    return Math.min(score, 100);
  },

  prepareSavePayload(exercises: any[], categoryId: string) {
    return exercises.map((exercise, index) => ({
      category_id: categoryId,
      exercise_id: exercise.exercise_id,
      exercise_name_snapshot: exercise.exercise_name,
      sets: exercise.sets_json?.length || 3,
      sets_json: exercise.sets_json,
      sort_order: index + 1,
      superset_id: exercise.superset_id,
    }));
  },
};
