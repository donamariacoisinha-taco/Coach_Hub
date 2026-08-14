import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUEST_DASHBOARD_KEY,
  finishGuestWorkout,
  getGuestDashboard,
  getGuestProfile,
  getGuestWorkout,
  getOrCreateGuestWorkoutSession,
  saveGuestPlan,
  saveGuestProfile,
  updateGuestWorkoutExercises,
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

  it('supports preparation, reload, keep/discard and local workout history', () => {
    const dashboard = saveGuestPlan({
      name: 'Plano player',
      workouts: [{
        name: 'Treino local',
        exercises: [
          { exercise_name: 'Supino', weight: 10, reps: '10' },
          { exercise_name: 'Remada', weight: 12, reps: '12' },
        ],
      }],
    }, {});
    const workoutId = dashboard.workouts[0].id;
    const base = getGuestWorkout(workoutId);
    const reordered = [base.exercises[1], base.exercises[0]];
    updateGuestWorkoutExercises(workoutId, reordered);
    expect(getGuestWorkout(workoutId).exercises.map((exercise: any) => exercise.exercise_name_snapshot))
      .toEqual(['Remada', 'Supino']);

    const session = getOrCreateGuestWorkoutSession(workoutId);
    localStorage.setItem(`workout_continuity_state_${session.historyId}`, JSON.stringify({
      currentIndex: 1,
      currentSet: 2,
      workoutPerformance: { 1: [{ weight: 20, reps: 8, rpe: 9, rest_time: 75 }] },
    }));
    expect(getOrCreateGuestWorkoutSession(workoutId)).toEqual(session);

    const discardedDraft = reordered.map((exercise: any) => ({ ...exercise, weight: 99 }));
    localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(discardedDraft));
    localStorage.removeItem(`workout_session_temp_${workoutId}`);
    expect(getGuestWorkout(workoutId).exercises[0].weight).toBe(12);

    updateGuestWorkoutExercises(workoutId, discardedDraft);
    expect(getGuestWorkout(workoutId).exercises[0].weight).toBe(99);
    finishGuestWorkout(workoutId, { duration_minutes: 30, performance: { 0: [{ weight: 99, reps: 8, rpe: 9 }] } });
    expect(getGuestDashboard()).toMatchObject({ stats: { sessions: 1 } });
    expect(getGuestDashboard().history).toHaveLength(1);
  });

  it('isolates sequential workout sessions and normalizes seconds, volume and completion fields', () => {
    const dashboard = saveGuestPlan({ workouts: [
      { name: 'Ficha A', exercises: [{ exercise_name: 'Supino', weight: 20, reps: '12' }] },
      { name: 'Ficha B', exercises: [{ exercise_name: 'Prancha', weight: 0, reps: '30' }] },
    ] }, {});
    const [first, second] = dashboard.workouts;
    const firstSession = getOrCreateGuestWorkoutSession(first.id);
    const secondSession = getOrCreateGuestWorkoutSession(second.id);
    expect(firstSession.historyId).not.toBe(secondSession.historyId);
    expect(getGuestWorkout(first.id).exercises[0].exercise_name_snapshot).toBe('Supino');
    expect(getGuestWorkout(second.id).exercises[0].exercise_name_snapshot).toBe('Prancha');

    finishGuestWorkout(first.id, {
      duration_seconds: 84,
      performance: { 0: [{ weight: 20, reps: 12, rpe: 8, rest_time: 60 }] },
    });
    const completed = getGuestDashboard().history[0];
    expect(completed).toMatchObject({
      category_id: first.id,
      workout_id: first.id,
      duration_minutes: 1,
      total_volume: 240,
    });
    expect(completed.workout_sets_logs[0]).toMatchObject({ weight_achieved: 20, reps_achieved: 12 });
    expect(localStorage.getItem(`guest_workout_session_${first.id}`)).toBeNull();
    expect(getOrCreateGuestWorkoutSession(second.id)).toEqual(secondSession);
  });
});
