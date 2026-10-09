
export function getProgressInsights(data: any[]) {
  if (!data || data.length < 2) return null;

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const weightDiff = last.max_weight - prev.max_weight;
  const volumeDiff = last.volume - prev.volume;

  let message = "Carga e volume sem aumento";
  if (weightDiff > 0) {
    message = "Carga maior que no último treino";
  } else if (volumeDiff > 0) {
    message = "Volume maior que no último treino";
  } else if (weightDiff < 0) {
    message = "Carga menor que no último treino";
  }

  return {
    weightTrend: weightDiff,
    volumeTrend: volumeDiff,
    message,
  };
}
