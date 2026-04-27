import { supabase } from "../../../lib/api/supabase";
import { Exercise } from "../../../types";

export const autoFixApi = {
  updateExercise: async (exercise: Exercise) => {
    let currentPayload: any = {
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      technical_tips: exercise.technical_tips,
      secondary_muscles: exercise.secondary_muscles,
      equipment: exercise.equipment,
      difficulty_level: exercise.difficulty_level,
      movement_pattern: exercise.movement_pattern,
      training_goal: exercise.training_goal,
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
    };

    while (true) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .update(currentPayload)
          .eq('id', exercise.id)
          .select()
          .single();

        if (error) {
          console.error(`AUTO_FIX_ERROR: Failed to update exercise ${exercise.id}:`, error);
          throw error;
        }
        return data;
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[AUTO_FIX] Removing missing column: ${badColumn}`);
            const { [badColumn]: _, ...remaining } = currentPayload;
            currentPayload = remaining;
            if (Object.keys(currentPayload).length === 0) throw err;
            continue;
          }
        }
        console.error(`CRITICAL_API_ERROR: Exception during update for ${exercise.id}:`, err);
        throw err;
      }
    }
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
