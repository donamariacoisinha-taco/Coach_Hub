import { describe, it, expect } from 'vitest';
import { canReplaceBeforeFirstSet, resolveSavedSets } from './workoutSaveChoices';

describe('workout save choices', () => {
  it('allows an active exercise before completion and blocks after its first completed set', () => {
    expect(canReplaceBeforeFirstSet(0, 0, {}, new Set())).toBe(true);
    expect(canReplaceBeforeFirstSet(0, 0, {}, new Set([0]))).toBe(false);
    expect(canReplaceBeforeFirstSet(1, 0, { 1: new Set([0]) }, new Set())).toBe(false);
    expect(canReplaceBeforeFirstSet(1, 0, {}, new Set([0]))).toBe(true);
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
