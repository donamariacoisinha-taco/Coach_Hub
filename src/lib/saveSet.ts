
import { workoutApi } from './api/workoutApi';
import { offlineQueue } from './offline/offlineQueue';
import { SetType } from '../types';
import { authApi } from './api/authApi';

interface SaveSetData {
  history_id: string;
  user_id?: string;
  exercise_id: string;
  set_number: number;
  weight_achieved: number;
  reps_achieved: number;
  rpe: number;
  set_type: SetType;
}

export const saveSet = async (data: SaveSetData): Promise<{ success: boolean, client_id: string }> => {
  // 1. Generate unique client_id for idempotency
  const client_id = crypto.randomUUID();

  // Ensure user_id is present for RLS
  let user_id = data.user_id;
  if (!user_id) {
    const user = await authApi.getUser();
    user_id = user?.id;
  }

  const payload = {
    ...data,
    user_id,
    client_id,
    created_at: new Date().toISOString()
  };

  console.log(`[saveSet] Attempting to save set: ${data.exercise_id} (client_id: ${client_id})`);

  try {
    // 2. Try to save to Supabase immediately via API
    const { error } = await workoutApi.saveSetLog(payload);
    
    if (error) {
      console.warn(`[saveSet] Supabase save failed, queuing offline: ${error.message}`);
      await offlineQueue.addToQueue('SAVE_SET', payload);
      return { success: false, client_id };
    }

    console.log(`[saveSet] SUCCESS: Saved to Supabase (client_id: ${client_id})`);
    return { success: true, client_id };
  } catch (err) {
    console.error(`[saveSet] Network error, queuing offline:`, err);
    await offlineQueue.addToQueue('SAVE_SET', payload);
    return { success: false, client_id };
  }
};
