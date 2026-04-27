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
    
    let finalPayload: any = {
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

    while (true) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .update(finalPayload)
          .eq('id', exerciseId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[PERFORMANCE] Removing missing column: ${badColumn}`);
            const { [badColumn]: _, ...remaining } = finalPayload;
            finalPayload = remaining;
            if (Object.keys(finalPayload).length === 0) throw err;
            continue;
          }
        }
        throw err;
      }
    }
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
