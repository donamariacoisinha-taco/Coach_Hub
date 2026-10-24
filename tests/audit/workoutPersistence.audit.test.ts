import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../src/lib/api/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../../src/lib/api/exerciseApi', () => ({ exerciseApi: {
  getExercises: vi.fn().mockResolvedValue([{ id: 'catalog-exercise', name: 'Catálogo', muscle_group: 'Peito' }]),
} }));
import { workoutApi } from '../../src/lib/api/workoutApi';
import { invalidateWorkoutCache } from '../../src/lib/cache/workoutCache';

describe('Workout persistence regression coverage', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    mocks.from.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('does not invent a routine or dashboard when loading fails without a cache', async () => {
    mocks.from.mockImplementation(() => { throw new Error('connection unavailable'); });
    await expect(workoutApi.getWorkoutInitData('real-workout-id', 'user-a')).rejects.toThrow('connection unavailable');
    await expect(workoutApi.getDashboardData('user-a')).rejects.toThrow('connection unavailable');
  });

  it('rejects an update affecting zero rows, including exercise and history updates', async () => {
    const query: any = { update: () => query, eq: () => query, select: () => query,
      single: vi.fn().mockResolvedValue({ error: null, data: null }) };
    mocks.from.mockReturnValue(query);
    await expect(workoutApi.updateCategory('missing-or-inaccessible-id', { name: 'Changed' }))
      .rejects.toThrow('não foi atualizada');
    await expect(workoutApi.updateWorkoutExercise('missing', 'workout-a', { reps: '12' }))
      .rejects.toThrow('não foi atualizado');
    await expect(workoutApi.finishWorkout('missing', 30, 1)).rejects.toThrow('confirmar a conclusão');
  });

  it('invalidates stale disk content along with memory content after a plan write', async () => {
    const stale = { category: { id: 'workout-a', user_id: 'user-a' }, exercises: [{ exercise_id: 'old-exercise' }], partialSession: null };
    localStorage.setItem('rubi_workout_init_workout-a', JSON.stringify(stale));
    localStorage.setItem('rubi_dashboard_cache_user-a', '{}');
    invalidateWorkoutCache('workout-a');
    expect(localStorage.getItem('rubi_workout_init_workout-a')).toBeNull();
    expect(localStorage.getItem('rubi_dashboard_cache_user-a')).toBeNull();
    mocks.from.mockImplementation(() => { throw new Error('connection unavailable'); });
    await expect(workoutApi.getWorkoutInitData('workout-a', 'user-a')).rejects.toThrow('connection unavailable');
  });

  it('allows real cached plans only for their owner and does not reuse a cached session id', async () => {
    const cached = { category: { id: 'workout-a', user_id: 'user-a' }, exercises: [{ id: 'real-row' }], partialSession: { history_id: 'old-history' } };
    localStorage.setItem('rubi_workout_init_workout-a', JSON.stringify(cached));
    mocks.from.mockImplementation(() => { throw new Error('connection unavailable'); });
    const result = await workoutApi.getWorkoutInitData('workout-a', 'user-a');
    expect(result.exercises).toEqual(cached.exercises);
    expect(result.partialSession).toBeNull();
    await expect(workoutApi.getWorkoutInitData('workout-a', 'user-b')).rejects.toThrow();
  });

  it('confirms the changed category and invalidates its persisted plan', async () => {
    localStorage.setItem('rubi_workout_init_workout-a', '{}');
    const query: any = { update: () => query, eq: () => query, select: () => query,
      single: vi.fn().mockResolvedValue({ error: null, data: { id: 'workout-a' } }) };
    mocks.from.mockReturnValue(query);
    await workoutApi.updateCategory('workout-a', { name: 'Changed' });
    expect(localStorage.getItem('rubi_workout_init_workout-a')).toBeNull();
  });
});
