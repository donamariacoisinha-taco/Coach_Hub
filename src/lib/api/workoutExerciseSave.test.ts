import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  missingInsertColumn,
  omitUnavailableOptionalFlag,
  planInsertRetry,
  planKeptIds,
  quoteExerciseIds,
  readCapability,
  rememberCapability,
  resetCapabilitiesForTests,
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

  it('não monta filtro de delete com lista vazia ou id que não é uuid', () => {
    expect(() => quoteExerciseIds([])).toThrow('lista nova completa');
    expect(() => quoteExerciseIds(['não-é-uuid'])).toThrow('ficha anterior foi mantida');
    expect(quoteExerciseIds(['11111111-1111-4111-8111-111111111111'])).toBe('("11111111-1111-4111-8111-111111111111")');
  });
});

describe('capacidade gravada da ficha', () => {
  beforeEach(() => {
    resetCapabilitiesForTests();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    });
  });

  it('lembra que a função e a coluna is_optional não existem, inclusive depois de reabrir a memória', () => {
    rememberCapability('replaceRpc', false);
    rememberCapability('isOptional', false);
    resetCapabilitiesForTests();
    expect(readCapability('replaceRpc')).toBe(false);
    expect(readCapability('isOptional')).toBe(false);
    expect(omitUnavailableOptionalFlag([{ category_id: 'c', is_optional: false }])).toEqual([{ category_id: 'c' }]);
  });
});
