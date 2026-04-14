
import { WorkoutHistory } from "../types";

export function calculateStreak(history: WorkoutHistory[]) {
  if (!history || history.length === 0) return 0;

  // Filtra apenas treinos concluídos com duração mínima (ex: 5 min para ser flexível, ou 10 como pedido)
  const validHistory = history
    .filter(h => h.completed_at && (h.duration_minutes || 0) >= 5)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

  if (validHistory.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastWorkoutDate = new Date(validHistory[0].completed_at!);
  lastWorkoutDate.setHours(0, 0, 0, 0);

  const diffFromToday = (today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24);

  // Se o último treino foi há mais de 2 dias (contando hoje e ontem), o streak quebrou
  if (diffFromToday > 1) {
    // Se o último treino não foi hoje nem ontem, streak é 0 (ou 1 se estivermos contando o treino atual que acabou de ser salvo)
    // Mas aqui estamos calculando baseado no histórico salvo.
    return 0; 
  }

  for (let i = 0; i < validHistory.length - 1; i++) {
    const current = new Date(validHistory[i].completed_at!);
    current.setHours(0, 0, 0, 0);
    
    const prev = new Date(validHistory[i + 1].completed_at!);
    prev.setHours(0, 0, 0, 0);

    const diff = (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      streak++;
    } else if (diff === 0) {
      // Mesmo dia, ignora
      continue;
    } else if (diff <= 2) {
      // Grace period de 1 dia (ex: treinou segunda, pulou terça, treinou quarta)
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
