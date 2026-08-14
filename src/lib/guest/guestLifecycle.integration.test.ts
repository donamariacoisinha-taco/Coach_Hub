import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, isGuestSession } from '../api/authApi';
import { workoutApi } from '../api/workoutApi';
import { activateGuestPlan, getGuestProfile } from './guestPersistence';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
};

describe('guest onboarding to dashboard integration', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createStorage()));

  it('completes onboarding, lists the plan and rehydrates after reload', async () => {
    await authApi.signInAsGuest();

    activateGuestPlan({
      id: 'guest-protocol',
      name: 'Plano da Maria',
      workouts: [
        { name: 'Treino A', exercises: [{ exercise_name: 'Supino', sets: 3, reps: '10' }] },
        { name: 'Treino B', exercises: [{ exercise_name: 'Agachamento', sets: 4, reps: '8' }] },
      ],
    }, { name: 'Maria', primary_goal: 'hypertrophy' });

    const firstDashboardRead = workoutApi.getGuestDashboardData();
    expect(firstDashboardRead.folders[0].name).toBe('Plano da Maria');
    expect(firstDashboardRead.workouts).toHaveLength(2);
    expect(firstDashboardRead.workouts.every((workout: any) => workout.exercises.length > 0)).toBe(true);

    // A reload creates new reads from storage, not from the objects returned above.
    const reloadedSession = await authApi.getSession();
    const reloadedDashboard = workoutApi.getGuestDashboardData();
    const reloadedProfile = getGuestProfile();
    expect(isGuestSession(reloadedSession)).toBe(true);
    expect(reloadedDashboard.workouts.map((workout: any) => workout.name)).toEqual(['Treino A', 'Treino B']);
    expect(reloadedProfile).toMatchObject({ name: 'Maria', active_plan_id: reloadedDashboard.folders[0].id });
  });

  it('rejects completion when persistence cannot be read back', () => {
    const brokenStorage = {
      ...createStorage(),
      getItem: () => null,
    };
    vi.stubGlobal('localStorage', brokenStorage);
    expect(() => activateGuestPlan({ name: 'Plano' }, {})).toThrow(/não pôde ser confirmado/i);
  });
});
