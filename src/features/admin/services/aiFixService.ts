import { Exercise } from "../../../types";
import { calculateQualityScoreV2 } from "./qualityScoreV2";

export const applyAiFix = (exercise: Exercise, suggestions: any): Exercise => {
  const updatedExercise = {
    ...exercise,
    name: suggestions.name || exercise.name,
    description: suggestions.description || exercise.description,
    instructions: suggestions.instructions || exercise.instructions,
    technical_tips: suggestions.technical_tips || exercise.technical_tips,
    secondary_muscles: suggestions.secondary_muscles || exercise.secondary_muscles,
    ai_review_status: 'auto_fixed' as const,
    ai_fixed_at: new Date().toISOString(),
    auto_fixed: true,
    version: (exercise.version || 1) + 1,
  };

  // Recalculate score
  updatedExercise.quality_score = calculateQualityScoreV2(updatedExercise);
  
  return updatedExercise;
};
