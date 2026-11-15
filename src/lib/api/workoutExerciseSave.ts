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

const CAPABILITY_KEYS = {
  replaceRpc: 'kyron_cap_replace_workout_exercises',
  isOptional: 'kyron_cap_workout_exercises_is_optional',
} as const;

type CapabilityName = keyof typeof CAPABILITY_KEYS;

const capabilityMemory: Record<CapabilityName, boolean | null> = {
  replaceRpc: null,
  isOptional: null,
};

function capabilityStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** null = ainda não sabemos. false = a primeira tentativa já falhou. */
export function readCapability(name: CapabilityName): boolean | null {
  if (capabilityMemory[name] !== null) return capabilityMemory[name];
  const stored = capabilityStorage()?.getItem(CAPABILITY_KEYS[name]);
  if (stored === '0' || stored === '1') {
    capabilityMemory[name] = stored === '1';
    return capabilityMemory[name];
  }
  return null;
}

export function rememberCapability(name: CapabilityName, available: boolean): void {
  capabilityMemory[name] = available;
  try {
    capabilityStorage()?.setItem(CAPABILITY_KEYS[name], available ? '1' : '0');
  } catch {
    // A memória da sessão já evita a próxima tentativa nesta aba.
  }
}

export function resetCapabilitiesForTests(): void {
  capabilityMemory.replaceRpc = null;
  capabilityMemory.isOptional = null;
}

export function isReplaceRpcMissing(): boolean {
  return readCapability('replaceRpc') === false;
}

export function omitUnavailableOptionalFlag<T extends Record<string, unknown>>(rows: T[]): T[] {
  if (readCapability('isOptional') !== false) return rows;
  return withoutColumn(rows, 'is_optional');
}

const EXERCISE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lista vazia ou id estranho não pode virar filtro que apaga a ficha inteira. */
export function quoteExerciseIds(ids: string[]): string {
  if (ids.length === 0) {
    throw new Error('Não vou apagar a ficha sem a lista nova completa.');
  }
  const quoted = ids.map((id) => {
    if (!EXERCISE_ID.test(id)) {
      throw new Error('Identificador de exercício inválido. A ficha anterior foi mantida.');
    }
    return `"${id}"`;
  });
  return `(${quoted.join(',')})`;
}
