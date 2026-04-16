
import { LastSetData, ProgressionInput } from '../../types';

export interface ProgressionDecision {
  nextWeight: number;
  action: 'increase' | 'maintain' | 'decrease' | 'decrease_major';
  message: string;
}

export const getNextSetDecision = (input: ProgressionInput, lastSet?: LastSetData): ProgressionDecision => {
  let nextWeight = input.weight;
  let action: ProgressionDecision['action'] = 'maintain';
  let message = 'Mantenha o ritmo';

  if (input.rpe <= 7 && input.repsDone >= input.repsTarget) {
    nextWeight += 2.5;
    action = 'increase';
    message = 'Carga aumentada! +2.5kg';
  } else if (input.rpe === 8) {
    action = 'maintain';
    message = 'Peso ideal. Mantenha.';
  } else if (input.rpe >= 9) {
    if (input.repsDone < input.repsTarget - 2) {
      nextWeight = Math.max(0, nextWeight - 5);
      action = 'decrease_major';
      message = 'Redução técnica: -5kg';
    } else {
      nextWeight = Math.max(0, nextWeight - 2.5);
      action = 'decrease';
      message = 'Ajuste de carga: -2.5kg';
    }
  }

  return { nextWeight, action, message };
};

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

export function calculatePR(data: any[]) {
  if (!data || data.length === 0) return 0;
  return Math.max(...data.map(d => d.max_weight || 0));
}
