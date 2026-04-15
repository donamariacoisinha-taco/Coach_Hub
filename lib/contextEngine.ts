
import { WorkoutHistory, UserProfile } from '../types';

export interface UserContext {
  currentTime: Date;
  dayOfWeek: number;
  lastWorkout?: WorkoutHistory;
  weeklyFrequency: number;
  daysSinceLastWorkout: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isTrainingDay: boolean;
}

export const getContext = (
  profile: UserProfile,
  history: WorkoutHistory[]
): UserContext => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  const lastWorkout = history.length > 0 ? history[0] : undefined;
  
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

  // Simple logic for training day based on profile.days_per_week
  // If they train 3 days, we assume Mon/Wed/Fri (1, 3, 5)
  // If they train 5 days, we assume Mon-Fri (1, 2, 3, 4, 5)
  let isTrainingDay = false;
  const freq = profile.days_per_week || 3;
  if (freq >= 5) {
    isTrainingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  } else if (freq >= 3) {
    isTrainingDay = [1, 3, 5].includes(dayOfWeek);
  } else {
    isTrainingDay = [2, 4].includes(dayOfWeek);
  }

  return {
    currentTime: now,
    dayOfWeek,
    lastWorkout,
    weeklyFrequency: freq,
    daysSinceLastWorkout,
    timeOfDay,
    isTrainingDay
  };
};
