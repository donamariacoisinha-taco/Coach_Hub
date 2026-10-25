import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkoutExercise } from '../../types';

const stableJson = (value: unknown): string => JSON.stringify(value, (_, item) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);

/** Save against live rows, not the possibly stale snapshot loaded by the player. */
export async function saveSessionTemplate(client: SupabaseClient, options: {
  workoutId: string;
  userId: string;
  historyId: string;
  exercises: WorkoutExercise[];
  removedIds: string[];
}) {
  const { workoutId, userId, historyId, exercises, removedIds } = options;
  if (!exercises.length) throw new Error('A ficha precisa de pelo menos um exercício.');
  if (exercises.some(ex => ex.category_id && ex.category_id !== workoutId)) {
    throw new Error('Os exercícios pertencem a outra ficha. Suas alterações foram preservadas; salve como nova ficha.');
  }
  const category = await client.from('workout_categories').select('id')
    .eq('id', workoutId).eq('user_id', userId).single();
  if (category.error) throw category.error;
  const history = await client.from('workout_history').select('category_id')
    .eq('id', historyId).eq('user_id', userId).single();
  if (history.error) throw history.error;
  if (history.data.category_id !== workoutId) {
    throw new Error('A sessão está vinculada a outra ficha. Suas alterações foram preservadas; salve como nova ficha.');
  }
  const current = await client.from('workout_exercises').select('id, exercise_id')
    .eq('category_id', workoutId);
  if (current.error) throw current.error;
  const live = current.data || [];
  const used = new Set<string>();
  const referencedIds = new Set(exercises.map(ex => ex.id));
  const removed = new Set(removedIds);
  const rows = exercises.map((ex, index) => {
    let match = live.find(row => row.id === ex.id && !used.has(row.id));
    const isNew = !ex.id || ex.id.startsWith('ex-live-');
    // The editor can replace row IDs. Reconcile unchanged exercises by their
    // library ID, but never guess which existing row a substitution replaces.
    if (!match) match = live.find(row => row.exercise_id === ex.exercise_id
      && !used.has(row.id) && !removed.has(row.id) && !referencedIds.has(row.id));
    if (!match && !isNew && live.length) {
      throw new Error('A ficha mudou desde o início do treino. Suas alterações foram preservadas; salve como nova ficha para não sobrescrever outra versão.');
    }
    const id = match?.id || crypto.randomUUID();
    used.add(id);
    const sets = ex.sets_json || [];
    return {
      id, category_id: workoutId, exercise_id: ex.exercise_id, sort_order: index,
      exercise_name_snapshot: ex.exercise_name || ex.exercise_name_snapshot || 'Exercício',
      sets: sets.length || ex.sets, reps: String(sets[0]?.reps ?? ex.reps ?? '10'),
      weight: Number(sets[0]?.weight ?? ex.weight ?? 0),
      rest_time: Number(sets[0]?.rest_time ?? ex.rest_time ?? 60),
      default_rpe: Number(sets[0]?.rpe ?? ex.default_rpe ?? 8), sets_json: sets,
      superset_id: ex.superset_id || null,
    };
  });
  const saved = await client.from('workout_exercises').upsert(rows, { onConflict: 'id' }).select('id');
  if (saved.error) throw saved.error;
  if (saved.data?.length !== rows.length || rows.some(row => !saved.data.some(item => item.id === row.id))) {
    throw new Error('O banco não confirmou todos os exercícios. Suas alterações foram preservadas.');
  }
  const toRemove = live.filter(row => removed.has(row.id) && !used.has(row.id)).map(row => row.id);
  if (toRemove.length) {
    const deleted = await client.from('workout_exercises').delete()
      .eq('category_id', workoutId).in('id', toRemove);
    if (deleted.error) throw deleted.error;
  }
  const verified = await client.from('workout_exercises').select('*').eq('category_id', workoutId);
  if (verified.error) throw verified.error;
  const persisted = verified.data || [];
  if (rows.some(expected => {
    const actual = persisted.find(row => row.id === expected.id);
    return !actual || Object.entries(expected).some(([key, value]) => stableJson(actual[key]) !== stableJson(value));
  }) || toRemove.some(id => persisted.some(row => row.id === id))) {
    throw new Error('A leitura da ficha não confirmou as alterações. Suas alterações locais foram preservadas.');
  }
  return exercises.map((ex, index) => ({ ...ex, id: rows[index].id }));
}
