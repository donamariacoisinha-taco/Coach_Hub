import { describe, expect, it } from 'vitest';
import {
  canWritePartialSession,
  createSetIdentityStore,
  finishReplacesLogs,
  prefillSetsFromLast,
  restSecondsFromLog,
} from './setPersistence';

describe('set persistence', () => {
  it('prefills every set from the last performance, including rest', () => {
    const sets = [
      { weight: 25, reps: 6, rpe: 8, rest_time: 90 },
      { weight: 25, reps: 6, rpe: 8, rest_time: 90 },
      { weight: 25, reps: 5, rpe: 8, rest_time: 90 },
    ];
    expect(prefillSetsFromLast(sets, { weight: 22.5, reps: 9, rpe: 8, rest_time: 75 })).toEqual([
      { weight: 22.5, reps: 9, rpe: 8, rest_time: 75 },
      { weight: 22.5, reps: 9, rpe: 8, rest_time: 75 },
      { weight: 22.5, reps: 9, rpe: 8, rest_time: 75 },
    ]);
  });

  it('keeps the plan values when there is no previous log', () => {
    const sets = [{ weight: 10, reps: 12, rpe: 7, rest_time: 60 }];
    expect(prefillSetsFromLast(sets, null)).toEqual(sets);
  });

  it('reuses one client id for the same set and does not replace logs on finish', () => {
    const ids = createSetIdentityStore(() => 'id-1');
    expect(ids.clientId('hist', 'ex', 1)).toBe('id-1');
    expect(ids.clientId('hist', 'ex', 1)).toBe('id-1');
    expect(finishReplacesLogs()).toBe(false);
  });

  it('stops partial-session writes after the workout is closed', () => {
    expect(canWritePartialSession(false)).toBe(true);
    expect(canWritePartialSession(true)).toBe(false);
  });

  it('prefers the rest that was actually taken', () => {
    expect(restSecondsFromLog({ rest_time_actual: 75, rest_time: 90 })).toBe(75);
    expect(restSecondsFromLog({ rest_time_actual: null, rest_time: 90 })).toBe(90);
    expect(restSecondsFromLog(null)).toBeNull();
  });
});
