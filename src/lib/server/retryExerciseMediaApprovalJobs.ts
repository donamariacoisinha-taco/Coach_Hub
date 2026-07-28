import type { SupabaseClient } from '@supabase/supabase-js';

export async function retryFailedExerciseMediaApprovalJobs(
  client: SupabaseClient,
): Promise<number> {
  const { data, error } = await client
    .from('exercise_media_queue')
    .update({
      status: 'pending',
      claimed_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('media_type', 'main')
    .in('status', ['failed', 'review'])
    .neq('approval_status', 'rejected')
    .lt('attempt_count', 5)
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}
