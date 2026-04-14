import { getQueue, removeFromQueue } from "./offlineQueue";
import { supabase } from "./supabase";

export async function syncQueue() {
  const queue = await getQueue();

  for (const item of queue) {
    try {
      if (item.type === "SET_LOG") {
        const { error } = await supabase.from("workout_sets_log").upsert([item.payload], { onConflict: 'history_id,exercise_id,set_number' });
        if (error) throw error;
      }

      await removeFromQueue(item.id!);
    } catch (err) {
      console.log("Sync falhou, tentando depois...", err);
      break;
    }
  }
}
