import { LastSetData } from "../types";

export function getPreSetHint({
  lastSet,
  targetReps,
}: {
  lastSet?: LastSetData | null;
  targetReps: number;
}) {
  if (!lastSet) return "Série inicial: foque na técnica e cadência.";

  if (lastSet.reps < targetReps) {
    return `Última vez: ${lastSet.reps} reps. Hoje vamos buscar as ${targetReps}!`;
  }

  if (lastSet.rpe <= 7) {
    const suggestedWeight = lastSet.weight + 2.5;
    return `Você dominou os ${lastSet.weight}kg. Hoje você pode tentar ${suggestedWeight}kg!`;
  }

  if (lastSet.rpe >= 9) {
    return `Intensidade alta detectada. Mantenha os ${lastSet.weight}kg com foco total.`;
  }

  return "Consistência é a chave. Repita a carga com perfeição.";
}
