// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BodyProjectionModule } from './BodyProjectionModule';
import { UserProfile, WorkoutHistory } from '../../types';

const profile = {
  id: 'guest-user-id',
  weight: 80,
  height: 178,
  target_weight: 75,
  goal: 'Emagrecimento',
  age: 30,
  gender: 'Masculino',
} as unknown as UserProfile;

const seedCheckIns = (logs: Array<{ date: string; weight: number }>) => {
  localStorage.setItem(`rubi_history_${profile.id}`, JSON.stringify(logs));
};

const renderModule = () => render(
  <BodyProjectionModule profile={profile} history={[] as WorkoutHistory[]} />,
);

describe('composição corporal com check-in de peso real', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('sem nenhum check-in, não afirma nenhuma variação de peso', async () => {
    renderModule();
    await waitFor(() =>
      expect(screen.getByText(/Nenhum check-in de peso registrado ainda/)).toBeTruthy());
    expect(screen.queryByText(/0,6 kg/)).toBeNull();
    expect(screen.queryByText(/0,5 kg/)).toBeNull();
  });

  it('com 1 check-in, pede o segundo em vez de inventar uma variação', async () => {
    seedCheckIns([{ date: '2026-08-24', weight: 80 }]);
    renderModule();
    await waitFor(() =>
      expect(screen.getByText(/Você fez 1 check-in de peso/)).toBeTruthy());
  });

  it('com 2 check-ins, mostra a perda real calculada, não o número fixo antigo', async () => {
    seedCheckIns([
      { date: '2026-08-17', weight: 80.6 },
      { date: '2026-08-24', weight: 80 },
    ]);
    renderModule();
    await waitFor(() =>
      expect(screen.getAllByText(/Seu peso caiu 0,6 kg nos últimos 7 dias/).length).toBeGreaterThan(0));
  });

  it('com 2 check-ins de ganho, mostra o ganho real', async () => {
    seedCheckIns([
      { date: '2026-08-17', weight: 79 },
      { date: '2026-08-24', weight: 80 },
    ]);
    renderModule();
    await waitFor(() =>
      expect(screen.getAllByText(/Seu peso subiu 1,0 kg nos últimos 7 dias/).length).toBeGreaterThan(0));
  });

  it('bloco de performance integrada some com a variação real em vez do "0,5 kg" fixo', async () => {
    seedCheckIns([
      { date: '2026-08-17', weight: 80.5 },
      { date: '2026-08-24', weight: 80 },
    ]);
    const { container } = renderModule();
    await waitFor(() => expect(screen.getByText('Relação Força / Composição Corporal')).toBeTruthy());
    expect(container.textContent).not.toContain('reduziu 0,5 kg nesta semana');
  });
});
