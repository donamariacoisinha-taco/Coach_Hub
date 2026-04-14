
export function getNextGoal(data: { streak: number }) {
  const targets = [3, 7, 14, 30, 60, 90, 100, 365];
  const nextTarget = targets.find(t => t > data.streak) || data.streak + 1;
  
  const diff = nextTarget - data.streak;

  return {
    target: nextTarget,
    diff,
    message: `Faltam ${diff} ${diff === 1 ? 'treino' : 'treinos'} para bater ${nextTarget} dias de sequência`,
  };
}
