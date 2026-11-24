/** A finished session has completed_at. Partial sessions are finished; open ones are not. */
export function isFinishedWorkout(row: { completed_at?: string | null } | null | undefined): boolean {
  return row?.completed_at != null && String(row.completed_at).trim() !== '';
}

export function countFinishedWorkouts(rows: Array<{ completed_at?: string | null }> | null | undefined): number {
  return (rows || []).filter((row) => isFinishedWorkout(row)).length;
}
