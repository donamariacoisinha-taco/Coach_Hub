// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from '../../lib/api/authApi';
import { WorkoutHistory, UserProfile } from '../../types';

vi.mock('../../App', () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
vi.mock('./BodyProjectionModule', () => ({ BodyProjectionModule: () => null }));
vi.mock('../../lib/api/authApi', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api/authApi')>('../../lib/api/authApi');
  return {
    ...actual,
    authApi: { getUser: vi.fn().mockResolvedValue({ id: actual.GUEST_USER_ID }) },
  };
});
vi.mock('../../services/athleteMemoryEngine', () => ({
  athleteMemoryEngine: { getMemory: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../../lib/api/mediaApi', () => ({ mediaApi: { getPhotos: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../lib/api/exerciseApi', () => ({ exerciseApi: { getExercises: vi.fn().mockResolvedValue([]) } }));

// Qualquer chamada ao Supabase nesta tela é um defeito no fluxo convidado.
const supabaseFrom = vi.fn((_table: string) => {
  throw new Error('fluxo convidado não deve consultar o Supabase');
});
vi.mock('../../lib/api/supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));

import { ProgressIntelligence } from './ProgressIntelligence';

const today = new Date().toISOString();

const guestProfile = {
  id: GUEST_USER_ID,
  name: 'Atleta Convidado',
  workout_streak: 5,
} as unknown as UserProfile;

/** Sessão parcial de peso corporal: 0 kg × 10, RPE 7. */
const guestHistory = [{
  id: 'guest-completed-1',
  user_id: GUEST_USER_ID,
  category_id: 'guest-workout-1',
  category_name: 'Treino A',
  created_at: today,
  completed_at: today,
  duration_minutes: 12,
  exercises_count: 1,
  partial: true,
  workout_sets_logs: [{
    exercise_id: 'ex-1',
    exercise_name: 'Prancha',
    set_number: 1,
    weight_achieved: 0,
    reps_achieved: 10,
    rpe: 7,
    rest_time: 60,
  }],
}] as unknown as WorkoutHistory[];

const renderScreen = () => render(
  <ProgressIntelligence history={guestHistory} profile={guestProfile} workouts={[]} />,
);

describe('Evolução do convidado com sessão parcial de peso corporal', () => {
  afterEach(() => { cleanup(); supabaseFrom.mockClear(); });

  it('não consulta o Supabase para carregar os logs do convidado', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Esforço Fisiológico')).toBeTruthy());
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  it('mantém o RPE real 7.0 vindo do histórico local', async () => {
    renderScreen();
    expect(await screen.findByText('7.0')).toBeTruthy();
  });

  it('não inventa volume: 0 kg permanece 0', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Carga Total Movimentada')).toBeTruthy());
    const loadBlock = container.querySelector('#hero-training-load-block');
    expect(loadBlock?.textContent).toContain('0');
    expect(loadBlock?.textContent).toContain('KG');
    expect(loadBlock?.textContent).not.toContain('TON');
    expect(loadBlock?.textContent).toContain('Sem base de comparação');
  });

  it('mostra "—" no Performance Score sem carga mensurável', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Performance Score')).toBeTruthy());
    const scoreBlock = container.querySelector('#hero-performance-score-block');
    expect(scoreBlock?.textContent).toContain('—');
    expect(scoreBlock?.textContent).toContain('Dados insuficientes para calcular prontidão');
    expect(scoreBlock?.textContent).not.toContain('90');
  });

  it('não exibe insight de progressão inventado', async () => {
    const { container } = renderScreen();
    await waitFor(() => expect(screen.getByText('Esforço Fisiológico')).toBeTruthy());
    expect(container.textContent).not.toContain('Sua força está crescendo');
    expect(container.textContent).not.toContain('4.2');
  });
});
