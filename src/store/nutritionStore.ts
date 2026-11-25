import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, Goal } from '../types';
import { nutritionEngine, NutritionPlan } from '../services/nutritionEngine';
import { profileDaysPerWeek } from '../domain/profile/weeklyFrequency';

export interface EditableNutritionProfile {
  gender: 'masculino' | 'feminino';
  age: number;
  weight: number;
  height: number;
  target_weight: number;
  activityLevel: 'Sedentário' | 'Leve' | 'Moderado' | 'Alto' | 'Extremo';
  goal: Goal | 'Hipertrofia' | 'Emagrecimento' | 'Recomposição' | 'Performance';
  athletic_level: 'Iniciante' | 'Intermediário' | 'Avançado';
  training_frequency: number; // days per week
  weekly_intensity: 'Resistência' | 'Hipertrofia' | 'Força' | 'Recuperação';
}

export interface MetabolicState {
  bmr: number | null;
  tdee: number | null;
  caloriesTarget: number | null;
  hydrationGoalMl: number | null;
  proteinGrams: number | null;
  proteinCalories: number | null;
  fatGrams: number | null;
  fatCalories: number | null;
  carbGrams: number | null;
  carbCalories: number | null;
  metabolicBalance: number; // 0 - 100
  limit: 'ok' | 'capped-20' | 'basal-floor' | null;
}

export type EnergyContext = {
  bodyFatPct: number | null;
  sessionsPerWeek: number | null;
  typicalMinutes: number | null;
};

interface NutritionStore {
  profile: EditableNutritionProfile;
  metabolicState: MetabolicState;
  showMetabolicSettings: boolean;
  
  // Actions
  setProfileField: <K extends keyof EditableNutritionProfile>(key: K, value: EditableNutritionProfile[K]) => void;
  updateFullProfile: (data: Partial<EditableNutritionProfile>) => void;
  setShowSettings: (show: boolean) => void;
  recalculate: () => void;
  syncFromUserProfile: (userProfile: UserProfile | null) => void;
  energyContext: EnergyContext;
  setEnergyContext: (patch: Partial<EnergyContext>) => void;
}

const defaultProfile: EditableNutritionProfile = {
  gender: 'masculino',
  age: 28,
  weight: 75,
  height: 175,
  target_weight: 78,
  activityLevel: 'Moderado',
  goal: 'Hipertrofia',
  athletic_level: 'Intermediário',
  training_frequency: 4,
  weekly_intensity: 'Hipertrofia',
};

// Calculate initial metabolic state based on default profile
const emptyEnergy = (): EnergyContext => ({ bodyFatPct: null, sessionsPerWeek: null, typicalMinutes: null });

const calculateMetabolic = (p: EditableNutritionProfile, energy?: EnergyContext | null): MetabolicState => {
  const context = energy ?? emptyEnergy();
  const plan = nutritionEngine.calculatePlan({
    weight: p.weight,
    height: p.height,
    age: p.age,
    gender: p.gender,
    goal: p.goal as Goal,
    workout_streak: p.training_frequency,
  }, p.activityLevel, context);

  // Score System 0-100: WHOOP/Oura inspired radial ring reflecting biological attributes
  // Calculated by water goal, training frequency ratio, target weight alignment, activity level
  const activityMap: Record<string, number> = { 'Sedentário': 50, 'Leve': 65, 'Moderado': 80, 'Alto': 92, 'Extremo': 98 };
  const baseScore = activityMap[p.activityLevel] || 80;
  const frequencyBonus = Math.min(20, (p.training_frequency || 4) * 3);
  const targetProximity = Math.max(0, 10 - Math.abs(p.weight - p.target_weight)); // Closer to target weight gives +0 to +10 points
  
  const metabolicBalance = Math.min(100, Math.round(baseScore * 0.7 + frequencyBonus + targetProximity));

  return {
    bmr: plan.bmr,
    tdee: plan.tdee,
    caloriesTarget: plan.caloriesTarget,
    limit: plan.limit,
    hydrationGoalMl: plan.hydrationGoalMl,
    proteinGrams: plan.proteinGrams,
    proteinCalories: plan.proteinCalories,
    fatGrams: plan.fatGrams,
    fatCalories: plan.fatCalories,
    carbGrams: plan.carbGrams,
    carbCalories: plan.carbCalories,
    metabolicBalance,
  };
};

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      energyContext: { bodyFatPct: null, sessionsPerWeek: null, typicalMinutes: null },
      metabolicState: calculateMetabolic(defaultProfile),
      showMetabolicSettings: false,

      setProfileField: (key, value) => {
        set((state) => {
          const updatedProfile = { ...state.profile, [key]: value };
          const updatedMetabolic = calculateMetabolic(updatedProfile, state.energyContext);
          return {
            profile: updatedProfile,
            metabolicState: updatedMetabolic,
          };
        });
      },

      updateFullProfile: (data) => {
        set((state) => {
          const updatedProfile = { ...state.profile, ...data };
          const updatedMetabolic = calculateMetabolic(updatedProfile, state.energyContext);
          return {
            profile: updatedProfile,
            metabolicState: updatedMetabolic,
          };
        });
      },

      setShowSettings: (show) => set({ showMetabolicSettings: show }),

      setEnergyContext: (patch) => {
        set((state) => {
          const energyContext = { ...emptyEnergy(), ...state.energyContext, ...patch };
          return {
            energyContext,
            metabolicState: calculateMetabolic(state.profile, energyContext),
          };
        });
      },

      recalculate: () => {
        set((state) => ({
          metabolicState: calculateMetabolic(state.profile, state.energyContext),
        }));
      },

      syncFromUserProfile: (userProfile) => {
        if (!userProfile) return;
        set((state) => {
          // Sync existing attributes from core App profile if available, ignoring empty ones
          const goalStr = userProfile.goal ? String(userProfile.goal) : state.profile.goal;
          const genderStr = userProfile.gender && (userProfile.gender.toLowerCase().includes('fem') || userProfile.gender.toLowerCase() === 'f') ? 'feminino' : 'masculino';
          
          const syncedProfile: EditableNutritionProfile = {
            ...state.profile,
            weight: userProfile.weight || state.profile.weight,
            height: userProfile.height || state.profile.height,
            age: userProfile.age || state.profile.age,
            target_weight: userProfile.target_weight || userProfile.weight || state.profile.target_weight,
            gender: genderStr as 'masculino' | 'feminino',
            goal: goalStr as any,
            athletic_level: (userProfile.experience_level as any) || state.profile.athletic_level,
            training_frequency: profileDaysPerWeek(userProfile) ?? state.profile.training_frequency,
          };
          const energyContext = {
            ...emptyEnergy(),
            ...state.energyContext,
            sessionsPerWeek: profileDaysPerWeek(userProfile),
          };

          return {
            profile: syncedProfile,
            energyContext,
            metabolicState: calculateMetabolic(syncedProfile, energyContext),
          };
        });
      },
    }),
    {
      name: 'coach_rubi_nutrition_settings_v1',
    }
  )
);
