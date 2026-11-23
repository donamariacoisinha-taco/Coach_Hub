import { describe, expect, it } from 'vitest';
import { adjustRestSeconds, countdownAfterAdjust, remainingRestSeconds } from './restClock';

describe('relógio de descanso', () => {
  it('em 0:00, +10s passa a contar de 0:10 até 0:00', () => {
    const samples = countdownAfterAdjust(
      0,
      10,
      1_000,
      [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
    );
    expect(samples).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  });

  it('−10s não desce de zero e +10s soma em cima do que ainda resta', () => {
    expect(adjustRestSeconds(0, -10)).toBe(0);
    expect(adjustRestSeconds(4, 10)).toBe(14);
    expect(remainingRestSeconds(5_000, 3_400)).toBe(2);
    expect(remainingRestSeconds(null, 3_400)).toBe(0);
  });
});