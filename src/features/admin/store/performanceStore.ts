import { create } from 'zustand';
import { Exercise } from '../../../types';

interface PerformanceStats {
  topExercicios: Exercise[];
  risingStars: Exercise[];
  declining: Exercise[];
  maxProgression: Exercise[];
  avgGlobalScore: number;
}

interface PerformanceState {
  stats: PerformanceStats | null;
  isLoading: boolean;
  
  // Actions
  setStats: (stats: PerformanceStats) => void;
  setLoading: (loading: boolean) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  stats: null,
  isLoading: false,
  
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
