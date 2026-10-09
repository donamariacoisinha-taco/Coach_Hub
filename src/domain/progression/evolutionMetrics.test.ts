import { describe, expect, it } from 'vitest';
import { buildEvolution, evolutionChange, evolutionRecord, periodPoints } from './evolutionMetrics';
import type { WorkoutHistory } from '../../types';
const now = Date.parse('2026-10-09T15:00:00Z');
const session = (id: string, date: string, partial = false) => ({ id, completed_at: date, partial } as WorkoutHistory);
const log = (history_id: string, weight: unknown, reps: unknown, extra = {}) => ({ history_id, exercise_id: 'supino', weight_achieved: weight, reps_achieved: reps, ...extra });
describe('Evolution metrics', () => {
  it('does not relabel lifetime gains as gains in the last 30 days', () => {
    const result = buildEvolution([session('a', '2026-01-01'), session('b', '2026-02-01')], [log('a', 40, 10), log('b', 60, 10)])[0];
    expect(periodPoints(result, 30, now)).toEqual([]);
    expect(evolutionChange(periodPoints(result, 30, now), 'load')).toBeNull();
  });
  it('never invents repetitions and preserves bodyweight records', () => {
    const result = buildEvolution([session('a', '2026-10-01', true)], [log('a', 80, 0), log('a', 80, null), log('a', 0, 12)])[0].points[0];
    expect(result).toMatchObject({ load: null, reps: 12, volume: 0, sets: 1, partial: true });
  });
  it('separates tested load, estimated maximum, last performance and volume sum', () => {
    const points = buildEvolution([session('a', '2026-10-01'), session('b', '2026-10-02')], [log('a', 100, 1), log('b', 90, 10)])[0].points;
    expect(evolutionRecord(points, 'load')?.historyId).toBe('a');
    expect(evolutionRecord(points, 'estimatedMax')?.historyId).toBe('b');
    expect(evolutionChange(points, 'load')).toBe(-10);
    expect(points.at(-1)?.load).toBe(90);
    expect(points.reduce((sum, p) => sum + p.volume, 0)).toBe(1000);
  });
  it('ignores orphan sessions, duplicate IDs, invalid data, warmups and long-set estimates', () => {
    const points = buildEvolution([session('a', '2026-10-01')], [log('missing', 500, 1), log('a', 200, 1, { is_warmup: true }), log('a', 50, 20, { id: 'x' }), log('a', 50, 20, { id: 'x' }), log('a', -10, 2), log('a', 100, 'bad')])[0].points;
    expect(points[0]).toMatchObject({ volume: 1000, load: 50, estimatedMax: null });
  });
  it('uses session completion dates rather than log insertion dates', () => {
    const exercise = buildEvolution([session('a', '2026-05-01')], [log('a', 10, 2, { created_at: '2026-10-08' })])[0];
    expect(periodPoints(exercise, 30, now)).toEqual([]);
  });
});
