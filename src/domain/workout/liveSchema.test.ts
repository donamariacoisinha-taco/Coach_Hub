import { describe, expect, it } from 'vitest';
import { lastSetColumns, rowForTable, selectExisting } from './liveSchema';

describe('contrato do schema real', () => {
  it('o último log não pede rest_time, que não existe em workout_sets_log', () => {
    expect(lastSetColumns()).toEqual(['weight_achieved', 'reps_achieved', 'rpe', 'rest_time_actual']);
    expect(lastSetColumns()).not.toContain('rest_time');
  });

  it('a série gravada fica só com colunas que existem', () => {
    expect(rowForTable('workout_sets_log', {
      history_id: 'h',
      exercise_id: 'e',
      set_number: 1,
      weight_achieved: 45,
      reps_achieved: 7,
      rpe: 10,
      rest_time: 90,
      rest_time_actual: 80,
      client_id: '11111111-1111-4111-8111-111111111111',
      user_id: 'u',
      set_type: 'Trabalho',
    })).toEqual({
      history_id: 'h',
      exercise_id: 'e',
      set_number: 1,
      weight_achieved: 45,
      reps_achieved: 7,
      rpe: 10,
      rest_time_actual: 80,
      client_id: '11111111-1111-4111-8111-111111111111',
      user_id: 'u',
      set_type: 'Trabalho',
    });
  });

  it('encerrar o treino não envia partial, e a ficha não envia is_optional', () => {
    expect(rowForTable('workout_history', {
      duration_minutes: 20,
      completed_at: '2026-11-15T14:00:00.000Z',
      exercises_count: 4,
      partial: true,
    })).toEqual({
      duration_minutes: 20,
      completed_at: '2026-11-15T14:00:00.000Z',
      exercises_count: 4,
    });
    expect('is_optional' in rowForTable('workout_exercises', {
      category_id: 'c',
      exercise_id: 'e',
      reps: '8',
      rest_time: 90,
      sets_json: [],
      is_optional: false,
    })).toBe(false);
    expect(selectExisting('workout_exercises', ['reps', 'rest_time', 'is_optional'])).toEqual(['reps', 'rest_time']);
  });
});
