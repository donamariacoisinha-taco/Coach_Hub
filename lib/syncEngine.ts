import { getQueue, removeFromQueue, updateQueueItem } from "./offlineQueue";
import { supabase } from "./supabase";

export async function syncQueue() {
  const queue = await getQueue();

  for (const item of queue) {
    try {
      // Fail-safe: descarta após 3 tentativas
      if (item.retryCount >= 3) {
        console.warn("Item descartado após múltiplas falhas:", item);
        await removeFromQueue(item.id!);
        continue;
      }

      if (item.type === "SET_LOG") {
        const { error } = await supabase.from("workout_sets_log").upsert([item.payload], { onConflict: 'client_id' });
        
        // Se for erro de rede, para o loop para tentar depois
        if (error && (error.message.includes('Failed to fetch') || error.code === 'PGRST301')) {
          throw error;
        }
        
        // Se for outro erro (ex: RLS), loga e remove da fila para não travar
        if (error) {
          console.error("Erro permanente no sync:", error);
        }
      }

      await removeFromQueue(item.id!);
    } catch (err) {
      console.log("Sync falhou, incrementando retry...", err);
      item.retryCount += 1;
      await updateQueueItem(item);
      // Se for erro de rede (detectado acima), o throw interrompe o loop.
    }
  }
}
