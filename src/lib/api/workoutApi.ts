
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
      folders: foldersRes.data as WorkoutFolder[],
      workouts: workoutsRes.data as WorkoutCategory[],
      history: historyRes.data as WorkoutHistory[],
      stats: { sessions: historyRes.data?.length || 0 }
    };
  },

  async deleteWorkout(id: string) {
    const { error } = await supabase.from('workout_categories').delete().eq('id', id);
    if (error) throw error;
  },

  async getWorkoutInitData(workoutId: string, userId: string) {
    const [catRes, exRes, partialRes] = await Promise.all([
      supabase.from('workout_categories').select('*').eq('id', workoutId).single(),
      supabase.from('workout_exercises').select(`*, exercises (*)`).eq('category_id', workoutId).order('sort_order'),
      supabase.from('partial_workout_sessions').select('*').eq('user_id', userId).eq('workout_id', workoutId).maybeSingle()
    ]);

    if (catRes.error) throw catRes.error;
    if (exRes.error) throw exRes.error;

    const loadedExercises = (exRes.data || []).filter((item: any) => item.exercises).map((item: any) => ({
      ...item,
      exercise_name: item.exercises.name,
      muscle_group: item.exercises.muscle_group,
      image_url: item.exercises.image_url
    }));

    return {
      category: catRes.data as WorkoutCategory,
      exercises: loadedExercises as WorkoutExercise[],
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

  async finishWorkout(historyId: string, durationMinutes: number, exercisesCount: number) {
    const { error } = await supabase.from('workout_history').update({ 
      duration_minutes: durationMinutes, 
      completed_at: new Date().toISOString(), 
      exercises_count: exercisesCount 
    }).eq('id', historyId);
    
    if (error) throw error;
  },

  async abandonWorkout(historyId: string) {
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
    return data;
  },

  async getWorkoutHistory(userId: string) {
    const { data, error } = await supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getExerciseList() {
    const { data, error } = await supabase
      .from('exercise_progress')
      .select('exercise_id, exercises(name)')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getWorkoutDetails(historyId: string) {
    const { data, error } = await supabase.from('workout_sets_log').select(`*, exercises (name, muscle_group)`).eq('history_id', historyId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getWorkoutEditorData(userId: string, workoutId?: string) {
    const queries: any[] = [
      supabase.from('workout_folders').select('*').eq('user_id', userId).order('name'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
      supabase.from('exercises').select('*').order('name')
    ];

    if (workoutId) {
      queries.push(supabase.from('workout_categories').select('*').eq('id', workoutId).single());
      queries.push(supabase.from('workout_exercises').select('*').eq('category_id', workoutId).order('sort_order'));
    }

    const results = await Promise.all(queries);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;

    return {
      folders: results[0].data as WorkoutFolder[],
      muscleGroups: results[1].data as MuscleGroup[],
      exercises: results[2].data as Exercise[],
      category: workoutId ? results[3].data as WorkoutCategory : null,
      workoutExercises: workoutId ? results[4].data as WorkoutExercise[] : []
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
    const { error } = await supabase.from('workout_exercises').insert(exercises);
    if (error) throw error;
  },

  async upsertPartialWorkoutSession(payload: any) {
    const { error } = await supabase.from('partial_workout_sessions').upsert(payload);
    if (error) throw error;
  },

  async getWorkoutLogsSimple(historyId: string) {
    const { data, error } = await supabase.from('workout_sets_log').select('*').eq('history_id', historyId);
    if (error) throw error;
    return data;
  },

  async getPartialSession(userId: string) {
    const { data, error } = await supabase
      .from('partial_workout_sessions')
      .select('workout_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveSetLog(payload: any) {
    const { error } = await supabase.from('workout_sets_log').insert([payload]);
    return { error };
  }
};
