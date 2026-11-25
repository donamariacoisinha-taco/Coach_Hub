export type BiologicalSex = 'male' | 'female';
export type BasalMethod = 'mifflin-st-jeor' | 'katch-mcardle';
export type LimitState = 'ok' | 'capped-20' | 'basal-floor';

export const KCAL_PER_TRAINING_MINUTE = 7.5;
export const KCAL_PER_KG = 7700;
const MAX_VALID_DURATION_MINUTES = 180;

export function biologicalSex(value: string | null | undefined): BiologicalSex | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('fem') || raw.includes('mulher') || raw === 'f') return 'female';
  if (raw.includes('masc') || raw.includes('homem') || raw === 'm' || raw === 'male') return 'male';
  return null;
}

export function ageFromBirthDate(birthDate: string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday = now.getMonth() < born.getMonth()
    || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age > 0 && age < 120 ? age : null;
}

export function mifflinStJeor(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
}): number {
  const base = (10 * input.weightKg) + (6.25 * input.heightCm) - (5 * input.ageYears);
  return input.sex === 'male' ? base + 5 : base - 161;
}

export function katchMcArdle(weightKg: number, bodyFatPct: number): number | null {
  if (!(bodyFatPct > 0) || bodyFatPct >= 70 || !(weightKg > 0)) return null;
  const leanKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + (21.6 * leanKg);
}

export type BasalResult = {
  kcal: number | null;
  method: BasalMethod | null;
  missing: string[];
};

export function basalRate(input: {
  weightKg?: number | null;
  heightCm?: number | null;
  ageYears?: number | null;
  birthDate?: string | null;
  sex?: string | null;
  bodyFatPct?: number | null;
  now?: Date;
}): BasalResult {
  const weight = Number(input.weightKg);
  const fat = input.bodyFatPct == null ? null : Number(input.bodyFatPct);
  if (weight > 0 && fat != null && katchMcArdle(weight, fat) != null) {
    return { kcal: katchMcArdle(weight, fat), method: 'katch-mcardle', missing: [] };
  }

  const height = Number(input.heightCm);
  const age = (input.ageYears != null && Number(input.ageYears) > 0)
    ? Number(input.ageYears)
    : ageFromBirthDate(input.birthDate, input.now);
  const sex = biologicalSex(input.sex);
  const missing: string[] = [];
  if (!(weight > 0)) missing.push('peso');
  if (!(height > 0)) missing.push('altura');
  if (age == null) missing.push('idade');
  if (!sex) missing.push('sexo');
  if (missing.length) return { kcal: null, method: null, missing };
  return {
    kcal: mifflinStJeor({ weightKg: weight, heightCm: height, ageYears: age as number, sex: sex as BiologicalSex }),
    method: 'mifflin-st-jeor',
    missing: [],
  };
}

/** Median of durations that are real minutes. Null, zero and multi-day leftovers stay out. */
export function medianValidDuration(values: Array<number | null | undefined>): number | null {
  const valid = values
    .map((value) => Number(value))
    .filter((value) => value > 0 && value <= MAX_VALID_DURATION_MINUTES)
    .sort((a, b) => a - b);
  if (!valid.length) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

export function trainingKcalPerDay(sessionsPerWeek: number, typicalMinutes: number): number | null {
  if (!(sessionsPerWeek > 0) || !(typicalMinutes > 0)) return null;
  return (KCAL_PER_TRAINING_MINUTE * typicalMinutes * sessionsPerWeek) / 7;
}

export function activityFactor(level: string | null | undefined): number | null {
  const raw = String(level || '').toLowerCase();
  if (!raw) return null;
  if (raw.includes('sedent')) return 1.2;
  if (raw.includes('leve') || raw.includes('light')) return 1.3;
  if (raw.includes('moder')) return 1.45;
  if (raw.includes('alto') || raw.includes('alta') || raw.includes('high')) return 1.6;
  return null;
}

export type Expenditure = {
  basal: number | null;
  dailyLife: number | null;
  training: number | null;
  total: number | null;
  missing: string[];
};

export function dailyExpenditure(input: {
  basal: number | null;
  activityLevel?: string | null;
  sessionsPerWeek?: number | null;
  typicalMinutes?: number | null;
}): Expenditure {
  const missing: string[] = [];
  const basal = input.basal != null && input.basal > 0 ? input.basal : null;
  if (basal == null) missing.push('taxa basal');
  const factor = activityFactor(input.activityLevel);
  if (factor == null) missing.push('dia a dia');
  const training = trainingKcalPerDay(Number(input.sessionsPerWeek), Number(input.typicalMinutes));
  if (training == null) missing.push('treino');
  const dailyLife = basal != null && factor != null ? basal * factor : null;
  const total = dailyLife != null && training != null ? dailyLife + training : null;
  return { basal, dailyLife, training, total, missing };
}

export type WeightLossPlan = {
  wantedDeficit: number;
  deficit: number;
  eatKcal: number;
  kgPerWeek: number;
  capped: boolean;
  floorHit: boolean;
};

/** Deficit is a percent of body weight per week, capped at 20% of expenditure and never below basal. */
export function weightLossPlan(input: {
  weightKg: number;
  expenditure: number;
  basal: number;
  weeklyFraction?: number;
}): WeightLossPlan {
  const pace = input.weeklyFraction ?? 0.0025;
  const wantedDeficit = (input.weightKg * pace * KCAL_PER_KG) / 7;
  const cap = 0.2 * input.expenditure;
  let deficit = Math.min(wantedDeficit, cap);
  const capped = wantedDeficit > cap;
  let floorHit = false;
  if (input.expenditure - deficit < input.basal) {
    deficit = Math.max(0, input.expenditure - input.basal);
    floorHit = true;
  }
  return {
    wantedDeficit,
    deficit,
    eatKcal: input.expenditure - deficit,
    kgPerWeek: (deficit * 7) / KCAL_PER_KG,
    capped,
    floorHit,
  };
}

export function formatKcal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return String(Math.round(value));
}
