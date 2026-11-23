/** Seconds shown after −10s / +10s. Never goes below zero. */
export function adjustRestSeconds(visibleSeconds: number, delta: number): number {
  return Math.max(0, Math.max(0, visibleSeconds) + delta);
}

/** Absolute end used by the ticking clock. Zero has no end. */
export function restEndAt(nowMs: number, seconds: number): number | null {
  if (seconds <= 0) return null;
  return nowMs + seconds * 1000;
}

/** Whole seconds left until endAt. A missing end reads as 0:00. */
export function remainingRestSeconds(endAtMs: number | null, nowMs: number): number {
  if (endAtMs == null) return 0;
  return Math.max(0, Math.round((endAtMs - nowMs) / 1000));
}

/**
 * From the clock on screen, apply +10/−10 and then sample the countdown.
 * elapsedMs are offsets from nowMs. The first value is the second shown
 * immediately after the button.
 */
export function countdownAfterAdjust(
  visibleSeconds: number,
  delta: number,
  nowMs: number,
  elapsedMs: number[],
): number[] {
  const seconds = adjustRestSeconds(visibleSeconds, delta);
  const end = restEndAt(nowMs, seconds);
  return [seconds, ...elapsedMs.map((elapsed) => remainingRestSeconds(end, nowMs + elapsed))];
}
