
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutExercise } from '../../types';

interface WorkoutState {
  currentWorkoutId: string | null;
  exercises: WorkoutExercise[];
  currentIndex: number;
  currentSet: number;
  historyId: string | null;
  startTime: number | null;
  isHydrated: boolean; // Add this
  
  setWorkout: (data: { id: string, exercises: WorkoutExercise[], historyId: string, startTime: number, currentIndex?: number, currentSet?: number }) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentSet: (set: number) => void;
  setCurrentIndex: (index: number) => void;
  resetWorkout: () => void;
  setHydrated: (val: boolean) => void; // Add this
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
        console.log(`[WorkoutStore] setWorkout tracking historyId: ${data.historyId}`);
        set({
          currentWorkoutId: data.id,
          exercises: data.exercises || [],
          historyId: data.historyId,
          startTime: data.startTime,
          currentIndex: data.currentIndex ?? 0,
          currentSet: data.currentSet ?? 1,
        });
      },

      nextStep: () => set((state) => {
        const currentEx = state.exercises[state.currentIndex];
        const totalSets = currentEx?.sets_json?.length || 3;
        
        if (state.currentSet < totalSets) {
          return { currentSet: state.currentSet + 1 };
        } else if (state.currentIndex < state.exercises.length - 1) {
          return { currentIndex: state.currentIndex + 1, currentSet: 1 };
        }
        return state;
      }),

      prevStep: () => set((state) => {
        if (state.currentSet > 1) {
          return { currentSet: state.currentSet - 1 };
        } else if (state.currentIndex > 0) {
          const prevEx = state.exercises[state.currentIndex - 1];
          return { 
            currentIndex: state.currentIndex - 1, 
            currentSet: prevEx.sets_json?.length || 3 
          };
        }
        return state;
      }),

      setCurrentSet: (setVal) => set({ currentSet: setVal }),
      setCurrentIndex: (index) => set({ currentIndex: index, currentSet: 1 }),
      resetWorkout: () => set({
        currentWorkoutId: null,
        exercises: [],
        currentIndex: 0,
        currentSet: 1,
        historyId: null,
        startTime: null,
      }),
      setHydrated: (val) => set({ isHydrated: val }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
