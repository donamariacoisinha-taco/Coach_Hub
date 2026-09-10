import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from '../api/authApi';
import {
  GUEST_DASHBOARD_KEY,
  createGuestFolder,
  createGuestWorkout,
  deleteGuestWorkout,
  getGuestDashboard,
  getGuestWorkout,
  updateGuestWorkoutMeta,
} from './guestPersistence';

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

const seedExistingDashboard = () => localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify({
  profile: { id: GUEST_USER_ID },
  folders: [{ id: 'folder-existente', user_id: GUEST_USER_ID, name: 'Treino Teste E2E' }],
  workouts: [{
    id: 'guest-workout-existente',
    user_id: GUEST_USER_ID,
    folder_id: 'folder-existente',
    name: 'Treino A — Corpo Inteiro',
    exercises: [{ id: 'ex-1', category_id: 'guest-workout-existente', exercise_id: 'guest-catalog-0', exercise_name_snapshot: 'Supino reto', sets: 3, sets_json: [] }],
    exercises_count: 1,
  }],
  history: [{ id: 'guest-completed-1', completed_at: new Date().toISOString(), partial: true, workout_sets_logs: [] }],
  stats: { sessions: 1 },
}));

describe('criação manual de ficha no Editor de Treino (guest)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('cria a ficha numa pasta padrão quando o convidado não tem nenhuma', () => {
    const workout = createGuestWorkout({
      name: 'Treino de Pernas',
      exercises: [{ exercise_name: 'Agachamento livre', sets: 4, reps: '8-10', weight: 60, rest_time: 90 }],
    });
    expect(workout.folder_id).toBeTruthy();
    const dashboard = getGuestDashboard();
    expect(dashboard.folders).toHaveLength(1);
    expect(dashboard.workouts).toHaveLength(1);
    expect(dashboard.workouts[0].exercises[0]).toMatchObject({ exercise_name_snapshot: 'Agachamento livre', sets: 4, weight: 60 });
  });

  it('a ficha criada é resolvível por getGuestWorkout (o Player consegue abrir)', () => {
    const workout = createGuestWorkout({ name: 'Treino de Costas', exercises: [{ exercise_name: 'Remada baixa' }] });
    const resolved = getGuestWorkout(workout.id);
    expect(resolved?.id).toBe(workout.id);
    expect(resolved?.exercises).toHaveLength(1);
  });

  it('preserva planos e histórico já existentes ao criar mais uma ficha', () => {
    seedExistingDashboard();
    createGuestWorkout({ name: 'Treino Extra', folder_id: 'folder-existente', exercises: [{ exercise_name: 'Rosca direta' }] });
    const dashboard = getGuestDashboard();
    expect(dashboard.workouts).toHaveLength(2);
    expect(dashboard.workouts.some(w => w.id === 'guest-workout-existente')).toBe(true);
    expect(dashboard.history).toHaveLength(1);
  });

  it('atualiza nome e pasta de uma ficha existente sem apagar as demais', () => {
    seedExistingDashboard();
    updateGuestWorkoutMeta('guest-workout-existente', { name: 'Treino A — Renomeado' });
    const dashboard = getGuestDashboard();
    expect(dashboard.workouts[0].name).toBe('Treino A — Renomeado');
    expect(dashboard.workouts[0].exercises).toHaveLength(1);
  });

  it('exclui só a ficha pedida', () => {
    seedExistingDashboard();
    createGuestWorkout({ name: 'Treino Extra', folder_id: 'folder-existente', exercises: [{ exercise_name: 'Rosca direta' }] });
    const beforeCount = getGuestDashboard().workouts.length;
    deleteGuestWorkout('guest-workout-existente');
    const dashboard = getGuestDashboard();
    expect(dashboard.workouts).toHaveLength(beforeCount - 1);
    expect(dashboard.workouts.some(w => w.id === 'guest-workout-existente')).toBe(false);
  });
});

describe('criar pasta nova do convidado', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('sempre cria uma pasta nova, mesmo com nome repetido', () => {
    createGuestFolder('Protocolo X');
    createGuestFolder('Protocolo X');
    expect(getGuestDashboard().folders).toHaveLength(2);
  });
});
