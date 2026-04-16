
import { WorkoutExercise, WorkoutHistory } from '../../types';

export interface SessionInitResult {
  historyId: string;
  startTime: number;
  currentIndex: number;
  currentSet: number;
}

export const workoutEngine = {
  initializeSession(
    partialSession: any | null,
    newHistory: WorkoutHistory | null
  ): SessionInitResult {
    if (partialSession) {
      return {
        historyId: partialSession.history_id,
        startTime: new Date(partialSession.start_time || Date.now()).getTime(),
        currentIndex: partialSession.current_index || 0,
        currentSet: partialSession.current_set || 1,
      };
    }

    if (!newHistory) {
      throw new Error("Falha ao iniciar novo histórico de treino");
    }

    return {
      historyId: newHistory.id,
      startTime: new Date(newHistory.created_at).getTime(),
      currentIndex: 0,
      currentSet: 1,
    };
  },

  calculateQualityScore(exercises: any[], muscles: string[]): number | null {
    if (exercises.length === 0) return null;
    
    // Heurística simples de qualidade
    const hasCompound = exercises.some(ex => ex.type?.toLowerCase().includes('composto'));
    const muscleVariety = muscles.length;
    const volumePerMuscle = exercises.length / (muscleVariety || 1);
    
    let score = 70; // Base
    if (hasCompound) score += 15;
    if (muscleVariety > 1) score += 10;
    if (volumePerMuscle > 2 && volumePerMuscle < 5) score += 5;
    
    return Math.min(score, 100);
  },

  prepareSavePayload(exercises: any[], categoryId: string) {
    return exercises.map((ex, i) => ({
      category_id: categoryId,
      exercise_id: ex.exercise_id,
      sets: ex.sets_json?.length || 3,
      sets_json: ex.sets_json,
      sort_order: i + 1,
      superset_id: ex.superset_id
    }));
  }
};
