import { autoFixApi } from "../api/autoFixApi";
import { auditExercise } from "./aiAuditService";
import { applyAiFix } from "./aiFixService";

/**
 * KYRON OS Maintenance Scheduler
 * Runs periodic maintenance tasks for the exercise library.
 */
export const runMaintenance = async () => {
  console.log("KYRON OS MAINTENANCE: Starting scheduled audit...");
  
  // 1. Daily Audit: New items without audit
  const queue = await autoFixApi.getAuditQueue();
  for (const ex of queue) {
    const result = await auditExercise(ex);
    if (result && result.confidence >= 0.95) {
       const fixed = applyAiFix(ex, result.suggestions);
       await autoFixApi.updateExercise(fixed);
    }
  }

  console.log("KYRON OS MAINTENANCE: Audit completed.");
};
