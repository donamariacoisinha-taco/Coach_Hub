const DAY_MS = 86_400_000;

/** A stale partial session is announced. It never takes over the route. */
export function shouldRedirectToPartialSession(): boolean {
  return false;
}

export function partialSessionAgeDays(startIso: string | null | undefined, now = Date.now()): number {
  const start = Date.parse(startIso || '');
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / DAY_MS));
}

export function partialSessionBanner(startIso: string | null | undefined, now = Date.now()): string {
  const days = partialSessionAgeDays(startIso, now);
  if (days <= 0) return 'Treino em andamento hoje';
  if (days === 1) return 'Treino em andamento há 1 dia';
  return `Treino em andamento há ${days} dias`;
}
