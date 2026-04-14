
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { notifyError } from "../lib/errorHandling";
import { useNavigation } from "../App";
import { WorkoutExercise, SetType, LastSetData, ProgressionInput } from "../types";
import { getPreSetHint } from "../lib/preSetEngine";
import { getEmotionalFeedback } from "../lib/feedbackEngine";
import { saveSet } from "../lib/saveSet";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { VictoryScreen } from "./VictoryScreen";

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
  const [previousSet, setPreviousSet] = useState<LastSetData | null>(null);
  const [preHint, setPreHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Session Tracking
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const { pendingCount, isOnline } = useSyncStatus();

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
      const targetReps = parseInt(plan?.reps as string) || 10;
      
      if (plan) {
        setWeight(plan.weight || 0);
        setReps(targetReps);
      }
      
      fetchLastSet(currentEx.exercise_id);
      
      setPreHint(
        getPreSetHint({
          lastSet,
          targetReps,
        })
      );
    }
  }, [currentIndex, currentSet, currentEx]); // Removed lastSet from dependencies to avoid loop

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
      
      const currentSetData: LastSetData = {
        weight,
        reps,
        rpe,
      };

      // Progression Logic
      const repsTarget = parseInt(currentEx.sets_json?.[currentSet - 1]?.reps as string) || 10;
      
      // Emotional Feedback
      const emotional = getEmotionalFeedback({
        current: currentSetData,
        lastSet: lastSet || undefined,
        previousSet: previousSet || undefined,
      });

      const decision = getNextSetDecision(
        { weight, repsDone: reps, repsTarget, rpe },
        lastSet || undefined
      );

      // Save Log
      await saveSet({ 
        history_id: historyId,
        user_id: user?.id,
        exercise_id: currentEx.exercise_id,
        set_number: currentSet,
        weight_achieved: weight,
        reps_achieved: reps,
        rpe: rpe,
        set_type: SetType.NORMAL
      });

      // Apply Decision
      setWeight(decision.nextWeight);
      setFeedback(emotional);
      setPreviousSet(currentSetData);
      
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
      if (emotional.includes("recorde")) {
        if ('vibrate' in navigator) navigator.vibrate([50, 50, 100]);
      } else {
        if ('vibrate' in navigator) navigator.vibrate(40);
      }
      
    } catch (err) {
      notifyError(err, "Erro ao salvar série");
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
        setIsFinished(true);
      } else {
        await supabase.from('workout_history').delete().eq('id', historyId);
        navigate('dashboard');
      }
      await supabase.from('partial_workout_sessions').delete().eq('user_id', user?.id);
    } catch (err) {
      console.error("Error finishing workout:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-12 text-center">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-slate-900/20"
      >
        <Play size={32} fill="currentColor" />
      </motion.div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Preparando ambiente...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      {isFinished && (
        <VictoryScreen 
          historyId={historyId!} 
          duration={Math.round((Date.now() - startTime) / 60000)}
          exercisesCount={exercises.length}
        />
      )}
      <div className="max-w-md mx-auto w-full px-6 pt-12 pb-32 flex-1 flex flex-col relative">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2.5 border border-slate-50 shadow-sm">
              {currentEx?.image_url ? (
                <img src={currentEx.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-4 h-4 bg-slate-100 rounded-full" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase text-slate-900">{currentEx?.exercise_name || 'Exercício'}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                {currentEx?.muscle_group || 'Geral'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black tabular-nums text-slate-300 tracking-widest">
              {formatTime(workoutDuration)}
            </span>
            <button 
              onClick={() => setShowExitModal(true)}
              className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 active:scale-90 transition-all"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </header>

        {/* MAIN DISPLAY */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {!isResting ? (
            <div className="animate-in fade-in zoom-in duration-500 w-full">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <input 
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="text-7xl font-black tracking-tighter tabular-nums text-slate-900 leading-none bg-transparent border-none outline-none text-center w-32"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Peso (kg)</span>
                </div>
                <span className="text-4xl text-slate-100 font-black mt-[-20px]">×</span>
                <div className="flex flex-col items-center">
                  <input 
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                    className="text-7xl font-black tracking-tighter tabular-nums text-slate-900 leading-none bg-transparent border-none outline-none text-center w-24"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Reps</span>
                </div>
              </div>

              {/* PRÉ-SÉRIE */}
              {preHint && (
                <p className="mt-6 text-sm text-slate-400 font-medium animate-in fade-in duration-500">
                  {preHint}
                </p>
              )}

              {/* CONTEXTO INTELIGENTE */}
              <div className="mt-12 space-y-3">
                {lastSet && (
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    último: {lastSet.weight}kg × {lastSet.reps}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    Meta: {weight}kg × {reps}
                  </p>
                  {currentIndex < exercises.length - 1 && currentSet === (currentEx?.sets_json?.length || 3) && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-200 px-2 py-0.5 bg-slate-50 rounded-full">
                      Próximo: {exercises[currentIndex + 1].exercise_name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-10 space-y-2">
                {!isOnline && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    Modo Offline — Salvando Local
                  </div>
                )}
                {pendingCount > 0 && isOnline && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                    Sincronizando {pendingCount} {pendingCount === 1 ? 'série' : 'séries'}...
                  </div>
                )}
                {pendingCount === 0 && isOnline && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-500/30">
                    Sincronizado
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="text-8xl font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mt-8">Descanso</p>

              {/* TIMER CONTROLS */}
              <div className="flex items-center gap-10 mt-16">
                <button
                  onClick={() => setTimeLeft((t) => Math.max(0, t - 15))}
                  className="w-16 h-16 rounded-full bg-white text-slate-300 active:scale-90 active:text-slate-900 border border-slate-50 shadow-sm flex items-center justify-center transition-all"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => setTimeLeft((t) => t + 15)}
                  className="w-16 h-16 rounded-full bg-white text-slate-300 active:scale-90 active:text-slate-900 border border-slate-50 shadow-sm flex items-center justify-center transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLES DISCRETOS */}
        {!isResting && (
          <div className="mt-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
            
            {/* RPE SELECTOR */}
            <div className="flex flex-col items-center gap-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Esforço (RPE)</p>
              <div className="flex gap-3">
                {[7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRpe(val)}
                    className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${
                      rpe === val 
                        ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-110" 
                        : "bg-white text-slate-300 border border-slate-50 shadow-sm active:bg-slate-50"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* SET NAVIGATION */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (currentSet > 1) setCurrentSet(s => s - 1);
                    else if (currentIndex > 0) {
                      setCurrentIndex(i => i - 1);
                      setCurrentSet(exercises[currentIndex - 1].sets_json?.length || 3);
                    }
                  }}
                  className="p-3 text-slate-200 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                  {currentSet} / {currentEx?.sets_json?.length || 3}
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
                  className="p-3 text-slate-200 hover:text-slate-900 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* ADJUSTMENTS */}
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Minus size={16} /></button>
                    <button onClick={() => setWeight(w => w + 2.5)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Plus size={16} /></button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setReps(r => Math.max(0, r - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Minus size={16} /></button>
                    <button onClick={() => setReps(r => r + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TOAST */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 20, x: "-50%" }}
              className="fixed bottom-32 left-1/2 z-[1200]
                         bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-full
                         shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <Check size={14} className="text-green-400" />
                {feedback}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA PRINCIPAL */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#F7F8FA]/80 backdrop-blur-md">
          <button
            onClick={isResting ? handleNextStep : handleCompleteSet}
            disabled={saving}
            className={`w-full h-20 rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center ${
              isResting 
                ? "bg-white text-slate-900 border border-slate-50 shadow-sm" 
                : "bg-slate-900 text-white shadow-slate-900/20"
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
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-slate-50 relative z-10"
            >
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Encerrar?</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-6 leading-relaxed">Deseja salvar esta sessão ou descartar o progresso?</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => finishWorkout(true)} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform shadow-xl shadow-slate-900/10">Salvar e Sair</button>
                <button onClick={() => finishWorkout(false)} className="w-full py-6 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Descartar</button>
                <button onClick={() => setShowExitModal(false)} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-widest active:text-slate-900 transition-colors">Continuar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
