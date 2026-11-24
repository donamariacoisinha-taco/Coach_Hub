import { useEffect, useState } from 'react';
import { workoutApi } from '../../lib/api/workoutApi';

/** Finished workout_history rows (completed_at set), including partials. Open sessions are excluded. Null until the read finishes. */
export function useCompletedWorkoutCount(userId?: string | null): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!userId) {
      setCount(null);
      return;
    }
    let cancelled = false;
    workoutApi.countWorkoutHistory(userId)
      .then((total) => {
        if (!cancelled) setCount(total);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => { cancelled = true; };
  }, [userId]);
  return count;
}
