export type WeeklyFrequencyProfile = {
  days_per_week?: number | string | null;
  frequency?: number | string | null;
};

export const WEEKLY_FREQUENCY_OPTIONS = [
  { value: '1', label: '1x por semana' },
  { value: '2', label: '2x por semana' },
  { value: '3', label: '3x por semana' },
  { value: '4', label: '4x por semana' },
  { value: '5', label: '5x por semana' },
  { value: '6', label: '6x por semana' },
  { value: '7', label: 'Diário (Consistente)' },
] as const;

function parsePositiveDays(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

/**
 * Weekly training frequency. `days_per_week` wins.
 * `frequency` is read only when `days_per_week` is null.
 * Preferred weekdays are not a frequency.
 */
export function profileDaysPerWeek(profile: WeeklyFrequencyProfile | null | undefined): number | null {
  if (!profile) return null;
  if (profile.days_per_week != null && profile.days_per_week !== '') {
    return parsePositiveDays(profile.days_per_week);
  }
  return parsePositiveDays(profile.frequency);
}

/** Columns written together so the legacy text never drifts from the integer. */
export function weeklyFrequencyWrite(payload: Record<string, unknown>): { days_per_week: number | null; frequency: string | null } | null {
  const hasDays = payload.days_per_week !== undefined;
  const hasFrequency = payload.frequency !== undefined;
  const hasAvailability = payload.weekly_availability !== undefined;
  if (!hasDays && !hasFrequency && !hasAvailability) return null;

  const source = hasDays
    ? payload.days_per_week
    : hasFrequency
      ? payload.frequency
      : payload.weekly_availability;
  const days = source == null || source === '' ? null : parsePositiveDays(source);
  return {
    days_per_week: days,
    frequency: days == null ? null : String(days),
  };
}

export function targetWeightWrite(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
