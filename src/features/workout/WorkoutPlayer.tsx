
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
  RefreshCw,
  Zap,
  ArrowRight,
  Target
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
import { imagePrefetcher } from "../../lib/utils/imagePrefetcher";
import { cacheStore } from "../../lib/cache/cacheStore";

export default function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { navigate, goBack } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  
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
  const [showExercisesList, setShowExercisesList] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Data Loading
  const playerQuery = useSmartQuery(`workout_init_${workoutId}`, async () => {
    const user = await authApi.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { category, exercises: loadedExercises, partialSession } = await workoutApi.getWorkoutInitData(workoutId, user.id);

    let sessionData;
    if (partialSession && partialSession.history_id) {
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

  const { status: queryStatus, isFetching, refresh } = playerQuery;

  // Sync Store with Query Data
  useEffect(() => {
    if (playerQuery.data && playerQuery.data.historyId) {
      setWorkout({
        id: workoutId,
        exercises: playerQuery.data.exercises,
        historyId: playerQuery.data.historyId,
        startTime: playerQuery.data.startTime,
        currentIndex: playerQuery.data.currentIndex,
        currentSet: playerQuery.data.currentSet
      });
    } else if (playerQuery.data && !playerQuery.data.historyId) {
      playerQuery.refresh();
    }
  }, [playerQuery.data, workoutId, setWorkout]);

  const currentEx = useMemo(() => (exercises && exercises[currentIndex]) || null, [exercises, currentIndex]);

  // Prefetch next
  useEffect(() => {
    const nextEx = exercises[currentIndex + 1];
    if (nextEx?.exercise_image) imagePrefetcher.prefetch(nextEx.exercise_image);
  }, [currentIndex, exercises]);

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

    // Optimistic UI
    setWeight(decision.nextWeight);
    setFeedback(emotional);
    setPreviousSet(currentSetData);
    setTimeout(() => setFeedback(null), 2500);

    setTimeLeft(currentEx.rest_time || 90);
    setRestOvertime(0);
    setIsResting(true);
    
    if ('vibrate' in navigator) navigator.vibrate(emotional.includes("recorde") ? [50, 50, 100] : 40);

    setSaving(true);
    try {
      await saveSet({ 
        history_id: historyId,
        exercise_id: currentEx.exercise_id,
        exercise_name_snapshot: currentEx.exercise_name,
        set_number: currentSet,
        weight_achieved: weight,
        reps_achieved: reps,
        rpe: rpe,
        set_type: SetType.NORMAL
      });
      workoutApi.updatePartialSession(historyId, currentIndex, currentSet).catch(console.error);
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const finishWorkout = async (isSuccess: boolean) => {
    const currentStore = useWorkoutStore.getState();
    const currentHistoryId = currentStore.historyId;
    const currentStartTime = currentStore.startTime;

    if (!currentHistoryId) {
      showError(new Error("Sessão não encontrada."));
      return;
    }
    
    setFinishing(true);
    try {
      const user = await authApi.getUser();
      const finalDuration = Math.round((Date.now() - (currentStartTime || Date.now())) / 60000);

      if (isSuccess) {
        const finalExCount = exercises.length;
        await workoutApi.finishWorkout(currentHistoryId, finalDuration, finalExCount);
        if (user) await workoutApi.clearPartialSession(user.id);
        cacheStore.clear(`workout_init_${workoutId}`);
        setWorkoutDuration(finalDuration);
        setIsFinished(true);
      } else {
        await workoutApi.abandonWorkout(currentHistoryId);
        if (user) await workoutApi.clearPartialSession(user.id);
        cacheStore.clear(`workout_init_${workoutId}`);
        resetWorkout();
        navigate('dashboard');
      }
    } catch (err) {
      showError(err);
    } finally {
      setFinishing(false);
      setShowExitModal(false);
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
    <div className="h-screen bg-[#F7F8FA] text-slate-900 flex flex-col font-sans overflow-hidden">
      {isFinished && (
        <VictoryScreen 
          historyId={historyId!} 
          duration={workoutDuration}
          exercisesCount={exercises.length}
          onDone={() => { resetWorkout(); navigate('dashboard'); }}
        />
      )}

      <ScreenState
        status={queryStatus}
        isFetching={isFetching}
        onRetry={() => refresh()}
      >
        <div className="flex flex-col h-full items-center">
          <div className="w-full max-w-md flex flex-col h-full bg-white relative">
            
            {/* 1. HEADER & PROGRESS */}
            <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowExitModal(true)}
                  className="p-1 -ml-1 text-slate-900 active:scale-90 transition-all font-bold"
                >
                  <ChevronLeft size={22} strokeWidth={3} />
                </button>
                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                  {currentEx?.exercise_name || 'Treino'}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {currentIndex + 1}/{exercises.length}
              </span>
            </header>

            {/* 2. CONTEÚDO SCROLLABLE */}
            <div className="flex-1 overflow-y-auto pb-44 bg-[#F7F8FA]">
              
              {/* COMPACT EXERCISE VIEW */}
              <div className="p-4 flex gap-4 items-center mb-2">
                <div className="w-16 h-16 bg-slate-200 rounded-2xl overflow-hidden border border-white shadow-sm flex-shrink-0">
                  {currentEx?.image_url ? (
                    <img 
                      src={currentEx.image_url} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <Play className="text-slate-300 fill-slate-300" size={24} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                       {currentEx?.muscle_group || 'Geral'}
                     </p>
                  </div>
                  <h1 className="text-lg font-bold leading-tight text-slate-900 line-clamp-1">
                    Como executar: {currentEx?.exercise_name}
                  </h1>
                </div>
              </div>

              {/* AÇÕES */}
              <div className="flex gap-3 px-4 mb-6">
                <button className="flex-1 bg-white border border-slate-100 rounded-xl py-3 shadow-sm text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <RefreshCw size={14} /> Substituir
                </button>
                <button className="flex-1 bg-white border border-slate-100 rounded-xl py-3 shadow-sm text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <Plus size={14} /> Nota
                </button>
              </div>

              {/* SERIES LIST */}
              <div className="px-4 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-1">SEQUÊNCIA DE SÉRIES</p>
                
                {currentEx?.sets_json?.map((setPlan, idx) => {
                  const isCurrent = idx === currentSet - 1;
                  const isPast = idx < currentSet - 1;
                  
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                        isCurrent 
                          ? "bg-white border-orange-200 shadow-lg shadow-orange-500/5 ring-4 ring-orange-500/5 translate-x-1" 
                          : isPast 
                            ? "bg-slate-100/50 border-transparent opacity-60" 
                            : "bg-white border-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          isCurrent ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-400"
                        }`}>
                          {idx + 1}
                        </div>
                        
                        {isCurrent ? (
                           <div className="flex items-center gap-4">
                              <div className="text-center">
                                 <input 
                                   type="number"
                                   value={weight}
                                   onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                                   className="text-2xl font-black w-14 bg-transparent border-none p-0 focus:ring-0 text-slate-900 text-center"
                                   onFocus={(e) => e.target.select()}
                                 />
                                 <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5">KG</p>
                              </div>
                              <div className="text-center">
                                 <input 
                                   type="number"
                                   value={reps}
                                   onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                                   className="text-2xl font-black w-12 bg-transparent border-none p-0 focus:ring-0 text-slate-900 text-center"
                                   onFocus={(e) => e.target.select()}
                                 />
                                 <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5">REPS</p>
                              </div>
                           </div>
                        ) : (
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900">{setPlan.weight}</p>
                               <p className="text-[8px] font-black text-slate-300 tracking-widest">KG</p>
                            </div>
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900">{setPlan.reps}</p>
                               <p className="text-[8px] font-black text-slate-300 tracking-widest">REPS</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {isPast ? (
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={16} strokeWidth={4} />
                        </div>
                      ) : isCurrent ? (
                        <div className="flex flex-col items-center">
                           <div className="flex gap-1">
                              {[8, 9, 10].map(v => (
                                <button 
                                  key={v}
                                  onClick={() => setRpe(v)}
                                  className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${
                                    rpe === v ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                           </div>
                           <p className="text-[8px] font-black text-slate-300 mt-1">SINTONIA</p>
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center text-slate-100">
                          <Check size={16} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* NAVIGATION BETWEEN EXERCISES */}
              <div className="flex justify-between px-4 mt-6">
                <button 
                  onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                  className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  ← Anterior
                </button>
                <button 
                  onClick={() => currentIndex < exercises.length - 1 && setCurrentIndex(currentIndex + 1)}
                  className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Próxima →
                </button>
              </div>

            </div>

            {/* 3. FOOTER FIXO (CORE DO APP) */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4 pb-8 max-w-md mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-slate-400">Descanso</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatTime(isResting ? timeLeft : 0)}
                  </p>
                </div>
                
                <button 
                  onClick={() => { setTimeLeft(60); setIsResting(true); }}
                  className="text-sm text-orange-500 font-semibold active:scale-95 transition-transform"
                >
                  Resetar
                </button>
              </div>

              <button
                onClick={isResting ? () => { setIsResting(false); setRestOvertime(0); } : handleCompleteSet}
                disabled={saving}
                className={`w-full py-4 rounded-2xl text-lg font-bold transition-all active:scale-[0.95] flex items-center justify-center gap-3 ${
                  isResting 
                    ? "bg-slate-100 text-slate-900" 
                    : "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isResting ? "Pular Descanso" : "Concluir Série"}
                  </>
                )}
              </button>
            </footer>

          </div>
        </div>
      </ScreenState>

      {/* OVERLAY DE LISTA DE EXERCÍCIOS */}
      <AnimatePresence>
        {showExercisesList && (
           <div className="fixed inset-0 z-[200] flex flex-col">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExercisesList(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="mt-auto bg-white rounded-t-[3rem] p-8 shadow-2xl relative z-10 max-w-md mx-auto w-full pb-12"
              >
                 <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8" />
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Ordem do Treino</h3>
                 <div className="space-y-4">
                    {exercises.map((ex, i) => (
                      <button 
                        key={ex.exercise_id}
                        onClick={() => { setCurrentIndex(i); setCurrentSet(1); setShowExercisesList(false); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                          i === currentIndex ? "bg-slate-900 text-white shadow-xl translate-x-2" : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                         <span className={`text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center ${
                           i === currentIndex ? "bg-white/20" : "bg-slate-100"
                         }`}>
                           {i + 1}
                         </span>
                         <span className="flex-1 text-left font-bold text-sm truncate">{ex.exercise_name}</span>
                         {i < currentIndex && <Check size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* MODAL DE SAÍDA */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitModal(false)} className="absolute inset-0 bg-slate-900/30 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-slate-50 relative z-10">
              <div className="text-center">
                <h3 className="text-2xl font-[1000] text-slate-900 uppercase tracking-tighter">Interromper?</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6 leading-relaxed">Você pode salvar o progresso atual ou descartar totalmente.</p>
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => finishWorkout(true)} 
                  disabled={finishing}
                  className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform shadow-xl flex items-center justify-center disabled:opacity-50"
                >
                  {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Encerrar e Salvar"}
                </button>
                <button 
                  onClick={() => finishWorkout(false)} 
                  disabled={finishing}
                  className="w-full py-6 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50"
                >
                  {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Descartar Treino"}
                </button>
                <button 
                  onClick={() => setShowExitModal(false)} 
                  disabled={finishing}
                  className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-widest active:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Voltar ao Treino
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
