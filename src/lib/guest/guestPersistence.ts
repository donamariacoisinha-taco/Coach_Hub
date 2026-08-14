import { GUEST_USER_ID } from '../api/authApi';
import { UserProfile } from '../../types';

export const GUEST_PROFILE_KEY = 'kyron_guest_profile_v1';
export const GUEST_DASHBOARD_KEY = 'kyron_guest_dashboard_v1';

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
  navigate: (view: 'dashboard') => void,
) => {
  saveGuestPlan(protocol, formData);
  const persisted = getGuestDashboard();
  const complete = persisted.folders.length > 0
    && persisted.workouts.length > 0
    && persisted.workouts.every((workout: any) => Array.isArray(workout.exercises) && workout.exercises.length > 0);
  if (!complete || !localStorage.getItem('favorite_workout_folder_id')) {
    throw new Error('O plano local não pôde ser confirmado neste aparelho.');
  }
  navigate('dashboard');
  return persisted;
};
