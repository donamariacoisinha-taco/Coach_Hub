import { describe, it, expect } from 'vitest';
import { canReplaceBeforeFirstSet, resolveSavedSets, completedSetsForSave } from './workoutSaveChoices';

describe('workout save choices', () => {
  it('includes a series already executed while its rest timer is still running', () => {
    const completed = completedSetsForSave(0, 0, {}, new Set(), 0);
    const saved = resolveSavedSets({ sets_json: [{ weight: 10, reps: '10' }, { weight: 10, reps: '10' }] },
      [{ weight: 42, reps: 8, rpe: 7, rest_time: 120 }, { weight: 99, reps: 99 }], completed);
    expect([...completed]).toEqual([0]);
    expect(saved[0]).toMatchObject({ weight: 42, reps: '8', rpe: 7, rest_time: 120 });
    expect(saved[1]).toMatchObject({ weight: 10, reps: '10' });
  });
  it('does not mark an unexecuted exercise as complete just because it is displayed', () => {
    expect(completedSetsForSave(1, 1, { 0: new Set([0]) }, new Set(), null).size).toBe(0);
    expect([...completedSetsForSave(0, 1, { 0: new Set([0]) }, new Set(), 1)]).toEqual([0]);
  });
  it('allows an active exercise before completion and blocks after its first completed set', () => {
    expect(canReplaceBeforeFirstSet(0, 0, {}, new Set())).toBe(true);
    expect(canReplaceBeforeFirstSet(0, 0, {}, new Set([0]))).toBe(false);
    expect(canReplaceBeforeFirstSet(1, 0, { 1: new Set([0]) }, new Set())).toBe(false);
    expect(canReplaceBeforeFirstSet(1, 0, {}, new Set([0]))).toBe(true);
    expect(canReplaceBeforeFirstSet(0, 0, {}, new Set(), 0)).toBe(false);
    expect(canReplaceBeforeFirstSet(1, 0, {}, new Set(), 0)).toBe(true);
  });
  it('saves performed values only for completed sets, preserving separate targets and zero effort', () => {
    const exercise = { sets_json: [
      { weight: 30, reps: '10', rpe: 8, rest_time: 60 },
      { weight: 40, reps: '8', rpe: 9, rest_time: 120 },
    ] };
    const saved = resolveSavedSets(exercise, [
      { weight: 35, reps: 9, rpe: 0, rest_time: 90 },
      { weight: 99, reps: 99 },
    ], new Set([0]));
    expect(saved[0]).toMatchObject({ weight: 35, reps: '9', rpe: 0, rest_time: 90 });
    expect(saved[1]).toMatchObject(exercise.sets_json[1]);
    expect(exercise.sets_json[0].weight).toBe(30);
  });
});
