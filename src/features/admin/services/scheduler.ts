import { autoFixApi } from "../api/autoFixApi";
import { auditExercise } from "./aiAuditService";
import { applyAiFix } from "./aiFixService";

/**
 * Coach Rubi Maintenance Scheduler
 * Runs periodic maintenance tasks for the exercise library.
 */
export const runMaintenance = async () => {
  console.log("RUBI MAINTENANCE: Starting scheduled audit...");
  
  // 1. Daily Audit: New items without audit
  const queue = await autoFixApi.getAuditQueue();
  for (const ex of queue) {
    const result = await auditExercise(ex);
    if (result && result.confidence >= 0.95) {
       const fixed = applyAiFix(ex, result.suggestions);
       await autoFixApi.updateExercise(fixed);
    }
  }

  console.log("RUBI MAINTENANCE: Audit completed.");
};
