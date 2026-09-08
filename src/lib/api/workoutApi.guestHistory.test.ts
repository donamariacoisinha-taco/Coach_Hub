import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from './authApi';
import { GUEST_DASHBOARD_KEY } from '../guest/guestPersistence';

// Qualquer consulta ao Supabase no fluxo convidado é um defeito.
const supabaseFrom = vi.fn((_table: string) => {
  throw new Error('fluxo convidado não deve consultar o Supabase');
});
vi.mock('./supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));
vi.mock('./exerciseApi', () => ({ exerciseApi: { getExercises: vi.fn().mockResolvedValue([]) } }));

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

const ontem = new Date(Date.now() - 86400000).toISOString();
const hoje = new Date().toISOString();

const seedDashboard = () => localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify({
  profile: { id: GUEST_USER_ID },
  folders: [],
  workouts: [],
  stats: { sessions: 2 },
  history: [
    {
      id: 'guest-completed-antiga',
      workout_name: 'Treino A',
      completed_at: ontem,
      duration_minutes: 40,
      partial: false,
      workout_sets_logs: [
        { exercise_id: 'e1', exercise_name: 'Supino', weight_achieved: 40, reps_achieved: 10, rpe: 8 },
      ],
    },
    {
      id: 'guest-completed-parcial',
      workout_name: 'Treino B',
      completed_at: hoje,
      duration_minutes: 12,
      partial: true,
      workout_sets_logs: [
        { exercise_id: 'e2', exercise_name: 'Prancha', weight_achieved: 0, reps_achieved: 10, rpe: 7 },
      ],
    },
    { id: 'guest-em-andamento', workout_name: 'Treino C', completed_at: null },
  ],
}));

describe('histórico do convidado', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    supabaseFrom.mockClear();
    seedDashboard();
  });

  it('lê o histórico local em vez de consultar o Supabase', async () => {
    const history = await workoutApi.getWorkoutHistory(GUEST_USER_ID);
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(history).toHaveLength(2);
  });

  it('devolve a sessão mais recente primeiro', async () => {
    const history = await workoutApi.getWorkoutHistory(GUEST_USER_ID);
    expect(history[0].id).toBe('guest-completed-parcial');
    expect(history[1].id).toBe('guest-completed-antiga');
  });

  it('descarta sessão sem conclusão e preserva o marcador parcial', async () => {
    const history = await workoutApi.getWorkoutHistory(GUEST_USER_ID);
    expect(history.map((h: any) => h.id)).not.toContain('guest-em-andamento');
    expect(history[0].partial).toBe(true);
    expect(history[1].partial).toBe(false);
  });

  it('preenche nome e contagem de exercícios a partir dos logs locais', async () => {
    const history = await workoutApi.getWorkoutHistory(GUEST_USER_ID);
    expect(history[0].category_name).toBe('Treino B');
    expect(history[0].exercises_count).toBe(1);
  });

  it('lê as séries locais da sessão sem tocar no Supabase', async () => {
    const logs = await workoutApi.getWorkoutDetails('guest-completed-parcial');
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ history_id: 'guest-completed-parcial', rpe: 7, weight_achieved: 0 });
    expect(logs[0].exercises.name).toBe('Prancha');
  });
});
