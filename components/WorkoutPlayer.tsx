
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigation } from "../App";
import { WorkoutExercise, SetType, LastSetData, ProgressionInput } from "../types";

// --- PROGRESSION ENGINE ---
const getNextSetDecision = (input: ProgressionInput, history?: LastSetData) => {
  let nextWeight = input.weight;
  let action = 'maintain';
  let message = 'Mantenha o ritmo';

  if (input.rpe <= 7 && input.repsDone >= input.repsTarget) {
    nextWeight += 2.5;
    action = 'increase';
    message = 'Carga aumentada! +2.5kg';
  } else if (input.rpe === 8) {
    action = 'maintain';
    message = 'Peso ideal. Mantenha.';
  } else if (input.rpe >= 9) {
    if (input.repsDone < input.repsTarget - 2) {
      nextWeight = Math.max(0, nextWeight - 5);
      action = 'decrease_major';
      message = 'Redução técnica: -5kg';
    } else {
      nextWeight = Math.max(0, nextWeight - 2.5);
      action = 'decrease';
      message = 'Ajuste de carga: -2.5kg';
    }
  }

  return { nextWeight, action, message };
};

export default function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { navigate } = useNavigation();
  
  // Core State
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Execution State
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(8);
  
  // Progression & Feedback
  const [lastSet, setLastSet] = useState<LastSetData | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Session Tracking
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentEx = useMemo(() => exercises[currentIndex] || null, [exercises, currentIndex]);

  // Duration Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest Timer
  useEffect(() => {
    if (!isResting) return;
    if (timeLeft <= 0) {
      handleNextStep();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isResting, timeLeft]);

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [catRes, exRes, partialRes] = await Promise.all([
          supabase.from('workout_categories').select('*').eq('id', workoutId).single(),
          supabase.from('workout_exercises').select(`*, exercises (*)`).eq('category_id', workoutId).order('sort_order'),
          supabase.from('partial_workout_sessions').select('*').eq('user_id', user.id).eq('workout_id', workoutId).maybeSingle()
        ]);

        if (exRes.data) {
          const loadedExercises = exRes.data.filter((item: any) => item.exercises).map((item: any) => ({
            ...item,
            exercise_name: item.exercises.name,
            muscle_group: item.exercises.muscle_group,
            image_url: item.exercises.image_url
          }));
          setExercises(loadedExercises);

          if (partialRes.data) {
            setHistoryId(partialRes.data.history_id);
            setStartTime(new Date(partialRes.data.start_time || Date.now()).getTime());
            setCurrentIndex(partialRes.data.current_index || 0);
            setCurrentSet(partialRes.data.current_set || 1);
          } else {
            const { data: newHistory } = await supabase.from('workout_history').insert([{ 
              user_id: user.id, 
              category_id: workoutId, 
              category_name: catRes.data?.name || 'Treino' 
            }]).select().single();
            
            setHistoryId(newHistory?.id);
            setStartTime(Date.now());
            
            await supabase.from('partial_workout_sessions').upsert({ 
              user_id: user.id, 
              workout_id: workoutId, 
              history_id: newHistory?.id, 
              exercises_json: loadedExercises,
              start_time: new Date().toISOString(),
              updated_at: new Date().toISOString() 
            });
          }
        }
      } catch (err) {
        console.error("Error initializing workout:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [workoutId]);

  // Fetch Last Set Data
  const fetchLastSet = async (exerciseId: string) => {
    try {
      const { data } = await supabase
        .from("workout_sets_log")
        .select("weight_achieved, reps_achieved, rpe")
        .eq("exercise_id", exerciseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLastSet({
          weight: data.weight_achieved,
          reps: data.reps_achieved,
          rpe: data.rpe,
        });
      } else {
        setLastSet(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync state with current exercise/set
  useEffect(() => {
    if (currentEx) {
      const plan = currentEx.sets_json?.[currentSet - 1];
      if (plan) {
        setWeight(plan.weight);
        setReps(parseInt(plan.reps as string) || 0);
      }
      fetchLastSet(currentEx.exercise_id);
    }
  }, [currentIndex, currentSet, currentEx]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCompleteSet = async () => {
    if (saving || !currentEx || !historyId) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Progression Logic
      const repsTarget = parseInt(currentEx.sets_json?.[currentSet - 1]?.reps as string) || 10;
      const decision = getNextSetDecision(
        { weight, repsDone: reps, repsTarget, rpe },
        lastSet || undefined
      );

      // Save Log
      await supabase.from('workout_sets_log').upsert([{ 
        history_id: historyId,
        user_id: user?.id,
        exercise_id: currentEx.exercise_id,
        set_number: currentSet,
        weight_achieved: weight,
        reps_achieved: reps,
        rpe: rpe,
        set_type: SetType.NORMAL
      }], { onConflict: 'history_id,exercise_id,set_number' });

      // Apply Decision
      setWeight(decision.nextWeight);
      setFeedback(decision.message);
      setTimeout(() => setFeedback(null), 1800);

      // Update partial session
      await supabase.from('partial_workout_sessions').update({
        current_index: currentIndex,
        current_set: currentSet,
        updated_at: new Date().toISOString()
      }).eq('history_id', historyId);

      const restTime = currentEx.rest_time || 90;
      setTimeLeft(restTime);
      setIsResting(true);
      
      // Haptic
      if ('vibrate' in navigator) navigator.vibrate(50);
      
    } catch (err) {
      console.error("Error saving set:", err);
      alert("Erro ao salvar série.");
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    setIsResting(false);
    if (!currentEx) return;
    
    const totalSets = currentEx.sets_json?.length || 3;
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSet(1);
    } else {
      finishWorkout(true);
    }
  };

  const finishWorkout = async (isSuccess: boolean) => {
    if (!historyId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isSuccess) {
        await supabase.from('workout_history').update({ 
          duration_minutes: Math.round((Date.now() - startTime) / 60000), 
          completed_at: new Date().toISOString(), 
          exercises_count: exercises.length 
        }).eq('id', historyId);
      } else {
        await supabase.from('workout_history').delete().eq('id', historyId);
      }
      await supabase.from('partial_workout_sessions').delete().eq('user_id', user?.id);
      navigate('dashboard');
    } catch (err) {
      console.error("Error finishing workout:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100">
      <div className="max-w-md mx-auto w-full px-6 pt-8 pb-32 flex-1 flex flex-col relative">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100">
              {currentEx?.image_url ? (
                <img src={currentEx.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase">{currentEx?.exercise_name || 'Exercício'}</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                {currentEx?.muscle_group || 'Geral'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black tabular-nums text-gray-300 tracking-widest">
              {formatTime(workoutDuration)}
            </span>
            <button 
              onClick={() => setShowExitModal(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 active:scale-90 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* MAIN DISPLAY */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {!isResting ? (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="text-7xl font-black tracking-tighter tabular-nums text-gray-900 leading-none">
                {weight}<span className="text-2xl ml-1 text-gray-300 font-bold">kg</span>
                <span className="text-4xl text-gray-100 mx-3">×</span>
                {reps}
              </div>

              {/* CONTEXTO INTELIGENTE */}
              <div className="mt-10 space-y-2">
                {lastSet && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                    último: {lastSet.weight}kg × {lastSet.reps}
                  </p>
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                  próxima: {weight + 2.5}kg × {reps}
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="text-8xl font-black tracking-tighter tabular-nums text-gray-900 leading-none">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mt-6">Descanso</p>

              {/* TIMER CONTROLS */}
              <div className="flex items-center gap-8 mt-12">
                <button
                  onClick={() => setTimeLeft((t) => Math.max(0, t - 15))}
                  className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 active:scale-90 active:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => setTimeLeft((t) => t + 15)}
                  className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 active:scale-90 active:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLES DISCRETOS */}
        {!isResting && (
          <div className="mt-auto space-y-10 animate-in slide-in-from-bottom-4 duration-700">
            
            {/* RPE SELECTOR */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Esforço (RPE)</p>
              <div className="flex gap-2">
                {[7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRpe(val)}
                    className={`w-10 h-10 rounded-full text-[10px] font-black transition-all ${
                      rpe === val 
                        ? "bg-gray-900 text-white shadow-xl scale-110" 
                        : "bg-gray-50 text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* SET NAVIGATION */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (currentSet > 1) setCurrentSet(s => s - 1);
                    else if (currentIndex > 0) {
                      setCurrentIndex(i => i - 1);
                      setCurrentSet(exercises[currentIndex - 1].sets_json?.length || 3);
                    }
                  }}
                  className="p-2 text-gray-200 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                  Série {currentSet} / {currentEx?.sets_json?.length || 3}
                </span>
                <button
                  onClick={() => {
                    const totalSets = currentEx?.sets_json?.length || 3;
                    if (currentSet < totalSets) setCurrentSet(s => s + 1);
                    else if (currentIndex < exercises.length - 1) {
                      setCurrentIndex(i => i + 1);
                      setCurrentSet(1);
                    }
                  }}
                  className="p-2 text-gray-200 hover:text-gray-900 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* ADJUSTMENTS */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="p-2 text-gray-200 active:text-gray-900"><Minus size={18} /></button>
                  <span className="text-xs font-black tabular-nums min-w-[2.5rem] text-center">{weight}</span>
                  <button onClick={() => setWeight(w => w + 2.5)} className="p-2 text-gray-200 active:text-gray-900"><Plus size={18} /></button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setReps(r => Math.max(0, r - 1))} className="p-2 text-gray-200 active:text-gray-900"><Minus size={18} /></button>
                  <span className="text-xs font-black tabular-nums min-w-[1.5rem] text-center">{reps}</span>
                  <button onClick={() => setReps(r => r + 1)} className="p-2 text-gray-200 active:text-gray-900"><Plus size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[1200]
                          bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full
                          shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <Check size={14} className="text-green-400" />
              {feedback}
            </div>
          </div>
        )}

        {/* CTA PRINCIPAL */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md">
          <button
            onClick={isResting ? handleNextStep : handleCompleteSet}
            disabled={saving}
            className={`w-full h-20 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center ${
              isResting 
                ? "bg-gray-50 text-gray-900 border border-gray-100" 
                : "bg-gray-900 text-white shadow-gray-900/20"
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isResting ? (
              "Pular descanso"
            ) : (
              "Concluir série"
            )}
          </button>
        </div>
      </div>

      {/* EXIT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-[1300] bg-black/5 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 border border-gray-50">
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Encerrar?</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4 leading-relaxed">Deseja salvar esta sessão ou descartar o progresso?</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => finishWorkout(true)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Salvar e Sair</button>
              <button onClick={() => finishWorkout(false)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Descartar</button>
              <button onClick={() => setShowExitModal(false)} className="w-full py-3 text-gray-300 font-black uppercase text-[9px] tracking-widest">Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
