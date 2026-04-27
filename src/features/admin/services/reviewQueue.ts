import { autoFixApi } from "../api/autoFixApi";
import { Exercise } from "../../../types";

/**
 * Coach Rubi Human Review Queue Controller
 * Manages items that require human intervention.
 */
export const reviewQueueController = {
  getPendingReviews: async () => {
    return await autoFixApi.getReviewQueue();
  },

  approveItem: async (exercise: Exercise) => {
    const approved = {
      ...exercise,
      needs_human_review: false,
      ai_review_status: 'approved' as const,
      last_review_at: new Date().toISOString()
    };
    return await autoFixApi.updateExercise(approved);
  },

  rejectItem: async (exercise: Exercise) => {
    const rejected = {
      ...exercise,
      needs_human_review: false,
      ai_review_status: 'rejected' as const
    };
    return await autoFixApi.updateExercise(rejected);
  }
};
