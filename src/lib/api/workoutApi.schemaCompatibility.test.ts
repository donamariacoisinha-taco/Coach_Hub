import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ insert: vi.fn(), response: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { from: () => ({ insert: (rows: any[]) => {
  mocks.insert(rows); return { select: () => mocks.response() };
} }) } }));
import { workoutApi } from './workoutApi';

const exercise = { category_id: 'test-workout', exercise_id: 'test-exercise', is_optional: false,
  sets: 3, reps: '12', weight: 10, rest_time: 60, default_rpe: 8 };
const missing = (column: string) => ({ code: 'PGRST204', message: `Could not find the '${column}' column of 'workout_exercises' in the schema cache` });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', { length: 0, removeItem: vi.fn() });
});

describe('Workout schema compatibility', () => {
  it('retries the real production error once, removing only optional metadata', async () => {
    mocks.response.mockResolvedValueOnce({ error: missing('is_optional') })
      .mockResolvedValueOnce({ data: [{ id: 'saved-exercise' }], error: null });
    await expect(workoutApi.insertWorkoutExercises([exercise])).resolves.toEqual(['saved-exercise']);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    const { is_optional, ...expected } = exercise;
    expect(mocks.insert.mock.calls[1][0]).toEqual([expected]);
  });

  it('stops if the same schema error persists after the property is removed', async () => {
    mocks.response.mockResolvedValue({ error: missing('is_optional') });
    await expect(workoutApi.insertWorkoutExercises([exercise])).rejects.toMatchObject({ code: 'PGRST204' });
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });

  it('does not drop training data to bypass a missing required column', async () => {
    mocks.response.mockResolvedValue({ error: missing('weight') });
    await expect(workoutApi.insertWorkoutExercises([exercise])).rejects.toMatchObject({ code: 'PGRST204' });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
});
