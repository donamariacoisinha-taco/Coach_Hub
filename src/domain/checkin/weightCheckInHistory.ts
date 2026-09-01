/**
 * Histórico de check-ins de peso, gravado localmente por `WeeklyCheckIn`
 * em `localStorage['rubi_history_<profileId>']` — funciona igual para
 * convidado e autenticado, pois a chave usa `profile.id`.
 *
 * Regra central: nenhuma variação de peso é afirmada sem dois check-ins
 * reais para compará-la. Sem base, a função devolve `null` e a interface
 * mostra um estado que diz o que falta, nunca um número de demonstração.
 */

export type WeightCheckInLog = {
  date: string;
  weight: number;
  energy?: number;
  recovery?: number;
  sleep?: number;
  hydration?: boolean;
};

export const parseWeightCheckInLogs = (raw: string | null | undefined): WeightCheckInLog[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is WeightCheckInLog =>
      entry && typeof entry.date === 'string' && Number.isFinite(Number(entry.weight)));
  } catch {
    return [];
  }
};

export const sortWeightCheckInLogsDesc = (logs: WeightCheckInLog[]): WeightCheckInLog[] =>
  [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export type WeightDelta = {
  /** Diferença real: positivo é ganho, negativo é perda. */
  deltaKg: number;
  days: number;
  latest: WeightCheckInLog;
  previous: WeightCheckInLog;
};

/**
 * Variação de peso entre os dois check-ins mais recentes.
 * `null` com menos de dois registros — não há como afirmar variação alguma.
 */
export const computeWeightDelta = (logs: WeightCheckInLog[]): WeightDelta | null => {
  const sorted = sortWeightCheckInLogsDesc(logs);
  if (sorted.length < 2) return null;

  const [latest, previous] = sorted;
  const days = Math.max(1, Math.round(
    (new Date(latest.date).getTime() - new Date(previous.date).getTime()) / 86_400_000,
  ));

  return {
    deltaKg: parseFloat((latest.weight - previous.weight).toFixed(1)),
    days,
    latest,
    previous,
  };
};

export const formatWeightDeltaSentence = (delta: WeightDelta): string => {
  const magnitude = Math.abs(delta.deltaKg).toFixed(1).replace('.', ',');
  const periodo = delta.days === 1 ? 'no último dia' : `nos últimos ${delta.days} dias`;

  if (delta.deltaKg === 0) {
    return `Seu peso se manteve estável ${periodo}, entre os dois últimos check-ins.`;
  }
  const direcao = delta.deltaKg < 0 ? 'caiu' : 'subiu';
  return `Seu peso ${direcao} ${magnitude} kg ${periodo}, entre os dois últimos check-ins.`;
};
