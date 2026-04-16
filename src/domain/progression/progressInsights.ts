
export function getProgressInsights(data: any[]) {
  if (!data || data.length < 2) return null;

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const weightDiff = last.max_weight - prev.max_weight;
  const volumeDiff = last.volume - prev.volume;

  let message = "Consistência mantida";
  if (weightDiff > 0) {
    message = "🔥 Mais forte que o último treino";
  } else if (volumeDiff > 0) {
    message = "📈 Mais volume total";
  } else if (weightDiff < 0) {
    message = "⚖️ Foco na técnica hoje";
  }

  return {
    weightTrend: weightDiff,
    volumeTrend: volumeDiff,
    message,
  };
}
