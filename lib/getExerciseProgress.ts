
import { supabase } from "./supabase";

export async function getExerciseProgress(exerciseId: string) {
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("*")
    .eq("exercise_id", exerciseId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar progresso do exercício:", error);
    return [];
  }

  return data;
}
