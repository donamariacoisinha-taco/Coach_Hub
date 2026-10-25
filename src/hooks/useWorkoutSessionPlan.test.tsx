// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useWorkoutSessionPlan } from './useWorkoutSessionPlan';
import type { WorkoutExercise } from '../types';
import { saveGuestPlan, getGuestWorkout, readGuestWorkoutTemp } from '../lib/guest/guestPersistence';

const initial = [{ id: 'row', exercise_id: 'original', category_id: 'plan',
  sets: 2, weight: 20, reps: '10', rest_time: 60 }] as WorkoutExercise[];
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('preparation session staging under deferred React updates', () => {
  it('composes rapid replacement and edits, and persists the actual list exactly once per edit', () => {
    const { result } = renderHook(() => useWorkoutSessionPlan('plan', false), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });
    act(() => result.current.setExercises(initial));
    act(() => {
      result.current.stageExercises(previous => previous.map(ex => ({ ...ex, exercise_id: 'replacement' })));
      result.current.stageExercises(previous => previous.map(ex => ({ ...ex, weight: 42, reps: '8', default_rpe: 7, rest_time: 120 })));
    });
    const recovered = JSON.parse(localStorage.getItem('workout_session_temp_plan')!);
    expect(recovered).toEqual(result.current.exercises);
    expect(recovered[0]).toMatchObject({ exercise_id: 'replacement', weight: 42, reps: '8', default_rpe: 7, rest_time: 120 });
    expect(initial[0].exercise_id).toBe('original');
  });
  it('stages removal of every exercise without deleting the saved guest ficha', () => {
    const plan = saveGuestPlan({ workouts: [{ name: 'Teste', exercises: initial }] }, {});
    const id = plan.workouts[0].id;
    const original = getGuestWorkout(id).exercises;
    const { result } = renderHook(() => useWorkoutSessionPlan(id, true));
    act(() => result.current.setExercises(original));
    act(() => result.current.stageExercises(() => []));
    expect(readGuestWorkoutTemp(id)).toEqual([]);
    expect(getGuestWorkout(id).exercises).toEqual(original);
  });
});
