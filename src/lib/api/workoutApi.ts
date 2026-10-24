
import { supabase } from './supabase';
import { WorkoutCategory, WorkoutExercise, WorkoutFolder, WorkoutHistory, UserProfile, MuscleGroup, Exercise, SetConfig, normalizeMuscleGroup } from '../../types';
import { fetchWithRetry } from '../utils';
import { exerciseApi } from './exerciseApi';
import { getGuestDashboard, getGuestWorkout, deleteGuestWorkout, updateGuestSessionSet } from '../guest/guestPersistence';
import { authApi, GUEST_USER_ID } from './authApi';
import { invalidateWorkoutCache } from '../cache/workoutCache';
import { v5 as uuidv5 } from 'uuid';

export const workoutApi = {
  getGuestDashboardData() {
    return getGuestDashboard();
  },
  async getDashboardData(userId: string) {
    return fetchWithRetry(async () => {
      try {
        const [profileRes, foldersRes, workoutsRes, historyRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
          supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).gt('exercises_count', 0).order('completed_at', { ascending: false })
        ]);

        console.log(`[workoutApi] Fetched data for userId: ${userId}`);
        console.log(`[workoutApi] Workouts count: ${workoutsRes.data?.length}`);

        if (profileRes.error) throw profileRes.error;
        if (foldersRes.error) throw foldersRes.error;
        if (workoutsRes.error) throw workoutsRes.error;
        if (historyRes.error) throw historyRes.error;

        const workouts = (workoutsRes.data || []) as WorkoutCategory[];
        const workoutIds = workouts.map(w => w.id);

        let exercisesMap: Record<string, number> = {};
        if (workoutIds.length > 0) {
          const exercisesRes = await supabase
            .from('workout_exercises')
            .select('category_id')
            .in('category_id', workoutIds);
          
          if (!exercisesRes.error && exercisesRes.data) {
            exercisesRes.data.forEach((ex: any) => {
              exercisesMap[ex.category_id] = (exercisesMap[ex.category_id] || 0) + 1;
            });
          }
        }

        const enrichedWorkouts = workouts.map(w => ({
          ...w,
          exercises_count: exercisesMap[w.id] || 0
        }));

        const result = {
          profile: profileRes.data as UserProfile | null,
          folders: (foldersRes.data || []) as WorkoutFolder[],
          workouts: enrichedWorkouts,
          history: (historyRes.data || []) as WorkoutHistory[],
          stats: { sessions: historyRes.data?.length || 0 }
        };

        // Cache the successful result
        try { localStorage.setItem(`rubi_dashboard_cache_${userId}`, JSON.stringify(result)); }
        catch (error) { console.warn('[workoutApi] Dashboard cache unavailable', error); }
        return result;
      } catch (err: any) {
        console.warn("[workoutApi] Connection failed (Failed to fetch). Activating localStorage cache backup.", err);
        
        try {
          const cached = localStorage.getItem(`rubi_dashboard_cache_${userId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.profile?.id === userId && Array.isArray(parsed.workouts)
              && !parsed.workouts.some((workout: any) => /^classic-/.test(workout.id))) return parsed;
          }
        } catch (e) {
          console.error("Failed to parse cached dashboard data:", e);
        }

        throw err;
      }
    });
  },

  async deleteWorkout(id: string) {
    if (id.startsWith('guest-workout-')) {
      deleteGuestWorkout(id);
      return;
    }

    // We explicitly delete exercises first to avoid foreign key issues if cascade is not set
    await supabase.from('workout_exercises').delete().eq('category_id', id);
    const { error } = await supabase.from('workout_categories').delete().eq('id', id);
    if (error) throw error;

    // Synchronize localStorage backup cache immediately to prevent deleted workout from reappearing
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rubi_dashboard_cache_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached && cached.workouts) {
              cached.workouts = cached.workouts.filter((w: any) => w.id !== id);
              localStorage.setItem(key, JSON.stringify(cached));
            }
          }
        }
      }
    } catch (e) {
      console.warn('[workoutApi] Failed to sync local storage cache during workout deletion', e);
    }
  },

  async deleteFolder(id: string) {
    // Move workouts to uncategorized first
    await supabase.from('workout_categories').update({ folder_id: null }).eq('folder_id', id);
    const { error } = await supabase.from('workout_folders').delete().eq('id', id);
    if (error) throw error;

    // Synchronize localStorage backup cache immediately
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rubi_dashboard_cache_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached) {
              if (cached.folders) {
                cached.folders = cached.folders.filter((f: any) => f.id !== id);
              }
              if (cached.workouts) {
                cached.workouts = cached.workouts.map((w: any) => 
                  w.folder_id === id ? { ...w, folder_id: null } : w
                );
              }
              localStorage.setItem(key, JSON.stringify(cached));
            }
          }
        }
      }
    } catch (e) {
      console.warn('[workoutApi] Failed to sync local storage cache during folder deletion', e);
    }
  },

  async createFolder(userId: string, name: string) {
    const { data, error } = await supabase.from('workout_folders').insert([{ user_id: userId, name }]).select().single();
    if (error) throw error;
    return data as WorkoutFolder;
  },

  async getWorkoutInitData(workoutId: string, userId: string) {
    return fetchWithRetry(async () => {
      try {
        const [catRes, partialRes] = await Promise.all([
          supabase.from('workout_categories').select('*').eq('id', workoutId).single(),
          supabase.from('partial_workout_sessions').select('*').eq('user_id', userId).eq('workout_id', workoutId).maybeSingle()
        ]);

        if (catRes.error) throw catRes.error;
        if (partialRes.error) throw partialRes.error;

        // Fetch exercises with fallback join
        let exercisesData: any[] = [];
        const exResWithJoin = await supabase.from('workout_exercises')
          .select(`*, exercises (id, name, muscle_group, image_url, is_active)`)
          .eq('category_id', workoutId)
          .order('sort_order');

        if (exResWithJoin.error) {
          console.warn('[workoutApi] Join query in getWorkoutInitData failed, falling back to select("*") from workout_exercises', exResWithJoin.error);
          const exResSimple = await supabase.from('workout_exercises')
            .select('*')
            .eq('category_id', workoutId)
            .order('sort_order');
          
          if (exResSimple.error) throw exResSimple.error;
          exercisesData = exResSimple.data || [];
        } else {
          exercisesData = exResWithJoin.data || [];
        }

        // Fetch exercise library to do client-side mapping if join didn't work or returned null exercises
        let exercisesList: Exercise[] = [];
        try {
          exercisesList = await exerciseApi.getExercises();
        } catch (e) {
          console.warn('[workoutApi] Failed to load exercises list for client-side join:', e);
        }
        const exercisesMap = new Map(exercisesList.map(e => [e.id, e]));

        const loadedExercises = exercisesData.map((item: any) => {
          const resolvedExercise = item.exercises || exercisesMap.get(item.exercise_id);
          return {
            ...item,
            exercise_name: resolvedExercise?.name || item.exercise_name_snapshot || item.exercise_name || item.custom_name || 'Exercício Indisponível',
            muscle_group: normalizeMuscleGroup(resolvedExercise?.muscle_group || item.muscle_group || 'Outros'),
            exercise_image: resolvedExercise?.image_url || item.exercise_image
          };
        });

        const result = {
          category: catRes.data as WorkoutCategory,
          exercises: (loadedExercises || []) as WorkoutExercise[],
          partialSession: partialRes.data
        };

        // Cache successful workout content
        try { localStorage.setItem(`rubi_workout_init_${workoutId}`, JSON.stringify(result)); }
        catch (error) { console.warn('[workoutApi] Workout cache unavailable', error); }
        return result;
      } catch (err: any) {
        console.warn(`[workoutApi] Failed to init workout ${workoutId} online. Trying local cache fallbacks.`, err);
        
        try {
          const cached = localStorage.getItem(`rubi_workout_init_${workoutId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.category?.id === workoutId && parsed.category?.user_id === userId
              && Array.isArray(parsed.exercises)
              && !parsed.exercises.some((exercise: any) => String(exercise.id).startsWith('offline-work-ex-'))) {
              // Session ids in a disk snapshot can refer to already finished sessions.
              return { ...parsed, partialSession: null };
            }
          }
        } catch (e) {
          console.error("Failed to parse cached workout data:", e);
        }

        throw err;
      }
    });
  },

  async startWorkoutHistory(userId: string, workoutId: string, categoryName: string) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(workoutId)) {
      throw new Error('Não foi possível iniciar o treino: a ficha não possui um identificador válido no banco.');
    }

    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase.from('workout_history').insert([{
          user_id: userId,
          category_id: workoutId,
          category_name: categoryName,
          completed_at: null
        }]).select().single();

        if (error) throw error;
        if (!data?.id || !uuidPattern.test(data.id)) {
          throw new Error('O banco não retornou um identificador válido para a sessão de treino.');
        }
        return data as WorkoutHistory;
      } catch (err: any) {
        lastError = err;
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 350 * attempt));
        }
      }
    }

    console.error('[workoutApi] Failed to create a real workout history after retries.', lastError);
    throw lastError || new Error('Não foi possível criar a sessão de treino no banco. Tente novamente.');
  },

  async upsertPartialSession(userId: string, workoutId: string, historyId: string, startTime: string) {
    try {
      const { error } = await supabase.from('partial_workout_sessions').upsert({ 
        user_id: userId, 
        workout_id: workoutId, 
        history_id: historyId, 
        start_time: startTime,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.warn("[workoutApi] Failed to upsert partial session online. Using local storage fallback.", err);
      try {
        localStorage.setItem(`rubi_partial_session_${workoutId}`, JSON.stringify({
          user_id: userId,
          workout_id: workoutId,
          history_id: historyId,
          start_time: startTime,
          updated_at: new Date().toISOString()
        }));
      } catch (e) {
        console.error("Local storage error in partial session fallback", e);
      }
    }
  },

  async updatePartialSession(historyId: string, currentIndex: number, currentSet: number) {
    try {
      const { error } = await supabase.from('partial_workout_sessions').update({
        current_index: currentIndex,
        current_set: currentSet,
        updated_at: new Date().toISOString()
      }).eq('history_id', historyId);
      if (error) throw error;
    } catch (err) {
      console.warn("[workoutApi] Failed to update partial session online. Tolerating offline state.", err);
    }
  },

  async getLastSet(exerciseId: string) {
    const { data, error } = await supabase
      .from("workout_sets_log")
      .select("weight_achieved, reps_achieved, rpe")
      .eq("exercise_id", exerciseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getHistoricalSets(exerciseId: string, currentHistoryId?: string) {
    // 1. Get the most recent session (history_id) for this exercise, excluding current if provided
    let query = supabase
      .from("workout_sets_log")
      .select("history_id")
      .eq("exercise_id", exerciseId);
    
    if (currentHistoryId) {
      query = query.neq("history_id", currentHistoryId);
    }

    const { data: lastSession } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (!lastSession) return [];

    // 2. Get all sets from that specific session
    const { data, error } = await supabase
      .from("workout_sets_log")
      .select("weight_achieved, reps_achieved, rpe, set_number")
      .eq("history_id", lastSession.history_id)
      .eq("exercise_id", exerciseId)
      .order("set_number", { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async finishWorkout(historyId: string, durationMinutes: number, exercisesCount: number, partial = false) {
    const basePayload = {
      duration_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
      exercises_count: exercisesCount
    };

    let result = await supabase.from('workout_history')
      .update(partial ? { ...basePayload, partial: true } : basePayload)
      .eq('id', historyId).select('id').single();

    // Bancos que ainda não têm a coluna `partial` rejeitam o update inteiro.
    // Nesse caso a sessão é salva sem o marcador — nunca perdida.
    if (result.error && partial && (result.error.code === '42703' || /partial/i.test(result.error.message || ''))) {
      console.warn('[workoutApi] Coluna `partial` ausente em workout_history; sessão salva sem o marcador.', result.error);
      result = await supabase.from('workout_history').update(basePayload).eq('id', historyId).select('id').single();
    }

    if (result.error) throw result.error;
    if (result.data?.id !== historyId) throw new Error('Não foi possível confirmar a conclusão do treino. Tente novamente.');
    
    // EKE Feedback Loop
    try {
      const { ekeService } = await import('../../domain/eke/ekeService');
      await ekeService.processWorkoutFeedback(historyId);
    } catch (e) {
      console.warn("[EKE] Feedback loop deferred or failed", e);
    }
  },

  async abandonWorkout(historyId: string) {
    if (!historyId) return;
    
    // Primeiro limpamos todas as dependências que podem ter chaves estrangeiras
    const { offlineQueue } = await import('../offline/offlineQueue');
    
    try {
      await Promise.all([
        offlineQueue.clearByHistoryId(historyId),
        supabase.from('workout_sets_log').delete().eq('history_id', historyId),
        supabase.from('partial_workout_sessions').delete().eq('history_id', historyId)
      ]);

      // Depois abandonamos o histórico
      const { error } = await supabase.from('workout_history').delete().eq('id', historyId);
      if (error) {
        console.error(`[workoutApi] Failed to delete history record ${historyId}:`, error);
        // Se falhar a deleção por algum motivo, pelo menos garantimos que completed_at continua nulo
        // Mas o ideal é que o ON DELETE CASCADE cuide disso se a política permitir
      }
    } catch (err) {
      console.error(`[workoutApi] Error during abandonWorkout for ${historyId}:`, err);
      throw err;
    }
  },

  async clearPartialSession(userId: string) {
    const { error } = await supabase.from('partial_workout_sessions').delete().eq('user_id', userId);
    if (error) throw error;
  },

  async getWorkoutLogs(historyId: string) {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase.from('workout_sets_log').select('weight_achieved, reps_achieved, exercise_id').eq('history_id', historyId);
      if (error) throw error;
      return data || [];
    });
  },

  async getWorkoutHistory(userId: string) {
    // Convidado guarda o histórico no próprio aparelho: consultar o Supabase
    // aqui devolveria lista vazia e a tela de Histórico ficaria em branco.
    if (userId === GUEST_USER_ID) {
      return (getGuestDashboard().history || [])
        .filter((entry: any) => entry?.completed_at)
        .map((entry: any) => ({
          ...entry,
          user_id: GUEST_USER_ID,
          category_name: entry.category_name || entry.workout_name || 'Treino local',
          exercises_count: entry.exercises_count
            ?? new Set((entry.workout_sets_logs || []).map((log: any) => log.exercise_id)).size,
        }))
        .sort((a: any, b: any) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    }

    return fetchWithRetry(async () => {
      const rows: WorkoutHistory[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from('workout_history').select('*')
          .eq('user_id', userId).not('completed_at', 'is', null).gt('exercises_count', 0)
          .order('completed_at', { ascending: false }).order('id', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if ((data || []).length < pageSize) break;
      }
      return rows;
    });
  },

  /** Complete, user-scoped data for Evolution. Failures must remain visible. */
  async getEvolutionLogs(history: WorkoutHistory[]) {
    const user = await authApi.getUser();
    if (!user) throw new Error('Sessão indisponível. Entre novamente.');
    if (user.id === GUEST_USER_ID) {
      return (getGuestDashboard().history || []).flatMap((entry: any) =>
        (entry.workout_sets_logs || []).map((log: any) => ({ ...log,
          history_id: entry.id, exercise_name_snapshot: log.exercise_name || log.exercise_name_snapshot,
        })));
    }
    const rows: any[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from('workout_sets_log').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: true }).order('id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if ((data || []).length < pageSize) break;
    }
    const visible = new Set(history.filter(h => h.user_id === user.id).map(h => h.id));
    const logs = rows.filter(log => visible.has(log.history_id));
    // Names are descriptive metadata only; a catalog failure must not replace real data.
    try {
      const catalog = await exerciseApi.getExercises();
      const names = new Map(catalog.map(ex => [ex.id, ex.name]));
      return logs.map(log => ({ ...log, exercise_name_snapshot: log.exercise_name_snapshot || names.get(log.exercise_id) }));
    } catch {
      return logs;
    }
  },

  async getExerciseList() {
    let response: any = await supabase
      .from('exercise_progress')
      .select('exercise_id, exercises(name)')
      .order('date', { ascending: false });
    
    if (response.error) {
      console.warn('[workoutApi] getExerciseList join failed, falling back to select("exercise_id")', response.error);
      response = await supabase
        .from('exercise_progress')
        .select('exercise_id')
        .order('date', { ascending: false });
      
      if (response.error) throw response.error;
    }
    return response.data || [];
  },

  async getWorkoutDetails(historyId: string) {
    // Séries do convidado ficam em `history[].workout_sets_logs`, não na tabela.
    if (String(historyId).startsWith('guest-')) {
      const entry = (getGuestDashboard().history || [])
        .find((item: any) => item.id === historyId);
      return (entry?.workout_sets_logs || []).map((log: any) => ({
        ...log,
        history_id: historyId,
        exercises: { name: log.exercise_name || 'Exercício', muscle_group: 'Outros' },
      }));
    }

    let response: any = await supabase.from('workout_sets_log').select(`*, exercises (name, muscle_group)`).eq('history_id', historyId).order('created_at', { ascending: true });
    
    if (response.error) {
      console.warn('[workoutApi] getWorkoutDetails join failed, falling back to select("*")', response.error);
      response = await supabase.from('workout_sets_log').select(`*`).eq('history_id', historyId).order('created_at', { ascending: true });
      if (response.error) throw response.error;
    }
    
    // Client-side join fallback if exercises is not populated
    const data = response.data || [];
    if (data.length > 0 && !data[0].exercises) {
      try {
        const exercisesList = await exerciseApi.getExercises();
        const exercisesMap = new Map(exercisesList.map(e => [e.id, e]));
        return data.map((item: any) => ({
          ...item,
          exercises: exercisesMap.get(item.exercise_id) || { name: item.exercise_name_snapshot || 'Exercício', muscle_group: 'Outros' }
        }));
      } catch (e) {
        console.warn('Failed client-side join in getWorkoutDetails fallback:', e);
      }
    }
    return data;
  },

  /**
   * Corrige peso/reps/RPE de uma série já registrada numa sessão concluída
   * (Evolução → Sessões). Localiza a série pelo id quando disponível
   * (autenticado); no convidado, que não grava id por série, usa
   * exercise_id + set_number.
   */
  async updateWorkoutSetLog(
    set: { id?: string; history_id: string; exercise_id: string; set_number: number },
    updates: Partial<{ weight_achieved: number; reps_achieved: number; rpe: number }>,
  ) {
    if (String(set.history_id).startsWith('guest-')) {
      updateGuestSessionSet(set.history_id, set.exercise_id, set.set_number, updates);
      return;
    }
    if (!set.id) throw new Error('Não foi possível identificar a série para editar.');
    const { error } = await supabase.from('workout_sets_log').update(updates).eq('id', set.id);
    if (error) throw error;
  },

  async getAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getWorkoutEditorData(userId: string, workoutId?: string) {
    // Convidado não tem pasta/ficha/favorito em tabela do Supabase — user_id
    // é o id sentinela, que a coluna uuid rejeita antes de chegarmos perto do
    // conteúdo real. Fonte da verdade é o dashboard local.
    if (userId === GUEST_USER_ID) {
      const dashboard = getGuestDashboard();

      let exercisesList: Exercise[] = [];
      try {
        exercisesList = await exerciseApi.getExercises();
      } catch (err) {
        console.warn('[WorkoutEditor] Erro ao buscar exercícios via exerciseApi. Retornando padrão estático.', err);
        try {
          const { fallbackExercises } = await import('./fallbackExercises');
          exercisesList = fallbackExercises;
        } catch (importErr) {
          console.error('[WorkoutEditor] Falha crítica de importação de fallback:', importErr);
        }
      }

      let muscleGroups: MuscleGroup[] = [];
      try {
        muscleGroups = await exerciseApi.getMuscleGroups();
      } catch (err) {
        console.warn('[WorkoutEditor] Erro ao buscar grupos musculares:', err);
      }

      let category: WorkoutCategory | null = null;
      let workoutExercises: any[] = [];
      if (workoutId) {
        const workout = getGuestWorkout(workoutId);
        if (workout) {
          category = {
            id: workout.id,
            user_id: GUEST_USER_ID,
            folder_id: workout.folder_id,
            name: workout.name,
            description: workout.description,
          } as WorkoutCategory;

          const exercisesMap = new Map(exercisesList.map(e => [e.id, e]));
          workoutExercises = (workout.exercises || []).map((item: any) => {
            const resolvedExercise = exercisesMap.get(item.exercise_id);
            return {
              ...item,
              exercises: resolvedExercise || null,
              exercise_name: resolvedExercise?.name || item.exercise_name_snapshot || item.exercise_name || 'Exercício Indisponível',
              muscle_group: normalizeMuscleGroup(resolvedExercise?.muscle_group || item.muscle_group || 'Outros'),
              exercise_image: resolvedExercise?.image_url || item.exercise_image,
            };
          });
        }
      }

      return {
        folders: dashboard.folders || [],
        muscleGroups,
        exercises: exercisesList,
        // Favoritar exercício não existe no modo convidado ainda — lista
        // vazia é o dado real, não uma ausência disfarçada.
        favorites: [] as string[],
        category,
        workoutExercises: workoutExercises as WorkoutExercise[],
      };
    }

    // We fetch folders, muscle groups, and user favorites.
    // Exercises are fetched reliably below.
    const queries: any[] = [
      supabase.from('workout_folders').select('*').eq('user_id', userId).order('name'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
      supabase.from('user_favorite_exercises').select('exercise_id').eq('user_id', userId)
    ];

    if (workoutId) {
      queries.push(supabase.from('workout_categories').select('*').eq('id', workoutId).single());
    }

    const results = await Promise.all(queries);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;

    // Fetch exercises using the ultra-resilient exerciseApi cache/fallback/normalization flow
    let exercisesList: Exercise[] = [];
    try {
      exercisesList = await exerciseApi.getExercises();
    } catch (err) {
      console.warn('[WorkoutEditor] Erro ao buscar exercícios via exerciseApi. Retornando padrão estático.', err);
      // Fallback
      try {
        const { fallbackExercises } = await import('./fallbackExercises');
        exercisesList = fallbackExercises;
      } catch (importErr) {
        console.error('[WorkoutEditor] Falha crítica de importação de fallback:', importErr);
      }
    }

    let workoutExercises: any[] = [];
    if (workoutId) {
      // Try fetching with join first
      const exWithJoin = await supabase.from('workout_exercises')
        .select('*, exercises(*)')
        .eq('category_id', workoutId)
        .order('sort_order');
      
      if (exWithJoin.error) {
        console.warn('[workoutApi] Editor join query failed, trying fallback select("*") on workout_exercises...', exWithJoin.error);
        const exSimple = await supabase.from('workout_exercises')
          .select('*')
          .eq('category_id', workoutId)
          .order('sort_order');
        
        if (exSimple.error) throw exSimple.error;
        workoutExercises = exSimple.data || [];
      } else {
        workoutExercises = exWithJoin.data || [];
      }
    }

    const exercisesMap = new Map(exercisesList.map(e => [e.id, e]));
    const enrichedWorkoutExercises = workoutExercises.map((item: any) => {
      const resolvedExercise = item.exercises || exercisesMap.get(item.exercise_id);
      return {
        ...item,
        exercises: resolvedExercise || null,
        exercise_name: resolvedExercise?.name || item.exercise_name_snapshot || item.exercise_name || item.custom_name || 'Exercício Indisponível',
        muscle_group: normalizeMuscleGroup(resolvedExercise?.muscle_group || item.muscle_group || 'Outros'),
        exercise_image: resolvedExercise?.image_url || item.exercise_image
      };
    });

    return {
      folders: (results[0].data || []) as WorkoutFolder[],
      muscleGroups: (results[1].data || []) as MuscleGroup[],
      exercises: exercisesList,
      favorites: (results[2].data || []).map((f: any) => f.exercise_id),
      category: workoutId ? results[3].data as WorkoutCategory : null,
      workoutExercises: enrichedWorkoutExercises as WorkoutExercise[]
    };
  },

  async createCategory(payload: any) {
    const { data, error } = await supabase.from('workout_categories').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, payload: any) {
    invalidateWorkoutCache(id);
    const { data, error } = await supabase.from('workout_categories').update(payload).eq('id', id).select('id').single();
    if (error) throw error;
    if (data?.id !== id) throw new Error('A ficha não foi atualizada. Recarregue e tente novamente.');
    invalidateWorkoutCache(id);
  },

  async updateWorkoutExercise(id: string, categoryId: string, payload: any) {
    invalidateWorkoutCache(categoryId);
    const { data, error } = await supabase.from('workout_exercises').update(payload)
      .eq('id', id).eq('category_id', categoryId).select('id').single();
    if (error) throw error;
    if (data?.id !== id) throw new Error('O exercício não foi atualizado. Recarregue a ficha e tente novamente.');
    invalidateWorkoutCache(categoryId);
  },

  async saveNewWorkoutExercise(categoryId: string, clientKey: string, payload: any) {
    invalidateWorkoutCache(categoryId);
    const id = uuidv5(JSON.stringify([categoryId, clientKey]), uuidv5.URL);
    const { data, error } = await supabase.from('workout_exercises')
      .upsert({ ...payload, id, category_id: categoryId }, { onConflict: 'id' }).select('id').single();
    if (error) throw error;
    if (data?.id !== id) throw new Error('Não foi possível confirmar o novo exercício. Tente novamente.');
    invalidateWorkoutCache(categoryId);
    return id;
  },

  async deleteExercisesByCategory(categoryId: string) {
    invalidateWorkoutCache(categoryId);
    const { error } = await supabase.from('workout_exercises').delete().eq('category_id', categoryId);
    if (error) throw error;
  },

  // Apaga só as linhas antigas da ficha, preservando as recém-inseridas (por id).
  // Usado depois de um insert bem-sucedido, para nunca haver uma janela em que a
  // ficha fica sem nenhuma linha no banco caso o insert tivesse falhado.
  async deleteExercisesByCategoryExcept(categoryId: string, keepIds: string[]) {
    if (!keepIds.length) throw new Error('Nenhum exercício confirmado; a ficha anterior foi preservada.');
    invalidateWorkoutCache(categoryId);
    let query = supabase.from('workout_exercises').delete().eq('category_id', categoryId);
    if (keepIds.length > 0) query = query.not('id', 'in', `(${keepIds.join(',')})`);
    const { error } = await query;
    if (error) throw error;
  },

  async insertWorkoutExercises(exercises: any[]): Promise<string[]> {
    exercises.forEach(ex => invalidateWorkoutCache(ex.category_id));
    let currentExercises = [...exercises];

    while (true) {
      try {
        const { data, error } = await supabase.from('workout_exercises').insert(currentExercises).select('id');
        if (error) throw error;
        if (!data || data.length !== currentExercises.length) throw new Error('Não foi possível confirmar os exercícios salvos.');
        return (data || []).map((row: any) => row.id);
      } catch (err: any) {
        const errorMsg = err.message || '';
        console.warn(`[insertWorkoutExercises] Failed to insert workout exercises:`, errorMsg);

        // PostgREST places the column name BEFORE "column" (PGRST204).
        // Only optional metadata may be dropped; never discard training values.
        if (errorMsg.toLowerCase().includes('column') || errorMsg.includes('schema cache')) {
          const match = errorMsg.match(/Could not find the ["']([^"']+)["'] column/i) ||
                        errorMsg.match(/column ["']([^"']+)["']/) ||
                        errorMsg.match(/column\s+named\s+["']([^"']+)["']/) || 
                        errorMsg.match(/column\s+([a-zA-Z0-9_-]+)/);
                        
          if (match && match[1]) {
            const badColumn = match[1];
            if (badColumn !== 'is_optional' || !currentExercises.some(ex => Object.hasOwn(ex, badColumn))) {
              throw err;
            }
            console.warn(`[WORKOUT] Removing missing column from insert payload: ${badColumn}`);
            
            currentExercises = currentExercises.map(ex => {
              const { [badColumn]: _, ...remaining } = ex;
              return remaining;
            });

            if (currentExercises.length > 0 && Object.keys(currentExercises[0]).length === 0) throw err;
            continue;
          }
        }
        throw err;
      }
    }
  },

  async upsertPartialWorkoutSession(payload: any) {
    try {
      const { error } = await supabase.from('partial_workout_sessions').upsert(payload);
      if (error) throw error;
    } catch (err) {
      console.warn("[workoutApi] Failed to upsert partial session (from payload). Tolerating offline.", err);
    }
  },

  async getWorkoutLogsSimple(historyId: string) {
    try {
      const { data, error } = await supabase.from('workout_sets_log').select('*').eq('history_id', historyId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("[workoutApi] Failed to get simple workout logs. Returning empty list.", err);
      return [];
    }
  },

  async getPartialSession(userId: string) {
    try {
      const { data, error } = await supabase
        .from('partial_workout_sessions')
        .select('workout_id, history_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.warn("[workoutApi] Failed to get partial session. Returning null (offline/connection issue).", err);
      return null;
    }
  },

  async saveSetLog(payload: any) {
    let currentPayload = { ...payload };
    
    while (true) {
      try {
        // Idempotent write: try to upsert if possible, or insert
        // Since we might not have a unique constraint, we use insert and handle history cleanup in batch
        const { error } = await supabase.from('workout_sets_log').insert([currentPayload]);
        return { error };
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[LOG] Removing missing column: ${badColumn}`);
            const { [badColumn]: _, ...remaining } = currentPayload;
            currentPayload = remaining;
            continue;
          }
        }
        return { error: err };
      }
    }
  },

  async updateWorkoutExerciseSets(id: string, sets: SetConfig[]) {
    const { error } = await supabase.from('workout_exercises').update({
      sets_json: sets,
      // For legacy compatibility, also update the flat fields with average or first set values
      weight: sets.length > 0 ? sets[0].weight : 0,
      reps: sets.length > 0 ? sets[0].reps : '10',
      sets: sets.length
    }).eq('id', id);
    if (error) throw error;
  },

  async updateExerciseProgression(userId: string, exerciseId: string, weight: number, reps: number, rpe: number) {
    const { error } = await supabase.from('exercise_progression').upsert({
      user_id: userId,
      exercise_id: exerciseId,
      last_weight: weight,
      last_reps: reps,
      last_rpe: rpe,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,exercise_id' });
    
    if (error && error.code === 'PGRST116') return; 
    if (error) {
      console.warn("[PROGRESSION] Failed to update progression", error);
    }
  },

  async updateProgressionFromLogs(userId: string, historyId: string) {
    // Single Source of Truth: update progression based on what's actually in workout_sets_log
    try {
      const { data: logs, error: logsError } = await supabase
        .from('workout_sets_log')
        .select('exercise_id, weight_achieved, reps_achieved, rpe')
        .eq('history_id', historyId)
        .order('set_number', { ascending: false });

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return;

      // Group by exercise and pick the "best" or last record
      const latestPerExercise = new Map();
      logs.forEach(log => {
        if (!latestPerExercise.has(log.exercise_id)) {
          latestPerExercise.set(log.exercise_id, log);
        }
      });

      for (const [exId, data] of latestPerExercise.entries()) {
        await this.updateExerciseProgression(userId, exId, data.weight_achieved, data.reps_achieved, data.rpe);
      }
      return true;
    } catch (err) {
      console.error("[INTEGRITY] Failed to update progression from logs", err);
      return false;
    }
  },

  async validateWorkoutIntegrity(historyId: string, expectedCount: number) {
    const { data, count, error } = await supabase
      .from('workout_sets_log')
      .select('*', { count: 'exact', head: true })
      .eq('history_id', historyId);
    
    if (error) throw error;
    return count === expectedCount;
  },

  async saveWorkoutBatch(historyId: string, logs: any[]) {
    if (!historyId || !logs.length || logs.some(log => log.history_id !== historyId || !log.user_id)) {
      throw new Error('Dados incompletos para salvar a sessão. Os registros anteriores foram preservados.');
    }
    // Stable primary keys make retries safe, including a lost response after commit.
    // The occurrence index preserves repeated exercises in the same session.
    const rows = logs.map((log, index) => ({ ...log,
      id: uuidv5(JSON.stringify([historyId, log.user_id, log.exercise_id, log.set_number, index]), uuidv5.URL),
    }));
    const { data, error } = await supabase.from('workout_sets_log')
      .upsert(rows, { onConflict: 'id' }).select('id');
    if (error) throw error;
    const confirmed = new Set((data || []).map(row => row.id));
    if (confirmed.size !== rows.length || rows.some(row => !confirmed.has(row.id))) {
      throw new Error('Não foi possível confirmar todas as séries. Os registros anteriores foram preservados.');
    }
    // Only discard superseded incremental logs AFTER the new snapshot is confirmed.
    const { error: cleanupError } = await supabase.from('workout_sets_log')
      .delete().eq('history_id', historyId).not('id', 'in', `(${rows.map(row => row.id).join(',')})`);
    if (cleanupError) throw cleanupError;
    if (!await this.validateWorkoutIntegrity(historyId, rows.length)) {
      throw new Error('A conferência das séries falhou. Tente salvar novamente.');
    }
  }
};
