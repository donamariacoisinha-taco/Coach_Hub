
import { supabase } from './supabase';
import { Exercise, MuscleGroup } from '../../types';

export const adminApi = {
  async updateExercise(id: string, payload: Partial<Exercise>) {
    const { error } = await supabase.from('exercises').update(payload).eq('id', id);
    if (error) throw error;
  },

  async createExercise(payload: Partial<Exercise>) {
    const { error } = await supabase.from('exercises').insert([payload]);
    if (error) throw error;
  },

  async uploadExerciseImage(file: File, exerciseId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${exerciseId}-${Math.random()}.${fileExt}`;
    const filePath = `exercises/${fileName}`;
    
    const { error: uploadError } = await supabase.storage.from('exercise-images').upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('exercise-images').getPublicUrl(filePath);
    return publicUrl;
  },

  async updateMuscleGroup(id: string, payload: Partial<MuscleGroup>) {
    const { error } = await supabase.from('muscle_groups').update(payload).eq('id', id);
    if (error) throw error;
  },

  async createMuscleGroup(payload: any) {
    const { error } = await supabase.from('muscle_groups').insert([payload]);
    if (error) throw error;
  },

  async deleteMuscleGroup(id: string) {
    const { error } = await supabase.from('muscle_groups').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteExercise(id: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) throw error;
  },

  async getAdminData() {
    const [exRes, mgRes] = await Promise.all([
      supabase.from('exercises').select('*').order('name'),
      supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true })
    ]);
    
    if (exRes.error) throw exRes.error;
    if (mgRes.error) throw mgRes.error;
    
    return {
      exercises: (exRes.data || []) as Exercise[],
      muscleGroups: (mgRes.data || []) as MuscleGroup[]
    };
  },

  async reorderMuscleGroups(items: { id: string, sort_order: number }[]) {
    // Supabase doesn't support bulk update with different values easily in a single call without RPC
    // For simplicity in this audit, we'll do them sequentially or assume an RPC exists.
    // Since I can't create RPCs, I'll do Promise.all
    const updates = items.map(item => 
      supabase.from('muscle_groups').update({ sort_order: item.sort_order }).eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;
  }
};
