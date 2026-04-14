import { addToQueue } from "./offlineQueue";
import { supabase } from "./supabase";

export async function saveSet(payload: any) {
  // Validação básica
  if (!payload.weight_achieved || !payload.reps_achieved) {
    console.warn("Tentativa de salvar set inválido:", payload);
    return;
  }

  // Garante client_id para idempotência
  const finalPayload = {
    ...payload,
    client_id: payload.client_id || crypto.randomUUID(),
    created_at: payload.created_at || new Date().toISOString()
  };

  try {
    if (!navigator.onLine) throw new Error("offline");

    const { error } = await supabase.from("workout_sets_log").upsert([finalPayload], { onConflict: 'client_id' });
    
    if (error) {
      if (error.message.includes('Failed to fetch') || error.code === 'PGRST301') {
        throw error;
      }
      console.error("Erro ao salvar série (não-rede):", error);
      return;
    }
  } catch (err) {
    console.log("Salvando offline...");

    await addToQueue({
      type: "SET_LOG",
      payload: finalPayload,
      createdAt: Date.now(),
      retryCount: 0
    });
  }
}
