
import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingSyncCount: 0,
  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setPendingCount: (count) => set({ pendingSyncCount: count }),
}));
