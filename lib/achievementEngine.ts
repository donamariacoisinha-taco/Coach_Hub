
export type Achievement = {
  id: string;
  title: string;
  icon: string;
  description: string;
};

export function checkAchievements(data: { 
  totalWorkouts: number; 
  streak: number; 
  totalVolume: number;
  isPR?: boolean;
}) {
  const achievements: Achievement[] = [];

  if (data.totalWorkouts === 1) {
    achievements.push({
      id: 'first_workout',
      title: "Primeiro Passo",
      icon: "🎯",
      description: "Primeiro treino concluído"
    });
  }

  if (data.streak === 7) {
    achievements.push({
      id: 'week_streak',
      title: "Consistência de Ferro",
      icon: "🔥",
      description: "7 dias seguidos de treino"
    });
  }

  if (data.totalVolume >= 1000) {
    achievements.push({
      id: 'one_ton',
      title: "Peso Pesado",
      icon: "🏋️",
      description: "1 tonelada levantada no total"
    });
  }

  if (data.isPR) {
    achievements.push({
      id: 'new_pr',
      title: "Superação",
      icon: "🏆",
      description: "Novo recorde pessoal batido"
    });
  }

  return achievements;
}
