import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ rows: [] as any[], acknowledge: true }));
vi.mock('./api/supabase', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) },
  from: () => ({
    upsert: (rows: any[]) => {
      db.rows = rows;
      return { select: async () => ({ data: db.acknowledge ? rows : [], error: null }) };
    },
    select: () => ({ eq: async (_column: string, userId: string) => ({
      data: db.rows.filter(row => row.user_id === userId), error: null,
    }) }),
  }),
} }));
import { applyPrescription, loadPrescriptions, savePrescriptions } from './exercisePrescriptions';
import { completedSetsForSave, resolveSavedSets } from './workoutSaveChoices';

beforeEach(() => { db.rows = []; db.acknowledge = true; });
describe('authenticated save and reload of exercise values', () => {
  it.each([false, true])('reloads saved weight, reps, effort and rest after partial=%s', async partial => {
    const original = { exercise_id: 'replacement', sets_json: [
      { weight: 10, reps: '10', rpe: 8, rest_time: 60 },
      { weight: 20, reps: '10', rpe: 8, rest_time: 60 },
    ] };
    const performance = [{ weight: 42, reps: 8, rpe: 0, rest_time: 120 }, { weight: 45, reps: 6, rpe: 9, rest_time: 150 }];
    const completed = completedSetsForSave(0, 0, {}, new Set(partial ? [] : [0, 1]), partial ? 0 : null);
    const saved = resolveSavedSets(original, performance, completed);
    await savePrescriptions(false, [{ exercise_id: 'replacement', sets_json: saved }]);
    const loaded = await loadPrescriptions(false);
    const reopened = applyPrescription({ ...original, category_id: 'another-ficha' }, loaded.replacement);
    expect(reopened).toMatchObject({ weight: 42, reps: '8', default_rpe: 0, rest_time: 120 });
    expect(reopened.sets_json[1]).toMatchObject(partial ? original.sets_json[1] : { ...performance[1], reps: '6' });
  });
  it('rejects a write without confirmed rows', async () => {
    db.acknowledge = false;
    await expect(savePrescriptions(false, [{ exercise_id: 'replacement', sets_json: [{ weight: 42 }] }])).rejects.toThrow('não confirmou');
  });
});
