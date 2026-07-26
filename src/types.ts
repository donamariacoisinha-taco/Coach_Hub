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
  email?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  target_weight?: number;
  birth_date?: string;
  experience_level?: ExperienceLevel;
  time_available?: number;
  goal?: Goal | string;
  preference?: EquipmentPreference;
  focus_muscles?: string[];
  days_per_week?: number;
  frequency?: string;
  onboarding_completed: boolean;

  // Authorization is sourced from public.user_access.
  role?: 'admin' | 'coach' | 'user';
  plan?: 'free' | 'premium';
  account_status?: 'active' | 'suspended';
  suspension_reason?: string | null;
  suspended_at?: string | null;
  suspended_by?: string | null;
  is_admin?: boolean;
  is_premium?: boolean;

  last_deload_at?: string;

  // Onboarding 2.1 specific fields for persistence and recommendation
  sex?: string;
  primary_goal?: string;
  training_experience?: string;
  weekly_availability?: number;
  training_environment?: string;
  restrictions?: string[];
  exercise_dislikes?: string[];
  onboarding_version?: string;
  created_at?: string;
  updated_at?: string;
  active_protocol_id?: string;
  active_plan_id?: string;
  last_onboarding_update?: string;

  // Tracking Stats
  workouts_completed?: number;
  workout_streak?: number;
  total_minutes?: number;
  preferred_training_days?: string[];
  training_adherence_score?: number;
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

export interface WorkoutCategory {
  id: string;
  user_id: string;
  folder_id?: string | null;
  name: string;
  description?: string;
  created_at?: string;
}

export interface WorkoutExercise {
  id?: string;
  category_id: string;
  exercise_id: string;
  exercise_name_snapshot?: string;
  sets?: number;
  reps?: string | number;
  weight?: number;
  rest_time?: number;
  sort_order?: number;
  sets_json?: WorkoutSet[];
  exercise?: Exercise;
}

export interface WorkoutSet {
  id?: string;
  reps?: string | number;
  weight?: number;
  rpe?: number;
  rest_time?: number;
  type?: SetType;
  completed?: boolean;
  [key: string]: unknown;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group?: string;
  sub_muscle_group?: string;
  equipment?: string;
  image_url?: string;
  video_url?: string;
  description?: string;
  instructions?: string[] | string;
  is_active?: boolean;
  user_id?: string | null;
  biomechanics?: ExerciseBiomechanics | null;
  [key: string]: unknown;
}

export interface ExerciseBiomechanics {
  primary_group: string;
  agonist_muscles: string[];
  synergist_muscles: string[];
  stabilizer_muscles: string[];
  antagonist_muscles: string[];
  movement_pattern: string;
  equipment_needed: string[];
  primary_joint_actions: string[];
  tags: string[];
}

export interface WorkoutHistory {
  id: string;
  user_id: string;
  workout_id?: string;
  workout_name?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  [key: string]: unknown;
}

export interface AthleteMemory {
  user_id: string;
  favorite_exercises: string[];
  exercise_skip_patterns: Record<string, number>;
  average_rest_time: number;
  weekly_frequency: number;
  preferred_training_time: string;
  average_rpe: number;
  fatigue_patterns: Record<string, number>;
  recovery_profile: 'slow' | 'moderate' | 'fast';
  consistency_score: number;
  volume_tolerance: 'low' | 'medium' | 'high';
  preferred_workout_duration: number;
  motivation_profile: string;
  most_successful_workout_split: string;
  dropout_risk_score: number;
  last_motivation_state: string;
  historical_adherence: number;
  preferred_ui_density: string;
  training_personality: string;
  adaptation_level: number;
  last_updated_at: string;
}

export interface ExercisePerformanceMemory {
  user_id: string;
  exercise_id: string;
  previous_loads: number[];
  rep_history: number[];
  rpe_history: number[];
  best_weight: number;
  best_reps: number;
  best_1rm: number;
  best_execution_rpe: number;
  average_rest_used: number;
  last_completed_at: string | null;
  fatigue_response: 'low' | 'moderate' | 'high';
}
