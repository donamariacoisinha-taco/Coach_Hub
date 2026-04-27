import { supabase } from "../../../lib/api/supabase";
import { Exercise } from "../../../types";

export const autoFixApi = {
  updateExercise: async (exercise: Exercise) => {
    const { data, error } = await supabase
      .from('exercises')
      .update({
        name: exercise.name,
        description: exercise.description,
        instructions: exercise.instructions,
        technical_tips: exercise.technical_tips,
        secondary_muscles: exercise.secondary_muscles,
        quality_score: exercise.quality_score,
        ai_issues: exercise.ai_issues,
        ai_suggestions: exercise.ai_suggestions,
        ai_fixed_at: exercise.ai_fixed_at,
        ai_review_status: exercise.ai_review_status,
        ai_confidence: exercise.ai_confidence,
        last_ai_audit: exercise.last_ai_audit,
        auto_fixed: exercise.auto_fixed,
        needs_human_review: exercise.needs_human_review,
        version: exercise.version
      })
      .eq('id', exercise.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getAuditQueue: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .is('last_ai_audit', null)
      .limit(50);
    
    if (error) throw error;
    return data as Exercise[];
  },

  getReviewQueue: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('needs_human_review', true)
      .order('ai_fixed_at', { ascending: false });

    if (error) throw error;
    return data as Exercise[];
  }
};
