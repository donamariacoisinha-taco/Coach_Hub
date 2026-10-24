import { cacheStore } from './cacheStore';

/** Invalidate both sources of cached plans, including partially applied writes. */
export function invalidateWorkoutCache(workoutId: string) {
  cacheStore.clear(`workout_init_${workoutId}`);
  cacheStore.clear(`editor_init_${workoutId}`);
  cacheStore.clearPrefix('dashboard_');
  try {
    localStorage.removeItem(`rubi_workout_init_${workoutId}`);
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    keys.forEach(key => {
      if (key?.startsWith('rubi_dashboard_cache_')) localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('[WorkoutCache] Failed to invalidate persistent cache', error);
  }
}
