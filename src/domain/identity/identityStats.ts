import { profileDaysPerWeek, type WeeklyFrequencyProfile } from '../profile/weeklyFrequency';

export type TrainingLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export type IdentitySession = {
  id?: string | null;
  completed_at?: string | null;
  partial?: boolean | null;
  duration_minutes?: number | null;
};

export type IdentitySetLog = {
  history_id?: string | null;
  weight_achieved?: number | string | null;
  reps_achieved?: number | string | null;
  set_type?: string | null;
};

export type IdentityStats = {
  daysPerWeek: number | null;
  level: TrainingLevel | null;
  finishedWorkouts: number;
  partialWorkouts: number;
  activeWeeks: number;
  fulfilledWeekStreak: number | null;
  finishedThisWeek: number;
  volumeKg: number | null;
  sessionsWithSets: number;
  typicalDurationMinutes: number | null;
};

const LEVELS: Array<[RegExp, TrainingLevel]> = [
  [/avan|advanced/, 'Avançado'],
  [/intermed/, 'Intermediário'],
  [/iniciante|beginner/, 'Iniciante'],
];

export function trainingLevel(experience: string | null | undefined): TrainingLevel | null {
  const raw = String(experience || '').trim().toLowerCase();
  if (!raw) return null;
  const match = LEVELS.find(([pattern]) => pattern.test(raw));
  return match ? match[1] : null;
}

export function weeklyFrequency(profile: WeeklyFrequencyProfile | null | undefined): number | null {
  return profileDaysPerWeek(profile);
}

function localMonday(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

function weekKey(date: Date): string {
  const monday = localMonday(date);
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${month}-${day}`;
}

function finishedSessions(sessions: IdentitySession[]): IdentitySession[] {
  return sessions.filter((session) => {
    if (session?.completed_at == null || String(session.completed_at).trim() === '') return false;
    return !Number.isNaN(new Date(session.completed_at).getTime());
  });
}

function isWorkSet(setType: string | null | undefined): boolean {
  const raw = String(setType || '').trim().toLowerCase();
  if (!raw) return true;
  return raw !== 'aquecimento' && raw !== 'warmup';
}

export function buildIdentityStats(input: {
  profile?: (WeeklyFrequencyProfile & { experience_level?: string | null }) | null;
  sessions?: IdentitySession[] | null;
  logs?: IdentitySetLog[] | null;
  now?: Date;
}): IdentityStats {
  const now = input.now ?? new Date();
  const daysPerWeek = weeklyFrequency(input.profile);
  const finished = finishedSessions(input.sessions || []);
  const partialWorkouts = finished.filter((session) => session.partial).length;
  const weeks = new Map<string, number>();
  for (const session of finished) {
    const key = weekKey(new Date(session.completed_at as string));
    weeks.set(key, (weeks.get(key) || 0) + 1);
  }

  let fulfilledWeekStreak: number | null = null;
  if (daysPerWeek != null) {
    fulfilledWeekStreak = 0;
    const cursor = localMonday(now);
    if ((weeks.get(weekKey(cursor)) || 0) < daysPerWeek) cursor.setDate(cursor.getDate() - 7);
    while ((weeks.get(weekKey(cursor)) || 0) >= daysPerWeek) {
      fulfilledWeekStreak += 1;
      cursor.setDate(cursor.getDate() - 7);
    }
  }

  const finishedIds = new Set(finished.map((session) => session.id).filter(Boolean) as string[]);
  let volume = 0;
  let countedSets = 0;
  const sessionsWithSets = new Set<string>();
  for (const log of input.logs || []) {
    if (!isWorkSet(log.set_type)) continue;
    if (log.history_id && finishedIds.size && !finishedIds.has(String(log.history_id))) continue;
    const weight = Number(log.weight_achieved);
    const reps = Number(log.reps_achieved);
    if (!(weight > 0) || !(reps > 0)) continue;
    volume += weight * reps;
    countedSets += 1;
    if (log.history_id) sessionsWithSets.add(String(log.history_id));
  }

  const durations = finished.map((session) => session.duration_minutes);
  const valid = durations
    .map((value) => Number(value))
    .filter((value) => value > 0 && value <= 180)
    .sort((a, b) => a - b);
  const mid = Math.floor(valid.length / 2);
  const typicalDurationMinutes = !valid.length
    ? null
    : valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;

  return {
    daysPerWeek,
    level: trainingLevel(input.profile?.experience_level),
    finishedWorkouts: finished.length,
    partialWorkouts,
    activeWeeks: weeks.size,
    fulfilledWeekStreak,
    finishedThisWeek: weeks.get(weekKey(now)) || 0,
    volumeKg: countedSets > 0 ? volume : null,
    sessionsWithSets: sessionsWithSets.size,
    typicalDurationMinutes,
  };
}
