import { GUEST_USER_ID } from '../api/authApi';
import { UserProfile } from '../../types';

export const GUEST_PROFILE_KEY = 'kyron_guest_profile_v1';
export const GUEST_DASHBOARD_KEY = 'kyron_guest_dashboard_v1';
export const GUEST_STORAGE_SCHEMA_VERSION = 2;
export const GUEST_STORAGE_VERSION_KEY = 'kyron_guest_storage_schema_version';
const GUEST_STORAGE_MIGRATION_NOTICE_KEY = 'kyron_guest_storage_migration_notice_v2';

export type GuestDashboard = {
  profile: UserProfile & Record<string, any>;
  folders: any[];
  workouts: any[];
  history: any[];
  stats: { sessions: number };
};

export const createDefaultGuestProfile = (): UserProfile & Record<string, any> => ({
  id: GUEST_USER_ID,
  email: 'guest@kyron.os',
  name: 'Atleta Convidado',
  full_name: 'Atleta Convidado',
  onboarding_completed: true,
  role: 'user',
  is_admin: false,
  is_premium: false,
  account_status: 'active',
  workout_streak: 0,
});

const readJson = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
};

export const getGuestProfile = (): UserProfile & Record<string, any> => (
  readJson<UserProfile & Record<string, any>>(GUEST_PROFILE_KEY) || createDefaultGuestProfile()
);

export const saveGuestProfile = (changes: Record<string, any>): UserProfile & Record<string, any> => {
  const profile: UserProfile & Record<string, any> = {
    ...getGuestProfile(), ...changes, id: GUEST_USER_ID, role: 'user' as const, is_admin: false,
  };
  localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(`rubi_cached_profile_${GUEST_USER_ID}`, JSON.stringify(profile));
  return profile;
};

export const createEmptyGuestDashboard = (): GuestDashboard => ({
  profile: getGuestProfile(),
  folders: [] as any[],
  workouts: [] as any[],
  history: [] as any[],
  stats: { sessions: 0 },
});

export const getGuestDashboard = (): GuestDashboard => {
  const dashboard = readJson<GuestDashboard>(GUEST_DASHBOARD_KEY);
  return dashboard ? { ...dashboard, profile: getGuestProfile() } : createEmptyGuestDashboard();
};

export const saveGuestPlan = (protocol: any, formData: Record<string, any>) => {
  const now = Date.now();
  const folderId = `guest-folder-${now}`;
  const sourceWorkouts = Array.isArray(protocol?.workouts) ? protocol.workouts : [];
  const fallbackExercises = [
    'Agachamento livre', 'Supino reto', 'Remada baixa',
    'Desenvolvimento com halteres', 'Mesa flexora', 'Prancha',
  ];
  const normalizedWorkouts = (sourceWorkouts.length > 0 ? sourceWorkouts : [{ name: 'Treino A — Corpo Inteiro', exercises: [] }])
    .map((workout: any, workoutIndex: number) => {
      const sourceExercises = Array.isArray(workout.exercises) && workout.exercises.length > 0
        ? workout.exercises
        : fallbackExercises.map((name, index) => ({ exercise_name: name, sort_order: index + 1 }));
      const id = `guest-workout-${now}-${workoutIndex}`;
      return {
        id,
        user_id: GUEST_USER_ID,
        folder_id: folderId,
        name: workout.name || `Treino ${String.fromCharCode(65 + workoutIndex)}`,
        description: workout.description || 'Plano salvo localmente no modo convidado.',
        duration_minutes: workout.duration_minutes || 45,
        created_at: new Date(now).toISOString(),
        exercises_count: sourceExercises.length,
        exercises: sourceExercises.map((exercise: any, exerciseIndex: number) => ({
          id: `guest-exercise-${now}-${workoutIndex}-${exerciseIndex}`,
          category_id: id,
          exercise_id: exercise.exercise_id || exercise.id || `guest-catalog-${exerciseIndex}`,
          exercise_name_snapshot: exercise.exercise_name || exercise.name || fallbackExercises[exerciseIndex % fallbackExercises.length],
          sets: Number(exercise.sets) || 3,
          reps: String(exercise.reps || '10-12'),
          weight: Number(exercise.weight) || 0,
          rest_time: Number(exercise.rest_time) || 60,
          sort_order: exercise.sort_order || exerciseIndex + 1,
          sets_json: exercise.sets_json || [],
        })),
      };
    });

  if (normalizedWorkouts.length === 0 || normalizedWorkouts.some((workout: any) => workout.exercises.length === 0)) {
    throw new Error('Não foi possível gerar um plano local completo.');
  }

  const profile = saveGuestProfile({
    ...formData,
    gender: formData.sex || formData.gender,
    goal: formData.primary_goal || formData.goal,
    frequency: String(formData.weekly_availability || formData.frequency || 3),
    onboarding_completed: true,
    active_protocol_id: protocol?.id || 'guest-local-protocol',
    active_plan_id: folderId,
    last_onboarding_update: new Date(now).toISOString(),
  });
  const dashboard: GuestDashboard = {
    profile,
    folders: [{ id: folderId, user_id: GUEST_USER_ID, name: protocol?.name || 'Meu plano local' }],
    workouts: normalizedWorkouts,
    history: [],
    stats: { sessions: 0 },
  };
  localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify(dashboard));
  localStorage.setItem('favorite_workout_folder_id', folderId);
  localStorage.setItem(`rubi_dashboard_cache_${GUEST_USER_ID}`, JSON.stringify(dashboard));
  return dashboard;
};

export const activateGuestPlan = (
  protocol: any,
  formData: Record<string, any>,
) => {
  saveGuestPlan(protocol, formData);
  const persisted = getGuestDashboard();
  const complete = persisted.folders.length > 0
    && persisted.workouts.length > 0
    && persisted.workouts.every((workout: any) => Array.isArray(workout.exercises) && workout.exercises.length > 0);
  if (!complete || !localStorage.getItem('favorite_workout_folder_id')) {
    throw new Error('O plano local não pôde ser confirmado neste aparelho.');
  }
  return persisted;
};

export const getGuestWorkout = (workoutId: string) => {
  const dashboard = getGuestDashboard();
  const matches = dashboard.workouts.filter((workout: any) => workout.id === workoutId);
  if (matches.length !== 1) return null;
  const workout = matches[0];
  const folderId = workout.folder_id || workout.workout_folder_id;
  if (!folderId || !dashboard.folders.some((folder: any) => folder.id === folderId)) return null;
  if (!Array.isArray(workout.exercises) || workout.exercises.some((exercise: any) =>
    exercise.category_id && exercise.category_id !== workoutId)) return null;
  return workout;
};

export const saveGuestWorkoutTemp = (workoutId: string, exercises: any[]) => {
  const workout = getGuestWorkout(workoutId);
  if (!workout) throw new Error('Ficha local não encontrada para salvar a sessão temporária.');
  localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify({
    schemaVersion: GUEST_STORAGE_SCHEMA_VERSION,
    workoutId,
    folderId: workout.folder_id || workout.workout_folder_id,
    exercises,
  }));
};

export const readGuestWorkoutTemp = (workoutId: string): any[] | null => {
  const workout = getGuestWorkout(workoutId);
  const key = `workout_session_temp_${workoutId}`;
  const temp = readJson<any>(key);
  const folderId = workout?.folder_id || workout?.workout_folder_id;
  const compatible = workout && temp?.schemaVersion === GUEST_STORAGE_SCHEMA_VERSION
    && temp.workoutId === workoutId
    && temp.folderId === folderId
    && Array.isArray(temp.exercises)
    && temp.exercises.every((exercise: any) => !exercise.category_id || exercise.category_id === workoutId);
  if (!compatible) {
    if (temp) localStorage.removeItem(key);
    return null;
  }
  return temp.exercises;
};

export const updateGuestWorkoutExercises = (workoutId: string, exercises: any[]) => {
  const dashboard = getGuestDashboard();
  const index = dashboard.workouts.findIndex((workout: any) => workout.id === workoutId);
  if (index < 0) throw new Error('Ficha local não encontrada.');
  dashboard.workouts[index] = {
    ...dashboard.workouts[index],
    exercises: exercises.map((exercise, order) => ({ ...exercise, sort_order: order + 1 })),
    exercises_count: exercises.length,
  };
  localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify(dashboard));
  localStorage.setItem(`rubi_dashboard_cache_${GUEST_USER_ID}`, JSON.stringify(dashboard));
  return dashboard.workouts[index];
};

export const getOrCreateGuestWorkoutSession = (workoutId: string) => {
  const key = `guest_workout_session_${workoutId}`;
  const existing = readJson<any>(key);
  if (existing) return existing;
  const session = {
    historyId: `guest-history-${workoutId}`,
    workoutId,
    startTime: Date.now(),
    currentIndex: 0,
    currentSet: 1,
  };
  localStorage.setItem(key, JSON.stringify(session));
  return session;
};

export const validateGuestWorkoutSession = (workoutId: string) => {
  const workout = getGuestWorkout(workoutId);
  const sessionKey = `guest_workout_session_${workoutId}`;
  const session = readJson<any>(sessionKey);
  if (!session) return { valid: true, reset: false };
  const continuityKey = `workout_continuity_state_${session.historyId}`;
  const continuity = readJson<any>(continuityKey);
  const exerciseIds = (workout?.exercises || []).map((exercise: any) => exercise.exercise_id);
  const storedIds = continuity?.exerciseIds;
  const continuityWorkoutMatches = !continuity?.workoutId || continuity.workoutId === workoutId;
  const idsMatch = !storedIds || (
    Array.isArray(storedIds)
    && storedIds.length === exerciseIds.length
    && storedIds.every((id: string, index: number) => id === exerciseIds[index])
  );
  const indexValid = !continuity || (
    Number(continuity.currentIndex || 0) >= 0
    && Number(continuity.currentIndex || 0) < exerciseIds.length
  );
  const completedValid = !continuity?.completedSetsByExercise || Object.entries(continuity.completedSetsByExercise)
    .every(([exerciseIndex, completed]: [string, any]) => {
      const exercise = workout?.exercises?.[Number(exerciseIndex)];
      const setCount = exercise?.sets_json?.length || exercise?.sets || 0;
      return Boolean(exercise) && Array.isArray(completed)
        && completed.every((setIndex: number) => setIndex >= 0 && setIndex < setCount);
    });
  const valid = Boolean(workout)
    && session.workoutId === workoutId
    && session.historyId === `guest-history-${workoutId}`
    && continuityWorkoutMatches
    && idsMatch
    && indexValid
    && completedValid;
  if (valid) return { valid: true, reset: false };
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(continuityKey);
  localStorage.removeItem(`workout_session_temp_${workoutId}`);
  localStorage.removeItem(`workout_rest_start_${workoutId}`);
  localStorage.removeItem(`workout_rest_time_left_${workoutId}`);
  console.warn('[GuestWorkout] Sessão local incompatível descartada com segurança.', { workoutId });
  return { valid: false, reset: true };
};

export const clearLegacyGuestWorkoutState = (workoutId: string) => {
  const removed: string[] = [];
  const remove = (key: string) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  };
  ['workout_rest_start', 'workout_rest_time_left', 'last_valid_workout', 'workout_session', 'currentExercise']
    .forEach(remove);
  const persisted = readJson<any>('workout-storage');
  const persistedWorkoutId = persisted?.state?.currentWorkoutId;
  if (persistedWorkoutId && persistedWorkoutId !== workoutId) remove('workout-storage');
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key && key.startsWith('rubi_partial_session_') && key !== `rubi_partial_session_${workoutId}`) remove(key);
  }
  return removed;
};

export type GuestStorageMigrationResult = {
  applied: boolean;
  fromVersion: number;
  toVersion: number;
  removedKeys: string[];
  reason: string;
};

export const migrateGuestStorage = (): GuestStorageMigrationResult => {
  const fromVersion = Number(localStorage.getItem(GUEST_STORAGE_VERSION_KEY) || 0);
  if (fromVersion >= GUEST_STORAGE_SCHEMA_VERSION) {
    return {
      applied: false,
      fromVersion,
      toVersion: GUEST_STORAGE_SCHEMA_VERSION,
      removedKeys: [],
      reason: 'schema-current',
    };
  }

  const removedKeys: string[] = [];
  const transientExact = new Set([
    'workout-storage',
    'workout_rest_start',
    'workout_rest_time_left',
    'last_valid_workout',
    'workout_session',
    'currentExercise',
    'current_exercise',
    'workout_current_exercise',
  ]);
  const transientPrefixes = [
    'workout_continuity_state_',
    'guest_workout_session_',
    'workout_rest_start_',
    'workout_rest_time_left_',
    'workout_session_temp_',
    'rubi_partial_session_',
    'workout_partial_session_',
    'currentExercise_',
  ];
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (transientExact.has(key) || transientPrefixes.some(prefix => key.startsWith(prefix))) {
      localStorage.removeItem(key);
      removedKeys.push(key);
    }
  }

  const result: GuestStorageMigrationResult = {
    applied: true,
    fromVersion,
    toVersion: GUEST_STORAGE_SCHEMA_VERSION,
    removedKeys: removedKeys.sort(),
    reason: 'legacy-transient-state-incompatible',
  };
  localStorage.setItem(GUEST_STORAGE_VERSION_KEY, String(GUEST_STORAGE_SCHEMA_VERSION));
  localStorage.setItem(GUEST_STORAGE_MIGRATION_NOTICE_KEY, JSON.stringify(result));
  return result;
};

export const consumeGuestStorageMigrationNotice = (remove = true): GuestStorageMigrationResult | null => {
  const notice = readJson<GuestStorageMigrationResult>(GUEST_STORAGE_MIGRATION_NOTICE_KEY);
  if (notice && remove) localStorage.removeItem(GUEST_STORAGE_MIGRATION_NOTICE_KEY);
  return notice;
};

export const finishGuestWorkout = (workoutId: string, result: Record<string, any>) => {
  const dashboard = getGuestDashboard();
  const workout = dashboard.workouts.find((item: any) => item.id === workoutId);
  const performance = result.performance || {};
  const workoutSetsLogs = Object.entries(performance).flatMap(([exerciseIndex, sets]: [string, any]) =>
    (sets || []).map((set: any, setIndex: number) => ({
      exercise_id: workout?.exercises?.[Number(exerciseIndex)]?.exercise_id,
      exercise_name: workout?.exercises?.[Number(exerciseIndex)]?.exercise_name_snapshot,
      set_number: setIndex + 1,
      weight_achieved: Number(set.weight || 0),
      reps_achieved: Number(set.reps || 0),
      rpe: Number(set.rpe || 0),
      rest_time: Number(set.rest_time || 0),
    }))
  );
  const totalVolume = workoutSetsLogs.reduce((sum: number, set: any) =>
    sum + set.weight_achieved * set.reps_achieved, 0);
  const durationMinutes = result.duration_seconds !== undefined
    ? Math.max(1, Math.round(Number(result.duration_seconds) / 60))
    : Math.max(1, Math.round(Number(result.duration_minutes) || 0));
  dashboard.history = [{
    ...result,
    id: `guest-completed-${Date.now()}`,
    workout_id: workoutId,
    category_id: workoutId,
    workout_name: workout?.name || 'Treino local',
    completed_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    total_volume: totalVolume,
    workout_sets_logs: workoutSetsLogs,
  }, ...(dashboard.history || [])];
  dashboard.stats = { ...dashboard.stats, sessions: (dashboard.stats?.sessions || 0) + 1 };
  localStorage.setItem(GUEST_DASHBOARD_KEY, JSON.stringify(dashboard));
  localStorage.setItem(`rubi_dashboard_cache_${GUEST_USER_ID}`, JSON.stringify(dashboard));
  localStorage.removeItem(`guest_workout_session_${workoutId}`);
  return dashboard;
};
