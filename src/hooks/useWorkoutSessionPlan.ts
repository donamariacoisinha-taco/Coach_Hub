import { useCallback, useRef, useState } from 'react';
import type { WorkoutExercise } from '../types';
import { saveGuestWorkoutTemp } from '../lib/guest/guestPersistence';

/** Preparation edits are staged until the user chooses a save destination. */
export function useWorkoutSessionPlan(workoutId: string, guest: boolean) {
  const [exercises, renderExercises] = useState<WorkoutExercise[]>([]);
  const latest = useRef(exercises);
  const setExercises = useCallback((value: WorkoutExercise[] | ((previous: WorkoutExercise[]) => WorkoutExercise[])) => {
    const next = typeof value === 'function' ? value(latest.current) : value;
    latest.current = next;
    renderExercises(next);
  }, []);
  const stageExercises = useCallback((change: (previous: WorkoutExercise[]) => WorkoutExercise[]) => {
    const next = change(latest.current);
    // Calculate and persist outside React's deferred/replayed state updaters.
    if (guest) saveGuestWorkoutTemp(workoutId, next);
    else localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
    setExercises(next);
  }, [workoutId, guest, setExercises]);
  return { exercises, setExercises, stageExercises };
}
