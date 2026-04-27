import { Exercise } from '../../../types';

export const calculateQualityScoreV2 = (exercise: Exercise): number => {
  let score = 0;
  
  // 1. Basic Information (20%)
  if (exercise.name && exercise.name.length > 3) score += 5;
  if (exercise.muscle_group) score += 5;
  if (exercise.difficulty_level) score += 5;
  if (exercise.type) score += 5;

  // 2. Content Richness (30%)
  if (exercise.description && exercise.description.length > 50) {
    score += 10;
    if (exercise.description.length > 150) score += 5;
  }
  if (exercise.instructions && exercise.instructions.split('\n').length >= 3) score += 10;
  if (exercise.technical_tips && exercise.technical_tips.length > 20) score += 5;

  // 3. Structural Integrity (20%)
  if (exercise.secondary_muscles && exercise.secondary_muscles.length > 0) score += 5;
  if (exercise.movement_pattern) score += 5;
  if (exercise.training_goal) score += 5;
  if (exercise.plane) score += 5;

  // 4. Media & Assets (20%)
  if (exercise.image_url) score += 10;
  if (exercise.video_url) score += 10;

  // 5. AI & Verification (10%)
  if (exercise.ai_review_status === 'approved') score += 10;
  else if (exercise.ai_review_status === 'auto_fixed') score += 5;

  return Math.min(100, score);
};

export const getQualityBadge = (score: number) => {
  if (score >= 95) return { label: 'Premium Elite', color: 'bg-amber-400', textColor: 'text-amber-950' };
  if (score >= 80) return { label: 'Premium', color: 'bg-emerald-400', textColor: 'text-emerald-950' };
  if (score >= 60) return { label: 'Bom', color: 'bg-blue-400', textColor: 'text-blue-950' };
  if (score >= 40) return { label: 'Melhorável', color: 'bg-yellow-400', textColor: 'text-yellow-950' };
  return { label: 'Crítico', color: 'bg-red-400', textColor: 'text-red-950' };
};
