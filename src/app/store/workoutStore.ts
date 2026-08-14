import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutExercise } from '../../types';
import {
  decideWorkoutAdvance,
  decideWorkoutPrevious,
  getWorkoutSetCount,
  normalizeWorkoutPosition,
} from '../../domain/workout/workoutReliability';
import { migrateGuestStorage } from '../../lib/guest/guestPersistence';

if (typeof localStorage !== 'undefined' && localStorage.getItem('kyron_guest_session')) {
  migrateGuestStorage();
}

interface WorkoutState {
  currentWorkoutId: string | null;
  exercises: WorkoutExercise[];
  currentIndex: number;
  currentSet: number;
  historyId: string | null;
  startTime: number | null;
  isHydrated: boolean;

  setWorkout: (data: {
    id: string;
    exercises: WorkoutExercise[];
    historyId: string;
    startTime: number;
    currentIndex?: number;
    currentSet?: number;
  }) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentSet: (set: number) => void;
  setCurrentIndex: (index: number) => void;
  resetWorkout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      currentWorkoutId: null,
      exercises: [],
      currentIndex: 0,
      currentSet: 1,
      historyId: null,
      startTime: null,
      isHydrated: false,

      setWorkout: (data) => {
        const exercises = data.exercises || [];
        const position = normalizeWorkoutPosition(
          exercises,
          data.currentIndex ?? 0,
          data.currentSet ?? 1,
        );
        set({
          currentWorkoutId: data.id,
          exercises,
          historyId: data.historyId,
          startTime: data.startTime,
          ...position,
        });
      },

      nextStep: () => set((state) => {
        const currentExercise = state.exercises[state.currentIndex];
        const decision = decideWorkoutAdvance({
          currentIndex: state.currentIndex,
          currentSet: state.currentSet,
          exerciseCount: state.exercises.length,
          runtimeSetCount: getWorkoutSetCount(currentExercise),
        });

        if (decision.action === 'STAY' || decision.action === 'FINISH_WORKOUT') return state;
        return {
          currentIndex: decision.currentIndex,
          currentSet: decision.currentSet,
        };
      }),

      prevStep: () => set((state) => decideWorkoutPrevious({
        exercises: state.exercises,
        currentIndex: state.currentIndex,
        currentSet: state.currentSet,
      })),

      setCurrentSet: (setValue) => set((state) => normalizeWorkoutPosition(
        state.exercises,
        state.currentIndex,
        setValue,
      )),

      setCurrentIndex: (index) => set((state) => normalizeWorkoutPosition(
        state.exercises,
        index,
        1,
      )),

      resetWorkout: () => set({
        currentWorkoutId: null,
        exercises: [],
        currentIndex: 0,
        currentSet: 1,
        historyId: null,
        startTime: null,
      }),

      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const position = normalizeWorkoutPosition(
          state.exercises,
          state.currentIndex,
          state.currentSet,
        );
        state.currentIndex = position.currentIndex;
        state.currentSet = position.currentSet;
        state.setHydrated(true);
      },
    },
  ),
);
