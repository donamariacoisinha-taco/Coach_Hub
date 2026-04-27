
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
  activeTab: 'dashboard' | 'library' | 'review' | 'ai' | 'analytics' | 'settings';
  searchQuery: string;
  selectedExercise: Exercise | null;
  isEditorOpen: boolean;
  isCommandPaletteOpen: boolean;
  
  // Actions
  fetchData: () => Promise<void>;
  setActiveTab: (tab: AdminState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  openEditor: (exercise?: Exercise | null) => void;
  closeEditor: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateExercise: (id: string, payload: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  createExercise: (payload: Partial<Exercise>) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  exercises: [],
  muscleGroups: [],
  stats: null,
  loading: false,
  error: null,
  
  activeTab: 'dashboard',
  searchQuery: '',
  selectedExercise: null,
  isEditorOpen: false,
  isCommandPaletteOpen: false,
  
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
  
  openEditor: (exercise = null) => set({ selectedExercise: exercise, isEditorOpen: true }),
  closeEditor: () => set({ selectedExercise: null, isEditorOpen: false }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  
  updateExercise: async (id, payload) => {
    try {
      await adminApi.updateExercise(id, payload);
      set({ fetchData: get().fetchData }); // Trigger refresh or update local state
      const exercises = get().exercises.map(ex => ex.id === id ? { ...ex, ...payload } as Exercise : ex);
      set({ exercises });
    } catch (err: any) {
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
  }
}));
