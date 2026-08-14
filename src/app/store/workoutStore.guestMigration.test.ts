import { describe, expect, it, vi } from 'vitest';

describe('workoutStore guest migration ordering', () => {
  it('migrates legacy global state before Zustand hydration', async () => {
    const values = new Map<string, string>();
    const storage = {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, String(value)),
    } as Storage;
    vi.stubGlobal('localStorage', storage);
    localStorage.setItem('kyron_guest_session', JSON.stringify({ user: { id: 'guest-user-id' } }));
    localStorage.setItem('workout-storage', JSON.stringify({ state: {
      currentWorkoutId: 'guest-workout-a',
      exercises: [{ exercise_id: 'prancha', weight: 240 }],
      currentIndex: 5,
      currentSet: 3,
    }, version: 0 }));
    localStorage.setItem('workout_rest_start', '1');
    localStorage.setItem('currentExercise', JSON.stringify({ exercise_id: 'prancha' }));

    vi.resetModules();
    const { useWorkoutStore } = await import('./workoutStore');
    expect(useWorkoutStore.getState()).toMatchObject({
      currentWorkoutId: null,
      exercises: [],
      currentIndex: 0,
      currentSet: 1,
    });
    expect(localStorage.getItem('workout_rest_start')).toBeNull();
    expect(localStorage.getItem('currentExercise')).toBeNull();
    expect(localStorage.getItem('kyron_guest_storage_schema_version')).toBe('3');
  });
});
