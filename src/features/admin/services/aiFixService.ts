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
    equipment: suggestions.equipment || exercise.equipment,
    difficulty_level: suggestions.difficulty_level || exercise.difficulty_level,
    movement_pattern: suggestions.movement_pattern || exercise.movement_pattern,
    training_goal: suggestions.training_goal || exercise.training_goal,
    ai_review_status: 'auto_fixed' as const,
    ai_fixed_at: new Date().toISOString(),
    auto_fixed: true,
    version: (exercise.version || 1) + 1,
  };

  // Recalculate score breakdown
  const breakdown = calculateQualityScoreV2(updatedExercise);
  updatedExercise.quality_score = breakdown.total;
  
  // If still critical after fix, mark for human review
  if (breakdown.total < 50) {
    updatedExercise.needs_human_review = true;
  }
  
  return updatedExercise;
};
