import { create } from 'zustand';
import { Exercise } from '../../../types';

interface AutoFixStats {
  auditedToday: number;
  autoFixedCount: number;
  inReviewCount: number;
  avgScoreBefore: number;
  avgScoreAfter: number;
  qualityGain: number;
  pendingIssues: number;
}

interface AutoFixState {
  isAutoPilotOn: boolean;
  isAuditing: boolean;
  isFixing: boolean;
  stats: AutoFixStats;
  auditProgress: number; // 0-100
  fixingProgress: number; // 0-100
  recentActivity: any[];
  
  // Actions
  setAutoPilot: (on: boolean) => void;
  setAuditing: (is: boolean) => void;
  setFixing: (is: boolean) => void;
  updateStats: (stats: Partial<AutoFixStats>) => void;
  setAuditProgress: (p: number) => void;
  setFixingProgress: (p: number) => void;
  addActivity: (activity: any) => void;
}

export const useAutoFixStore = create<AutoFixState>((set) => ({
  isAutoPilotOn: false,
  isAuditing: false,
  isFixing: false,
  auditProgress: 0,
  fixingProgress: 0,
  stats: {
    auditedToday: 0,
    autoFixedCount: 0,
    inReviewCount: 0,
    avgScoreBefore: 0,
    avgScoreAfter: 0,
    qualityGain: 0,
    pendingIssues: 0
  },
  recentActivity: [],

  setAutoPilot: (on) => set({ isAutoPilotOn: on }),
  setAuditing: (is) => set({ isAuditing: is }),
  setFixing: (is) => set({ isFixing: is }),
  updateStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  setAuditProgress: (p) => set({ auditProgress: p }),
  setFixingProgress: (p) => set({ fixingProgress: p }),
  addActivity: (activity) => set((state) => ({ 
    recentActivity: [activity, ...state.recentActivity.slice(0, 49)] 
  })),
}));
