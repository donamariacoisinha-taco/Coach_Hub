export type PlanSet = {
  reps?: number | string | null;
  weight?: number | string | null;
  rest_time?: number | string | null;
};

export type PlanColumnFallback = {
  sets?: number | null;
  reps?: number | string | null;
  weight?: number | string | null;
  rest_time?: number | string | null;
};

export type PlanSummary = {
  sets: number;
  reps: string;
  weight: number;
  rest_time: number;
};

function finiteNumber(value: unknown, fallback: number): number {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * sets_json é a prescrição. As colunas reps, rest_time, weight e sets
 * são só um espelho da primeira série, para telas e linhas antigas.
 */
export function summaryFromSets(sets: PlanSet[] | null | undefined, fallback: PlanColumnFallback = {}): PlanSummary {
  const list = Array.isArray(sets) ? sets : [];
  const first = list[0];
  const repsSource = first && first.reps != null && String(first.reps) !== ''
    ? first.reps
    : fallback.reps;
  return {
    sets: list.length > 0 ? list.length : finiteNumber(fallback.sets, 0),
    reps: repsSource != null && String(repsSource) !== '' ? String(repsSource) : '12',
    weight: finiteNumber(first?.weight ?? fallback.weight, 0),
    rest_time: finiteNumber(first?.rest_time ?? fallback.rest_time, 60),
  };
}

export function readPlanSummary(exercise: PlanColumnFallback & { sets_json?: PlanSet[] | null }): PlanSummary {
  return summaryFromSets(exercise.sets_json, exercise);
}

/**
 * Quantas séries a ficha pede. A lista da ficha ganha da coluna `sets`.
 * Log da última sessão e prescrição não aumentam esse número.
 */
export function planSetCount(
  exercise: { sets_json?: readonly unknown[] | null; sets?: number | null },
  fallback = 0,
): number {
  const listed = Array.isArray(exercise.sets_json) ? exercise.sets_json.length : 0;
  if (listed > 0) return listed;
  const declared = Math.trunc(Number(exercise.sets));
  if (Number.isFinite(declared) && declared > 0) return declared;
  return fallback;
}

export function alignFlatColumns<T extends PlanColumnFallback & { sets_json?: PlanSet[] | null }>(row: T): T & PlanSummary {
  return { ...row, ...summaryFromSets(row.sets_json, row) };
}
