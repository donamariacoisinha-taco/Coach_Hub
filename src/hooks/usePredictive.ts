
import { useMemo } from 'react';
import { UserProfile, WorkoutHistory, WorkoutCategory } from '../types';
import { getContext, getNextBestAction } from '../domain/predictive/predictiveEngine';

export function usePredictive(
  profile: UserProfile | null,
  history: WorkoutHistory[],
  workouts: WorkoutCategory[]
) {
  const context = useMemo(() => {
    if (!profile) return null;
    return getContext(profile, history);
  }, [profile, history]);

  const nextAction = useMemo(() => {
    if (!context || workouts.length === 0) return null;
    return getNextBestAction(context, workouts);
  }, [context, workouts]);

  return {
    context,
    nextAction
  };
}
