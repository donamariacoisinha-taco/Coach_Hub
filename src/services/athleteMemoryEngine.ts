import { supabase } from '../lib/api/supabase';
import { AthleteMemory, ExercisePerformanceMemory, WorkoutHistory, WorkoutCategory, WorkoutExercise, ExperienceLevel } from '../types';

// Web Audio API helper to synthesize pristine, high-end sounds (no static loading required)
export const playSensoryTone = (type: 'confirm' | 'success' | 'click' | 'focus' | 'pulse' | 'warning') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play sound depending on tone request
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } 
    else if (type === 'confirm') {
      // Warm elegant digital drop click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
    else if (type === 'success') {
      // Golden dual-tone bell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      // Make it soft and elegant
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start(ctx.currentTime + 0.16);
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.6);
    }
    else if (type === 'focus') {
      // Deep focus resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
    else if (type === 'pulse') {
      // Small tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    }
    else if (type === 'warning') {
      // Lower, subtle warning synth
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("[Sensory Tone] AudioContext play failed", e);
  }
};

// Tactical vibration support (if supported by device)
export const playHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' | 'success') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (intensity === 'light') {
        navigator.vibrate(12);
      } else if (intensity === 'medium') {
        navigator.vibrate(30);
      } else if (intensity === 'heavy') {
        navigator.vibrate([60, 40, 60]);
      } else if (intensity === 'success') {
        navigator.vibrate([15, 30, 25]);
      }
    } catch (e) {}
  }
};

// Default Memory Blueprint to fall back on or bootstrap
const createDefaultMemory = (userId: string): AthleteMemory => ({
  user_id: userId,
  favorite_exercises: [],
  exercise_skip_patterns: {},
  average_rest_time: 90,
  weekly_frequency: 3,
  preferred_training_time: "evening",
  average_rpe: 8.0,
  fatigue_patterns: {},
  recovery_profile: 'moderate',
  consistency_score: 75,
  volume_tolerance: 'medium',
  preferred_workout_duration: 50,
  motivation_profile: 'disciplined',
  most_successful_workout_split: "AB",
  dropout_risk_score: 15,
  last_motivation_state: "moderate",
  historical_adherence: 95,
  preferred_ui_density: 'cozy',
  training_personality: "Consistente Pragmático",
  adaptation_level: 80,
  last_updated_at: new Date().toISOString()
});

export const athleteMemoryEngine = {
  /**
   * Reads AthleteMemory safely with local storage backup in case database tables are missing/empty
   */
  async getMemory(userId: string): Promise<AthleteMemory> {
    if (!userId) return createDefaultMemory('guest');
    
    // 1. Try local cache first to render immediately
    const localCached = localStorage.getItem(`coach_rubi_mem_${userId}`);
    if (localCached) {
      try {
        return JSON.parse(localCached) as AthleteMemory;
      } catch (e) {}
    }

    try {
      const { data, error } = await supabase
        .from('athlete_memory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(data));
        return data as AthleteMemory;
      }
    } catch (dbError) {
      console.warn("[MemoryEngine] athlete_memory table not found or query error, using offline store.", dbError);
    }

    // Bootstrap default
    const defaultMem = createDefaultMemory(userId);
    localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(defaultMem));
    return defaultMem;
  },

  /**
   * Persists AthleteMemory cleanly to both local cache and Supabase
   */
  async saveMemory(memory: AthleteMemory): Promise<void> {
    const userId = memory.user_id;
    localStorage.setItem(`coach_rubi_mem_${userId}`, JSON.stringify(memory));

    try {
      // First check if table query is supported
      const { error } = await supabase
        .from('athlete_memory')
        .upsert({ ...memory, last_updated_at: new Date().toISOString() });
      if (error) {
        console.warn("[MemoryEngine] Supabase table upsert failed, continuing offline.", error.message);
      }
    } catch (dbError) {
      // Table doesn't exist, ignore and use offline store
    }
  },

  /**
   * Learn from a completed workout session
   */
  async learnFromWorkoutSession(
    userId: string,
    historyId: string,
    workoutTitle: string,
    durationMinutes: number,
    loggedExercises: any[] // structure: { exercise_id, exercise_name, sets: [{ weight, reps, rpe }] }[]
  ): Promise<AthleteMemory> {
    const mem = await this.getMemory(userId);
    
    // 1. Preferred Training Time Recognition
    const hour = new Date().getHours();
    let timeCategory = "evening";
    if (hour >= 5 && hour < 12) timeCategory = "morning";
    else if (hour >= 12 && hour < 18) timeCategory = "afternoon";
    else timeCategory = "evening";
    
    mem.preferred_training_time = timeCategory;

    // 2. Average Workout Duration calculation
    mem.preferred_workout_duration = Math.round(
      (mem.preferred_workout_duration * 4 + durationMinutes) / 5
    );

    // 3. Process each exercises performance memory & update fatigue
    let totalSets = 0;
    let sumRpe = 0;
    const muscleWorkload: Record<string, number> = { ...mem.fatigue_patterns };

    for (const le of loggedExercises) {
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

      // Update Exercise Performance Memory
      const avgRpeForThis = validSetsCount > 0 ? exerciseRpeSum / validSetsCount : 8;
      await this.learnPerformanceMemory(userId, le.exercise_id, maxWeight, maxReps, avgRpeForThis);

      // Accumulate primary muscle fatigue
      const muscle = le.muscle_group || "Geral";
      muscleWorkload[muscle] = Math.min(100, (muscleWorkload[muscle] || 0) + sets.length * 8);
    }

    mem.fatigue_patterns = muscleWorkload;

    // 4. Update overall average RPE
    if (totalSets > 0) {
      const sessionAvgRpe = sumRpe / totalSets;
      mem.average_rpe = parseFloat(((mem.average_rpe * 9 + sessionAvgRpe) / 10).toFixed(1));
    }

    // 5. Update Weekly Frequency & Consistency Score
    mem.weekly_frequency = Math.min(7, mem.weekly_frequency + 0.2);
    mem.consistency_score = Math.min(100, mem.consistency_score + 3);

    // Decreasing dropout risk with completion
    mem.dropout_risk_score = Math.max(0, mem.dropout_risk_score - 5);
    mem.last_motivation_state = "high";
    mem.historical_adherence = Math.min(100, Math.round((mem.historical_adherence * 9 + 100) / 10));

    // Dynamic Volume Tolerance assessment
    if (totalSets > 24) {
      mem.volume_tolerance = 'high';
    } else if (totalSets < 10) {
      mem.volume_tolerance = 'low';
    } else {
      mem.volume_tolerance = 'medium';
    }

    // Adapt recovery profile based on volume and consistency
    if (mem.consistency_score > 85 && mem.volume_tolerance === 'high') {
      mem.recovery_profile = 'fast';
    } else if (mem.consistency_score < 50) {
      mem.recovery_profile = 'slow';
    } else {
      mem.recovery_profile = 'moderate';
    }

    // Determine personality archetype
    if (mem.average_rpe >= 8.8) {
      mem.training_personality = "Focado em Intensidade (Hardcore)";
    } else if (mem.consistency_score >= 90) {
      mem.training_personality = "Consistente Metódico";
    } else if (mem.adaptation_level > 85) {
      mem.training_personality = "Atleta Resiliente Adaptativo";
    } else {
      mem.training_personality = "Buscador de Performance";
    }

    mem.adaptation_level = Math.min(100, Math.max(10, mem.adaptation_level + 2));
    mem.last_updated_at = new Date().toISOString();

    await this.saveMemory(mem);
    return mem;
  },

  /**
   * Tracks skipped exercises to dynamically learn skip aversion patterns
   */
  async trackExerciseSkip(userId: string, exerciseId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    if (!mem.exercise_skip_patterns) mem.exercise_skip_patterns = {};
    
    mem.exercise_skip_patterns[exerciseId] = (mem.exercise_skip_patterns[exerciseId] || 0) + 1;
    
    // Adjust adaptation level and motivation state slightly
    mem.adaptation_level = Math.max(10, mem.adaptation_level - 1);
    
    // If user skips the same exercise more than 3 times, suggest alternative or adapt split
    if (mem.exercise_skip_patterns[exerciseId] >= 3) {
      // Add behavior recognition trigger
      console.log(`[AthleteMemory] Skipper trigger activated for exercise ${exerciseId}`);
    }

    await this.saveMemory(mem);
  },

  /**
   * Tracks decreased intensity behavior
   */
  async trackExerciseIntensityReduction(userId: string, exerciseId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    // Lower average RPE slightly to reflect training fatigue/reserve
    mem.average_rpe = parseFloat(Math.max(4, mem.average_rpe - 0.1).toFixed(1));
    mem.adaptation_level = Math.min(100, mem.adaptation_level + 1); // adapting intensity is positive adaptation behavior!
    await this.saveMemory(mem);
  },

  /**
   * Track session/workout abandonment to calculate Dropout Risk
   */
  async trackWorkoutAbandonment(userId: string): Promise<void> {
    const mem = await this.getMemory(userId);
    
    // Raise dropout risk score
    mem.dropout_risk_score = Math.min(100, mem.dropout_risk_score + 15);
    mem.last_motivation_state = "low";
    mem.consistency_score = Math.max(10, mem.consistency_score - 8);
    mem.historical_adherence = Math.max(0, Math.round((mem.historical_adherence * 9 + 0) / 10));
    
    await this.saveMemory(mem);
  },

  /**
   * Manage performance memory of separate exercises
   */
  async getPerformanceMemory(userId: string, exerciseId: string): Promise<ExercisePerformanceMemory | null> {
    const localKey = `coach_rubi_perf_${userId}_${exerciseId}`;
    const localCached = localStorage.getItem(localKey);
    if (localCached) {
      try {
        return JSON.parse(localCached);
      } catch (e) {}
    }

    try {
      const { data, error } = await supabase
        .from('exercise_performance_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data as ExercisePerformanceMemory;
      }
    } catch (e) {}

    return null;
  },

  async learnPerformanceMemory(
    userId: string,
    exerciseId: string,
    weight: number,
    reps: number,
    rpe: number
  ): Promise<ExercisePerformanceMemory> {
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
      fatigue_response: 'moderate' as const
    };

    // Calculate estimated 1-Rep-Max (Epley Formula)
    const current1RM = weight * (1 + reps / 30);

    // Keep up to 6 historic data points
    current.previous_loads = [...(current.previous_loads || []).slice(-5), weight];
    current.rep_history = [...(current.rep_history || []).slice(-5), reps];
    current.rpe_history = [...(current.rpe_history || []).slice(-5), rpe];

    if (weight > current.best_weight) {
      current.best_weight = weight;
      current.best_reps = reps;
      current.best_execution_rpe = rpe;
    }
    if (current1RM > current.best_1rm) {
      current.best_1rm = Math.round(current1RM);
    }

    // Simple fatigue assessment based on RPE
    current.fatigue_response = rpe >= 9 ? 'high' : rpe <= 6 ? 'low' : 'moderate';
    current.last_completed_at = new Date().toISOString();

    const localKey = `coach_rubi_perf_${userId}_${exerciseId}`;
    localStorage.setItem(localKey, JSON.stringify(current));

    try {
      await supabase.from('exercise_performance_memory').upsert(current);
    } catch (e) {}

    return current;
  },

  /**
   * Predictive Load Engine
   */
  async predictLoadSuggestion(
    userId: string,
    exerciseId: string,
    experienceLevel: ExperienceLevel
  ): Promise<{
    suggestedWeight: number;
    suggestedReps: number;
    indicator: 'increase' | 'maintain' | 'deload';
    message: string;
  }> {
    const memory = await this.getMemory(userId);
    const perf = await this.getPerformanceMemory(userId, exerciseId);

    if (!perf || perf.previous_loads.length === 0) {
      return {
        suggestedWeight: 0, // Fallback to current workout target
        suggestedReps: 10,
        indicator: 'maintain',
        message: 'Nova experiência. Encontre uma carga confortável.'
      };
    }

    const lastWeight = perf.previous_loads[perf.previous_loads.length - 1] || 0;
    const lastReps = perf.rep_history[perf.rep_history.length - 1] || 10;
    const lastRpe = perf.rpe_history[perf.rpe_history.length - 1] || 8;

    // Core Load Decision Algorithm
    let suggestedWeight = lastWeight;
    let suggestedReps = lastReps;
    let indicator: 'increase' | 'maintain' | 'deload' = 'maintain';
    let message = 'Manter carga atual para巩固 técnica.';

    // Reduce due to accumulated general fatigue
    if (memory.adaptation_level < 50 || memory.last_motivation_state === 'low') {
      indicator = 'deload';
      suggestedWeight = Math.max(0, parseFloat((lastWeight * 0.9).toFixed(1)));
      message = 'Preservar organismo. Redução preventiva de 10% hoje.';
      return { suggestedWeight, suggestedReps, indicator, message };
    }

    // Standard progressive overload based on performance and RPE
    if (lastRpe <= 7.5 && lastReps >= 8) {
      indicator = 'increase';
      const step = experienceLevel === ExperienceLevel.ADVANCED ? 1 : 2.5; 
      suggestedWeight = lastWeight + step;
      message = `Próxima: ${suggestedWeight}kg ↑`;
    } else if (lastRpe >= 9.5) {
      indicator = 'maintain';
      message = 'Carga máxima atingida. Foco total em execução limpa.';
    } else {
      indicator = 'maintain';
      message = 'Densidade ideal. Manter peso anterior para lapidar.';
    }

    return { suggestedWeight, suggestedReps, indicator, message };
  },

  /**
   * Emotionally Intelligent Context Insights Layer
   */
  generateContextualInsights(memory: AthleteMemory, history: WorkoutHistory[]): string[] {
    const insights: string[] = [];
    if (!history || history.length === 0) {
      return ["Seja bem-vindo ao Coach Rubi. Seu ritmo e biologia serão lembrados a partir de hoje."];
    }

    // 1. Consistency / Streak Observation
    const streak = memory.consistency_score;
    if (streak > 85) {
      insights.push(`Você manteve consistência excelente nas últimas sessões. Seu ritmo de treino está estabilizado em ${Math.round(streak)}%.`);
    } else if (streak < 40) {
      insights.push(`Últimas sessões espaçadas. Vamos retomar o ritmo aos poucos, com carga reduzida.`);
    }

    // 2. Dropout Risk Warning
    if (memory.dropout_risk_score > 40) {
      insights.push(`Detectamos fadiga ou quebra de ritmo recente. Coach Rubi sugere focar em consistência hoje, ignorando recordes.`);
    }

    // 3. Muscle Fatigue Overlap warning
    const fatigue = memory.fatigue_patterns || {};
    const complexMuscles = Object.entries(fatigue)
      .filter(([_, level]) => level > 75)
      .map(([muscle]) => muscle.toLowerCase());

    if (complexMuscles.length > 0) {
      insights.push(`Seu volume de ${complexMuscles.join(', ')} está acumulado. Priorize reidratação e regeneração hoje.`);
    }

    // 4. Preferred UI density selection recommendation
    if (memory.average_rpe > 8.5) {
      insights.push(`Você treina em intensidade elevada. Experimente o modo de foco compactado durante a execução.`);
    }

    // 5. Training Personality reinforcement
    if (memory.training_personality) {
      insights.push(`Seu perfil atual: "${memory.training_personality}". Sua mente guia o seu corpo.`);
    }

    return insights;
  }
};
