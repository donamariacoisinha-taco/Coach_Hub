
import React, { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  MoreHorizontal,
  Play,
  Loader2,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authApi } from "../../lib/api/authApi";
import { workoutApi } from "../../lib/api/workoutApi";
import { useNavigation } from "../../App";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ScreenState } from "../../components/ui/ScreenState";
import { useSmartQuery } from "../../hooks/useSmartQuery";
import { WorkoutExercise, SetType, LastSetData } from "../../types";
import { useWorkoutStore } from "../../app/store/workoutStore";
import { useAppStore } from "../../app/store/appStore";
import { saveSet } from "../../lib/saveSet";
import { getNextSetDecision, getPreSetHint } from "../../domain/progression/progressionEngine";
import { getEmotionalFeedback } from "../../domain/feedback/feedbackEngine";
import { VictoryScreen } from "../../components/VictoryScreen";
import { workoutEngine } from "../../domain/workout/workoutEngine";

export default function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { navigate } = useNavigation();
  const { showError } = useErrorHandler();
  
  // Global State
  const { isOnline, pendingSyncCount, isSyncing } = useAppStore();
  const { 
    exercises, currentIndex, currentSet, historyId, startTime,
    setWorkout, nextStep, prevStep, setCurrentSet, setCurrentIndex, resetWorkout 
  } = useWorkoutStore();

  // Local UI State
  const [saving, setSaving] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [restOvertime, setRestOvertime] = useState(0);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(8);
  const [lastSet, setLastSet] = useState<LastSetData | null>(null);
  const [previousSet, setPreviousSet] = useState<LastSetData | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Data Loading
  const playerQuery = useSmartQuery(`workout_init_${workoutId}`, async () => {
    const user = await authApi.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { category, exercises: loadedExercises, partialSession } = await workoutApi.getWorkoutInitData(workoutId, user.id);

    let sessionData;
    if (partialSession) {
      sessionData = workoutEngine.initializeSession(partialSession, null);
    } else {
      const newHistory = await workoutApi.startWorkoutHistory(user.id, workoutId, category?.name || 'Treino');
      sessionData = workoutEngine.initializeSession(null, newHistory);
      
      await workoutApi.upsertPartialSession(user.id, workoutId, sessionData.historyId, new Date(sessionData.startTime).toISOString());
    }

    return {
      exercises: loadedExercises,
      ...sessionData
    };
  }, { revalidateOnFocus: false });

  const { uiState, isRefreshing, refresh } = playerQuery;

  // Sync Store with Query Data
  useEffect(() => {
    if (playerQuery.data) {
      setWorkout({
        id: workoutId,
        exercises: playerQuery.data.exercises,
        historyId: playerQuery.data.historyId,
        startTime: playerQuery.data.startTime,
        currentIndex: playerQuery.data.currentIndex,
        currentSet: playerQuery.data.currentSet
      });
    }
  }, [playerQuery.data, workoutId, setWorkout]);

  const currentEx = useMemo(() => exercises[currentIndex] || null, [exercises, currentIndex]);

  // Timers
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!isResting) return;
    if (timeLeft <= 0) {
      setRestOvertime(prev => prev + 1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isResting, timeLeft]);

  // Fetch Last Set
  useEffect(() => {
    if (!currentEx) return;
    const fetchLast = async () => {
      try {
        const data = await workoutApi.getLastSet(currentEx.exercise_id);
        if (data) setLastSet({ weight: data.weight_achieved, reps: data.reps_achieved, rpe: data.rpe });
        else setLastSet(null);
      } catch (err) {
        console.error("Error fetching last set:", err);
      }
    };
    fetchLast();

    const plan = currentEx.sets_json?.[currentSet - 1];
    if (plan) {
      setWeight(plan.weight || 0);
      setReps(parseInt(plan.reps as string) || 10);
    }
  }, [currentEx, currentSet]);

  const handleCompleteSet = async () => {
    if (saving || !currentEx || !historyId) return;
    setSaving(true);
    
    try {
      const currentSetData = { weight, reps, rpe };
      const repsTarget = parseInt(currentEx.sets_json?.[currentSet - 1]?.reps as string) || 10;
      
      const emotional = getEmotionalFeedback({
        current: currentSetData,
        lastSet: lastSet || undefined,
        previousSet: previousSet || undefined,
      });

      const decision = getNextSetDecision(
        { weight, repsDone: reps, repsTarget, rpe },
        lastSet || undefined
      );

      // PERSISTENCE LAYER (Resilient)
      await saveSet({ 
        history_id: historyId,
        exercise_id: currentEx.exercise_id,
        set_number: currentSet,
        weight_achieved: weight,
        reps_achieved: reps,
        rpe: rpe,
        set_type: SetType.NORMAL
      });

      setWeight(decision.nextWeight);
      setFeedback(emotional);
      setPreviousSet(currentSetData);
      setTimeout(() => setFeedback(null), 1800);

      // Update partial session (fire and forget)
      workoutApi.updatePartialSession(historyId, currentIndex, currentSet).catch(console.error);

      setTimeLeft(currentEx.rest_time || 90);
      setRestOvertime(0);
      setIsResting(true);
      
      if ('vibrate' in navigator) navigator.vibrate(emotional.includes("recorde") ? [50, 50, 100] : 40);
      
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const finishWorkout = async (isSuccess: boolean) => {
    if (!historyId) return;
    try {
      if (isSuccess) {
        const duration = Math.round((Date.now() - (startTime || Date.now())) / 60000);
        await workoutApi.finishWorkout(historyId, duration, exercises.length);
        setIsFinished(true);
      } else {
        await workoutApi.abandonWorkout(historyId);
        navigate('dashboard');
      }
      const user = await authApi.getUser();
      if (user) await workoutApi.clearPartialSession(user.id);
      resetWorkout();
    } catch (err) {
      console.error("Error finishing workout:", err);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const preHint = useMemo(() => {
    if (!currentEx) return null;
    return getPreSetHint({
      lastSet,
      targetReps: parseInt(currentEx.sets_json?.[currentSet - 1]?.reps as string) || 10
    });
  }, [currentEx, currentSet, lastSet]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      {isFinished && (
        <VictoryScreen 
          historyId={historyId!} 
          duration={Math.round((Date.now() - (startTime || Date.now())) / 60000)}
          exercisesCount={exercises.length}
        />
      )}
      <ScreenState
        state={uiState}
        isRefreshing={isRefreshing}
        onRetry={() => window.location.reload()}
      >
        <div className="max-w-md mx-auto w-full px-5 pt-6 flex-1 flex flex-col relative">
          
          {/* HEADER COMPACTO */}
          <header className="flex items-center justify-between py-3 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-50 shadow-sm">
                {currentEx?.image_url ? (
                  <img src={currentEx.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-3 h-3 bg-slate-100 rounded-full" />
                )}
              </div>
              <div>
                <h1 className="text-xs font-black tracking-tight uppercase text-slate-900 truncate max-w-[150px]">{currentEx?.exercise_name || 'Exercício'}</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                  {currentEx?.muscle_group || 'Geral'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black tabular-nums text-slate-300 tracking-widest">
                {formatTime(workoutDuration)}
              </span>
              <button 
                onClick={() => setShowExitModal(true)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 active:scale-90 transition-all"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </header>

          {/* MAIN DISPLAY */}
          <div className="flex flex-col items-center justify-center text-center py-4">
            {!isResting ? (
              <div className="animate-in fade-in zoom-in duration-500 w-full">
                <div className="flex items-end justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <input 
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      className="text-7xl font-black tracking-tighter tabular-nums text-slate-900 leading-none bg-transparent border-none outline-none text-center w-32"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Peso (kg)</span>
                  </div>
                  <span className="text-xl text-slate-300 font-black mb-6">×</span>
                  <div className="flex flex-col items-center">
                    <input 
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                      className="text-7xl font-black tracking-tighter tabular-nums text-slate-900 leading-none bg-transparent border-none outline-none text-center w-24"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Reps</span>
                  </div>
                </div>

                {/* FEEDBACK INTELIGENTE IMEDIATO */}
                <AnimatePresence mode="wait">
                  {feedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 px-6"
                    >
                      <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                        <Check size={14} className="text-green-500" />
                        {feedback}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {preHint && !feedback && (
                  <p className="mt-4 text-sm text-slate-400 font-medium animate-in fade-in duration-500 px-6">
                    {preHint}
                  </p>
                )}

                {/* CONTEXTO UNIFICADO */}
                <div className="mt-8 flex justify-center items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  {lastSet && (
                    <span className="text-slate-300">
                      Último: {lastSet.weight}kg × {lastSet.reps}
                    </span>
                  )}
                  {lastSet && <div className="w-1 h-1 rounded-full bg-slate-200" />}
                  <span className="text-blue-600">
                    Meta: {weight}kg × {reps}
                  </span>
                </div>
                
                {/* SYNC STATUS COMPACTO */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  {!isOnline && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <WifiOff size={10} /> Offline
                    </div>
                  )}
                  {pendingSyncCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-500">
                      <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                      {pendingSyncCount} pendentes
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-8xl font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mt-6">Descanso</p>

                <AnimatePresence>
                  {restOvertime > 60 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 mx-4"
                    >
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Equipamento ocupado?</p>
                      <p className="text-[11px] text-blue-900 font-medium mb-3">Pule este exercício e volte nele depois.</p>
                      <button 
                        onClick={() => {
                          if (currentIndex < exercises.length - 1) {
                            setCurrentIndex(currentIndex + 1);
                            setIsResting(false);
                            setRestOvertime(0);
                          }
                        }}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-600 pb-0.5"
                      >
                        Pular Exercício
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-8 mt-12">
                  <button onClick={() => setTimeLeft((t) => Math.max(0, t - 15))} className="w-14 h-14 rounded-full bg-white text-slate-300 active:scale-90 active:text-slate-900 border border-slate-50 shadow-sm flex items-center justify-center transition-all"><Minus size={18} /></button>
                  <button onClick={() => setTimeLeft((t) => t + 15)} className="w-14 h-14 rounded-full bg-white text-slate-300 active:scale-90 active:text-slate-900 border border-slate-50 shadow-sm flex items-center justify-center transition-all"><Plus size={18} /></button>
                </div>
              </div>
            )}
          </div>

          {/* CONTROLES */}
          {!isResting && (
            <div className="mt-4 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col items-center gap-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Esforço (RPE)</p>
                <div className="flex gap-2.5">
                  {[7, 8, 9, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRpe(val)}
                      className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all ${
                        rpe === val 
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-105" 
                          : "bg-white text-slate-300 border border-slate-50 shadow-sm active:bg-slate-50"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <button onClick={prevStep} className="p-2 text-slate-200 hover:text-slate-900 transition-colors"><ChevronLeft size={18} /></button>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                    {currentSet} / {currentEx?.sets_json?.length || 3}
                  </span>
                  <button onClick={nextStep} className="p-2 text-slate-200 hover:text-slate-900 transition-colors"><ChevronRight size={18} /></button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Minus size={14} /></button>
                    <button onClick={() => setWeight(w => w + 2.5)} className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Plus size={14} /></button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setReps(r => Math.max(0, r - 1))} className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Minus size={14} /></button>
                    <button onClick={() => setReps(r => r + 1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-lg border border-slate-50 text-slate-300 active:text-slate-900 active:scale-90 transition-all shadow-sm"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ESPAÇO FLEXÍVEL */}
          <div className="flex-1 min-h-[20px]" />

          {/* CTA STICKY */}
          <div className="sticky bottom-0 left-0 right-0 pt-2 pb-safe bg-[#F7F8FA] z-[100]">
            <button
              onClick={isResting ? () => { setIsResting(false); setRestOvertime(0); } : handleCompleteSet}
              disabled={saving}
              className={`w-full h-16 rounded-full font-black uppercase text-[10px] tracking-[0.4em] transition-all active:scale-[0.98] shadow-xl flex items-center justify-center ${
                isResting ? "bg-white text-slate-900 border border-slate-50 shadow-sm" : "bg-slate-900 text-white shadow-slate-900/20"
              }`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : isResting ? "Pular descanso" : "Concluir série"}
            </button>
          </div>
        </div>
      </ScreenState>

      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitModal(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-slate-50 relative z-10">
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
