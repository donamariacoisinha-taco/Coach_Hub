import { beforeEach, describe, expect, it, vi } from 'vitest';

const getExercises = vi.fn();
vi.mock('./exerciseApi', () => ({
  exerciseApi: { getExercises: () => getExercises() },
}));
vi.mock('./supabase', () => ({
  supabase: {
    from: () => {
      throw new Error('workout_exercises unavailable');
    },
    rpc: vi.fn(),
  },
}));

import { workoutApi } from './workoutApi';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  };
};

describe('getWorkoutInitData sem catálogo inventado', () => {
  beforeEach(() => {
    getExercises.mockReset();
    vi.stubGlobal('localStorage', createStorage());
  });

  it('não monta Protocolo A nem a lista alfabética do catálogo quando a ficha não carrega', async () => {
    await expect(workoutApi.getWorkoutInitData('4bcaf6a1-f070-4af7-80f4-fef7bbe526aa', 'user-1'))
      .rejects.toThrow('workout_exercises unavailable');
    expect(getExercises).not.toHaveBeenCalled();
  });
});
