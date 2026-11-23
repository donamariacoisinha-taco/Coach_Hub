
import { supabase } from './supabase';
import { WorkoutCategory, WorkoutExercise, WorkoutFolder, WorkoutHistory, UserProfile, MuscleGroup, Exercise, SetConfig, normalizeMuscleGroup } from '../../types';
import { fetchWithRetry } from '../utils';
import { exerciseApi } from './exerciseApi';
import { getGuestDashboard, getGuestWorkout, deleteGuestWorkout, updateGuestSessionSet } from '../guest/guestPersistence';
import { authApi, GUEST_USER_ID } from './authApi';
import { isIncompleteSave, isMissingReplaceRpc, isReplaceRpcMissing, missingInsertColumn, omitUnavailableOptionalFlag, planInsertRetry, planKeptIds, quoteExerciseIds, rememberCapability, withoutColumn } from './workoutExerciseSave';
import { restSecondsFromLog } from '../../domain/workout/setPersistence';
import { alignFlatColumns, planSetCount } from '../../domain/workout/planColumns';
import { lastSetColumns, rowForTable } from '../../domain/workout/liveSchema';
import { completionFromCounts } from '../../domain/workout/sessionSummary';
import { isMissingRelationError, isRelationMissing, markRelationMissing, shareInflight } from './missingRelation';

let progressionTableMissing = false;
const lastSetCache = new Map<string, Promise<unknown>>();
const historyCache = new Map<string, { at: number; value: unknown }>();
const historyCountCache = new Map<string, { at: number; value: number }>();
const partialCache = new Map<string, { at: number; value: unknown }>();
const dashboardReadCache = new Map<string, { at: number; value: unknown }>();
const folderListCache = new Map<string, { at: number; value: { data: unknown; error: null } }>();
const READ_CACHE_MS = 15000;

function invalidateFolderList(userId?: string) {
  if (userId) folderListCache.delete(userId);
  else folderListCache.clear();
}

function readWorkoutFolders(userId: string) {
  const hit = folderListCache.get(userId);
  if (hit && Date.now() - hit.at < READ_CACHE_MS) return Promise.resolve(hit.value);
  return shareInflight(`folders:${userId}`, async () => {
    const { data, error } = await supabase.from('workout_folders').select('*').eq('user_id', userId).order('name');
    if (error) return { data: null, error };
    const value = { data, error: null as null };
    folderListCache.set(userId, { at: Date.now(), value });
    return value;
  });
}

async function annotateHistoryCompletion<T extends { id: string; category_id?: string | null; partial?: boolean }>(rows: T[]): Promise<T[]> {
  if (!rows.length) return rows;
  try {
    const ids = rows.map((row) => row.id).filter(Boolean);
    const categoryIds = [...new Set(rows.map((row) => row.category_id).filter(Boolean))] as string[];
    const [logRes, planRes] = await Promise.all([
      supabase.from('workout_sets_log').select('history_id').in('history_id', ids),
      categoryIds.length
        ? supabase.from('workout_exercises').select('category_id, sets, sets_json').in('category_id', categoryIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (logRes.error || planRes.error) return rows;
    const logged = new Map<string, number>();
    for (const row of logRes.data || []) {
      const id = String(row.history_id || '');
      if (id) logged.set(id, (logged.get(id) || 0) + 1);
    }
    const planned = new Map<string, number>();
    for (const row of planRes.data || []) {
      const id = String((row as { category_id?: string }).category_id || '');
      if (id) planned.set(id, (planned.get(id) || 0) + planSetCount(row as { sets?: number; sets_json?: unknown[] }));
    }
    return rows.map((row) => {
      const loggedSets = logged.get(row.id) || 0;
      const plannedSets = row.category_id ? planned.get(row.category_id) || 0 : 0;
      const completion = completionFromCounts(loggedSets, plannedSets);
      return {
        ...row,
        logged_sets: loggedSets,
        planned_sets: plannedSets,
        partial: plannedSets > 0 ? completion.partial : Boolean(row.partial),
      };
    });
  } catch (err) {
    console.warn('[workoutApi] Não foi possível comparar séries feitas e previstas', err);
    return rows;
  }
}

export const workoutApi = {
  getGuestDashboardData() {
    return getGuestDashboard();
  },
  async getDashboardData(userId: string) {
    const hit = dashboardReadCache.get(userId);
    if (hit && Date.now() - hit.at < READ_CACHE_MS) return hit.value as Awaited<ReturnType<typeof this.loadDashboardData>>;
    return shareInflight(`dashboard:${userId}`, async () => {
      const value = await this.loadDashboardData(userId);
      dashboardReadCache.set(userId, { at: Date.now(), value });
      return value;
    });
  },

  invalidateDashboardRead(userId?: string) {
    if (userId) dashboardReadCache.delete(userId);
    else dashboardReadCache.clear();
  },

  async loadDashboardData(userId: string) {
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
        localStorage.setItem(`rubi_dashboard_cache_${userId}`, JSON.stringify(result));
        return result;
      } catch (err: any) {
        console.warn("[workoutApi] Connection failed (Failed to fetch). Activating localStorage cache backup.", err);
        
        try {
          const cached = localStorage.getItem(`rubi_dashboard_cache_${userId}`);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (e) {
          console.error("Failed to parse cached dashboard data:", e);
        }

        // Return high-quality premium catalog fallback structure if no cache exists
        return {
          profile: {
            id: userId,
            email: 'convidado@kyron.os',
            name: 'Atleta Convidado',
            onboarding_completed: true,
            workout_streak: 5,
            biometrics_bmi: 23.8,
            training_experience: 'Avançado',
            performance_score: 94,
            weight: 82,
            height: 182,
            created_at: new Date().toISOString()
          } as any,
          folders: [
            { id: 'folder-elite', name: 'Protocolos de Elite' },
            { id: 'folder-hipertrofia', name: 'Hipertrofia Estética' },
            { id: 'folder-forca', name: 'Força & Power' }
          ] as WorkoutFolder[],
          workouts: [
            {
              id: 'classic-a',
              name: 'Protocolo A — Desenvolvimento Miofibrilar',
              user_id: userId,
              folder_id: 'folder-elite',
              description: 'Ativação biomecânica otimizada para peito e ombros utilizando falha concêntrica.',
              duration_minutes: 55,
              created_at: new Date().toISOString()
            },
            {
              id: 'classic-b',
              name: 'Protocolo B — Ênfase Posterior Chain',
              user_id: userId,
              folder_id: 'folder-elite',
              description: 'Desenho neuromuscular para costas e bíceps focado em tempo sob tensão elevado.',
              duration_minutes: 60,
              created_at: new Date().toISOString()
            },
            {
              id: 'classic-c',
              name: 'Protocolo C — Divisão de Quadríceps & Core',
              user_id: userId,
              folder_id: 'folder-hipertrofia',
              description: 'Recrutamento de unidades motoras do quadríceps com cadência controlada.',
              duration_minutes: 50,
              created_at: new Date().toISOString()
            }
          ] as unknown as WorkoutCategory[],
          history: [] as WorkoutHistory[],
          stats: { sessions: 0 }
        };
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
    invalidateFolderList();

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
    invalidateFolderList(userId);
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
        localStorage.setItem(`rubi_workout_init_${workoutId}`, JSON.stringify(result));
        return result;
      } catch (err: any) {
        console.warn(`[workoutApi] Failed to init workout ${workoutId} online. Trying local cache fallbacks.`, err);
        
        try {
          const cached = localStorage.getItem(`rubi_workout_init_${workoutId}`);
          if (cached) {
            return JSON.parse(cached);
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

  async getExercisePrescription(userId: string, exerciseId: string) {
    if (!userId || !exerciseId || userId === 'guest-user-id') return null;
    const { data, error } = await supabase
      .from('exercise_prescriptions')
      .select('exercise_id, sets_json')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();
    if (error) {
      console.warn('[workoutApi] prescrição do exercício indisponível', error);
      return null;
    }
    const sets = (data as { sets_json?: unknown } | null)?.sets_json;
    return Array.isArray(sets) && sets.length > 0 ? sets : null;
  },

  async getLastSet(exerciseId: string) {
    const cached = lastSetCache.get(exerciseId);
    if (cached) return cached as ReturnType<typeof this.loadLastSet>;
    const request = this.loadLastSet(exerciseId);
    lastSetCache.set(exerciseId, request);
    try {
      return await request;
    } catch (error) {
      lastSetCache.delete(exerciseId);
      throw error;
    }
  },

  async loadLastSet(exerciseId: string) {
    const selected = lastSetColumns();
    const { data, error } = await supabase
      .from("workout_sets_log")
      .select(selected.join(", "))
      .eq("exercise_id", exerciseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const row = data as unknown as { weight_achieved: number; reps_achieved: number; rpe: number; rest_time_actual?: number | null } | null;
    return row ? { ...row, rest_time: restSecondsFromLog(row) } : null;
  },

  async getLastThreeExerciseSessions(exerciseId: string, currentHistoryId?: string) {
    // Preserve previous sessions even when today's prescription is replicated.
    let query = supabase.from('workout_sets_log')
      .select('history_id, set_number, weight_achieved, reps_achieved, rpe, created_at')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(150);
    if (currentHistoryId) query = query.neq('history_id', currentHistoryId);
    const { data, error } = await query;
    if (error) throw error;
    const grouped = new Map<string, typeof data>();
    for (const row of data || []) {
      if (!row.history_id) continue;
      if (!grouped.has(row.history_id)) {
        if (grouped.size >= 3) continue;
        grouped.set(row.history_id, []);
      }
      grouped.get(row.history_id)!.push(row);
    }
    return Array.from(grouped.entries()).map(([history_id, sets]) => ({
      history_id,
      date: sets[0]?.created_at || '',
      sets: sets.sort((a, b) => a.set_number - b.set_number)
    }));
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

    historyCache.clear();
    let payload: Record<string, unknown> = rowForTable('workout_history', partial ? { ...basePayload, partial: true } : { ...basePayload });
    let histError = (await supabase.from('workout_history').update(payload).eq('id', historyId)).error;

    // Uma coluna que o banco ainda não tem rejeita o update inteiro.
    // Tira essa coluna e tenta de novo, sem avisar o usuário quando a segunda gravação passa.
    const stripped = new Set<string>();
    while (histError) {
      const missing = missingInsertColumn(histError.message || '');
      if (!missing || stripped.has(missing) || !(missing in payload)) break;
      stripped.add(missing);
      const { [missing]: _removed, ...rest } = payload;
      payload = rest;
      histError = (await supabase.from('workout_history').update(payload).eq('id', historyId)).error;
    }

    if (histError) throw histError;
    
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
    partialCache.delete(userId);
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

  async countWorkoutHistory(userId: string): Promise<number> {
    if (userId === GUEST_USER_ID) return (getGuestDashboard().history || []).length;
    const hit = historyCountCache.get(userId);
    if (hit && Date.now() - hit.at < READ_CACHE_MS) return hit.value;
    return shareInflight(`history-count:${userId}`, async () => {
      const { count, error } = await supabase
        .from('workout_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      const value = count || 0;
      historyCountCache.set(userId, { at: Date.now(), value });
      return value;
    });
  },

  async getLastSessionSets(exerciseId: string) {
    const { data, error } = await supabase
      .from('workout_sets_log')
      .select('history_id, set_number, weight_achieved, reps_achieved, rpe, rest_time_actual, created_at, exercise_id')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) return [];
    const latestHistory = rows[0].history_id;
    return rows
      .filter((row) => row.history_id === latestHistory)
      .sort((a, b) => a.set_number - b.set_number);
  },

  async listExercisePrescriptions(userId: string) {
    if (!userId || userId === GUEST_USER_ID) return [];
    const { data, error } = await supabase
      .from('exercise_prescriptions')
      .select('exercise_id, sets_json')
      .eq('user_id', userId);
    if (error) {
      console.warn('[workoutApi] prescrições indisponíveis', error);
      return [];
    }
    return (data || []) as { exercise_id: string; sets_json: unknown }[];
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

    const fresh = historyCache.get(userId);
    if (fresh && Date.now() - fresh.at < READ_CACHE_MS) return fresh.value as WorkoutHistory[];
    const value = await shareInflight(`history:${userId}`, () => fetchWithRetry(async () => {
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
      return annotateHistoryCompletion(rows);
    }));
    historyCache.set(userId, { at: Date.now(), value });
    return value;
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
      readWorkoutFolders(userId),
      exerciseApi.getMuscleGroups().then((groups) => ({ data: groups, error: null })).catch((error) => ({ data: null, error })),
      exerciseApi.getFavorites(userId).then((ids) => ({ data: ids.map((exercise_id: string) => ({ exercise_id })), error: null })).catch((error) => ({ data: null, error })),
    ];

    if (workoutId) {
      queries.push(supabase.from('workout_categories').select('*').eq('id', workoutId).single());
    }

    const workoutExercisesPromise = (async () => {
      if (!workoutId) return [] as any[];
      const exWithJoin = await supabase.from('workout_exercises')
        .select('*, exercises(*)')
        .eq('category_id', workoutId)
        .order('sort_order');
      if (!exWithJoin.error) return exWithJoin.data || [];
      console.warn('[workoutApi] Editor join query failed, trying fallback select("*") on workout_exercises...', exWithJoin.error);
      const exSimple = await supabase.from('workout_exercises')
        .select('*')
        .eq('category_id', workoutId)
        .order('sort_order');
      if (exSimple.error) throw exSimple.error;
      return exSimple.data || [];
    })();

    const [results, exercisesList, workoutExercises] = await Promise.all([
      Promise.all(queries),
      exerciseApi.getExercises().catch(async (err) => {
        console.warn('[WorkoutEditor] Erro ao buscar exercícios via exerciseApi. Retornando padrão estático.', err);
        try {
          const { fallbackExercises } = await import('./fallbackExercises');
          return fallbackExercises;
        } catch (importErr) {
          console.error('[WorkoutEditor] Falha crítica de importação de fallback:', importErr);
          return [] as Exercise[];
        }
      }),
      workoutExercisesPromise,
    ]);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;

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
    const { error } = await supabase.from('workout_categories').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteExercisesByCategory(categoryId: string) {
    const { error } = await supabase.from('workout_exercises').delete().eq('category_id', categoryId);
    if (error) throw error;
  },

  // Apaga as linhas antigas só quando o insert devolveu exatamente a lista nova.
  // expectedCount vem do que pedimos para gravar, não do tamanho de keepIds:
  // comparar a lista com ela mesma deixava um filtro vazio apagar a ficha.
  async deleteExercisesByCategoryExcept(categoryId: string, keepIds: string[], expectedCount: number) {
    const plan = planKeptIds(expectedCount, keepIds);
    if (isIncompleteSave(plan)) throw new Error(plan.reason);
    const idList = quoteExerciseIds(plan.keepIds);
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('category_id', categoryId)
      .not('id', 'in', idList);
    if (error) throw error;
  },

  async insertWorkoutExercises(exercises: any[]): Promise<string[]> {
    let currentExercises = omitUnavailableOptionalFlag(exercises.map((row) => rowForTable('workout_exercises', alignFlatColumns({ ...row }))));
    const stripped = new Set<string>();

    while (true) {
      const { data, error } = await supabase.from('workout_exercises').insert(currentExercises).select('id');
      if (!error) {
        if (currentExercises[0] && 'is_optional' in currentExercises[0]) rememberCapability('isOptional', true);
        return (data || []).map((row: any) => row.id);
      }

      const message = error.message || '';
      const retry = planInsertRetry(message, currentExercises[0], stripped);
      if (retry.action === 'fail') throw error;

      if (retry.column === 'is_optional') rememberCapability('isOptional', false);
      stripped.add(retry.column);
      currentExercises = withoutColumn(currentExercises, retry.column);
    }
  },

  async replaceWorkoutExercises(categoryId: string, exercises: any[]): Promise<string[]> {
    if (!categoryId) throw new Error('Ficha sem identificador.');
    if (!exercises.length) {
      throw new Error('A ficha precisa de pelo menos um exercício para substituir a lista.');
    }

    const aligned = exercises.map((row) => alignFlatColumns({ ...row }));

    if (!isReplaceRpcMissing()) {
      let rpcData: unknown = null;
      let rpcError: unknown = null;
      try {
        const rpc = await supabase.rpc('replace_workout_exercises', {
          p_category_id: categoryId,
          p_rows: aligned,
        });
        rpcData = rpc.data;
        rpcError = rpc.error;
      } catch (error) {
        rpcError = error;
      }

      if (!rpcError) {
        rememberCapability('replaceRpc', true);
        const ids = Array.isArray(rpcData) ? rpcData.map((id: unknown) => String(id)) : [];
        const plan = planKeptIds(aligned.length, ids);
        if (isIncompleteSave(plan)) throw new Error(plan.reason);
        return plan.keepIds;
      }

      if (!isMissingReplaceRpc(rpcError)) throw rpcError;
      rememberCapability('replaceRpc', false);
    }

    const insertedIds = await this.insertWorkoutExercises(aligned);
    const plan = planKeptIds(aligned.length, insertedIds);
    if (isIncompleteSave(plan)) {
      if (plan.rollbackIds.length > 0) {
        await supabase.from('workout_exercises').delete().in('id', plan.rollbackIds);
      }
      throw new Error(plan.reason);
    }
    await this.deleteExercisesByCategoryExcept(categoryId, plan.keepIds, aligned.length);
    return plan.keepIds;
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
    const fresh = partialCache.get(userId);
    if (fresh && Date.now() - fresh.at < READ_CACHE_MS) return fresh.value as { workout_id: string; history_id: string } | null;
    try {
      const data = await shareInflight(`partial:${userId}`, async () => {
        const { data: row, error } = await supabase
          .from('partial_workout_sessions')
          .select('workout_id, history_id, start_time, updated_at, exercises_json, current_weight, current_reps')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        return row;
      });
      partialCache.set(userId, { at: Date.now(), value: data });
      return data;
    } catch (err: any) {
      console.warn("[workoutApi] Failed to get partial session. Returning null (offline/connection issue).", err);
      return null;
    }
  },

  async saveSetLog(payload: any) {
    let currentPayload = { ...payload };
    const stripped = new Set<string>();

    const write = async () => {
      currentPayload = rowForTable('workout_sets_log', currentPayload);
      const existing = await supabase.from('workout_sets_log').select('id')
        .eq('history_id', currentPayload.history_id)
        .eq('exercise_id', currentPayload.exercise_id)
        .eq('set_number', currentPayload.set_number)
        .order('created_at', { ascending: false })
        .limit(1);
      if (existing.error) return existing;
      const existingId = existing.data?.[0]?.id;
      if (existingId) {
        const { created_at: _createdAt, ...updates } = currentPayload;
        return supabase.from('workout_sets_log').update(updates).eq('id', existingId);
      }
      return supabase.from('workout_sets_log').insert([currentPayload]);
    };

    while (true) {
      const result = await write();
      if (!result.error) {
        if (currentPayload.exercise_id) lastSetCache.delete(String(currentPayload.exercise_id));
        return { error: null };
      }
      const retry = planInsertRetry(result.error.message || '', currentPayload, stripped);
      if (retry.action === 'fail') return { error: result.error };
      stripped.add(retry.column);
      currentPayload = withoutColumn([currentPayload], retry.column)[0];
    }
  },

  async savePlanExerciseTargets(categoryId: string, rows: { exercise_id: string; sets_json: any[] }[]) {
    for (const row of rows) {
      if (!row?.exercise_id) continue;
      const first = row.sets_json?.[0] || {};
      const { error } = await supabase.from('workout_exercises').update({
        sets_json: row.sets_json,
        sets: row.sets_json?.length,
        weight: first.weight,
        reps: first.reps != null ? String(first.reps) : undefined,
        rest_time: first.rest_time,
        default_rpe: first.rpe,
      }).eq('category_id', categoryId).eq('exercise_id', row.exercise_id);
      if (error) throw error;
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
    if (progressionTableMissing || isRelationMissing('exercise_progression')) return;
    const { error } = await supabase.from('exercise_progression').upsert({
      user_id: userId,
      exercise_id: exerciseId,
      last_weight: weight,
      last_reps: reps,
      last_rpe: rpe,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,exercise_id' });

    if (!error || error.code === 'PGRST116') return;
    const message = `${error.message || ''} ${error.code || ''}`.toLowerCase();
    if (error.code === 'PGRST205' || error.code === '42P01' || message.includes('does not exist') || message.includes('schema cache') || message.includes('not found') || isMissingRelationError(error)) {
      progressionTableMissing = true;
      markRelationMissing('exercise_progression');
      return;
    }
    console.warn("[PROGRESSION] Failed to update progression", error);
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
    let currentLogs = [...logs];
    
    while (true) {
      try {
        const { error } = await supabase.from('workout_sets_log').insert(currentLogs);
        if (error) throw error;
        return;
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[BATCH] Removing missing column: ${badColumn}`);
            currentLogs = currentLogs.map(log => {
              const { [badColumn]: _, ...remaining } = log;
              return remaining;
            });
            if (currentLogs.length > 0 && Object.keys(currentLogs[0]).length === 0) throw err;
            continue;
          }
        }
        throw err;
      }
    }
  }
};
