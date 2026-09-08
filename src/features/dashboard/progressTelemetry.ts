/**
 * Telemetria da tela de Evolução.
 *
 * Regra central: nada aqui inventa número. Quando não há base real, a função
 * devolve `null` e a interface mostra "—" ou "Dados insuficientes" — nunca um
 * valor demonstrativo apresentado como se fosse do usuário.
 */

import { SetLog, summarizeSetLogs } from '../../domain/workout/sessionSummary';

export type { SetLog };

export type SessionTelemetry = Record<string, any> & {
  id: string;
  total_volume: number;
  /** Média de RPE das séries que registraram esforço; `null` quando não houve. */
  avg_rpe: number | null;
  /** Houve carga (peso × repetições) mensurável nesta sessão. */
  hasMeasurableLoad: boolean;
  logs: SetLog[];
};

/**
 * Convidados não gravam em `workout_sets_log`: os registros ficam dentro do
 * próprio histórico local, em `history[].workout_sets_logs`. Achata essa
 * estrutura no mesmo formato da tabela remota, preservando o `history_id`.
 */
export const flattenGuestSetLogs = (history: any[]): SetLog[] =>
  (history || []).flatMap((entry: any) => {
    const logs = Array.isArray(entry?.workout_sets_logs) ? entry.workout_sets_logs : [];
    return logs.map((log: SetLog) => ({
      ...log,
      history_id: log?.history_id || entry?.id,
    }));
  });

export const groupLogsByHistory = (logs: SetLog[]): Record<string, SetLog[]> => {
  const groups: Record<string, SetLog[]> = {};
  (logs || []).forEach(log => {
    const key = log?.history_id;
    if (key === undefined || key === null) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return groups;
};

/**
 * Combina o histórico com os logs de série e calcula volume e RPE reais.
 * Volume 0 continua 0 — exercício de peso corporal não vira carga fictícia.
 */
export const buildSessionsWithTelemetry = (
  history: any[],
  logsByHistory: Record<string, SetLog[]>,
): SessionTelemetry[] => (history || [])
  .map(entry => {
    const logs = logsByHistory[entry.id] || [];
    const summary = summarizeSetLogs(logs);
    return {
      ...entry,
      total_volume: summary.totalVolume,
      avg_rpe: summary.avgRpe,
      hasMeasurableLoad: summary.hasMeasurableLoad,
      loadKind: summary.loadKind,
      logs,
    };
  })
  .sort((a, b) => new Date(b.completed_at || b.created_at).getTime()
    - new Date(a.completed_at || a.created_at).getTime());

/**
 * Variação percentual de volume entre duas sessões equivalentes.
 * `null` quando qualquer uma delas não tem carga mensurável — sem base real,
 * não há comparação a exibir.
 */
export const computeVolumeChangePercent = (
  latest: SessionTelemetry | null | undefined,
  previous: SessionTelemetry | null | undefined,
): number | null => {
  if (!latest || !previous) return null;
  if (!latest.hasMeasurableLoad || !previous.hasMeasurableLoad) return null;
  return parseFloat((((latest.total_volume - previous.total_volume) / previous.total_volume) * 100).toFixed(1));
};

/**
 * Índice de prontidão 0-100. Só existe quando a última sessão tem carga
 * mensurável: um RPE de peso corporal isolado não sustenta o cálculo.
 */
export const computePerformanceScore = (input: {
  streak?: number;
  sessions: SessionTelemetry[];
  latestSession?: SessionTelemetry | null;
  volChangePercent: number | null;
}): number | null => {
  const { streak = 0, sessions, latestSession, volChangePercent } = input;
  if (!latestSession || !latestSession.hasMeasurableLoad) return null;

  let score = 70;
  score += Math.min(15, streak * 3);

  const recentWorkouts = (sessions || []).filter(session => {
    const date = new Date(session.completed_at || session.created_at);
    const diffDays = Math.ceil(Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  }).length;
  score += Math.min(15, recentWorkouts * 5);

  if (volChangePercent !== null) {
    if (volChangePercent > 2) score += 10;
    else if (volChangePercent >= -2) score += 5;
    else score -= 5;
  }

  if (latestSession.avg_rpe !== null && latestSession.avg_rpe >= 7.5 && latestSession.avg_rpe <= 8.5) {
    score += 10;
  }

  return Math.min(100, Math.max(15, score));
};

export const EMPTY_METRIC = '—';

export const formatRpe = (value: number | null | undefined): string =>
  (value === null || value === undefined ? EMPTY_METRIC : value.toFixed(1));

export const formatScore = (value: number | null | undefined): string =>
  (value === null || value === undefined ? EMPTY_METRIC : String(value));
