
import { LastSetData } from '../../types';

export const getEmotionalFeedback = ({
  current,
  lastSet,
  previousSet,
}: {
  current: LastSetData;
  lastSet?: LastSetData;
  previousSet?: LastSetData;
}): string => {
  if (lastSet && current.weight > lastSet.weight) {
    return "Progressão de carga registrada.";
  }
  if (lastSet && current.weight === lastSet.weight && current.reps > lastSet.reps) {
    return "Aumento de volume detectado.";
  }
  if (previousSet && current.weight > previousSet.weight) {
    return "Carga superior à série anterior.";
  }
  if (current.rpe >= 9) {
    return "Intensidade alta. Mantenha o foco.";
  }
  if (current.rpe === 8) {
    return "Estímulo ideal para hipertrofia.";
  }
  return "Série concluída.";
};

export const getAdvancedEmotionalFeedback = ({
  streak,
  pr,
  volumeTrend,
}: {
  streak: number;
  pr: boolean;
  volumeTrend: number;
}): string => {
  if (pr && streak >= 7) return "Meta de consistência e força atingida.";
  if (pr) return "Novo marco de força registrado.";
  if (streak >= 30) return "Consistência excepcional: 30 dias.";
  if (streak >= 7) return "Sequência de 7 dias concluída.";
  if (volumeTrend > 0) return "Tendência de volume positiva.";
  if (streak >= 3) return "Ritmo de treino constante.";
  
  return "Sessão finalizada com sucesso.";
};
