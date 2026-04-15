
import { UserContext } from './contextEngine';
import { WorkoutCategory } from '../types';

export interface PredictiveAction {
  type: 'start_workout' | 'rest' | 'motivation' | 'resume';
  title: string;
  description: string;
  suggestedWorkoutId?: string;
  suggestedWorkoutName?: string;
  priority: number; // 1-10
}

export const getNextBestAction = (
  context: UserContext,
  workouts: WorkoutCategory[]
): PredictiveAction => {
  const { daysSinceLastWorkout, isTrainingDay, timeOfDay, lastWorkout } = context;

  // 1. If currently in a workout (handled by component state usually, but let's assume we want to resume if last was very recent and not finished? 
  // Actually, history only has completed ones. So resume is for active sessions which we'll handle in the hook).

  // 2. If it's a training day and they haven't trained today
  const trainedToday = lastWorkout && new Date(lastWorkout.completed_at).toDateString() === context.currentTime.toDateString();

  if (isTrainingDay && !trainedToday) {
    // Suggest the next workout in rotation or based on last
    // For now, let's pick one that isn't the last one
    const suggested = workouts.find(w => w.id !== lastWorkout?.category_id) || workouts[0];
    
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

  // 3. If they are away for too long
  if (daysSinceLastWorkout >= 2 && !trainedToday) {
    const suggested = workouts[0];
    return {
      type: 'motivation',
      title: 'Sentimos sua falta!',
      description: `Já faz ${daysSinceLastWorkout} dias desde o último treino. Vamos retomar hoje?`,
      suggestedWorkoutId: suggested?.id,
      suggestedWorkoutName: suggested?.name,
      priority: 9
    };
  }

  // 4. If they already trained today
  if (trainedToday) {
    return {
      type: 'rest',
      title: 'Missão Cumprida!',
      description: 'Você já treinou hoje. Aproveite o descanso e foque na recuperação.',
      priority: 5
    };
  }

  // Default: Rest day
  return {
    type: 'rest',
    title: 'Dia de Descanso',
    description: 'Hoje é dia de recuperar fibras. Mantenha a hidratação e dieta em dia.',
    priority: 3
  };
};

export const getWeightSuggestion = (
  lastWeight: number,
  lastRpe: number,
  isDeload: boolean = false
): number => {
  if (isDeload) return Math.floor(lastWeight * 0.8);
  
  // Simple progression: if RPE was low (< 8), suggest +2.5kg or +5%
  if (lastRpe < 8 && lastRpe > 0) {
    return lastWeight + 2.5;
  }
  
  return lastWeight;
};
