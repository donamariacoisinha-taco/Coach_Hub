/**
 * Derivações exibidas em cada card de treino do Dashboard.
 *
 * Regra central (CLAUDE.md): nunca apresente dado fictício como se fosse do
 * usuário — se não há base real, mostre `—` ou "Dados insuficientes". Estas
 * funções só produzem texto/números a partir do histórico real da ficha.
 */

import { WorkoutHistory } from '../../types';

/** Duração média das sessões concluídas (parciais não entram na conta). `null` sem base real. */
export const getWorkoutCardAvgDuration = (workoutHistory: WorkoutHistory[]): number | null => {
  const completedDurations = workoutHistory
    .filter((h) => !h.partial && typeof h.duration_minutes === 'number' && h.duration_minutes > 0)
    .map((h) => h.duration_minutes);

  if (completedDurations.length === 0) return null;
  return Math.round(completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length);
};

/** Texto de evolução da ficha, derivado só da contagem real de sessões concluídas. */
export const getWorkoutCardEvolutionInsight = (
  workoutHistory: WorkoutHistory[],
  options: { isPublicAdmin?: boolean; createdAt?: string | null } = {},
): string => {
  if (options.isPublicAdmin) {
    return '✓ Ficha pública oficial';
  }
  if (workoutHistory.length === 0) {
    const isNew = options.createdAt
      && (Date.now() - new Date(options.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000);
    return isNew ? 'Treino recém-adicionado' : 'Primeira execução';
  }

  const completedCount = workoutHistory.filter((h) => !h.partial).length;
  if (completedCount === 0) {
    return 'Apenas sessões parciais até agora';
  }
  return `${completedCount} ${completedCount === 1 ? 'sessão concluída' : 'sessões concluídas'}`;
};
