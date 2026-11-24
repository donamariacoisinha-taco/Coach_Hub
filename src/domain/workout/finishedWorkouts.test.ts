import { describe, expect, it } from 'vitest';
import { countFinishedWorkouts, isFinishedWorkout } from './finishedWorkouts';

describe('contagem de treinos encerrados', () => {
  it('conta sessão concluída e parcial, e ignora a sessão ainda aberta', () => {
    const rows = [
      { completed_at: '2026-11-01T10:00:00Z' },
      { completed_at: '2026-11-02T10:00:00Z', partial: true },
      { completed_at: null },
      { completed_at: '' },
      {},
    ];
    expect(rows.map((row) => isFinishedWorkout(row))).toEqual([true, true, false, false, false]);
    expect(countFinishedWorkouts(rows)).toBe(2);
  });
});
