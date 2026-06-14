
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
  role?: 'admin' | 'user';
  is_admin?: boolean; // Keep for backward compatibility if needed, but role is preferred
  last_deload_at?: string;
  
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

export interface MuscleGroup {
  id: string;
  name: string;
  body_side: 'front' | 'back';
  parent_id?: string | null;
  // sort_order is used for manual reordering in the admin panel
  sort_order?: number;
  created_at?: string;
}

export interface AIIssue {
  category: 'content' | 'structural' | 'governance' | 'other';
  description: string;
}

export type ExerciseType = 'free_weight' | 'machine' | 'bodyweight' | 'cable' | 'band' | 'other';

export interface Exercise {
  id: string;
  user_id?: string;
  name: string;
  alt_name?: string;
  muscle_group: string;
  muscle_group_id: string;
  type: ExerciseType | string;
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
  static_frame_url?: string;
  
  // Media Assets V3
  thumbnail_url?: string;
  guide_images?: { id: string, url: string, caption?: string }[];
  biomechanics_images?: { id: string, url: string, type: string }[];
  media_assets?: any;
  updated_at?: string;
  
  // Governance & Quality
  curation_status?: 'draft' | 'approved' | 'premium' | 'archived';
  movement_pattern?: 'push' | 'pull' | 'hinge' | 'squat' | 'lunge' | 'carry' | 'isolation';
  plane?: 'horizontal' | 'vertical' | 'sagittal' | 'frontal' | 'transverse';
  training_goal?: 'strength' | 'hypertrophy' | 'power' | 'endurance';
  quality_score?: number; // 0-100
  quality_status?: 'premium' | 'good' | 'improvable' | 'critical';
  performance_score?: number; // 0-100 based on usage frequency and RPE
  usage_count?: number;
  last_used_at?: string;
  last_review_at?: string;
  ai_review_notes?: string[];
  version_history?: { date: string, author: string, changes: string }[];

  // KYRON OS Quality Score V3 + Performance Brain Fields
  quality_score_v3?: number;
  editorial_score?: number;
  structural_score?: number;
  governance_score?: number;
  usage_score?: number;
  results_score?: number;

  completion_rate?: number;
  repeat_rate?: number;
  drop_rate?: number;
  skip_rate?: number;
  avg_progression_rate?: number;
  beginner_success?: number;
  advanced_success?: number;

  ranking_status?: 'rising' | 'elite' | 'decline' | 'forgotten' | 'testing';
  last_performance_update?: string;

  // AI-Assisted Content Fields
  ai_issues?: AIIssue[];
  ai_suggestions?: string[];
  ai_fixed_at?: string;
  ai_review_status?: 'pending' | 'auto_fixed' | 'human_verified' | 'approved' | 'rejected';
  ai_confidence?: number;
  last_ai_audit?: string;
  auto_fixed?: boolean;
  needs_human_review?: boolean;
  version?: number;
  
  // Protocol Quality Flags
  recommended_for_beginners?: boolean;
  recommended_for_intermediate?: boolean;
  recommended_for_advanced?: boolean;
  featured_exercise?: boolean;
  administrator_favorite?: boolean;
  protocol_priority?: boolean;
  alternatives?: string[];
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
  exercises_count?: number;
}

export interface SetConfig {
  reps: string;
  weight: number;
  rest_time: number;
  type?: SetType;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string;
  category_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_name_snapshot?: string;
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

export interface AthleteMemory {
  user_id: string;
  favorite_exercises: string[];
  exercise_skip_patterns: Record<string, number>; // exercise_id -> skip count
  average_rest_time: number;
  weekly_frequency: number;
  preferred_training_time: string; // e.g. "morning", "afternoon", "evening" or specific hours
  average_rpe: number;
  fatigue_patterns: Record<string, number>; // muscle -> fatigue level 0-100
  recovery_profile: 'fast' | 'moderate' | 'slow';
  consistency_score: number; // 0-100
  volume_tolerance: 'low' | 'medium' | 'high';
  preferred_workout_duration: number; // in mins
  motivation_profile: 'disciplined' | 'dynamic' | 'goal_oriented' | 'calm';
  most_successful_workout_split: string; // e.g., "AB", "ABC", "Push/Pull/Legs"
  dropout_risk_score: number; // 0-100
  last_motivation_state: string; // "high" | "moderate" | "low"
  historical_adherence: number; // completion rate percentage (0-100)
  preferred_ui_density: 'cozy' | 'compact';
  training_personality: string; // e.g. "Perfeccionista", "Focado em Progressão", "Consistente Pragmático"
  adaptation_level: number; // metric of how well user adapts 0-100
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
  fatigue_response: 'high' | 'moderate' | 'low';
}

// TAXONOMY NORMALIZATION ENUM
export enum MuscleGroupEnum {
  PEITO = 'Peito',
  COSTAS = 'Costas',
  OMBROS = 'Ombros',
  PERNAS = 'Pernas',
  ABDOMEN = 'Abdômen',
  BRACOS = 'Braços'
}

export function normalizeMuscleGroup(mg: string): string {
  if (!mg) return 'Outros';
  const clean = mg.trim().toLowerCase();
  
  // Specific normalizations
  if (
    clean.startsWith('perna') || 
    clean.includes('quadriceps') || 
    clean.includes('quadríceps') ||
    clean.includes('posterior') || 
    clean.includes('panturrilha') || 
    clean.includes('gluteo') || 
    clean.includes('glúteo') || 
    clean.includes('coxa') ||
    clean === 'perna' ||
    clean === 'pernas'
  ) {
    return 'Pernas';
  }
  if (
    clean.startsWith('ombro') || 
    clean.includes('deltoide') || 
    clean.includes('deltoide') ||
    clean === 'ombros' ||
    clean === 'ombro'
  ) {
    return 'Ombros';
  }
  if (
    clean.startsWith('abdomen') || 
    clean.includes('abdominais') || 
    clean.includes('abdômen') || 
    clean.includes('abdominal') ||
    clean === 'abdomen' ||
    clean === 'abdominais' ||
    clean === 'abdômen'
  ) {
    return 'Abdômen';
  }
  if (
    clean.startsWith('peito') || 
    clean.includes('peitoral') ||
    clean === 'peito' ||
    clean === 'peitoral'
  ) {
    return 'Peito';
  }
  if (
    clean.startsWith('costas') || 
    clean.includes('dorsal') || 
    clean.includes('trapézio') || 
    clean.includes('trapezio') ||
    clean === 'costas'
  ) {
    return 'Costas';
  }
  if (
    clean.startsWith('braço') || 
    clean.startsWith('braco') || 
    clean.includes('biceps') || 
    clean.includes('triceps') || 
    clean.includes('antebraço') || 
    clean.includes('antebraco') || 
    clean.includes('bíceps') || 
    clean.includes('tríceps') ||
    clean === 'braço' ||
    clean === 'braços'
  ) {
    return 'Braços';
  }
  
  // Title case fallback
  return mg.charAt(0).toUpperCase() + mg.slice(1);
}

export function getVirtualAnatomicalCut(mg: string, name: string): string | undefined {
  if (!mg) return undefined;
  const clean = mg.trim().toLowerCase();
  const cleanName = name.toLowerCase();
  
  // Braços cuts: 'Bíceps', 'Tríceps', 'Antebraço'
  if (clean.includes('bicep') || clean.includes('bíceps')) return 'Bíceps';
  if (clean.includes('tricep') || clean.includes('tríceps')) return 'Tríceps';
  if (clean.includes('antebraço') || clean.includes('antebraco')) return 'Antebraço';
  
  // Pernas cuts: 'Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha'
  if (clean.includes('quadriceps') || clean.includes('quadríceps')) return 'Quadríceps';
  if (clean.includes('posterior') || clean.includes('isquios')) return 'Posterior';
  if (clean.includes('panturrilha') || clean.includes('gêmeos')) return 'Panturrilha';
  if (clean.includes('glúteo') || clean.includes('gluteo') || clean.includes('glúteos')) return 'Glúteo';
  
  // Abdômen cuts: 'Superior', 'Inferior', 'Oblíquos'
  if (clean.includes('oblíquo') || clean.includes('obliquo')) return 'Oblíquos';
  
  // Fallbacks based on exercise name keywords
  if (cleanName.includes('biceps') || cleanName.includes('rosca') || cleanName.includes('bíceps')) return 'Bíceps';
  if (cleanName.includes('tricep') || cleanName.includes('tríceps') || cleanName.includes('testa') || cleanName.includes('coice') || cleanName.includes('french') || cleanName.includes('francês')) return 'Tríceps';
  if (cleanName.includes('panturrilha') || cleanName.includes('gêmeos') || cleanName.includes('gemeos') || cleanName.includes('galeos') || cleanName.includes('calf')) return 'Panturrilha';
  if (cleanName.includes('stiff') || cleanName.includes('flexor') || cleanName.includes('flexora') || cleanName.includes('curl') || cleanName.includes('mesa flexora')) return 'Posterior';
  if (cleanName.includes('agachamento') || cleanName.includes('extensor') || cleanName.includes('extensora') || cleanName.includes('leg press') || cleanName.includes('hacker') || cleanName.includes('squat')) return 'Quadríceps';
  if (cleanName.includes('gluteo') || cleanName.includes('glúteo') || cleanName.includes('elevação pélvica') || cleanName.includes('elevacao pelvica') || cleanName.includes('afundo') || cleanName.includes('búlgaro')) return 'Glúteo';
  if (cleanName.includes('abdominal') || cleanName.includes('supra') || cleanName.includes('crunch') || cleanName.includes('prancha')) return 'Superior';
  if (cleanName.includes('infra') || cleanName.includes('elevação de pernas') || cleanName.includes('elevacao de pernas')) return 'Inferior';
  if (cleanName.includes('oblíquo') || cleanName.includes('obliquo') || cleanName.includes('rotacional') || cleanName.includes('twist')) return 'Oblíquos';

  // Specific db fields mapping
  if (clean === 'perna') {
    if (cleanName.includes('flexor') || cleanName.includes('flexora') || cleanName.includes('stiff')) return 'Posterior';
    if (cleanName.includes('glúteo') || cleanName.includes('gluteo') || cleanName.includes('pélvica') || cleanName.includes('pelvica') || cleanName.includes('afundo') || cleanName.includes('búlgaro')) return 'Glúteo';
    if (cleanName.includes('panturrilha') || cleanName.includes('gêmeos')) return 'Panturrilha';
    return 'Quadríceps';
  }
  
  return undefined;
}

export interface SystemTemplateExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight: number;
  rest_time: number;
  sets_json: SetConfig[];
  notes?: string;
  sort_order: number;
}

export interface SystemTemplateWorkout {
  id: string;
  name: string;
  description?: string;
  exercises: SystemTemplateExercise[];
}

export interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  version: number;
  is_default: boolean;
  updated_at: string;
  updated_by: string;
  created_at: string;
  created_by: 'system' | 'admin' | 'rubi_ai';
  folders: { id: string; name: string }[];
  workouts: SystemTemplateWorkout[];
  version_history?: {
    version: number;
    updated_at: string;
    updated_by: string;
    changes: string[];
  }[];
}

export interface HealthScoreResult {
  score: number;
  rating: 'Excellent' | 'Good' | 'Needs Review';
}

export function calculateExerciseHealthScore(ex: Exercise | null | undefined): HealthScoreResult {
  if (!ex) {
    return { score: 0, rating: 'Needs Review' };
  }
  let score = 0;
  
  // 1. Thumbnail (15 pts)
  if (ex.thumbnail_url || ex.image_url) {
    score += 15;
  }
  
  // 2. Video (15 pts)
  if (ex.video_url && ex.video_url.trim().length > 0) {
    score += 15;
  }
  
  // 3. Instructions (20 pts)
  const instrLen = (ex.instructions || '').trim().length;
  if (instrLen > 30) {
    score += 20;
  } else if (instrLen > 0) {
    score += 10;
  }
  
  // 4. Equipment (10 pts)
  if (ex.equipment && ex.equipment.trim().toLowerCase() !== 'nenhum' && ex.equipment.trim().length > 0) {
    score += 10;
  }
  
  // 5. Muscle Group (10 pts)
  if (ex.muscle_group && ex.muscle_group.trim().length > 0) {
    score += 10;
  }
  
  // 6. Secondary Muscles (10 pts)
  if (ex.secondary_muscles && ex.secondary_muscles.length > 0) {
    score += 10;
  }
  
  // 7. Difficulty (10 pts)
  if (ex.difficulty_level) {
    score += 10;
  }
  
  // 8. Category/Type (5 pts)
  if (ex.type && ex.type.trim().length > 0) {
    score += 5;
  }
  
  // 9. Tags (5 pts)
  if (ex.movement_pattern || ex.plane || ex.training_goal) {
    score += 5;
  }
  
  let rating: 'Excellent' | 'Good' | 'Needs Review' = 'Needs Review';
  if (score >= 85) {
    rating = 'Excellent';
  } else if (score >= 70) {
    rating = 'Good';
  }
  
  return { score, rating };
}
