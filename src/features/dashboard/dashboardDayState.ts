/**
 * Derivações do calendário e da orientação diária do Dashboard.
 *
 * Regra central: uma sessão parcial nunca marca o dia como treino concluído.
 * Quando o mesmo dia tem sessão completa e parcial, a completa prevalece.
 */

export type DayState = 'completed' | 'partial' | 'missed' | 'future' | 'rest';

export type CalendarDay = {
  date: Date;
  dayNum: number;
  dayName: string;
  isToday: boolean;
  isFuture: boolean;
  isPreferred: boolean;
  isCompleted: boolean;
  isPartial: boolean;
  state: DayState;
  id: string;
};

const DAYS_OF_WEEK_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const dateKey = (entry: any): string | null =>
  (entry?.completed_at ? new Date(entry.completed_at).toDateString() : null);

/** Datas com pelo menos uma sessão completa e datas apenas parciais. */
export const splitSessionDates = (history: any[]) => {
  const completedDates = new Set(
    (history || []).filter(entry => !entry?.partial).map(dateKey).filter(Boolean) as string[],
  );
  const partialDates = new Set(
    (history || []).filter(entry => entry?.partial).map(dateKey)
      .filter(Boolean).filter(key => !completedDates.has(key as string)) as string[],
  );
  return { completedDates, partialDates };
};

export const buildCalendarDays = (
  history: any[],
  preferredTrainingDays: string[] = [],
  now: Date = new Date(),
): CalendarDay[] => {
  const { completedDates, partialDates } = splitSessionDates(history);
  const days: CalendarDay[] = [];

  for (let offset = -3; offset <= 3; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const isToday = offset === 0;
    const isFuture = offset > 0;
    const key = date.toDateString();

    const isPreferred = (preferredTrainingDays || []).includes(DAYS_OF_WEEK_EN[date.getDay()]);
    const isCompleted = completedDates.has(key);
    const isPartial = partialDates.has(key);

    let state: DayState = 'rest';
    if (isCompleted) state = 'completed';
    else if (isPartial) state = 'partial';
    else if (isPreferred) state = isFuture || isToday ? 'future' : 'missed';

    days.push({
      date,
      dayNum: date.getDate(),
      dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase().substring(0, 3),
      isToday,
      isFuture,
      isPreferred,
      isCompleted,
      isPartial,
      state,
      id: `cal-${offset}-${date.getDate()}`,
    });
  }
  return days;
};

export type EmotionalGuidance = {
  text: string;
  emoji: string;
  color: string;
  /** Chave estável para teste e telemetria. */
  kind: 'partial' | 'streak' | 'rest' | 'last-call' | 'no-guilt' | 'training-day';
};

export const buildEmotionalGuidance = (
  history: any[],
  options: { streak?: number; preferredTrainingDays?: string[]; now?: Date } = {},
): EmotionalGuidance => {
  const { streak = 0, preferredTrainingDays = [], now = new Date() } = options;
  const todayPreferred = preferredTrainingDays.includes(DAYS_OF_WEEK_EN[now.getDay()]);

  const todayEntries = (history || []).filter(entry =>
    entry?.completed_at && new Date(entry.completed_at).toDateString() === now.toDateString());
  const completedToday = todayEntries.some(entry => !entry.partial);
  const partialToday = !completedToday && todayEntries.some(entry => entry.partial);

  // A sessão parcial vem antes do streak: nada de sugerir sobrecarga como se a
  // meta do dia estivesse integralmente cumprida.
  if (partialToday) {
    return {
      text: 'Você registrou parte do treino de hoje. Já conta como movimento — retome as séries que faltam quando puder.',
      emoji: '🟡',
      color: 'text-amber-600 bg-amber-50/80 border-amber-200/50',
      kind: 'partial',
    };
  }

  if (streak >= 3) {
    return {
      text: 'Seu corpo está respondendo perfeitamente ao estímulo. Continue assim!',
      emoji: '🔥',
      color: 'text-blue-600 bg-blue-50/60 border-blue-105',
      kind: 'streak',
    };
  }

  if (!todayPreferred && !completedToday) {
    return {
      text: 'Hoje seu corpo se reconstrói. Hidrate-se e recupere o foco.',
      emoji: '☕',
      color: 'text-indigo-600 bg-indigo-50/40 border-indigo-100/30',
      kind: 'rest',
    };
  }

  if (todayPreferred && !completedToday) {
    if (streak > 0) {
      return {
        text: 'Última chamada para salvar sua sequência de consistência. Que tal 20 minutos de foco hoje?',
        emoji: '⚡',
        color: 'text-amber-600 bg-amber-50/80 border-amber-200/50',
        kind: 'last-call',
      };
    }
    return {
      text: 'Sem culpa. O progresso não é linear. Um treino leve hoje é melhor do que nenhum.',
      emoji: '🤝',
      color: 'text-purple-600 bg-purple-50/80 border-purple-100',
      kind: 'no-guilt',
    };
  }

  return {
    text: 'Hoje é dia de construir sobrecarga mecânica progressiva. Bons treinos!',
    emoji: '💪',
    color: 'text-emerald-600 bg-emerald-50/80 border-emerald-100',
    kind: 'training-day',
  };
};
