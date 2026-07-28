import { supabase } from './supabase';

export interface ExerciseQualityDashboardRow {
  total_exercises: number;
  average_score: number | string | null;
  approved: number;
  media_pending: number;
  good: number;
  review: number;
  incomplete: number;
  high_priority: number;
  anatomy_average: number | string | null;
  technique_average: number | string | null;
  safety_average: number | string | null;
  equipment_average: number | string | null;
  taxonomy_average: number | string | null;
  search_average: number | string | null;
  media_average: number | string | null;
  last_assessed_at: string | null;
}

export interface ExerciseQualityIssue {
  code: string;
  severity: 'low' | 'medium' | 'high';
  dimension: string;
  message: string;
  confidence?: number;
  muscles?: string[];
}

export interface ExerciseQualityAssessment {
  exercise_id: string;
  exerciseName: string;
  muscleGroup: string;
  subgroup: string;
  equipment: string;
  imageUrl: string | null;
  anatomy_score: number;
  technique_score: number;
  safety_score: number;
  equipment_score: number;
  taxonomy_score: number;
  search_score: number;
  media_score: number;
  total_score: number;
  status: 'approved' | 'approved_with_media_pending' | 'good' | 'review' | 'incomplete';
  confidence: number;
  issues: ExerciseQualityIssue[];
  recommendations: Array<Record<string, unknown>>;
  assessed_at: string;
}

export interface ExerciseQualityProposal {
  id: string;
  exercise_id: string;
  exerciseName: string;
  field_name: string;
  current_value: unknown;
  proposed_value: unknown;
  reason: string;
  confidence: number;
  risk_level: 'safe' | 'moderate' | 'expert_review';
  status: 'pending' | 'applied' | 'rejected' | 'superseded';
  created_at: string;
}

export interface ExerciseSubstitute {
  exercise_id: string;
  name: string;
  muscle_group: string;
  subgroup: string;
  equipment: string;
  difficulty_level: string;
  quality_score: number;
  match_score: number;
  reasons: string[];
}

export interface ExerciseQualityDashboardResponse {
  dashboard: ExerciseQualityDashboardRow | null;
  assessments: ExerciseQualityAssessment[];
  proposals: ExerciseQualityProposal[];
  recentRun: {
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    assessed_count: number;
    proposals_count: number;
    automatic_fixes_count: number;
    summary: Record<string, unknown>;
  } | null;
}

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'Não informado';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

export const exerciseQualityAdminApi = {
  asDisplayValue,

  async getDashboard(): Promise<ExerciseQualityDashboardResponse> {
    const [dashboardResult, assessmentsResult, proposalsResult, runResult] = await Promise.all([
      supabase.from('exercise_quality_dashboard').select('*').maybeSingle(),
      supabase
        .from('exercise_quality_assessments')
        .select('exercise_id,anatomy_score,technique_score,safety_score,equipment_score,taxonomy_score,search_score,media_score,total_score,status,confidence,issues,recommendations,assessed_at')
        .order('total_score', { ascending: true })
        .limit(148),
      supabase
        .from('exercise_quality_proposals')
        .select('id,exercise_id,field_name,current_value,proposed_value,reason,confidence,risk_level,status,created_at')
        .eq('status', 'pending')
        .order('risk_level', { ascending: true })
        .order('confidence', { ascending: false }),
      supabase
        .from('exercise_quality_runs')
        .select('id,status,started_at,completed_at,assessed_count,proposals_count,automatic_fixes_count,summary')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (dashboardResult.error) throw dashboardResult.error;
    if (assessmentsResult.error) throw assessmentsResult.error;
    if (proposalsResult.error) throw proposalsResult.error;
    if (runResult.error) throw runResult.error;

    const assessmentRows = assessmentsResult.data || [];
    const proposalRows = proposalsResult.data || [];
    const exerciseIds = Array.from(new Set([
      ...assessmentRows.map((row: any) => row.exercise_id),
      ...proposalRows.map((row: any) => row.exercise_id),
    ]));

    const exerciseMap = new Map<string, any>();
    if (exerciseIds.length > 0) {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('id,name,muscle_group,subgroup,equipment,image_url')
        .in('id', exerciseIds);
      if (error) throw error;
      (exercises || []).forEach((exercise: any) => exerciseMap.set(exercise.id, exercise));
    }

    const assessments: ExerciseQualityAssessment[] = assessmentRows.map((row: any) => {
      const exercise = exerciseMap.get(row.exercise_id) || {};
      return {
        ...row,
        exerciseName: exercise.name || 'Exercício',
        muscleGroup: exercise.muscle_group || 'Sem grupo',
        subgroup: exercise.subgroup || 'Sem subgrupo',
        equipment: exercise.equipment || 'Não informado',
        imageUrl: exercise.image_url || null,
        confidence: asNumber(row.confidence),
        issues: Array.isArray(row.issues) ? row.issues : [],
        recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
      } as ExerciseQualityAssessment;
    });

    const proposals: ExerciseQualityProposal[] = proposalRows.map((row: any) => ({
      ...row,
      exerciseName: exerciseMap.get(row.exercise_id)?.name || 'Exercício',
      confidence: asNumber(row.confidence),
    }));

    return {
      dashboard: dashboardResult.data as ExerciseQualityDashboardRow | null,
      assessments,
      proposals,
      recentRun: runResult.data as ExerciseQualityDashboardResponse['recentRun'],
    };
  },

  async runAudit(): Promise<string> {
    const { data, error } = await supabase.rpc('refresh_exercise_quality_engine');
    if (error) throw error;
    return String(data || '');
  },

  async reviewProposal(
    proposalId: string,
    decision: 'approve' | 'reject',
    notes?: string,
  ): Promise<{ proposal_id: string; decision: string; applied: boolean; run_id?: string }> {
    const { data, error } = await supabase.rpc('review_exercise_quality_proposal', {
      p_proposal_id: proposalId,
      p_decision: decision,
      p_notes: notes || null,
    });
    if (error) throw error;
    return data as any;
  },

  async applySafeProposals(): Promise<{ applied: number; run_id?: string | null }> {
    const { data, error } = await supabase.rpc('apply_safe_exercise_quality_proposals');
    if (error) throw error;
    return data as any;
  },

  async getSubstitutes(
    exerciseId: string,
    availableEquipment?: string[],
    limit = 8,
  ): Promise<ExerciseSubstitute[]> {
    const { data, error } = await supabase.rpc('find_exercise_substitutes', {
      p_exercise_id: exerciseId,
      p_available_equipment: availableEquipment?.length ? availableEquipment : null,
      p_limit: limit,
    });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      quality_score: asNumber(row.quality_score),
      match_score: asNumber(row.match_score),
      reasons: Array.isArray(row.reasons) ? row.reasons : [],
    })) as ExerciseSubstitute[];
  },

  async rankForProtocol(filters: {
    muscleGroup?: string;
    subgroup?: string;
    equipment?: string[];
    difficulty?: string;
    limit?: number;
  }) {
    const { data, error } = await supabase.rpc('rank_exercises_for_protocol', {
      p_muscle_group: filters.muscleGroup || null,
      p_subgroup: filters.subgroup || null,
      p_equipment: filters.equipment?.length ? filters.equipment : null,
      p_difficulty: filters.difficulty || null,
      p_limit: filters.limit || 20,
    });
    if (error) throw error;
    return data || [];
  },
};
