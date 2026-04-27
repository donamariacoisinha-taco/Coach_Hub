
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
  role?: 'admin' | 'user';
  is_admin?: boolean; // Keep for backward compatibility if needed, but role is preferred
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
  technical_tips?: string;
  is_active: boolean;
  image_url?: string;
  equipment?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  technical_prompt?: string;
  anatomical_cut?: string;
  
  // Governance & Quality
  movement_pattern?: 'push' | 'pull' | 'hinge' | 'squat' | 'lunge' | 'carry' | 'isolation';
  plane?: 'horizontal' | 'vertical' | 'sagittal' | 'frontal' | 'transverse';
  training_goal?: 'strength' | 'hypertrophy' | 'power' | 'endurance';
  quality_score?: number; // 0-100
  quality_status?: 'premium' | 'good' | 'improvable';
  performance_score?: number; // 0-100 based on usage frequency and RPE
  usage_count?: number;
  last_used_at?: string;
  last_review_at?: string;
  ai_review_notes?: string[];
  version_history?: { date: string, author: string, changes: string }[];

  // Coach Rubi Quality Score V3 + Performance Brain Fields
  quality_score_v3?: number;
  performance_score?: number;
  editorial_score?: number;
  structural_score?: number;
  governance_score?: number;
  usage_score?: number;
  results_score?: number;

  usage_count?: number;
  completion_rate?: number;
  repeat_rate?: number;
  drop_rate?: number;
  skip_rate?: number;
  avg_progression_rate?: number;
  beginner_success?: number;
  advanced_success?: number;

  ranking_status?: 'rising' | 'elite' | 'decline' | 'forgotten' | 'testing';
  last_performance_update?: string;
}

export interface EKEContext {
  muscle_groups?: string[];
  goal?: Goal;
  level?: ExperienceLevel;
  time_available?: number; // minutes
  equipment?: EquipmentPreference;
  user_id?: string;
}

export interface RecommendedExercise extends Exercise {
  relevance_score: number;
  recommendation_reason: string;
}

export interface WorkoutPlan {
  id?: string;
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  estimated_duration: number;
  intensity_level: string;
}

export interface EKEDecisionLog {
  id: string;
  user_id?: string;
  context: any;
  selected_exercises: any;
  scores_breakdown: any;
  final_decision: any;
  variant_id?: string;
  created_at: string;
}

export interface EKEConfig {
  id: string;
  quality_weight: number;
  performance_weight: number;
  context_weight: number;
  updated_at: string;
}

export interface UserEKEPreference {
  user_id: string;
  favorite_exercises: string[];
  avoided_exercises: string[];
  best_performing_exercises: string[];
  variant_id?: 'A' | 'B';
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
