import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type MemoryStorage = Storage & { values: Map<string, string> };

const createMemoryStorage = (): MemoryStorage => {
  const values = new Map<string, string>();
  return {
    values,
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
};

const storage = createMemoryStorage();
vi.stubGlobal('localStorage', storage);

let useWorkoutStore: typeof import('./workoutStore').useWorkoutStore;

const exercises = [
  { exercise_id: 'ex-a', sets: 2, sets_json: [{ reps: '10' }, { reps: '8' }] },
  { exercise_id: 'ex-b', sets: 3, sets_json: [{ reps: '12' }, { reps: '10' }, { reps: '8' }] },
] as any[];

beforeAll(async () => {
  ({ useWorkoutStore } = await import('./workoutStore'));
});

beforeEach(() => {
  storage.clear();
  useWorkoutStore.getState().resetWorkout();
});

describe('workoutStore reliability integration', () => {
  it('normalizes an invalid position when loading a workout', () => {
    useWorkoutStore.getState().setWorkout({
      id: 'workout-1',
      exercises,
      historyId: 'history-1',
      startTime: Date.now(),
      currentIndex: 99,
      currentSet: 99,
    });

    expect(useWorkoutStore.getState()).toMatchObject({
      currentIndex: 1,
      currentSet: 3,
    });
  });

  it('advances through sets and exercises without skipping', () => {
    useWorkoutStore.getState().setWorkout({
      id: 'workout-1',
      exercises,
      historyId: 'history-1',
      startTime: Date.now(),
    });

    useWorkoutStore.getState().nextStep();
    expect(useWorkoutStore.getState()).toMatchObject({ currentIndex: 0, currentSet: 2 });

    useWorkoutStore.getState().nextStep();
    expect(useWorkoutStore.getState()).toMatchObject({ currentIndex: 1, currentSet: 1 });
  });

  it('does not move beyond the final set of the final exercise', () => {
    useWorkoutStore.getState().setWorkout({
      id: 'workout-1',
      exercises,
      historyId: 'history-1',
      startTime: Date.now(),
      currentIndex: 1,
      currentSet: 3,
    });

    useWorkoutStore.getState().nextStep();
    expect(useWorkoutStore.getState()).toMatchObject({ currentIndex: 1, currentSet: 3 });
  });

  it('returns to the final set of the previous exercise', () => {
    useWorkoutStore.getState().setWorkout({
      id: 'workout-1',
      exercises,
      historyId: 'history-1',
      startTime: Date.now(),
      currentIndex: 1,
      currentSet: 1,
    });

    useWorkoutStore.getState().prevStep();
    expect(useWorkoutStore.getState()).toMatchObject({ currentIndex: 0, currentSet: 2 });
  });

  it('clamps direct index and set updates', () => {
    useWorkoutStore.getState().setWorkout({
      id: 'workout-1',
      exercises,
      historyId: 'history-1',
      startTime: Date.now(),
    });

    useWorkoutStore.getState().setCurrentIndex(-3);
    useWorkoutStore.getState().setCurrentSet(40);
    expect(useWorkoutStore.getState()).toMatchObject({ currentIndex: 0, currentSet: 2 });
  });
});
