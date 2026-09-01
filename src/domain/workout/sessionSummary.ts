/**
 * Classificação de uma sessão de treino a partir dos seus registros de série.
 *
 * É a fonte única para responder três perguntas que a interface precisa separar
 * com clareza: a sessão foi concluída ou parcial? houve carga mensurável ou foi
 * peso corporal? existe registro suficiente para afirmar qualquer coisa?
 *
 * Regra central: nada aqui inventa número. Sem registro, o resultado diz
 * `no-data` — nunca um valor de demonstração.
 */

export type SetLog = Record<string, any>;

export type SessionLoadKind =
  /** Houve peso × repetições maior que zero. */
  | 'measurable'
  /** Séries registradas, mas todas sem carga (peso corporal). */
  | 'bodyweight'
  /** Nenhuma série registrada. */
  | 'no-data';

export type SessionSummary = {
  partial: boolean;
  loadKind: SessionLoadKind;
  totalVolume: number;
  /** Média de RPE das séries que registraram esforço; `null` quando não houve. */
  avgRpe: number | null;
  setCount: number;
  hasMeasurableLoad: boolean;
};

export const setVolume = (log: SetLog): number => {
  const weight = parseFloat(log?.weight_achieved) || 0;
  const reps = parseInt(log?.reps_achieved) || 0;
  return weight * reps;
};

export const summarizeSetLogs = (logs: SetLog[]): Omit<SessionSummary, 'partial'> => {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const totalVolume = safeLogs.reduce((sum, log) => sum + setVolume(log), 0);
  const ratedSets = safeLogs.filter(log => Number(log?.rpe) > 0);
  const avgRpe = ratedSets.length > 0
    ? parseFloat((ratedSets.reduce((sum, log) => sum + Number(log.rpe), 0) / ratedSets.length).toFixed(1))
    : null;

  let loadKind: SessionLoadKind = 'no-data';
  if (safeLogs.length > 0) loadKind = totalVolume > 0 ? 'measurable' : 'bodyweight';

  return {
    loadKind,
    totalVolume,
    avgRpe,
    setCount: safeLogs.length,
    hasMeasurableLoad: totalVolume > 0,
  };
};

export const summarizeSession = (entry: any, logs: SetLog[]): SessionSummary => ({
  partial: Boolean(entry?.partial),
  ...summarizeSetLogs(logs),
});

export type BadgeTone = 'complete' | 'partial' | 'measurable' | 'bodyweight' | 'no-data';

export type SessionBadge = {
  label: string;
  /** Texto longo para leitor de tela e `title`. */
  description: string;
  tone: BadgeTone;
};

/** Concluída ou parcial — sempre disponível, vem do próprio histórico. */
export const sessionStatusBadge = (summary: Pick<SessionSummary, 'partial'>): SessionBadge => (
  summary.partial
    ? {
      label: 'Sessão parcial',
      description: 'Treino encerrado antes de todas as séries. Só as séries concluídas foram salvas.',
      tone: 'partial',
    }
    : {
      label: 'Treino concluído',
      description: 'Todas as séries prescritas foram concluídas.',
      tone: 'complete',
    }
);

/** Qualidade do dado registrado — depende dos logs da sessão. */
export const sessionDataBadge = (summary: Pick<SessionSummary, 'loadKind'>): SessionBadge => {
  switch (summary.loadKind) {
    case 'measurable':
      return {
        label: 'Com carga',
        description: 'Séries registradas com peso, então volume e progressão podem ser calculados.',
        tone: 'measurable',
      };
    case 'bodyweight':
      return {
        label: 'Peso corporal',
        description: 'Séries sem peso adicional. O esforço conta, mas não gera volume em quilos.',
        tone: 'bodyweight',
      };
    default:
      return {
        label: 'Sem dados suficientes',
        description: 'Nenhuma série registrada nesta sessão.',
        tone: 'no-data',
      };
  }
};

export const formatSessionVolume = (summary: Pick<SessionSummary, 'loadKind' | 'totalVolume'>): string => {
  if (summary.loadKind === 'no-data') return '—';
  if (summary.loadKind === 'bodyweight') return 'Peso corporal';
  return summary.totalVolume >= 1000
    ? `${(summary.totalVolume / 1000).toFixed(1)} ton`
    : `${summary.totalVolume.toLocaleString('pt-BR')} kg`;
};

/** Peso de uma série: `0 kg` num exercício corporal vira texto, não número seco. */
export const formatSetWeight = (log: SetLog): string => {
  const weight = parseFloat(log?.weight_achieved) || 0;
  return weight > 0 ? `${weight} kg` : 'Peso corporal';
};
