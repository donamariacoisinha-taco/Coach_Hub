
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
  // ... existing logic ...
  if (lastSet && current.weight > lastSet.weight) {
    return "Novo recorde de carga! 🔥";
  }
  if (lastSet && current.weight === lastSet.weight && current.reps > lastSet.reps) {
    return "Mais reps que a última vez! Evolução pura.";
  }
  if (previousSet && current.weight > previousSet.weight) {
    return "Subindo o sarrafo! Boa.";
  }
  if (current.rpe >= 9) {
    return "Esforço máximo. É assim que se cresce.";
  }
  if (current.rpe === 8) {
    return "No ponto ideal. Sólido.";
  }
  return "Série concluída. Vamos para a próxima!";
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
  if (pr && streak >= 7) return "Incrível! Recorde batido e 1 semana de consistência! 🏆";
  if (pr) return "Novo Recorde Pessoal! Você está ficando mais forte! 💪";
  if (streak >= 30) return "30 dias! Você é uma máquina de consistência! 🤖";
  if (streak >= 7) return "Uma semana completa! O hábito está formado. 🔥";
  if (volumeTrend > 0) return "Volume total subindo! Evolução constante. 📈";
  if (streak >= 3) return "3 dias seguidos! Mantendo o ritmo. ⚡";
  
  return "Treino concluído com sucesso! Orgulhe-se do esforço.";
};
