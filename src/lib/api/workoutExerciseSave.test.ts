import { describe, expect, it } from 'vitest';
import {
  missingInsertColumn,
  planInsertRetry,
  planKeptIds,
  withoutColumn,
} from './workoutExerciseSave';

const postgrest = "Could not find the 'is_optional' column of 'workout_exercises' in the schema cache";

describe('workout exercise save', () => {
  it('reads the missing column from the PostgREST schema-cache error', () => {
    expect(missingInsertColumn(postgrest)).toBe('is_optional');
    expect(missingInsertColumn('column "is_optional" of relation "workout_exercises" does not exist')).toBe('is_optional');
  });

  it('does not treat the word "of" as a column name', () => {
    expect(missingInsertColumn(postgrest)).not.toBe('of');
    expect(planInsertRetry(postgrest, { category_id: 'c', is_optional: false }, new Set())).toEqual({
      action: 'retry',
      column: 'is_optional',
    });
  });

  it('retries a missing column only once', () => {
    const sample = { category_id: 'c', is_optional: false };
    const stripped = new Set(['is_optional']);
    expect(planInsertRetry(postgrest, sample, stripped)).toEqual({ action: 'fail' });
    expect(withoutColumn([sample], 'is_optional')).toEqual([{ category_id: 'c' }]);
  });

  it('refuses to delete the previous list when the insert did not return every id', () => {
    expect(planKeptIds(2, [])).toEqual({
      ok: false,
      rollbackIds: [],
      reason: 'A gravação não confirmou todos os exercícios. A ficha anterior foi mantida.',
    });
    expect(planKeptIds(2, ['new-1'])).toMatchObject({ ok: false, rollbackIds: ['new-1'] });
    expect(planKeptIds(2, ['new-1', 'new-2'])).toEqual({ ok: true, keepIds: ['new-1', 'new-2'] });
  });
});
