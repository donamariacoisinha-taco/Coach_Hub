
import { create } from 'zustand';
import { Exercise, MuscleGroup } from '../types';
import { adminApi } from '../lib/api/adminApi';

interface AdminState {
  exercises: Exercise[];
  muscleGroups: MuscleGroup[];
  stats: any | null;
  loading: boolean;
  error: string | null;
  
  // UI State
  activeTab: 'dashboard' | 'library' | 'review' | 'ai' | 'analytics' | 'settings' | 'autofix' | 'performance';
  searchQuery: string;
  selectedMuscleFilter: string;
  viewMode: 'table' | 'grid' | 'compact';
  selectedExercise: Exercise | null;
  isEditorOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  // Actions
  fetchData: () => Promise<void>;
  setActiveTab: (tab: AdminState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  setMuscleFilter: (filter: string) => void;
  setViewMode: (mode: AdminState['viewMode']) => void;
  openEditor: (exercise?: Exercise | null) => void;
  closeEditor: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateExercise: (id: string, payload: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  createExercise: (payload: Partial<Exercise>) => Promise<void>;
  archiveExercises: (ids: string[]) => Promise<void>;
  toggleExercisesStatus: (ids: string[], is_active: boolean) => Promise<void>;
  updateExerciseStatus: (id: string, is_active: boolean) => Promise<void>;
  deleteExercises: (ids: string[]) => Promise<void>;
  setExercises: (exercises: Exercise[]) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  exercises: [],
  muscleGroups: [],
  stats: null,
  loading: false,
  error: null,
  
  activeTab: 'dashboard',
  searchQuery: '',
  selectedMuscleFilter: 'Todos',
  viewMode: 'table',
  selectedExercise: null,
  isEditorOpen: false,
  isCommandPaletteOpen: false,
  
  setExercises: (exercises) => set({ exercises }),
  
  fetchData: async () => {
    set({ loading: true });
    try {
      const [adminData, qualityStats] = await Promise.all([
        adminApi.getAdminData(),
        adminApi.getQualityStats()
      ]);
      set({ 
        exercises: adminData.exercises, 
        muscleGroups: adminData.muscleGroups,
        stats: qualityStats,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMuscleFilter: (filter) => set({ selectedMuscleFilter: filter }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  openEditor: (exercise = null) => set({ selectedExercise: exercise, isEditorOpen: true }),
  closeEditor: () => set({ selectedExercise: null, isEditorOpen: false }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  
  updateExercise: async (id, payload) => {
    const previousExercises = get().exercises;
    // Optimistic Update
    const newExercises = previousExercises.map(ex => 
      ex.id === id ? { ...ex, ...payload } as Exercise : ex
    );
    set({ exercises: newExercises });

    try {
      await adminApi.updateExercise(id, payload);
    } catch (err: any) {
      // Rollback on error
      set({ exercises: previousExercises });
      throw err;
    }
  },

  updateExerciseStatus: async (id, is_active) => {
    const previousExercises = get().exercises;
    const newExercises = previousExercises.map(ex => 
      ex.id === id ? { ...ex, is_active } as Exercise : ex
    );
    set({ exercises: newExercises });

    try {
      await adminApi.updateExerciseStatus(id, is_active);
    } catch (err: any) {
      set({ exercises: previousExercises });
      throw err;
    }
  },
  
  deleteExercise: async (id) => {
    try {
      await adminApi.deleteExercise(id);
      set({ exercises: get().exercises.filter(ex => (ex as any).id !== id) });
    } catch (err: any) {
      throw err;
    }
  },
  
  createExercise: async (payload) => {
    try {
      await adminApi.createExercise(payload as any);
      get().fetchData(); // Refresh to get the new id and data
    } catch (err: any) {
      throw err;
    }
  },

  archiveExercises: async (ids) => {
    try {
      await adminApi.bulkUpdateStatus(ids, false);
      set({ 
        exercises: get().exercises.map(ex => 
          ids.includes(ex.id) ? { ...ex, is_active: false } as Exercise : ex
        )
      });
    } catch (err: any) {
      throw err;
    }
  },

  toggleExercisesStatus: async (ids, is_active) => {
    try {
      await adminApi.bulkUpdateStatus(ids, is_active);
      set({ 
        exercises: get().exercises.map(ex => 
          ids.includes(ex.id) ? { ...ex, is_active } as Exercise : ex
        )
      });
    } catch (err: any) {
      throw err;
    }
  },

  deleteExercises: async (ids) => {
    try {
      await Promise.all(ids.map(id => adminApi.deleteExercise(id)));
      set({ exercises: get().exercises.filter(ex => !ids.includes(ex.id)) });
    } catch (err: any) {
      throw err;
    }
  }
}));
