import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from './authApi';
import { GUEST_DASHBOARD_KEY } from '../guest/guestPersistence';

// Qualquer consulta ao Supabase para o convidado é um defeito: user_id
// sentinela não é um uuid válido, a consulta sempre falharia.
const supabaseFrom = vi.fn((_table: string) => {
  throw new Error('clonar protocolo para o convidado não deve consultar o Supabase');
});
vi.mock('./supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));
vi.mock('./workoutApi', () => ({ workoutApi: {} }));

import { premiumProtocolsApi, PremiumProtocol } from './premiumProtocolsApi';

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

const fakeProtocol = {
  id: 'protocol-1',
  name: 'Hipertrofia 5x',
  workouts: [
    { id: 'w1', name: 'Treino A', description: 'Peito e Tríceps', exercises: [
      { exercise_id: 'ex-1', exercise_name: 'Supino reto', sets: 4, reps: '8-10', weight: 40, rest_time: 90, sets_json: [], sort_order: 1 },
    ] },
    { id: 'w2', name: 'Treino B', description: 'Costas e Bíceps', exercises: [
      { exercise_id: 'ex-2', exercise_name: 'Remada baixa', sets: 4, reps: '8-10', weight: 35, rest_time: 90, sets_json: [], sort_order: 1 },
    ] },
  ],
} as unknown as PremiumProtocol;

const seedExistingDashboard = () => localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify({
  profile: { id: GUEST_USER_ID },
  folders: [{ id: 'folder-existente', user_id: GUEST_USER_ID, name: 'Treino Teste E2E' }],
  workouts: [{ id: 'guest-workout-existente', user_id: GUEST_USER_ID, folder_id: 'folder-existente', name: 'Treino A — Corpo Inteiro', exercises: [] }],
  history: [{ id: 'guest-completed-1', completed_at: new Date().toISOString(), partial: true, workout_sets_logs: [] }],
  stats: { sessions: 1 },
}));

describe('Biblioteca Premium: adicionar ao meu treino (convidado)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    supabaseFrom.mockClear();
    vi.spyOn(premiumProtocolsApi, 'getProtocolById').mockResolvedValue(fakeProtocol);
  });

  it('cria uma ficha local por treino do protocolo, sem tocar o Supabase', async () => {
    const folder = await premiumProtocolsApi.cloneToUser(GUEST_USER_ID, 'protocol-1');
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(folder.name).toBe('Hipertrofia 5x');

    const dashboard = JSON.parse(localStorage.getItem(GUEST_DASHBOARD_KEY) as string);
    const created = dashboard.workouts.filter((w: any) => w.folder_id === folder.id);
    expect(created).toHaveLength(2);
    expect(created.map((w: any) => w.name).sort()).toEqual(['Treino A', 'Treino B']);
    const treinoA = created.find((w: any) => w.name === 'Treino A');
    expect(treinoA.exercises[0]).toMatchObject({ exercise_name_snapshot: 'Supino reto', sets: 4, weight: 40 });
  });

  it('não apaga plano nem histórico que o convidado já tinha', async () => {
    seedExistingDashboard();
    await premiumProtocolsApi.cloneToUser(GUEST_USER_ID, 'protocol-1');
    const dashboard = JSON.parse(localStorage.getItem(GUEST_DASHBOARD_KEY) as string);
    expect(dashboard.workouts.some((w: any) => w.id === 'guest-workout-existente')).toBe(true);
    expect(dashboard.history).toHaveLength(1);
    // 1 ficha antiga + 2 do protocolo clonado
    expect(dashboard.workouts).toHaveLength(3);
  });
});
