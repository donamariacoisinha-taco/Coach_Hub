
import { useMemo, useEffect } from 'react';
import { UserProfile, WorkoutHistory, WorkoutCategory } from '../types';
import { getContext, getNextBestAction } from '../domain/predictive/predictiveEngine';
import { usePrefetch } from './usePrefetch';
import { authApi } from '../lib/api/authApi';
import { workoutApi } from '../lib/api/workoutApi';

export function usePredictive(
  profile: UserProfile | null,
  history: WorkoutHistory[],
  workouts: WorkoutCategory[]
) {
  const prefetch = usePrefetch();

  const context = useMemo(() => {
    if (!profile) return null;
    return getContext(profile, history);
  }, [profile, history]);

  const nextAction = useMemo(() => {
    if (!context || workouts.length === 0) return null;
    return getNextBestAction(context, workouts);
  }, [context, workouts]);

  // Auto-prefetch suggested workout
  useEffect(() => {
    if (nextAction?.suggestedWorkoutId) {
      prefetch(`workout_init_${nextAction.suggestedWorkoutId}`, async () => {
        const user = await authApi.getUser();
        if (!user) return null;
        return workoutApi.getWorkoutInitData(nextAction.suggestedWorkoutId!, user.id);
      });
    }
  }, [nextAction?.suggestedWorkoutId, prefetch]);

  return {
    context,
    nextAction
  };
}
