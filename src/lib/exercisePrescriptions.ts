import { supabase } from './api/supabase';
import { SetType } from '../types';
export function applyPrescription<T extends Record<string, any>>(exercise: T, sets: any[]): T & { sets_json?: any[] } {
  if (!sets.length) return exercise;
  const first = sets[0];
  return { ...exercise, sets: sets.length, sets_json: sets.map(s => ({ ...s })), weight: Number(first.weight), reps: String(first.reps), default_rpe: Number(first.rpe), rest_time: Number(first.rest_time) };
}
export async function loadPrescriptions(guest: boolean): Promise<Record<string, any[]>> {
  if (guest) return JSON.parse(localStorage.getItem('kyron_guest_exercise_prescriptions') || '{}');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Usuário não autenticado');
  const { data, error } = await supabase.from('exercise_prescriptions').select('exercise_id,sets_json').eq('user_id', user.id);
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.exercise_id, row.sets_json]));
}
export async function savePrescriptions(guest: boolean, rows: { exercise_id: string; sets_json: any[] }[]) {
  if (guest) {
    const previous = await loadPrescriptions(true);
    localStorage.setItem('kyron_guest_exercise_prescriptions', JSON.stringify({ ...previous, ...Object.fromEntries(rows.map(row => [row.exercise_id, row.sets_json])) }));
    return;
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Usuário não autenticado');
  if (!rows.length) return;
  const unique = Object.values(Object.fromEntries(rows.map(row => [row.exercise_id, row])));
  const { error } = await supabase.from('exercise_prescriptions').upsert(unique.map(row => ({ ...row, user_id: user.id, updated_at: new Date().toISOString() })), { onConflict: 'user_id,exercise_id' });
  if (error) throw error;
}
export function editAndReplicate(sets: any[], index: number, field: string, value: any, manual: Set<string>, completed: Set<number>) {
  const next = sets.map(s => ({ ...s }));
  if (!next[index]) return next;
  manual.add(`${index}:${field}`);
  next[index][field] = value;
  if (field !== 'type' && next[index + 1] && !completed.has(index + 1) && !manual.has(`${index + 1}:${field}`)) next[index + 1][field] = value;
  return next;
}
