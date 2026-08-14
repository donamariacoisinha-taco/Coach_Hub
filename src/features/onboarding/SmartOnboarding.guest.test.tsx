// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, GUEST_USER_ID } from '../../lib/api/authApi';
import { getGuestDashboard } from '../../lib/guest/guestPersistence';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showError: vi.fn(async () => undefined),
  showSuccess: vi.fn(),
  getTemplates: vi.fn(async () => []),
  getProtocols: vi.fn(async () => []),
  getExercises: vi.fn(async () => []),
  isAdmin: vi.fn(async () => false),
}));

vi.mock('../../App', () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({ showError: mocks.showError, showSuccess: mocks.showSuccess }),
}));
vi.mock('../../lib/api/systemTemplatesApi', () => ({
  systemTemplatesApi: { getTemplates: mocks.getTemplates },
}));
vi.mock('../../lib/api/premiumProtocolsApi', () => ({
  premiumProtocolsApi: { getProtocols: mocks.getProtocols },
}));
vi.mock('../../lib/api/exerciseApi', () => ({
  exerciseApi: { getExercises: mocks.getExercises, isAdmin: mocks.isAdmin },
}));

import SmartOnboarding from './SmartOnboarding';

describe('SmartOnboarding guest final action', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    await authApi.signInAsGuest();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  it('moves from Prosseguir to Concluir Configuração without waiting for remote guest data', async () => {
    mocks.getExercises.mockImplementationOnce(() => new Promise(() => undefined));
    render(<SmartOnboarding initialStep={7} initialUserId={GUEST_USER_ID} />);

    const proceed = await screen.findByRole('button', { name: /^prosseguir$/i });
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    fireEvent.click(screen.getByRole('button', { name: /nenhuma limita/i }));
    fireEvent.click(proceed);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    vi.useRealTimers();

    expect(await screen.findByRole('button', { name: /concluir configura/i })).toBeTruthy();
    expect(screen.queryByText(/rubi optimizer/i)).toBeNull();
    expect(mocks.getExercises).not.toHaveBeenCalled();
    expect(mocks.isAdmin).not.toHaveBeenCalled();
  });

  it('uses the real buttons to persist a complete plan and navigate without an error toast', async () => {
    render(<SmartOnboarding initialStep={7} initialUserId={GUEST_USER_ID} skipBootstrap />);

    fireEvent.click(await screen.findByRole('button', { name: /^prosseguir$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /concluir configura/i }));
    expect(await screen.findByText(/configuração concluída/i)).toBeTruthy();

    const persistedBeforeNavigation = getGuestDashboard();
    expect(persistedBeforeNavigation.profile.active_plan_id).toBe(persistedBeforeNavigation.folders[0].id);
    expect(persistedBeforeNavigation.folders).toHaveLength(1);
    expect(persistedBeforeNavigation.workouts.length).toBeGreaterThan(0);
    expect(persistedBeforeNavigation.workouts.every((workout: any) => workout.exercises?.length > 0)).toBe(true);

    const dashboardButton = await screen.findByRole('button', { name: /ir para o dashboard/i });
    fireEvent.click(dashboardButton);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('dashboard'));
    expect(mocks.showError).not.toHaveBeenCalled();
  });

  it('does not request system templates or admin status while bootstrapping a guest', async () => {
    render(<SmartOnboarding initialStep={0} initialUserId={GUEST_USER_ID} />);
    await screen.findByText(/kyron onboarding/i);
    expect(mocks.getExercises).not.toHaveBeenCalled();
    expect(mocks.getTemplates).not.toHaveBeenCalled();
    expect(mocks.isAdmin).not.toHaveBeenCalled();
  });

  it('leaves the optimizer and shows an actionable error when activation times out', async () => {
    localStorage.removeItem('kyron_guest_session');
    vi.spyOn(authApi, 'getSession').mockImplementationOnce(() => new Promise(() => undefined));
    render(<SmartOnboarding initialStep={7} initialUserId="authenticated-user" skipBootstrap activationTimeoutMs={1000} />);

    fireEvent.click(screen.getByRole('button', { name: /^prosseguir$/i }));
    const conclude = await screen.findByRole('button', { name: /concluir configura/i });
    vi.useFakeTimers();
    fireEvent.click(conclude);

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.queryByText(/rubi optimizer/i)).toBeNull();
    expect(screen.getByRole('button', { name: /concluir configura/i })).toBeTruthy();
    expect(mocks.showError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringMatching(/tempo limite/i),
    }));
  });
});
