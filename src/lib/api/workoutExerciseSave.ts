export function missingInsertColumn(message: string): string | null {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /Could not find the "([^"]+)" column/i,
    /column ["']([A-Za-z_][A-Za-z0-9_]*)["'] (?:of relation|does not exist)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    const name = match?.[1];
    if (name && name !== 'of') return name;
  }
  return null;
}

export function withoutColumn<T extends Record<string, unknown>>(rows: T[], column: string): T[] {
  return rows.map((row) => {
    if (!(column in row)) return row;
    const next = { ...row };
    delete next[column];
    return next;
  });
}

export type InsertFailurePlan =
  | { action: 'retry'; column: string }
  | { action: 'fail' };

/** One unknown column is removed once. A repeat, or a message we cannot read, stops the loop. */
export function planInsertRetry(
  message: string,
  sample: Record<string, unknown> | undefined,
  alreadyStripped: ReadonlySet<string>,
): InsertFailurePlan {
  const column = missingInsertColumn(message);
  if (!column || alreadyStripped.has(column) || !sample || !(column in sample)) {
    return { action: 'fail' };
  }
  return { action: 'retry', column };
}

export type KeptIdPlan =
  | { ok: true; keepIds: string[] }
  | { ok: false; rollbackIds: string[]; reason: string };

/**
 * Old rows may be deleted only when every inserted row came back with an id.
 * Anything less keeps the previous list and drops only the rows we can name.
 */
export function isIncompleteSave(plan: KeptIdPlan): plan is Extract<KeptIdPlan, { ok: false }> {
  return plan.ok === false;
}

export function planKeptIds(expectedCount: number, returnedIds: Array<string | null | undefined>): KeptIdPlan {
  const ids = returnedIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (expectedCount > 0 && ids.length === expectedCount) {
    return { ok: true, keepIds: ids };
  }
  return {
    ok: false,
    rollbackIds: ids,
    reason: 'A gravação não confirmou todos os exercícios. A ficha anterior foi mantida.',
  };
}
