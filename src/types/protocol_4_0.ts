export interface PremiumProtocol {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  category: 'public' | 'premium';
  goal?: string;
  difficulty?: string;
  environment?: string;
  training_days?: number;
  duration_weeks?: number;
  estimated_duration?: number;
  status: 'draft' | 'published';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  version: number;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface PremiumProtocolDay {
  id: string;
  protocol_id: string;
  day_number: number;
  title?: string;
  description?: string;
  sort_order: number;
}

export interface PremiumProtocolExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps: string;
  rest_seconds?: number;
  load_type?: string;
  rpe?: string;
  tempo?: string;
  cadence?: string;
  notes?: string;
  drop_set: boolean;
  rest_pause: boolean;
  superset: boolean;
}
