const missing = new Set<string>();
const inflight = new Map<string, Promise<unknown>>();

function storageKey(name: string): string {
  return `kyron_missing_relation_${name}`;
}

export function isRelationMissing(name: string): boolean {
  if (missing.has(name)) return true;
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(storageKey(name)) === '1') {
      missing.add(name);
      return true;
    }
  } catch {
    // Sem armazenamento, a memória desta aba ainda vale.
  }
  return false;
}

export function markRelationMissing(name: string): void {
  missing.add(name);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey(name), '1');
  } catch {
    // A memória desta aba já impede a próxima chamada.
  }
}

export function isMissingRelationError(error: unknown): boolean {
  const value = error as { message?: string; code?: string; details?: string; status?: number };
  const message = `${value?.message || ''} ${value?.details || ''} ${value?.code || ''}`.toLowerCase();
  return value?.status === 404
    || value?.code === 'PGRST205'
    || value?.code === 'PGRST202'
    || value?.code === '42P01'
    || message.includes('does not exist')
    || message.includes('could not find the table')
    || message.includes('could not find the function')
    || (message.includes('schema cache') && message.includes('not found'));
}

export function resetMissingRelationsForTests(): void {
  missing.clear();
  inflight.clear();
}

/** Chamadas iguais e simultâneas compartilham uma ida à rede. */
export function shareInflight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const task = run().finally(() => {
    if (inflight.get(key) === task) inflight.delete(key);
  });
  inflight.set(key, task);
  return task;
}
