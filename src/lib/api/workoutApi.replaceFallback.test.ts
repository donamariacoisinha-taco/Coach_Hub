import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const inserts: Array<Record<string, unknown>[]> = [];
const categoryDeletes: string[] = [];
const rollbacks: string[][] = [];
let shortInsert = false;

function response(state: { kind: string; rows: Record<string, unknown>[] | null; filter: string | null; ids: string[] | null }) {
  if (state.kind === 'insert') {
    const rows = state.rows || [];
    inserts.push(rows);
    const hasOptional = rows.some((row) => 'is_optional' in row);
    if (hasOptional) {
      return { data: null, error: { code: 'PGRST204', message: "Could not find the 'is_optional' column of 'workout_exercises' in the schema cache" } };
    }
    const ids = rows.map((_, index) => `11111111-1111-4111-8111-11111111111${index}`);
    if (shortInsert) return { data: ids.slice(0, 1).map((id) => ({ id })), error: null };
    return { data: ids.map((id) => ({ id })), error: null };
  }
  if (state.kind === 'rollback') {
    rollbacks.push(state.ids || []);
    return { error: null };
  }
  categoryDeletes.push(state.filter || '');
  return { error: null };
}

function query() {
  const state = { kind: 'read', rows: null as Record<string, unknown>[] | null, filter: null as string | null, ids: null as string[] | null };
  const api = {
    insert(rows: Record<string, unknown>[]) { state.kind = 'insert'; state.rows = rows; return api; },
    select() { return api; },
    delete() { state.kind = 'delete'; return api; },
    eq() { return api; },
    not(_column: string, _op: string, filter: string) { state.filter = filter; return api; },
    in(_column: string, ids: string[]) { state.kind = 'rollback'; state.ids = ids; return api; },
    then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(response(state)).then(resolve, reject);
    },
  };
  return api;
}

vi.mock('./exerciseApi', () => ({ exerciseApi: { getExercises: vi.fn() } }));
vi.mock('./supabase', () => ({ supabase: { from: () => query(), rpc: (...args: unknown[]) => rpc(...args) } }));

import { workoutApi } from './workoutApi';
import { resetCapabilitiesForTests } from './workoutExerciseSave';

const rows = [
  { exercise_id: 'supino', exercise_name: 'Supino', reps: '12', rest_time: 60, sets_json: [{ reps: '8', weight: 20, rest_time: 90 }], is_optional: false },
  { exercise_id: 'extensora', exercise_name: 'Extensora', reps: '12', rest_time: 60, sets_json: [{ reps: '10', weight: 15, rest_time: 75 }], is_optional: true },
];

describe('troca da ficha sem a migration', () => {
  beforeEach(() => {
    shortInsert = false;
    inserts.length = 0;
    categoryDeletes.length = 0;
    rollbacks.length = 0;
    rpc.mockReset();
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', status: 404, message: 'Could not find the function public.replace_workout_exercises in the schema cache' } });
    resetCapabilitiesForTests();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
      clear: () => values.clear(),
    });
  });

  it('não envia is_optional, grava as colunas do sets_json e não repete a função ausente', async () => {
    await workoutApi.replaceWorkoutExercises('ficha-1', rows);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.[0]).not.toHaveProperty('is_optional');
    expect(inserts[0]?.[0]).toMatchObject({ reps: '8', rest_time: 90, weight: 20, sets: 1 });
    expect(inserts[0]?.[1]).toMatchObject({ reps: '10', rest_time: 75, weight: 15 });
    expect(categoryDeletes).toEqual(['("11111111-1111-4111-8111-111111111110","11111111-1111-4111-8111-111111111111")']);

    await workoutApi.replaceWorkoutExercises('ficha-1', rows);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(inserts).toHaveLength(2);
    expect(inserts.every((batch) => batch.every((row) => !('is_optional' in row)))).toBe(true);
  });

  it('insert incompleto não apaga a lista anterior', async () => {
    shortInsert = true;
    await expect(workoutApi.replaceWorkoutExercises('ficha-1', rows)).rejects.toThrow('ficha anterior foi mantida');
    expect(categoryDeletes).toHaveLength(0);
    expect(rollbacks).toEqual([['11111111-1111-4111-8111-111111111110']]);
  });
});
