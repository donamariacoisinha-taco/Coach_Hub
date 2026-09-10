import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from './authApi';
import { GUEST_DASHBOARD_KEY } from '../guest/guestPersistence';

// Qualquer consulta ao Supabase no editor de treino do convidado é um defeito:
// user_id sentinela não é um uuid válido e a consulta sempre falharia.
const supabaseFrom = vi.fn((_table: string) => {
  throw new Error('editor de treino do convidado não deve consultar o Supabase');
});
vi.mock('./supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));
vi.mock('./exerciseApi', () => ({
  exerciseApi: {
    getExercises: vi.fn().mockResolvedValue([
      { id: 'ex-supino', name: 'Supino reto', muscle_group: 'Peito', image_url: 'supino.png' },
    ]),
    getMuscleGroups: vi.fn().mockResolvedValue([{ id: 'mg-1', name: 'Peito', body_side: 'front', sort_order: 1 }]),
  },
}));

import { workoutApi } from './workoutApi';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
};

const seedDashboard = () => localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify({
  profile: { id: GUEST_USER_ID },
  folders: [{ id: 'folder-1', user_id: GUEST_USER_ID, name: 'Meus Treinos' }],
  workouts: [{
    id: 'guest-workout-1',
    user_id: GUEST_USER_ID,
    folder_id: 'folder-1',
    name: 'Treino A',
    description: 'Full body',
    exercises: [{ id: 'ex-1', category_id: 'guest-workout-1', exercise_id: 'ex-supino', exercise_name_snapshot: 'Supino reto', sets: 3, sets_json: [] }],
  }],
  history: [],
  stats: { sessions: 0 },
}));

describe('workoutApi.getWorkoutEditorData no modo convidado', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    supabaseFrom.mockClear();
    seedDashboard();
  });

  it('devolve pastas locais e catálogo de exercícios sem consultar o Supabase (ficha nova)', async () => {
    const data = await workoutApi.getWorkoutEditorData(GUEST_USER_ID);
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(data.folders).toHaveLength(1);
    expect(data.exercises).toHaveLength(1);
    expect(data.favorites).toEqual([]);
    expect(data.category).toBeNull();
  });

  it('carrega categoria e exercícios de uma ficha existente do convidado', async () => {
    const data = await workoutApi.getWorkoutEditorData(GUEST_USER_ID, 'guest-workout-1');
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(data.category).toMatchObject({ id: 'guest-workout-1', name: 'Treino A', folder_id: 'folder-1' });
    expect(data.workoutExercises).toHaveLength(1);
    expect(data.workoutExercises[0]).toMatchObject({ exercise_name: 'Supino reto', muscle_group: 'Peito' });
  });

  it('devolve categoria nula se a ficha pedida não existe localmente', async () => {
    const data = await workoutApi.getWorkoutEditorData(GUEST_USER_ID, 'guest-workout-inexistente');
    expect(data.category).toBeNull();
    expect(data.workoutExercises).toEqual([]);
  });
});
