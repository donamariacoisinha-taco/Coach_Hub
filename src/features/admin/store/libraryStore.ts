import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedView {
  id: string;
  name: string;
  filters: {
    muscleGroup?: string;
    status?: string;
    search?: string;
    minScore?: number;
    hasImage?: boolean;
    hasVideo?: boolean;
  };
  columns: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LibraryState {
  viewMode: 'table' | 'grid' | 'compact';
  activeViewId: string;
  savedViews: SavedView[];
  visibleColumns: string[];
  isKeyboardModeActive: boolean;
  
  // Actions
  setViewMode: (mode: 'table' | 'grid' | 'compact') => void;
  setActiveView: (id: string) => void;
  addSavedView: (view: SavedView) => void;
  updateView: (id: string, updates: Partial<SavedView>) => void;
  deleteView: (id: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  toggleKeyboardMode: () => void;
}

const DEFAULT_VIEWS: SavedView[] = [
  { id: 'all', name: 'Todos os Exercícios', filters: {}, columns: ['name', 'muscle_group', 'is_active', 'updated_at', 'actions'] },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      viewMode: 'table',
      activeViewId: 'all',
      savedViews: DEFAULT_VIEWS,
      visibleColumns: ['name', 'muscle_group', 'is_active', 'updated_at', 'actions'],
      isKeyboardModeActive: false,

      setViewMode: (mode) => set({ viewMode: mode }),
      setActiveView: (id) => set({ activeViewId: id }),
      addSavedView: (view) => set((state) => ({ savedViews: [...state.savedViews, view] })),
      updateView: (id, updates) => set((state) => ({
        savedViews: state.savedViews.map(v => v.id === id ? { ...v, ...updates } : v)
      })),
      deleteView: (id) => set((state) => ({
        savedViews: state.savedViews.filter(v => v.id !== id)
      })),
      setVisibleColumns: (columns) => set({ visibleColumns: columns }),
      toggleKeyboardMode: () => set((state) => ({ isKeyboardModeActive: !state.isKeyboardModeActive })),
    }),
    {
      name: 'rubi-library-os-v25',
    }
  )
);
