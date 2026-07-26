import { supabase } from './supabase';
import { Exercise } from '../../types';
import { fetchWithRetry } from '../utils';

const isDev = typeof import.meta !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

export const ekeApi = {
  /**
   * Updates exercise performance stats based on training session data.
   */
  async updateExercisePerformance(exerciseId: string, stats: {
    completedAllSets: boolean,
    progressionAchieved: boolean,
    volumeTrend: 'up' | 'down' | 'stable'
  }) {
    return fetchWithRetry(async () => {
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
    });
  },

  /**
   * Fetches all relevant exercises for EKE ranking.
   */
  async getExercisesForEke() {
    return fetchWithRetry(async () => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*');

        if (error) throw error;
        const activeData = (data || []).filter(ex => ex.is_active !== false);
        return activeData as Exercise[];
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          console.warn('[EKE] Fallback ativado em getExercisesForEke:', err.message);
          // Fallback: exclude the new EKE columns if they are missing
          const { data, error } = await supabase
            .from('exercises')
            .select('id, name, muscle_group, is_active');
          if (error) throw error;
          const activeData = (data || []).filter(ex => ex.is_active !== false);
          return activeData as Exercise[];
        }
        throw err;
      }
    });
  },

  async logDecision(payload: any) {
    const { error } = await supabase.from('eke_decision_logs').insert([payload]);
    if (error) console.error('[EKE] Log error:', error);
  },

  async getConfig() {
    const { data, error } = await supabase
      .from('eke_config')
      .select('*')
      .limit(1);

    if (error) {
      console.warn('[EKE] Config query failed, using safe defaults:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      if (isDev) console.info('[EKE] No config row found. Safe defaults will be used.');
      return null;
    }

    if (data.length > 1) {
      console.warn('[EKE] Multiple config rows returned after limit(1). Review table constraints.');
    }

    return data[0];
  },

  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
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