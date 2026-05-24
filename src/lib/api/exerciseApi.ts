
import { supabase } from './supabase';
import { Exercise, MuscleGroup, normalizeMuscleGroup, getVirtualAnatomicalCut } from '../../types';
import { fetchWithRetry } from '../utils';
import { fallbackExercises } from './fallbackExercises';

const CACHE_KEY = 'rubi_exercises_offline_cache';

function getLocalCache(): Exercise[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (import.meta.env.DEV) {
          console.log(`[ExerciseApi] Recuperado cache persistente com ${parsed.length} exercícios.`);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ExerciseApi] Erro ao ler cache persistente do localStorage:', err);
  }
  return [];
}

function setLocalCache(exercises: Exercise[]): void {
  try {
    if (Array.isArray(exercises) && exercises.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
      if (import.meta.env.DEV) {
        console.log(`[ExerciseApi] Salvo cache com de ${exercises.length} exercícios.`);
      }
    }
  } catch (err) {
    console.error('[ExerciseApi] Falha ao escrever cache no localStorage:', err);
  }
}

export const exerciseApi = {
  async getExercises() {
    return fetchWithRetry(async () => {
      let data: any[] | null = null;
      let error: any = null;

      try {
        const response = await supabase.from('exercises').select('*').order('name');
        data = response.data;
        error = response.error;
        if (error) throw error;
      } catch (err: any) {
        console.error('[ExerciseApi] Erro principal ao carregar exercícios:', err?.message || err);
        const isSchemaError = err.message?.includes('column') && err.message?.includes('schema cache');
        if (isSchemaError) {
          console.warn('[DB] Fallback ativado devido a erro de schema cache:', err.message);
          const response = await supabase.from('exercises')
            .select('id, name, muscle_group, image_url, is_active, description, instructions, equipment, performance_score, quality_status')
            .order('name');
          data = response.data;
          error = response.error;
          if (error) throw error;
        } else {
          // If a general network/auth error happens, load from local cache or static backup
          const cached = getLocalCache();
          if (cached.length > 0) {
            return cached;
          }
          console.warn('[ExerciseApi] Sem cache local, retornando banco estático de backup devido a falha.');
          return fallbackExercises;
        }
      }

      // If data is empty (P0 newly created user issue / empty library), load cache/static backup
      if (!data || data.length === 0) {
        console.warn('[ExerciseApi] Consulta ao Supabase retornou vazia. Ativando recuperação.');
        const cached = getLocalCache();
        if (cached.length > 0) {
          return cached;
        }
        console.warn('[ExerciseApi] Usando biblioteca estática de fábrica.');
        return fallbackExercises;
      }

      // Normalize muscle groups on the fly to avoid taxonomy bugs
      const normalizedExercises = data.map((ex) => ({
        ...ex,
        muscle_group: normalizeMuscleGroup(ex.muscle_group || 'Outros'),
        anatomical_cut: ex.anatomical_cut || getVirtualAnatomicalCut(ex.muscle_group || '', ex.name)
      })) as Exercise[];

      // Populate local cache for offline/fresh users
      setLocalCache(normalizedExercises);

      if (import.meta.env.DEV) {
        console.log(`[ExerciseApi] exercises carregados com sucesso: ${normalizedExercises.length} registros.`);
      }

      return normalizedExercises;
    });
  },

  async getPublicExercises() {
    return fetchWithRetry(async () => {
      let data: any[] | null = null;
      let error: any = null;

      try {
        const response = await supabase.from('exercises')
          .select('*')
          .eq('is_active', true)
          .order('name');
        data = response.data;
        error = response.error;
        if (error) throw error;
      } catch (err: any) {
        console.error('[ExerciseApi] Erro principal ao carregar exercícios públicos:', err?.message || err);
        const isSchemaError = err.message?.includes('column') && err.message?.includes('schema cache');
        if (isSchemaError) {
          const response = await supabase.from('exercises')
            .select('id, name, muscle_group, image_url, is_active, description, instructions, equipment, performance_score, quality_status')
            .eq('is_active', true)
            .order('name');
          data = response.data;
          error = response.error;
          if (error) throw error;
        } else {
          const cached = getLocalCache().filter(e => e.is_active);
          if (cached.length > 0) {
            return cached;
          }
          return fallbackExercises.filter(e => e.is_active);
        }
      }

      if (!data || data.length === 0) {
        const cached = getLocalCache().filter(e => e.is_active);
        if (cached.length > 0) {
          return cached;
        }
        return fallbackExercises.filter(e => e.is_active);
      }

      const normalizedExercises = data.map((ex) => ({
        ...ex,
        muscle_group: normalizeMuscleGroup(ex.muscle_group || 'Outros'),
        anatomical_cut: ex.anatomical_cut || getVirtualAnatomicalCut(ex.muscle_group || '', ex.name)
      })) as Exercise[];

      return normalizedExercises;
    });
  },

  async getMuscleGroups() {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as MuscleGroup[];
    });
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
