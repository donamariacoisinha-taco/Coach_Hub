
import { supabase } from './supabase';
import { WorkoutCategory, WorkoutExercise, WorkoutFolder, WorkoutHistory, UserProfile, MuscleGroup, Exercise } from '../../types';

export const workoutApi = {
  async getDashboardData(userId: string) {
    const [profileRes, foldersRes, workoutsRes, historyRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
      supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false })
    ]);

    if (profileRes.error) throw profileRes.error;
    if (foldersRes.error) throw foldersRes.error;
    if (workoutsRes.error) throw workoutsRes.error;
    if (historyRes.error) throw historyRes.error;

    return {
      profile: profileRes.data as UserProfile | null,
      folders: (foldersRes.data || []) as WorkoutFolder[],
      workouts: (workoutsRes.data || []) as WorkoutCategory[],
      history: (historyRes.data || []) as WorkoutHistory[],
      stats: { sessions: historyRes.data?.length || 0 }
    };
  },

  async deleteWorkout(id: string) {
    const { error } = await supabase.from('workout_categories').delete().eq('id', id);
    if (error) throw error;
  },

  async getWorkoutInitData(workoutId: string, userId: string) {
    // We use a more explicit column list for exercises to avoid schema cache issues with newly added EKE columns
    const [catRes, exRes, partialRes] = await Promise.all([
      supabase.from('workout_categories').select('*').eq('id', workoutId).single(),
      supabase.from('workout_exercises')
        .select(`*, exercises (id, name, muscle_group, image_url, is_active)`)
        .eq('category_id', workoutId)
        .order('sort_order'),
      supabase.from('partial_workout_sessions').select('*').eq('user_id', userId).eq('workout_id', workoutId).maybeSingle()
    ]);

    if (catRes.error) throw catRes.error;
    if (exRes.error) throw exRes.error;

    const loadedExercises = (exRes.data || []).map((item: any) => ({
      ...item,
      exercise_name: item.exercises?.name || item.exercise_name_snapshot || item.exercise_name || 'Exercício Indisponível',
      muscle_group: item.exercises?.muscle_group || item.muscle_group,
      exercise_image: item.exercises?.image_url || item.exercise_image
    }));

    return {
      category: catRes.data as WorkoutCategory,
      exercises: (loadedExercises || []) as WorkoutExercise[],
      partialSession: partialRes.data
    };
  },

  async startWorkoutHistory(userId: string, workoutId: string, categoryName: string) {
    const { data, error } = await supabase.from('workout_history').insert([{ 
      user_id: userId, 
      category_id: workoutId, 
      category_name: categoryName 
    }]).select().single();
    
    if (error) throw error;
    return data as WorkoutHistory;
  },

  async upsertPartialSession(userId: string, workoutId: string, historyId: string, startTime: string) {
    const { error } = await supabase.from('partial_workout_sessions').upsert({ 
      user_id: userId, 
      workout_id: workoutId, 
      history_id: historyId, 
      start_time: startTime,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async updatePartialSession(historyId: string, currentIndex: number, currentSet: number) {
    const { error } = await supabase.from('partial_workout_sessions').update({
      current_index: currentIndex,
      current_set: currentSet,
      updated_at: new Date().toISOString()
    }).eq('history_id', historyId);
    if (error) throw error;
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

  async finishWorkout(historyId: string, durationMinutes: number, exercisesCount: number) {
    const { error: histError } = await supabase.from('workout_history').update({ 
      duration_minutes: durationMinutes, 
      completed_at: new Date().toISOString(), 
      exercises_count: exercisesCount 
    }).eq('id', historyId);
    
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
    // Primeiro limpamos todas as dependências que podem ter chaves estrangeiras
    const { offlineQueue } = await import('../offline/offlineQueue');
    await Promise.all([
      offlineQueue.clearByHistoryId(historyId),
      supabase.from('workout_sets_log').delete().eq('history_id', historyId),
      supabase.from('partial_workout_sessions').delete().eq('history_id', historyId)
    ]);

    // Depois abandonamos o histórico
    const { error } = await supabase.from('workout_history').delete().eq('id', historyId);
    if (error) throw error;
  },

  async clearPartialSession(userId: string) {
    const { error } = await supabase.from('partial_workout_sessions').delete().eq('user_id', userId);
    if (error) throw error;
  },

  async getWorkoutLogs(historyId: string) {
    const { data, error } = await supabase.from('workout_sets_log').select('weight_achieved, reps_achieved, exercise_id').eq('history_id', historyId);
    if (error) throw error;
    return data || [];
  },

  async getWorkoutHistory(userId: string) {
    const { data, error } = await supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getExerciseList() {
    const { data, error } = await supabase
      .from('exercise_progress')
      .select('exercise_id, exercises(name)')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getWorkoutDetails(historyId: string) {
    const { data, error } = await supabase.from('workout_sets_log').select(`*, exercises (name, muscle_group)`).eq('history_id', historyId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
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
    const queries: any[] = [
      supabase.from('workout_folders').select('*').eq('user_id', userId).order('name'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
      supabase.from('exercises').select('id, name, muscle_group, image_url, is_active').order('name')
    ];

    if (workoutId) {
      queries.push(supabase.from('workout_categories').select('*').eq('id', workoutId).single());
      queries.push(supabase.from('workout_exercises').select('*, exercises(*)').eq('category_id', workoutId).order('sort_order'));
    }

    const results = await Promise.all(queries);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;

    return {
      folders: (results[0].data || []) as WorkoutFolder[],
      muscleGroups: (results[1].data || []) as MuscleGroup[],
      exercises: (results[2].data || []) as Exercise[],
      category: workoutId ? results[3].data as WorkoutCategory : null,
      workoutExercises: workoutId ? (results[4].data || []) as WorkoutExercise[] : []
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

  async insertWorkoutExercises(exercises: any[]) {
    let currentExercises = [...exercises];
    
    while (true) {
      try {
        const { error } = await supabase.from('workout_exercises').insert(currentExercises);
        if (error) throw error;
        return;
      } catch (err: any) {
        // Resilience pattern: handle missing columns from schema
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[WORKOUT] Removing missing column from insert: ${badColumn}`);
            
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
    const { error } = await supabase.from('partial_workout_sessions').upsert(payload);
    if (error) throw error;
  },

  async getWorkoutLogsSimple(historyId: string) {
    const { data, error } = await supabase.from('workout_sets_log').select('*').eq('history_id', historyId);
    if (error) throw error;
    return data || [];
  },

  async getPartialSession(userId: string) {
    const { data, error } = await supabase
      .from('partial_workout_sessions')
      .select('workout_id, history_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
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
