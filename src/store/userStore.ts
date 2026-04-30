import { create } from 'zustand';
import { UserProfile } from '../types';

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile, loading: false }),

  updateProfile: (data) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null
    }))
}));
