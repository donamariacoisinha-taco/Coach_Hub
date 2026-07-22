import { supabase } from '../lib/api/supabase';
import { AthleteMemory, ExercisePerformanceMemory, WorkoutHistory, ExperienceLevel } from '../types';

let athleteMemoryRemoteAvailable: boolean | null = null;
let performanceMemoryRemoteAvailable: boolean | null = null;
let warnedAthleteMemoryUnavailable = false;
let warnedPerformanceMemoryUnavailable = false;

const isMissingTableError = (error: any): boolean => {
  const message = String(error?.message || error?.details || error || '').toLowerCase();
  return error?.status === 404 ||
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('not found') ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache');
};

const warnOnce = (kind: 'athlete' | 'performance', message: string, error?: any) => {
  if (!import.meta.env.DEV) return;
  if (kind === 'athlete') {
    if (warnedAthleteMemoryUnavailable) return;
    warnedAthleteMemoryUnavailable = true;
  } else {
    if (warnedPerformanceMemoryUnavailable) return;
    warnedPerformanceMemoryUnavailable = true;
  }
  console.warn(message, error?.message || error || '');
};

// Web Audio API helper to synthesize pristine, high-end sounds (no static loading required)
export const playSensoryTone = (type: 'confirm' | 'success' | 'click' | 'focus' | 'pulse' | 'warning') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const profiles: Record<typeof type, { start: number; end: number; gain: number; duration: number; wave?: OscillatorType }> = {
      click: { start: 600, end: 1200, gain: 0.04, duration: 0.06, wave: 'sine' },
      confirm: { start: 880, end: 440, gain: 0.08, duration: 0.16, wave: 'sine' },
      success: { start: 523.25, end: 783.99, gain: 0.06, duration: 0.45, wave: 'triangle' },
      focus: { start: 150, end: 100, gain: 0.12, duration: 0.4, wave: 'sine' },
      pulse: { start: 1000, end: 1000, gain: 0.02, duration: 0.02, wave: 'sine' },
      warning: { start: 220, end: 180, gain: 0.03, duration: 0.25, wave: 'sawtooth' },
    };

    const p = profiles[type];
    osc.type = p.wave || 'sine';
    osc.frequency.setValueAtTime(p.start, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, p.end), ctx.currentTime + p.duration * 0.7);
    gain.gain.setValueAtTime(p.gain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + p.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + p.duration);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[Sensory Tone] AudioContext play failed', e);
  }
};

export const playHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' | 'success') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (intensity === 'light') navigator.vibrate(12);
      else if (intensity === 'medium') navigator.vibrate(30);
      else if (intensity === 'heavy') navigator.vibrate([60, 40, 60]);
      else if (intensity === 'success') navigator.vibrate([15, 30, 25]);
    } catch (e) {}
  }
};

const createDefaultMemory = (userId: string): AthleteMemory => ({
  user_id: userId,
  favorite_exercises: [],
  exercise_skip_patterns: {},
  average_rest_time: 90,
  weekly_frequency: 3,
  preferred_training_time: 'evening',
  average_rpe: 8.0,
  fatigue_patterns: {},
  recovery_profile: 'moderate',
  consistency_score: 75,
  volume_tolerance: 'medium',
  preferred_workout_duration: 50,
  motivation_profile: 'disciplined',
  most_successful_workout_split: 'AB',
  dropout_risk_score: 15,
  last_motivation_state: 'moderate',
  historical_adherence: 95,
  preferred_ui_density: 'cozy',
  training_personality: 'Consistente Pragmático',
  adaptation_level: 80,
  last_updated_at: new Date().toISOString(),
});

const getLocalMemory = (userId: string): AthleteMemory | null => {
  const localCached = localStorage.getItem(`coach_rubi_mem_${userId}`);
  if (!localCached) return null;
  try {
    return JSON.parse(localCached) as AthleteMemory;
  } catch (e) {
    return null;
  }
};

const getLocalPerformance = (userId: string, exerciseId: string): ExercisePerformanceMemory | null => {
  const localCached = localStorage.getItem(`coach_rubi_perf_${userId}_${exerciseId}`);
  if (!localCached) return null;
  try {
    return JSON.parse(localCached) as ExercisePerformanceMemory;
  } catch (e) {
    return null;
  }
};

export const athleteMemoryEngine = {
  async getMemory(userId: string): Promise<AthleteMemory> {
    if (!userId) return createDefaultMemory('guest');

    const local = getLocalMemory(userId);
    if (local) return local;

    if (athleteMemoryRemoteAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('athlete_memory')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          if (isMissingTableError(error)) {
            athleteMemoryRemoteAvailable = false;
            warnOnce('athlete', '[MemoryEngine] athlete_memory unavailable. Remote reads disabled for this session.', error);
          } else {
            throw error;
          }
        } else {
          athleteMemoryRemoteAvailable = true;
          if (data) {
            localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(data));
            return data as AthleteMemory;
          }
        }
      } catch (dbError) {
        if (isMissingTableError(dbError)) {
          athleteMemoryRemoteAvailable = false;
          warnOnce('athlete', '[MemoryEngine] athlete_memory unavailable. Remote reads disabled for this session.', dbError);
        } else if (import.meta.env.DEV) {
          console.warn('[MemoryEngine] athlete_memory query failed, using offline store.', dbError);
        }
      }
    }

    const defaultMem = createDefaultMemory(userId);
    localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(defaultMem));
    return defaultMem;
  },

  async saveMemory(memory: AthleteMemory): Promise<void> {
    const userId = memory.user_id;
    const payload = { ...memory, last_updated_at: new Date().toISOString() };
    localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(payload));

    if (athleteMemoryRemoteAvailable === false) return;

    try {
      const { error } = await supabase.from('athlete_memory').upsert(payload);
      if (error) {
        if (isMissingTableError(error)) {
          athleteMemoryRemoteAvailable = false;
          warnOnce('athlete', '[MemoryEngine] athlete_memory unavailable. Remote writes disabled for this session.', error);
          return;
        }
        console.warn('[MemoryEngine] Supabase athlete_memory upsert failed, continuing offline.', error.message);
      } else {
        athleteMemoryRemoteAvailable = true;
      }
    } catch (dbError) {
      if (isMissingTableError(dbError)) {
        athleteMemoryRemoteAvailable = false;
        warnOnce('athlete', '[MemoryEngine] athlete_memory unavailable. Remote writes disabled for this session.', dbError);
      }
    }
  },

  async learnFromWorkoutSession(
    userId: string,
    historyId: string,
    workoutTitle: string,
    durationMinutes: number,
    loggedExercises: any[]
  ): Promise<AthleteMemory> {
    const mem = await this.getMemory(userId);
    const hour = new Date().getHours();
    mem.preferred_training_time = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
    mem.preferred_workout_duration = Math.round((mem.preferred_workout_duration * 4 + durationMinutes) / 5);

    let totalSets = 0;
    let sumRpe = 0;
    const muscleWorkload: Record<string, number> = { ...mem.fatigue_patterns };

    for (const le of loggedExercises || []) {
      if (!le.exercise_id) continue;
      const sets = le.sets || [];
      totalSets += sets.length;

      let maxWeight = 0;
      let maxReps = 0;
      let exerciseRpeSum = 0;
      let validSetsCount = 0;

      sets.forEach((set: any) => {
        const w = parseFloat(set.weight) || 0;
        const r = parseInt(set.reps) || 0;
        const rp = parseFloat(set.rpe) || 8;
        sumRpe += rp;
        exerciseRpeSum += rp;
        validSetsCount++;
        if (w > maxWeight) maxWeight = w;
        if (r > maxReps) maxReps = r;
      });

      const avgRpeForThis = validSetsCount > 0 ? exerciseRpeSum / validSetsCount : 8;
      await this.learnPerformanceMemory(userId, le.exercise_id, maxWeight, maxReps, avgRpeForThis);
      const muscle = le.muscle_group || 'Geral';
      muscleWorkload[muscle] = Math.min(100, (muscleWorkload[muscle] || 0) + sets.length * 8);
    }

    mem.fatigue_patterns = muscleWorkload;
    if (totalSets > 0) {
      mem.average_rpe = parseFloat(((mem.average_rpe * 9 + sumRpe / totalSets) / 10).toFixed(1));
    }

    mem.weekly_frequency = Math.min(7, mem.weekly_frequency + 0.2);
    mem.consistency_score = Math.min(100, mem.consistency_score + 3);
    mem.dropout_risk_score = Math.max(0, mem.dropout_risk_score - 5);
    mem.last_motivation_state = 'high';
    mem.historical_adherence = Math.min(100, Math.round((mem.historical_adherence * 9 + 100) / 10));
    mem.volume_tolerance = totalSets > 24 ? 'high' : totalSets < 10 ? 'low' : 'medium';
    mem.recovery_profile = mem.consistency_score > 85 && mem.volume_tolerance === 'high' ? 'fast' : mem.consistency_score < 50 ? 'slow' : 'moderate';
    mem.training_personality = mem.average_rpe >= 8.8 ? 'Focado em Intensidade (Hardcore)' : mem.consistency_score >= 90 ? 'Consistente Metódico' : mem.adaptation_level > 85 ? 'Atleta Resiliente Adaptativo' : 'Buscador de Performance';
    mem.adaptation_level = Math.min(100, Math.max(10, mem.adaptation_level + 2));
    mem.last_updated_at = new Date().toISOString();

    await this.saveMemory(mem);
    return mem;
  },

  async trackExerciseSkip(userId: string, exerciseId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    if (!mem.exercise_skip_patterns) mem.exercise_skip_patterns = {};
    mem.exercise_skip_patterns[exerciseId] = (mem.exercise_skip_patterns[exerciseId] || 0) + 1;
    mem.adaptation_level = Math.max(10, mem.adaptation_level - 1);
    await this.saveMemory(mem);
  },

  async trackExerciseIntensityReduction(userId: string, exerciseId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    mem.average_rpe = parseFloat(Math.max(4, mem.average_rpe - 0.1).toFixed(1));
    mem.adaptation_level = Math.min(100, mem.adaptation_level + 1);
    await this.saveMemory(mem);
  },

  async trackWorkoutAbandonment(userId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    mem.dropout_risk_score = Math.min(100, mem.dropout_risk_score + 15);
    mem.last_motivation_state = 'low';
    mem.consistency_score = Math.max(10, mem.consistency_score - 8);
    mem.historical_adherence = Math.max(0, Math.round((mem.historical_adherence * 9 + 0) / 10));
    await this.saveMemory(mem);
  },

  async getPerformanceMemory(userId: string, exerciseId: string): Promise<ExercisePerformanceMemory | null> {
    const local = getLocalPerformance(userId, exerciseId);
    if (local) return local;

    if (performanceMemoryRemoteAvailable === false) return null;

    try {
      const { data, error } = await supabase
        .from('exercise_performance_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          performanceMemoryRemoteAvailable = false;
          warnOnce('performance', '[MemoryEngine] exercise_performance_memory unavailable. Remote reads disabled for this session.', error);
          return null;
        }
        throw error;
      }

      performanceMemoryRemoteAvailable = true;
      if (data) {
        localStorage.setItem(`coach_rubi_perf_${userId}_${exerciseId}`, JSON.stringify(data));
        return data as ExercisePerformanceMemory;
      }
    } catch (e) {
      if (isMissingTableError(e)) {
        performanceMemoryRemoteAvailable = false;
        warnOnce('performance', '[MemoryEngine] exercise_performance_memory unavailable. Remote reads disabled for this session.', e);
      }
    }

    return null;
  },

  async learnPerformanceMemory(userId: string, exerciseId: string, weight: number, reps: number, rpe: number): Promise<ExercisePerformanceMemory> {
    const current = await this.getPerformanceMemory(userId, exerciseId) || {
      user_id: userId,
      exercise_id: exerciseId,
      previous_loads: [],
      rep_history: [],
      rpe_history: [],
      best_weight: 0,
      best_reps: 0,
      best_1rm: 0,
      best_execution_rpe: rpe,
      average_rest_used: 90,
      last_completed_at: null,
      fatigue_response: 'moderate' as const,
    };

    const current1RM = weight * (1 + reps / 30);
    current.previous_loads = [...(current.previous_loads || []).slice(-5), weight];
    current.rep_history = [...(current.rep_history || []).slice(-5), reps];
    current.rpe_history = [...(current.rpe_history || []).slice(-5), rpe];

    if (weight > current.best_weight) {
      current.best_weight = weight;
      current.best_reps = reps;
      current.best_execution_rpe = rpe;
    }
    if (current1RM > current.best_1rm) current.best_1rm = Math.round(current1RM);

    current.fatigue_response = rpe >= 9 ? 'high' : rpe <= 6 ? 'low' : 'moderate';
    current.last_completed_at = new Date().toISOString();

    localStorage.setItem(`coach_rubi_perf_${userId}_${exerciseId}`, JSON.stringify(current));

    if (performanceMemoryRemoteAvailable !== false) {
      try {
        const { error } = await supabase.from('exercise_performance_memory').upsert(current);
        if (error) {
          if (isMissingTableError(error)) {
            performanceMemoryRemoteAvailable = false;
            warnOnce('performance', '[MemoryEngine] exercise_performance_memory unavailable. Remote writes disabled for this session.', error);
          } else {
            console.warn('[MemoryEngine] performance memory upsert failed, continuing offline.', error.message);
          }
        } else {
          performanceMemoryRemoteAvailable = true;
        }
      } catch (e) {
        if (isMissingTableError(e)) {
          performanceMemoryRemoteAvailable = false;
          warnOnce('performance', '[MemoryEngine] exercise_performance_memory unavailable. Remote writes disabled for this session.', e);
        }
      }
    }

    return current;
  },

  async predictLoadSuggestion(userId: string, exerciseId: string, experienceLevel: ExperienceLevel): Promise<{
    suggestedWeight: number;
    suggestedReps: number;
    indicator: 'increase' | 'maintain' | 'deload';
    message: string;
  }> {
    const memory = await this.getMemory(userId);
    const perf = await this.getPerformanceMemory(userId, exerciseId);

    if (!perf || perf.previous_loads.length === 0) {
      return { suggestedWeight: 0, suggestedReps: 10, indicator: 'maintain', message: 'Nova experiência. Encontre uma carga confortável.' };
    }

    const lastWeight = perf.previous_loads[perf.previous_loads.length - 1] || 0;
    const lastReps = perf.rep_history[perf.rep_history.length - 1] || 10;
    const lastRpe = perf.rpe_history[perf.rpe_history.length - 1] || 8;

    let suggestedWeight = lastWeight;
    const suggestedReps = lastReps;
    let indicator: 'increase' | 'maintain' | 'deload' = 'maintain';
    let message = 'Densidade ideal. Manter peso anterior para lapidar.';

    if (memory.adaptation_level < 50 || memory.last_motivation_state === 'low') {
      indicator = 'deload';
      suggestedWeight = Math.max(0, parseFloat((lastWeight * 0.9).toFixed(1)));
      message = 'Preservar organismo. Redução preventiva de 10% hoje.';
    } else if (lastRpe <= 7.5 && lastReps >= 8) {
      indicator = 'increase';
      const step = experienceLevel === ExperienceLevel.ADVANCED ? 1 : 2.5;
      suggestedWeight = lastWeight + step;
      message = `Próxima: ${suggestedWeight}kg ↑`;
    } else if (lastRpe >= 9.5) {
      message = 'Carga máxima atingida. Foco total em execução limpa.';
    }

    return { suggestedWeight, suggestedReps, indicator, message };
  },

  generateContextualInsights(memory: AthleteMemory, history: WorkoutHistory[]): string[] {
    const insights: string[] = [];
    if (!history || history.length === 0) return ['Seja bem-vindo ao KYRON OS. Seu ritmo e biologia serão lembrados a partir de hoje.'];

    const streak = memory.consistency_score;
    if (streak > 85) insights.push(`Você manteve consistência excelente nas últimas sessões. Seu ritmo de treino está estabilizado em ${Math.round(streak)}%.`);
    else if (streak < 40) insights.push('Últimas sessões espaçadas. Vamos retomar o ritmo aos poucos, com carga reduzida.');

    const complexMuscles = Object.entries(memory.fatigue_patterns || {})
      .filter(([_, level]) => level > 75)
      .map(([muscle]) => muscle.toLowerCase());

    if (complexMuscles.length > 0) insights.push(`Seu volume de ${complexMuscles.join(', ')} está acumulado. Priorize reidratação e regeneração hoje.`);
    if (memory.average_rpe > 8.5) insights.push('Você treina em intensidade elevada. Experimente o modo de foco compactado durante a execução.');
    if (memory.training_personality) insights.push(`Seu perfil atual: "${memory.training_personality}". Sua mente guia o seu corpo.`);

    return insights;
  },
};
