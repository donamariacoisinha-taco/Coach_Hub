import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingData {
  goal: string | null;
  experience_level: string | null;
  days_per_week: number | null;
  time_available: number | null;
  preference: string | null;
  name: string | null;
}

interface OnboardingState {
  step: number;
  data: OnboardingData;
  next: () => void;
  back: () => void;
  setStep: (step: number) => void;
  setData: (key: keyof OnboardingData, value: any) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      data: {
        goal: null,
        experience_level: null,
        days_per_week: 3,
        time_available: 45,
        preference: 'gym',
        name: null,
      },

      next: () => set((s) => ({ step: s.step + 1 })),
      back: () => set((s) => ({ step: s.step - 1 })),
      setStep: (step) => set({ step }),

      setData: (key, value) =>
        set((s) => ({
          data: { ...s.data, [key]: value }
        })),

      reset: () => set({ 
        step: 0, 
        data: {
          goal: null,
          experience_level: null,
          days_per_week: 3,
          time_available: 45,
          preference: 'gym',
          name: null,
        } 
      }),
    }),
    {
      name: 'onboarding_draft',
    }
  )
);
