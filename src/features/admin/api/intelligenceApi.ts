import { adminApi } from '../../../lib/api/adminApi';
import { Exercise } from '../../../types';

export const intelligenceApi = {
  async batchUpdate(exercises: Partial<Exercise>[]) {
    // In a real scenario, this would be a single batch request to Supabase/Backend
    // Here we simulate it with Promise.all for simplicity in this sandbox
    return Promise.all(exercises.map(ex => {
      if (!ex.id) return Promise.resolve();
      return adminApi.updateExercise(ex.id, ex);
    }));
  }
};
