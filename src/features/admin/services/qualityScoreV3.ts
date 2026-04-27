import { Exercise } from '../../../types';

export interface QualityScoreV3Result {
  total: number;
  editorial: number;
  structural: number;
  governance: number;
  usage: number;
  results: number;
}

export const calculateQualityScoreV3 = (exercise: Exercise): QualityScoreV3Result => {
  // 1. Editorial Quality (max 30)
  let editorial = 0;
  if (exercise.description && exercise.description.length > 100) editorial += 10;
  if (exercise.instructions && exercise.instructions.split('\n').length >= 4) editorial += 10;
  if (exercise.technical_tips && exercise.technical_tips.length > 30) editorial += 5;
  if (exercise.ai_review_status === 'approved') editorial += 5;

  // 2. Structural Integrity (max 25)
  let structural = 0;
  if (exercise.muscle_group) structural += 5;
  if (exercise.secondary_muscles && exercise.secondary_muscles.length > 0) structural += 5;
  if (exercise.equipment) structural += 5;
  if (exercise.difficulty_level) structural += 5;
  if (exercise.movement_pattern) structural += 5;

  // 3. Governance (max 10)
  let governance = 0;
  if (exercise.image_url) governance += 4;
  if (exercise.video_url) governance += 4;
  if (exercise.auto_fixed) governance += 2;

  // 4. Real Usage Performance (max 25)
  // Usage score is calculated based on completion_rate and frequency
  const completionRate = exercise.completion_rate || 0;
  const usageCount = exercise.usage_count || 0;
  
  let usage = 0;
  usage += (completionRate * 15); // Rate from 0-1 maps to 0-15
  usage += Math.min(10, (usageCount / 100) * 10); // Logarithmic usage intensity

  // 5. Results Effectiveness (max 10)
  const progressionRate = exercise.avg_progression_rate || 0;
  let results = Math.min(10, progressionRate * 10);

  const total = Math.min(100, editorial + structural + governance + usage + results);

  return {
    total,
    editorial,
    structural,
    governance,
    usage: Math.min(25, usage),
    results: Math.min(10, results)
  };
};

export const getRankingStatus = (exercise: Exercise): 'rising' | 'elite' | 'decline' | 'forgotten' | 'testing' => {
  const usage = exercise.usage_count || 0;
  const completion = exercise.completion_rate || 0;
  const score = exercise.quality_score_v3 || 0;

  if (usage > 500 && completion > 0.85 && score > 90) return 'elite';
  if (usage > 50 && usage < 200 && completion > 0.9) return 'rising';
  if (usage > 100 && completion < 0.4) return 'decline';
  if (usage === 0) return 'forgotten';
  return 'testing';
};
