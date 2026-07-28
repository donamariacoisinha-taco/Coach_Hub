
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

async function getTechnicalQualityMap(): Promise<Map<string, { score: number; status: string }>> {
  try {
    const { data, error } = await supabase
      .from('exercise_quality_assessments')
      .select('exercise_id,total_score,status');
    if (error) return new Map();
    return new Map(
      (data || []).map((row: any) => [
        row.exercise_id,
        { score: Number(row.total_score) || 0, status: String(row.status || '') },
      ]),
    );
  } catch {
    return new Map();
  }
}

function enrichAndRankExercises(data: any[], qualityMap: Map<string, { score: number; status: string }>): Exercise[] {
  const normalizedExercises = data.map((ex) => {
    const quality = qualityMap.get(ex.id);
    return {
      ...ex,
      muscle_group: normalizeMuscleGroup(ex.muscle_group || 'Outros'),
      anatomical_cut: ex.anatomical_cut || getVirtualAnatomicalCut(ex.muscle_group || '', ex.name),
      technical_quality_score: quality?.score,
      technical_quality_status: quality?.status,
    } as Exercise & { technical_quality_score?: number; technical_quality_status?: string };
  });

  if (qualityMap.size > 0) {
    normalizedExercises.sort((a: any, b: any) => {
      const scoreDifference = Number(b.technical_quality_score || 0) - Number(a.technical_quality_score || 0);
      if (scoreDifference !== 0) return scoreDifference;
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });
  }

  return normalizedExercises as Exercise[];
}

export const exerciseApi = {
  async getExercises() {
    try {
      return await fetchWithRetry(async () => {
        let response = await supabase.from('exercises').select('*').order('name');
        
        if (response.error) {
          const isSchemaError = response.error.message?.includes('column') && response.error.message?.includes('schema cache');
          if (isSchemaError) {
            console.warn('[DB] Fallback de cache do schema acionado no select principal:', response.error.message);
            response = await supabase.from('exercises')
              .select('id, name, muscle_group, image_url, is_active, description, instructions, equipment, performance_score, quality_status')
              .order('name');
          }
          if (response.error) throw response.error;
        }

        const data = response.data;
        if (!data || data.length === 0) {
          throw new Error('Consulta de exercicios vazia no banco');
        }

        const qualityMap = await getTechnicalQualityMap();
        const normalizedExercises = enrichAndRankExercises(data, qualityMap);

        setLocalCache(normalizedExercises);

        if (import.meta.env.DEV) {
          console.log(`[ExerciseApi] Exercícios carregados com sucesso online: ${normalizedExercises.length} registros.`);
        }

        return normalizedExercises;
      });
    } catch (err: any) {
      console.warn('[ExerciseApi] Erro ao carregar exercícios após retentativas. Usando caches e backups offline:', err?.message || err);
      const cached = getLocalCache();
      if (cached.length > 0) {
        if (import.meta.env.DEV) {
          console.log(`[ExerciseApi] Carregado cache persistente local de ${cached.length} exercícios.`);
        }
        return cached;
      }
      console.warn('[ExerciseApi] Sem cache local, retornando banco estático de backup devido a falha geral.');
      return fallbackExercises;
    }
  },

  async getPublicExercises() {
    try {
      return await fetchWithRetry(async () => {
        let response = await supabase.from('exercises')
          .select('*')
          .order('name');

        if (response.error) {
          const isSchemaError = response.error.message?.includes('column') && response.error.message?.includes('schema cache');
          if (isSchemaError) {
            console.warn('[DB] Fallback de cache do schema no select publico:', response.error.message);
            response = await supabase.from('exercises')
              .select('id, name, muscle_group, image_url, is_active, description, instructions, equipment, performance_score, quality_status')
              .order('name');
          }
          if (response.error) throw response.error;
        }

        const data = response.data || [];
        // Filter in JS to accept is_active = true or is_active = null/undefined (not false)
        const activeData = data.filter((ex: any) => ex.is_active !== false);

        if (activeData.length === 0) {
          throw new Error('Consulta de public_exercises vazia no banco');
        }

        const qualityMap = await getTechnicalQualityMap();
        return enrichAndRankExercises(activeData, qualityMap);
      });
    } catch (err: any) {
      console.warn('[ExerciseApi] Erro ao carregar exercícios públicos após retentativas. Usando caches offline:', err?.message || err);
      const cached = getLocalCache().filter(e => e.is_active !== false);
      if (cached.length > 0) {
        return cached;
      }
      return fallbackExercises.filter(e => e.is_active !== false);
    }
  },

  async getMuscleGroups() {
    try {
      return await fetchWithRetry(async () => {
        const { data, error } = await supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true });
        if (error) throw error;
        return (data || []) as MuscleGroup[];
      });
    } catch (err) {
      console.warn('[ExerciseApi] Erro ao buscar grupos musculares do Supabase, utilizando fallback estático local.', err);
      return [
        { id: 'peito', name: 'Peito', sort_order: 1 },
        { id: 'costas', name: 'Costas', sort_order: 2 },
        { id: 'pernas', name: 'Pernas', sort_order: 3 },
        { id: 'ombros', name: 'Ombros', sort_order: 4 },
        { id: 'braços', name: 'Bíceps/Tríceps', sort_order: 5 },
        { id: 'abdômen', name: 'Core', sort_order: 6 }
      ] as any[];
    }
  },

  async getFavorites(userId: string) {
    try {
      const { data, error } = await supabase.from('user_favorite_exercises').select('exercise_id').eq('user_id', userId);
      if (error) throw error;
      const favList = (data || []).map(f => f.exercise_id);
      localStorage.setItem(`rubi_favorites_cache_${userId}`, JSON.stringify(favList));
      return favList;
    } catch (err) {
      console.warn('[ExerciseApi] Failed to fetch favorites from Supabase, returning cache or empty list.', err);
      try {
        const cached = localStorage.getItem(`rubi_favorites_cache_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
      return [];
    }
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
