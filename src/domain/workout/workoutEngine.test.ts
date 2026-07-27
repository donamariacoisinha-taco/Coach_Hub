import { describe, expect, it, vi } from 'vitest';
import { workoutEngine } from './workoutEngine';

describe('workoutEngine.initializeSession', () => {
  it('resumes a valid partial session', () => {
    const result = workoutEngine.initializeSession({
      history_id: 'history-1',
      start_time: '2026-07-27T10:00:00.000Z',
      current_index: 2,
      current_set: 3,
    }, null);

    expect(result).toEqual({
      historyId: 'history-1',
      startTime: Date.parse('2026-07-27T10:00:00.000Z'),
      currentIndex: 2,
      currentSet: 3,
    });
  });

  it('normalizes invalid restored coordinates', () => {
    const result = workoutEngine.initializeSession({
      history_id: 'history-2',
      start_time: '2026-07-27T10:00:00.000Z',
      current_index: -9,
      current_set: 0,
    }, null);

    expect(result.currentIndex).toBe(0);
    expect(result.currentSet).toBe(1);
  });

  it('normalizes non-numeric restored coordinates', () => {
    const result = workoutEngine.initializeSession({
      history_id: 'history-3',
      current_index: 'invalid',
      current_set: Number.NaN,
    }, null);

    expect(result.currentIndex).toBe(0);
    expect(result.currentSet).toBe(1);
  });

  it('starts a new session from a valid history', () => {
    const result = workoutEngine.initializeSession(null, {
      id: 'history-new',
      created_at: '2026-07-27T11:00:00.000Z',
    } as any);

    expect(result).toEqual({
      historyId: 'history-new',
      startTime: Date.parse('2026-07-27T11:00:00.000Z'),
      currentIndex: 0,
      currentSet: 1,
    });
  });

  it('rejects a new history without an id', () => {
    expect(() => workoutEngine.initializeSession(null, { id: '' } as any))
      .toThrow('ID do Histórico Ausente');
  });

  it('rejects initialization without partial session or new history', () => {
    expect(() => workoutEngine.initializeSession(null, null))
      .toThrow('Histórico Ausente');
  });

  it('falls back to the current time for an invalid date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T12:00:00.000Z'));

    const result = workoutEngine.initializeSession({
      history_id: 'history-invalid-date',
      start_time: 'not-a-date',
    }, null);

    expect(result.startTime).toBe(Date.parse('2026-07-27T12:00:00.000Z'));
    vi.useRealTimers();
  });
});
