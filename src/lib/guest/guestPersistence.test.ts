import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUEST_DASHBOARD_KEY,
  getGuestDashboard,
  getGuestProfile,
  saveGuestPlan,
  saveGuestProfile,
} from './guestPersistence';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
};

describe('guest lifecycle persistence', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createStorage()));

  it('persists profile changes across a fresh read', () => {
    saveGuestProfile({ name: 'Maria', weight: 68 });
    expect(getGuestProfile()).toMatchObject({ name: 'Maria', weight: 68, is_admin: false });
  });

  it('creates a complete local plan and hydrates the dashboard after reload', () => {
    const dashboard = saveGuestPlan({
      id: 'local-protocol',
      name: 'Plano teste',
      workouts: [{
        name: 'Treino A',
        exercises: [{ exercise_name: 'Supino', sets: 3, reps: '10' }],
      }],
    }, { name: 'Maria', primary_goal: 'hypertrophy' });

    expect(dashboard.workouts[0].exercises).toHaveLength(1);
    expect(localStorage.getItem(GUEST_DASHBOARD_KEY)).not.toBeNull();
    expect(getGuestDashboard()).toMatchObject({
      folders: [{ name: 'Plano teste' }],
      workouts: [{ name: 'Treino A', exercises_count: 1 }],
      profile: { name: 'Maria', onboarding_completed: true },
    });
  });

  it('uses a complete six-exercise fallback when a protocol has no workouts', () => {
    const dashboard = saveGuestPlan({ id: 'empty', name: 'Plano local' }, {});
    expect(dashboard.workouts).toHaveLength(1);
    expect(dashboard.workouts[0].exercises).toHaveLength(6);
  });

  it('treats a new guest without a plan as an empty state, not an error', () => {
    expect(getGuestDashboard()).toMatchObject({ workouts: [], folders: [], stats: { sessions: 0 } });
  });
});
