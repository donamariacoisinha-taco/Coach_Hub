// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => {
  const hoje = new Date().toISOString();
  const ontem = new Date(Date.now() - 86400000).toISOString();
  const GUEST = 'guest-user-id';

  const parcialCorporal = {
    id: 'guest-completed-parcial',
    user_id: GUEST,
    category_id: 'w2',
    category_name: 'Treino B',
    created_at: hoje,
    completed_at: hoje,
    duration_minutes: 12,
    exercises_count: 1,
    partial: true,
  };

  const completaComCarga = {
    id: 'guest-completed-antiga',
    user_id: GUEST,
    category_id: 'w1',
    category_name: 'Treino A',
    created_at: ontem,
    completed_at: ontem,
    duration_minutes: 40,
    exercises_count: 1,
    partial: false,
  };

  const logsPorSessao: Record<string, any[]> = {
    'guest-completed-parcial': [{
      exercise_id: 'e2', history_id: 'guest-completed-parcial',
      weight_achieved: 0, reps_achieved: 10, rpe: 7,
      exercises: { name: 'Prancha', muscle_group: 'Abdômen' },
    }],
    'guest-completed-antiga': [{
      exercise_id: 'e1', history_id: 'guest-completed-antiga',
      weight_achieved: 40, reps_achieved: 10, rpe: 8,
      exercises: { name: 'Supino', muscle_group: 'Peito' },
    }],
  };

  return { parcialCorporal, completaComCarga, logsPorSessao };
});

// A aba `sessions` é a lista de sessões do histórico.
vi.mock('../App', () => ({
  useNavigation: () => ({ navigate: vi.fn(), current: { params: { tab: 'sessions' } } }),
}));
vi.mock('./ProgressPhotos', () => ({ default: () => null }));
vi.mock('./BioReport', () => ({ default: () => null }));
vi.mock('./ShareCard', () => ({ default: () => null }));
vi.mock('./ExerciseProgress', () => ({ ExerciseProgress: () => null }));
vi.mock('../lib/api/profileApi', () => ({ profileApi: { getProfile: vi.fn().mockResolvedValue(null) } }));
vi.mock('../lib/api/systemTemplatesApi', () => ({ systemTemplatesApi: { getTemplates: vi.fn().mockResolvedValue([]) } }));
vi.mock('../lib/api/exerciseApi', () => ({ exerciseApi: { getExercises: vi.fn().mockResolvedValue([]) } }));
vi.mock('../lib/api/supabase', () => ({
  supabase: { from: () => { throw new Error('fluxo convidado não deve consultar o Supabase'); } },
}));
vi.mock('../lib/api/authApi', async () => {
  const actual = await vi.importActual<typeof import('../lib/api/authApi')>('../lib/api/authApi');
  return { ...actual, authApi: { getUser: vi.fn().mockResolvedValue({ id: actual.GUEST_USER_ID }) } };
});
vi.mock('../lib/api/workoutApi', () => ({
  workoutApi: {
    getWorkoutHistory: vi.fn().mockResolvedValue([fixtures.parcialCorporal, fixtures.completaComCarga]),
    getWorkoutDetails: vi.fn((id: string) => Promise.resolve(fixtures.logsPorSessao[id] || [])),
    getExerciseList: vi.fn().mockResolvedValue([]),
    getWorkoutLogsSimple: vi.fn().mockResolvedValue([]),
    getAchievements: vi.fn().mockResolvedValue([]),
    abandonWorkout: vi.fn().mockResolvedValue(undefined),
  },
}));

import HistoryView from './HistoryView';
import { ErrorProvider } from '../hooks/useErrorHandler';

const renderHistory = () => render(
  <ErrorProvider><HistoryView /></ErrorProvider>,
);

const openSession = async (name: string) => {
  renderHistory();
  const title = await screen.findByText(name);
  fireEvent.click(title);
};

describe('histórico do convidado separa tipos de sessão', () => {
  afterEach(cleanup);

  it('rotula a sessão parcial e a concluída de forma distinta na lista', async () => {
    renderHistory();
    expect(await screen.findByText('Sessão parcial')).toBeTruthy();
    expect(await screen.findByText('Treino concluído')).toBeTruthy();
  });

  it('identifica peso corporal e não transforma em volume', async () => {
    await openSession('Treino B');
    // "Peso corporal" aparece duas vezes: no selo da sessão e no peso da série.
    const marcas = await screen.findAllByText('Peso corporal');
    expect(marcas.length).toBeGreaterThanOrEqual(2);
    await waitFor(() => expect(screen.getByText(/Volume: Peso corporal/)).toBeTruthy());
    expect(screen.getByText(/RPE médio: 7\.0/)).toBeTruthy();
  });

  it('identifica sessão com carga mensurável', async () => {
    await openSession('Treino A');
    expect(await screen.findByText('Com carga')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/Volume: 400 kg/)).toBeTruthy());
    expect(screen.getByText(/RPE médio: 8\.0/)).toBeTruthy();
  });
});
