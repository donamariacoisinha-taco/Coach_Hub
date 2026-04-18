
export enum ExperienceLevel {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermediário',
  ADVANCED = 'Avançado'
}

export enum Goal {
  HYPERTROPHY = 'Hipertrofia',
  WEIGHT_LOSS = 'Emagrecimento',
  ENDURANCE = 'Resistência',
  STRENGTH = 'Força'
}

export enum EquipmentPreference {
  MACHINES = 'Máquinas',
  FREE_WEIGHTS = 'Pesos Livres',
  BOTH = 'Ambos'
}

export enum SetType {
  WARMUP = 'Aquecimento',
  NORMAL = 'Trabalho',
  DROP = 'Drop Set',
  FAILURE = 'Até a Falha'
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  threshold: number;
  type: 'tonnage' | 'streak' | 'workouts';
  achieved_at?: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  target_weight?: number;
  birth_date?: string;
  experience_level?: ExperienceLevel;
  time_available?: number;
  goal?: Goal;
  preference?: EquipmentPreference;
  focus_muscles?: string[];
  days_per_week?: number;
  onboarding_completed: boolean;
  is_admin?: boolean;
  last_deload_at?: string;
}

export interface PersonalBest {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  calculated_1rm: number;
  achieved_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight: number;
  body_fat_pct?: number;
  body_fat_kg?: number;
  muscle_mass_kg?: number;
  visceral_fat_index?: number;
  bmr_kcal?: number;
  metabolic_age?: number;
  muscle_rate_pct?: number;
  fat_free_mass_kg?: number;
  subcutaneous_fat_pct?: number;
  body_water_pct?: number;
  skeletal_muscle_pct?: number;
  bone_mass_kg?: number;
  protein_pct?: number;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  tag: 'frente' | 'lado' | 'costas';
  created_at: string;
}

export interface WorkoutFolder {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  body_side: 'front' | 'back';
  parent_id?: string | null;
  // sort_order is used for manual reordering in the admin panel
  sort_order?: number;
  created_at?: string;
}

export interface Exercise {
  id: string;
  user_id?: string;
  name: string;
  alt_name?: string;
  muscle_group: string;
  muscle_group_id: string;
  type: string;
  instructions?: string;
  description?: string;
  video_url?: string;
  secondary_muscles?: string[];
  is_active: boolean;
  image_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  technical_prompt?: string;
  anatomical_cut?: string;
}

export interface WorkoutCategory {
  id: string;
  user_id: string;
  folder_id?: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface SetConfig {
  reps: string;
  weight: number;
  rest_time: number;
  type?: SetType;
}

export interface WorkoutExercise {
  id: string;
  category_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_image?: string;
  muscle_group?: string;
  type?: string;
  sets: number;
  reps: string;
  weight: number;
  rest_time: number;
  default_rpe?: number; // Sugestão de intensidade (padrão)
  sets_json?: SetConfig[];
  order: number;
  notes?: string;
  instructions?: string;
  superset_id?: string | null;
}

export interface WorkoutHistory {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  created_at: string;
  completed_at: string | null;
  duration_minutes: number;
  exercises_count: number;
}

export type LastSetData = {
  weight: number;
  reps: number;
  rpe: number;
};

export type ProgressionInput = {
  weight: number;
  repsDone: number;
  repsTarget: number;
  rpe: number;
};
