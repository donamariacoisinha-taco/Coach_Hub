export type LastPerformance = {
  weight: number;
  reps: number;
  rpe: number;
  rest_time?: number | null;
};

export type PrefillSet = {
  weight?: number | string;
  reps?: number | string;
  rpe?: number;
  rest_time?: number;
  type?: unknown;
};

/** Latest performed values fill every set, including rest. The plan still decides how many sets exist. */
export function prefillSetsFromLast<T extends PrefillSet>(sets: T[], last: LastPerformance | null | undefined): T[] {
  if (!last || sets.length === 0) return sets.map((set) => ({ ...set }));
  const rest = last.rest_time == null || Number.isNaN(Number(last.rest_time))
    ? undefined
    : Number(last.rest_time);
  return sets.map((set) => ({
    ...set,
    weight: Number(last.weight),
    reps: Number(last.reps),
    rpe: Number(last.rpe ?? set.rpe ?? 8),
    rest_time: rest ?? set.rest_time ?? 60,
  }) as T);
}

export function setLogKey(historyId: string, exerciseId: string, setNumber: number): string {
  return `${historyId}:${exerciseId}:${setNumber}`;
}

export function createSetIdentityStore(createId: () => string = () => crypto.randomUUID()) {
  const ids = new Map<string, string>();
  return {
    clientId(historyId: string, exerciseId: string, setNumber: number): string {
      const key = setLogKey(historyId, exerciseId, setNumber);
      const existing = ids.get(key);
      if (existing) return existing;
      const created = createId();
      ids.set(key, created);
      return created;
    },
  };
}

export function canWritePartialSession(sessionClosed: boolean): boolean {
  return !sessionClosed;
}

/** Finish updates the rows already saved. It must not delete and insert them again. */
export function finishReplacesLogs(): boolean {
  return false;
}

export function restSecondsFromLog(row: { rest_time_actual?: number | null; rest_time?: number | null } | null | undefined): number | null {
  if (!row) return null;
  const actual = Number(row.rest_time_actual);
  if (Number.isFinite(actual) && actual > 0) return actual;
  const prescribed = Number(row.rest_time);
  if (Number.isFinite(prescribed) && prescribed > 0) return prescribed;
  return null;
}
