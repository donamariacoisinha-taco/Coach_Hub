import { addToQueue } from "./offlineQueue";
import { supabase } from "./supabase";

export async function saveSet(payload: any) {
  try {
    // Se estiver offline, pula direto para o catch
    if (!navigator.onLine) throw new Error("offline");

    const { error } = await supabase.from("workout_sets_log").upsert([payload], { onConflict: 'history_id,exercise_id,set_number' });
    
    // Se houver erro de rede (não erro de RLS/Validação), salva offline
    if (error) {
      if (error.message.includes('Failed to fetch') || error.code === 'PGRST301') {
        throw error;
      }
      // Se for outro erro (ex: permissão), loga mas não enfileira para não travar o sync
      console.error("Erro ao salvar série (não-rede):", error);
      return;
    }
  } catch (err) {
    console.log("Salvando offline...");

    await addToQueue({
      type: "SET_LOG",
      payload,
      createdAt: Date.now(),
    });
  }
}
