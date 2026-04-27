import { Exercise } from '../../../types';

export interface QualityBreakdown {
  content: number;    // Descriptions, tips, instructions (40%)
  structural: number; // Muscles, equipment, difficulty, pattern (40%)
  governance: number; // Mídia, tags, consistency, AI verification (20%)
  total: number;
}

export const calculateQualityScoreV2 = (exercise: Exercise): QualityBreakdown => {
  let content = 0;
  let structural = 0;
  let governance = 0;
  
  // 1. Content (max 40)
  if (exercise.description && exercise.description.length > 50) content += 15;
  if (exercise.description && exercise.description.length > 150) content += 5;
  if (exercise.instructions && exercise.instructions.split('\n').length >= 3) content += 15;
  if (exercise.technical_tips && exercise.technical_tips.length > 20) content += 5;

  // 2. Structural (max 40)
  if (exercise.muscle_group) structural += 10;
  if (exercise.secondary_muscles && exercise.secondary_muscles.length > 0) structural += 5;
  if (exercise.equipment) structural += 10;
  if (exercise.difficulty_level) structural += 5;
  if (exercise.movement_pattern) structural += 5;
  if (exercise.training_goal) structural += 5;

  // 3. Governance (max 20)
  if (exercise.image_url) governance += 5;
  if (exercise.video_url) governance += 5;
  if (exercise.ai_review_status === 'approved') governance += 10;
  else if (exercise.ai_review_status === 'auto_fixed') governance += 5;

  return {
    content: Math.min(40, content),
    structural: Math.min(40, structural),
    governance: Math.min(20, governance),
    total: Math.min(100, content + structural + governance)
  };
};

export const getQualityBadge = (score: number) => {
  if (score >= 95) return { label: 'Premium Elite', color: 'bg-amber-400', textColor: 'text-amber-950', icon: 'Sparkles' };
  if (score >= 80) return { label: 'Premium', color: 'bg-emerald-400', textColor: 'text-emerald-950', icon: 'ShieldCheck' };
  if (score >= 60) return { label: 'Bom', color: 'bg-blue-400', textColor: 'text-blue-950', icon: 'CheckCircle' };
  if (score >= 40) return { label: 'Melhorável', color: 'bg-yellow-400', textColor: 'text-yellow-950', icon: 'AlertCircle' };
  return { label: 'Crítico', color: 'bg-red-400', textColor: 'text-red-950', icon: 'Zap' };
};
