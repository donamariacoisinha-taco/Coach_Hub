import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decideWorkoutAdvance, getWorkoutSetCount, shouldConfirmPartialBeforeTerminalSet } from '../../domain/workout/workoutReliability';
import {
  GUEST_DASHBOARD_KEY,
  GUEST_STORAGE_SCHEMA_VERSION,
  GUEST_STORAGE_VERSION_KEY,
  finishGuestWorkout,
  claimGuestStorageMigrationNoticeDisplay,
  clearLegacyGuestWorkoutState,
  getGuestDashboard,
  getGuestProfile,
  getGuestWorkout,
  getOrCreateGuestWorkoutSession,
  migrateGuestStorage,
  readGuestWorkoutTemp,
  saveGuestWorkoutTemp,
  saveGuestPlan,
  saveGuestProfile,
  updateGuestWorkoutExercises,
  validateGuestWorkoutSession,
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

describe('guest lifecycle persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    vi.stubGlobal('sessionStorage', createStorage());
  });

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

  it('persists only supplied completed sets and marks a confirmed partial session', () => {
    const dashboard = saveGuestPlan({ workouts: [{
      name: 'Ficha parcial',
      exercises: [{ exercise_name: 'Supino', sets: 3 }, { exercise_name: 'Remada', sets: 3 }],
    }] }, {});
    const workoutId = dashboard.workouts[0].id;
    finishGuestWorkout(workoutId, {
      duration_seconds: 45,
      partial: true,
      performance: { 0: [{ weight: 20, reps: 10, rpe: 8 }] },
    });
    const history = getGuestDashboard().history[0];
    expect(history).toMatchObject({ workout_id: workoutId, partial: true });
    expect(history.workout_sets_logs).toHaveLength(1);
    expect(history.workout_sets_logs[0]).toMatchObject({ exercise_name: 'Supino', set_number: 1 });
  });

  it('invalidates a legacy continuity state that belongs to another workout', () => {
    const dashboard = saveGuestPlan({ workouts: [{
      name: 'Ficha segura',
      exercises: [{ exercise_name: 'Supino', sets: 3 }],
    }] }, {});
    const workoutId = dashboard.workouts[0].id;
    const session = getOrCreateGuestWorkoutSession(workoutId);
    localStorage.setItem(`workout_continuity_state_${session.historyId}`, JSON.stringify({
      workoutId: 'guest-workout-outra-ficha',
      exerciseIds: ['exercise-from-another-workout'],
      currentIndex: 7,
      completedSetsByExercise: { 0: [0, 8] },
    }));

    expect(validateGuestWorkoutSession(workoutId)).toEqual({ valid: false, reset: true });
    expect(localStorage.getItem(`guest_workout_session_${workoutId}`)).toBeNull();
    expect(localStorage.getItem(`workout_continuity_state_${session.historyId}`)).toBeNull();
    const fresh = getOrCreateGuestWorkoutSession(workoutId);
    expect(fresh).toMatchObject({ workoutId, currentIndex: 0, currentSet: 1 });
  });

  it('clears every legacy global workout source before opening another guest workout', () => {
    const legacyExercise = [{ exercise_id: 'prancha', weight: 240 }];
    localStorage.setItem('workout-storage', JSON.stringify({ state: {
      currentWorkoutId: 'guest-workout-a', exercises: legacyExercise, currentIndex: 5,
    } }));
    localStorage.setItem('workout_rest_start', '123');
    localStorage.setItem('workout_rest_time_left', '60');
    localStorage.setItem('last_valid_workout', JSON.stringify(legacyExercise));
    localStorage.setItem('workout_session', JSON.stringify(legacyExercise));
    localStorage.setItem('currentExercise', JSON.stringify(legacyExercise[0]));
    localStorage.setItem('rubi_partial_session_guest-workout-a', JSON.stringify(legacyExercise));

    const removed = clearLegacyGuestWorkoutState('guest-workout-b');
    expect(removed).toEqual(expect.arrayContaining([
      'workout-storage', 'workout_rest_start', 'workout_rest_time_left',
      'last_valid_workout', 'workout_session', 'currentExercise',
      'rubi_partial_session_guest-workout-a',
    ]));
    expect(localStorage.getItem('workout-storage')).toBeNull();
  });

  it('migrates A/B/C legacy sessions once while preserving durable plans, order, profile and history', () => {
    saveGuestProfile({ name: 'Maria preservada' });
    const dashboard = saveGuestPlan({ name: 'Plano ABC', workouts: [
      { name: 'Ficha A', exercises: [{ exercise_name: 'Supino A', weight: 0 }, { exercise_name: 'Tríceps A', weight: 0 }] },
      { name: 'Ficha B', exercises: [{ exercise_name: 'Puxada B', weight: 0 }, { exercise_name: 'Rosca B', weight: 0 }] },
      { name: 'Ficha C', exercises: [{ exercise_name: 'Agachamento C', weight: 0 }, { exercise_name: 'Panturrilha C', weight: 0 }] },
    ] }, { name: 'Maria preservada' });
    updateGuestWorkoutExercises(dashboard.workouts[0].id, [
      dashboard.workouts[0].exercises[1], dashboard.workouts[0].exercises[0],
    ]);
    finishGuestWorkout(dashboard.workouts[0].id, {
      duration_seconds: 60,
      performance: { 0: [{ weight: 20, reps: 12, rpe: 8 }] },
    });
    const durableBefore = getGuestDashboard();
    const legacy = JSON.stringify({ currentIndex: 5, exerciseIds: ['prancha'], weight: 240 });
    ['A', 'B', 'C'].forEach(label => {
      localStorage.setItem(`workout_continuity_state_guest-history-${label}`, legacy);
      localStorage.setItem(`guest_workout_session_guest-workout-${label}`, legacy);
      localStorage.setItem(`workout_session_temp_guest-workout-${label}`, legacy);
      localStorage.setItem(`workout_rest_start_guest-workout-${label}`, '1');
      localStorage.setItem(`workout_rest_time_left_guest-workout-${label}`, '60');
      localStorage.setItem(`rubi_partial_session_guest-workout-${label}`, legacy);
    });
    localStorage.setItem('workout-storage', legacy);
    localStorage.setItem('currentExercise', legacy);

    const first = migrateGuestStorage();
    expect(first.applied).toBe(true);
    expect(localStorage.getItem(GUEST_STORAGE_VERSION_KEY)).toBe(String(GUEST_STORAGE_SCHEMA_VERSION));
    expect(first.removedKeys.length).toBeGreaterThan(10);
    expect(getGuestProfile().name).toBe('Maria preservada');
    expect(getGuestDashboard().history).toEqual(durableBefore.history);
    expect(getGuestDashboard().workouts.map((workout: any) => workout.name)).toEqual(['Ficha A', 'Ficha B', 'Ficha C']);
    const [aId, bId, cId] = getGuestDashboard().workouts.map((workout: any) => workout.id);
    expect([aId, bId, cId].map(id => getGuestWorkout(id).exercises.map((exercise: any) =>
      exercise.exercise_name_snapshot))).toEqual([
      ['Tríceps A', 'Supino A'],
      ['Puxada B', 'Rosca B'],
      ['Agachamento C', 'Panturrilha C'],
    ]);
    expect([aId, bId, cId].map(id => getGuestWorkout(id).exercises[0].weight)).toEqual([0, 0, 0]);

    localStorage.setItem(`workout_session_temp_${bId}`, JSON.stringify({
      schemaVersion: GUEST_STORAGE_SCHEMA_VERSION,
      workoutId: cId,
      folderId: getGuestWorkout(cId).folder_id,
      exercises: getGuestWorkout(cId).exercises,
    }));
    expect(readGuestWorkoutTemp(bId)).toBeNull();
    saveGuestWorkoutTemp(aId, getGuestWorkout(aId).exercises);
    expect(readGuestWorkoutTemp(aId)?.[0].exercise_name_snapshot).toBe('Tríceps A');

    const durableAfterFirstRun = JSON.stringify(getGuestDashboard());
    const second = migrateGuestStorage();
    expect(second).toMatchObject({ applied: false, reason: 'schema-current' });
    expect(JSON.stringify(getGuestDashboard())).toBe(durableAfterFirstRun);
    expect(shouldConfirmPartialBeforeTerminalSet({
      requiredSetCounts: [3, 3],
      completedSetsByExercise: { 0: new Set(), 1: new Set([0, 1]) },
      currentIndex: 1,
      currentSetIndex: 2,
    })).toBe(true);
  });

  it('repairs the exact v2 production corruption where A/B/C all contain the C sequence', () => {
    const dashboard = saveGuestPlan({ name: 'Plano produção', workouts: [
      { name: 'Superior Empurrar A', exercises: [{ exercise_name: 'Supino original', weight: 0 }] },
      { name: 'Superior Puxar B', exercises: [{ exercise_name: 'Puxada original', weight: 0 }] },
      { name: 'Pernas C', exercises: [
        { exercise_name: 'Agachamento livre', weight: 0 },
        { exercise_name: 'Leg press', weight: 0 },
        { exercise_name: 'Mesa flexora', weight: 0 },
      ] },
    ] }, { name: 'Perfil mantido' });
    const corrupted = getGuestDashboard();
    const cExercises = corrupted.workouts[2].exercises;
    corrupted.workouts[0].exercises = cExercises;
    corrupted.workouts[1].exercises = cExercises;
    localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify(corrupted));
    localStorage.setItem(GUEST_STORAGE_VERSION_KEY, '3');
    localStorage.setItem('workout-storage', JSON.stringify({ state: {
      currentWorkoutId: corrupted.workouts[0].id,
      exercises: cExercises,
      currentIndex: 5,
      currentSet: 3,
      startTime: Date.now() - 478000,
    } }));
    localStorage.setItem('workout_start_time', String(Date.now() - 478000));
    localStorage.setItem('workoutStartTime', String(Date.now() - 453000));
    localStorage.setItem('startTime', String(Date.now() - 453000));
    corrupted.workouts.forEach((workout: any, index: number) => {
      localStorage.setItem(`guest_workout_session_${workout.id}`, JSON.stringify({
        workoutId: workout.id, historyId: `guest-history-${workout.id}`, startTime: Date.now() - (453000 + index),
      }));
      localStorage.setItem(`workout_continuity_state_guest-history-${workout.id}`, JSON.stringify({
        workoutId: workout.id, exerciseIds: cExercises.map((exercise: any) => exercise.exercise_id), currentIndex: 5,
      }));
      localStorage.setItem(`workout_rest_start_${workout.id}`, String(Date.now() - 10000));
      localStorage.setItem(`workout_timer_${workout.id}`, String(478 - index));
      localStorage.setItem(`workout_elapsed_${workout.id}`, String(453 - index));
    });

    const result = migrateGuestStorage();
    expect(result).toMatchObject({ applied: true, fromVersion: 3, toVersion: 4 });
    expect(result.repairedWorkoutIds).toEqual([dashboard.workouts[0].id, dashboard.workouts[1].id]);
    const repaired = getGuestDashboard();
    expect(repaired.workouts[0].exercises[0]).toMatchObject({ exercise_name_snapshot: 'Supino reto', weight: 0, sort_order: 1 });
    expect(repaired.workouts[1].exercises[0]).toMatchObject({ exercise_name_snapshot: 'Puxada frontal', weight: 0, sort_order: 1 });
    expect(repaired.workouts[2].exercises[0].exercise_name_snapshot).toBe('Agachamento livre');
    repaired.workouts.forEach((workout: any) => {
      expect(workout.exercises.every((exercise: any) => exercise.category_id === workout.id)).toBe(true);
      expect(workout.exercises.every((exercise: any) => exercise.sets === 3)).toBe(true);
      expect(workout.exercises.every((exercise: any) => exercise.set_count === 3)).toBe(true);
      expect(workout.exercises.every((exercise: any) => exercise.series === 3)).toBe(true);
      expect(workout.exercises.every((exercise: any) => exercise.sets_json.length === 3)).toBe(true);
      expect(localStorage.getItem(`guest_workout_session_${workout.id}`)).toBeNull();
      expect(localStorage.getItem(`workout_rest_start_${workout.id}`)).toBeNull();
      expect(localStorage.getItem(`workout_timer_${workout.id}`)).toBeNull();
      expect(localStorage.getItem(`workout_elapsed_${workout.id}`)).toBeNull();
      const totalSets = getWorkoutSetCount(workout.exercises[0]);
      expect(totalSets).toBe(3);
      expect(decideWorkoutAdvance({
        currentIndex: 0, currentSet: 1, exerciseCount: workout.exercises.length, runtimeSetCount: totalSets,
      })).toMatchObject({ action: 'NEXT_SET', currentSet: 2 });
    });
    expect(localStorage.getItem('workout-storage')).toBeNull();
    expect(localStorage.getItem('workout_start_time')).toBeNull();
    expect(localStorage.getItem('workoutStartTime')).toBeNull();
    expect(localStorage.getItem('startTime')).toBeNull();
    expect(getGuestProfile().name).toBe('Perfil mantido');
    expect(migrateGuestStorage().applied).toBe(false);
  });

  it('claims the recovery notice only once per browser session while it remains persisted', () => {
    const notice = { applied: true, fromVersion: 3, toVersion: 4, removedKeys: [], reason: 'recovery' };
    expect(claimGuestStorageMigrationNoticeDisplay(notice)).toBe(true);
    expect(claimGuestStorageMigrationNoticeDisplay(notice)).toBe(false);
    sessionStorage.clear();
    expect(claimGuestStorageMigrationNoticeDisplay(notice)).toBe(true);
  });
});
