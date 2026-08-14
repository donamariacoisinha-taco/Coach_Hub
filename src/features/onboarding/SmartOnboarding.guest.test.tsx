// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  afterEach(() => cleanup());

  it('uses the real buttons to persist a complete plan and navigate without an error toast', async () => {
    render(<SmartOnboarding initialStep={8} initialUserId={GUEST_USER_ID} skipBootstrap />);

    fireEvent.click(await screen.findByRole('button', { name: /concluir configura/i }));
    const dashboardButton = await screen.findByRole('button', { name: /ir para o dashboard/i });

    const persistedBeforeNavigation = getGuestDashboard();
    expect(persistedBeforeNavigation.folders).toHaveLength(1);
    expect(persistedBeforeNavigation.workouts.length).toBeGreaterThan(0);
    expect(persistedBeforeNavigation.workouts.every((workout: any) => workout.exercises?.length > 0)).toBe(true);

    fireEvent.click(dashboardButton);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('dashboard'));
    expect(mocks.showError).not.toHaveBeenCalled();
  });

  it('does not request system templates or admin status while bootstrapping a guest', async () => {
    render(<SmartOnboarding initialStep={0} initialUserId={GUEST_USER_ID} />);
    await screen.findByText(/kyron onboarding/i);
    await waitFor(() => expect(mocks.getExercises).toHaveBeenCalled());
    expect(mocks.getTemplates).not.toHaveBeenCalled();
    expect(mocks.isAdmin).not.toHaveBeenCalled();
  });
});
