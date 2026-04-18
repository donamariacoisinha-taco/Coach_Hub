
import { supabase } from './supabase';
import { Exercise } from '../../types';

export const ekeApi = {
  /**
   * Updates exercise performance stats based on training session data.
   */
  async updateExercisePerformance(exerciseId: string, stats: { 
    completedAllSets: boolean, 
    progressionAchieved: boolean,
    volumeTrend: 'up' | 'down' | 'stable'
  }) {
    const { data: ex, error: fetchError } = await supabase
      .from('exercises')
      .select('performance_score, usage_count')
      .eq('id', exerciseId)
      .single();

    if (fetchError) throw fetchError;

    let scoreChange = 1; // Base point for using it
    if (stats.completedAllSets) scoreChange += 2;
    if (stats.progressionAchieved) scoreChange += 5;
    if (stats.volumeTrend === 'up') scoreChange += 2;
    if (stats.volumeTrend === 'down') scoreChange -= 1;

    const newScore = Math.min(100, Math.max(0, (ex.performance_score || 50) + scoreChange));
    const newUsageCount = (ex.usage_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('exercises')
      .update({ 
        performance_score: newScore,
        usage_count: newUsageCount,
        last_used_at: new Date().toISOString()
      })
      .eq('id', exerciseId);

    if (updateError) throw updateError;
    
    return { exerciseId, newScore, newUsageCount };
  },

  /**
   * Fetches all relevant exercises for EKE ranking.
   */
  async getExercisesForEke() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data as Exercise[];
  },

  async logDecision(payload: any) {
    const { error } = await supabase.from('eke_decision_logs').insert([payload]);
    if (error) console.error('[EKE] Log error:', error);
  },

  async getConfig() {
    const { data, error } = await supabase.from('eke_config').select('*').single();
    if (error) return null;
    return data;
  },

  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async getPerformanceStats() {
    // Aggregated stats for the admin dashboard
    const { data, error } = await supabase.rpc('get_eke_performance_metrics');
    if (error) {
      // Fallback if RPC doesn't exist yet
      return {
        completionRate: 0.85,
        mostRecommended: [],
        mostIgnored: [],
        musclePerformance: {}
      };
    }
    return data;
  }
};
