
import { supabase } from './supabase';
import { Exercise, MuscleGroup } from '../../types';

export const exerciseApi = {
  async getExercises() {
    const { data, error } = await supabase.from('exercises').select('*').order('name');
    if (error) throw error;
    return (data || []) as Exercise[];
  },

  async getMuscleGroups() {
    const { data, error } = await supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as MuscleGroup[];
  },

  async getFavorites(userId: string) {
    const { data, error } = await supabase.from('user_favorite_exercises').select('exercise_id').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(f => f.exercise_id);
  },

  async toggleFavorite(userId: string, exerciseId: string, isFavorite: boolean) {
    if (isFavorite) {
      const { error } = await supabase.from('user_favorite_exercises').delete().eq('user_id', userId).eq('exercise_id', exerciseId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('user_favorite_exercises').insert([{ user_id: userId, exercise_id: exerciseId }]);
      if (error) throw error;
    }
  },

  async isAdmin(userId: string) {
    const { data, error } = await supabase.from('profiles').select('role, is_admin').eq('id', userId).maybeSingle();
    if (error) return false;
    return data?.role === 'admin' || data?.is_admin === true;
  },

  async getExerciseProgress(exerciseId: string) {
    const { data, error } = await supabase
      .from("exercise_progress")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar progresso do exercício:", error);
      return [];
    }

    return data || [];
  }
};
