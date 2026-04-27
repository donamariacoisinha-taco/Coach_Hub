import { supabase } from "../../../lib/api/supabase";
import { Exercise } from "../../../types";
import { calculateQualityScoreV3, getRankingStatus } from "../services/qualityScoreV3";

export const performanceApi = {
  updatePerformanceMetrics: async (exerciseId: string, metrics: Partial<Exercise>) => {
    const { data: existing } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (!existing) return;

    const updated = { ...existing, ...metrics };
    const scoreResult = calculateQualityScoreV3(updated);
    
    const finalUpdate = {
      ...metrics,
      quality_score_v3: scoreResult.total,
      editorial_score: scoreResult.editorial,
      structural_score: scoreResult.structural,
      governance_score: scoreResult.governance,
      usage_score: scoreResult.usage,
      results_score: scoreResult.results,
      performance_score: scoreResult.usage + scoreResult.results,
      ranking_status: getRankingStatus(updated),
      last_performance_update: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('exercises')
      .update(finalUpdate)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getTopMovers: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('avg_progression_rate', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data as Exercise[];
  },

  getLibraryPerformanceSummary: async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('quality_score_v3, usage_count, completion_rate, ranking_status');
    
    if (error) throw error;
    return data;
  }
};
