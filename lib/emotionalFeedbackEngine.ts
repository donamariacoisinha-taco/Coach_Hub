
export function getAdvancedEmotionalFeedback({ streak, pr, volumeTrend }: { 
  streak: number; 
  pr: boolean; 
  volumeTrend: number; 
}) {
  if (pr && streak >= 3) {
    return "🔥 PR + consistência — evolução real";
  }

  if (streak >= 7) {
    return "👑 Nível elite — sua disciplina é inabalável";
  }

  if (streak >= 3) {
    return "📈 Sequência forte — continue assim";
  }

  if (volumeTrend > 0) {
    return "⚡ Mais volume que o último treino";
  }

  if (pr) {
    return "🏆 Novo recorde — você está mais forte";
  }

  return "Boa sessão — consistência é tudo";
}
