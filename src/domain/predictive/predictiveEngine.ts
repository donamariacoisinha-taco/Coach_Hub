
import { WorkoutHistory, WorkoutCategory, UserProfile } from '../../types';

export interface UserContext {
  currentTime: Date;
  dayOfWeek: number;
  lastWorkout?: WorkoutHistory;
  weeklyFrequency: number;
  daysSinceLastWorkout: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isTrainingDay: boolean;
  /** Existe hoje ao menos uma sessão concluída integralmente. */
  completedToday: boolean;
  /** Existe hoje ao menos uma sessão parcial e nenhuma completa. */
  partialToday: boolean;
  /** Sessão parcial mais recente de hoje, quando não houver sessão completa. */
  partialTodayWorkout?: WorkoutHistory;
}

export interface PredictiveAction {
  type: 'start_workout' | 'rest' | 'motivation' | 'resume' | 'partial';
  title: string;
  description: string;
  suggestedWorkoutId?: string;
  suggestedWorkoutName?: string;
  priority: number; // 1-10
}

export const getContext = (
  profile: UserProfile,
  history: WorkoutHistory[]
): UserContext => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastWorkout = (history && history.length > 0) ? history[0] : undefined;

  const isToday = (entry: WorkoutHistory) => Boolean(entry?.completed_at)
    && new Date(entry.completed_at as string).toDateString() === now.toDateString();
  const todaySessions = (history || []).filter(isToday);
  // Uma sessão parcial nunca vale como treino concluído; se as duas existirem
  // no mesmo dia, a completa prevalece.
  const completedToday = todaySessions.some(entry => !entry.partial);
  const partialTodayWorkout = completedToday ? undefined : todaySessions.find(entry => entry.partial);
  
  let daysSinceLastWorkout = 999;
  if (lastWorkout) {
    const lastDate = new Date(lastWorkout.completed_at);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    daysSinceLastWorkout = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const hour = now.getHours();
  let timeOfDay: UserContext['timeOfDay'] = 'morning';
  if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else if (hour >= 22 || hour < 5) timeOfDay = 'night';

  let isTrainingDay = false;
  const freq = profile.days_per_week || 3;
  if (freq >= 5) isTrainingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  else if (freq >= 3) isTrainingDay = [1, 3, 5].includes(dayOfWeek);
  else isTrainingDay = [2, 4].includes(dayOfWeek);

  return {
    currentTime: now,
    dayOfWeek,
    lastWorkout,
    weeklyFrequency: freq,
    daysSinceLastWorkout,
    timeOfDay,
    isTrainingDay,
    completedToday,
    partialToday: Boolean(partialTodayWorkout),
    partialTodayWorkout
  };
};

/**
 * Próximo treino da sequência (ex.: A, B, C, D), baseado no último feito pelo
 * usuário — não apenas "qualquer ficha diferente da última". Segue a ordem em
 * que as fichas aparecem para o usuário (mesma ordem de `workouts`), avançando
 * uma posição a partir da última concluída e voltando ao início ao chegar no
 * fim. Sem histórico ou ficha não encontrada na lista atual, cai na primeira.
 */
export const getNextWorkoutInSequence = (
  workouts: WorkoutCategory[],
  lastCategoryId?: string
): WorkoutCategory | null => {
  if (!workouts || workouts.length === 0) return null;
  if (!lastCategoryId) return workouts[0];

  const lastIndex = workouts.findIndex(w => w.id === lastCategoryId);
  if (lastIndex === -1) return workouts[0];

  return workouts[(lastIndex + 1) % workouts.length];
};

export const getNextBestAction = (
  context: UserContext,
  workouts: WorkoutCategory[]
): PredictiveAction => {
  const { daysSinceLastWorkout, isTrainingDay, timeOfDay, lastWorkout, completedToday, partialTodayWorkout } = context;

  if (completedToday) {
    return {
      type: 'rest',
      title: 'Missão Cumprida!',
      description: 'Você já treinou hoje. Aproveite o descanso e foque na recuperação.',
      priority: 5
    };
  }

  if (partialTodayWorkout) {
    const resumable = (workouts || []).find(w => w.id === partialTodayWorkout.category_id);
    return {
      type: 'partial',
      title: 'Sessão parcial registrada',
      description: 'Você salvou parte do treino de hoje. Só as séries concluídas foram guardadas — retome quando quiser.',
      suggestedWorkoutId: resumable?.id,
      suggestedWorkoutName: resumable?.name || partialTodayWorkout.category_name,
      priority: 8
    };
  }

  if (isTrainingDay) {
    const suggested = getNextWorkoutInSequence(workouts, lastWorkout?.category_id);
    let timeMsg = 'Hora de esmagar!';
    if (timeOfDay === 'morning') timeMsg = 'Bom dia! Que tal começar com energia?';
    if (timeOfDay === 'evening') timeMsg = 'Fim de dia produtivo? Vamos ao treino!';

    return {
      type: 'start_workout',
      title: `Hoje para você: ${suggested?.name || 'Treino'}`,
      description: `${timeMsg} Seu corpo agradece o movimento.`,
      suggestedWorkoutId: suggested?.id,
      suggestedWorkoutName: suggested?.name,
      priority: 10
    };
  }

  if (daysSinceLastWorkout >= 2) {
    const suggested = getNextWorkoutInSequence(workouts, lastWorkout?.category_id);
    return {
      type: 'motivation',
      title: 'Sentimos sua falta!',
      description: `Já faz ${daysSinceLastWorkout} dias desde o último treino. Vamos retomar hoje?`,
      suggestedWorkoutId: suggested?.id,
      suggestedWorkoutName: suggested?.name,
      priority: 9
    };
  }

  return {
    type: 'rest',
    title: 'Dia de Descanso',
    description: 'Hoje é dia de recuperar fibras. Mantenha a hidratação e dieta em dia.',
    priority: 3
  };
};
