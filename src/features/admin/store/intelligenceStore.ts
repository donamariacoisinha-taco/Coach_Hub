import { create } from 'zustand';
import { Exercise } from '../../../types';

export interface OptimizationResult {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  originalData?: Partial<Exercise>;
  optimizedData?: Partial<Exercise>;
}

interface IntelligenceState {
  isModalOpen: boolean;
  isProcessing: boolean;
  operation: 'audit' | 'fix' | 'metadata' | 'content' | 'scores' | 'full' | null;
  results: OptimizationResult[];
  progress: {
    total: number;
    current: number;
    startTime: number | null;
  };
  
  // Actions
  openModal: (operation?: 'audit' | 'fix' | 'metadata' | 'content' | 'scores' | 'full') => void;
  closeModal: () => void;
  startProcessing: (ids: string[], operation: 'audit' | 'fix' | 'metadata' | 'content' | 'scores' | 'full') => void;
  updateResult: (id: string, updates: Partial<OptimizationResult>) => void;
  finishProcessing: () => void;
  resetResults: () => void;
  rollback: (id: string) => void;
}

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  isModalOpen: false,
  isProcessing: false,
  operation: null,
  results: [],
  progress: {
    total: 0,
    current: 0,
    startTime: null,
  },

  openModal: (operation) => set({ isModalOpen: true, operation: operation || null }),
  closeModal: () => set({ isModalOpen: false, isProcessing: false }),
  
  startProcessing: (ids, operation) => set({
    isProcessing: true,
    operation,
    results: ids.map(id => ({ id, name: '...', status: 'pending' })),
    progress: {
      total: ids.length,
      current: 0,
      startTime: Date.now(),
    }
  }),

  updateResult: (id, updates) => set((state) => ({
    results: state.results.map(r => r.id === id ? { ...r, ...updates } : r),
    progress: {
      ...state.progress,
      current: updates.status === 'completed' || updates.status === 'failed' 
        ? state.progress.current + 1 
        : state.progress.current
    }
  })),

  finishProcessing: () => set({ isProcessing: false }),
  
  resetResults: () => set({ results: [], operation: null, progress: { total: 0, current: 0, startTime: null } }),

  rollback: (id) => {
    // Logic to restore originalData
    console.log('Rolling back', id);
  }
}));
