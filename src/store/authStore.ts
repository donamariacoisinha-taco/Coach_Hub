import { create } from 'zustand';
import { authApi } from '../lib/api/authApi';

interface AuthState {
  session: any | null;
  setSession: (session: any | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  logout: async () => {
    try {
      await authApi.signOut();
      set({ session: null });
    } catch (error) {
      console.error('[AUTH_STORE] Error during logout:', error);
    }
  }
}));
