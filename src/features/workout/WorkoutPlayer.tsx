
import React, { useEffect, useState, useMemo, useRef } from "react";
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

  // Auto-scroll refs
  const setRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio for timer
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
  }, []);

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

  // Auto-scroll to current set
  useEffect(() => {
    if (setRefs.current[currentSet - 1]) {
      setRefs.current[currentSet - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSet, currentIndex]);

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
    
    // Audio alert at 5s
    if (timeLeft === 5 && audioRef.current) {
      audioRef.current.play().catch(() => {});
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
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
                <div className="flex flex-col">
                  <span className="text-sm font-[1000] text-slate-900 truncate max-w-[180px] uppercase tracking-tighter">
                    {currentEx?.exercise_name || 'Carregando...'}
                  </span>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5">
                    {currentIndex + 1} de {exercises.length} • {exercises[currentIndex]?.muscle_group || 'Geral'}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExercisesList(true)}
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <MoreHorizontal size={20} strokeWidth={2.5} />
                </button>
              </div>
            </header>

            {/* 2. CONTEÚDO SCROLLABLE */}
            <div className="flex-1 overflow-y-auto pb-48 bg-[#F8FAFC]">
              
              {/* COMPACT VIDEO/IMAGE PREVIEW */}
              <div className="px-4 py-4">
                <div className="w-full aspect-video bg-slate-200 rounded-3xl overflow-hidden border border-white shadow-sm flex-shrink-0 relative group">
                  {currentEx?.image_url ? (
                    <img 
                      src={currentEx.image_url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <Play className="text-slate-300 fill-slate-300" size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent flex items-end p-4">
                     <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">Tutorial de Execução</p>
                  </div>
                </div>
              </div>

              {/* AÇÕES FIXAS NO BOLSO */}
              <div className="flex gap-3 px-4 mb-4 sticky top-0 z-10 py-1">
                <button className="flex-1 bg-white border border-slate-100 rounded-2xl py-3.5 shadow-sm text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all">
                  <RefreshCw size={14} /> Substituir
                </button>
                <button className="flex-1 bg-white border border-slate-100 rounded-2xl py-3.5 shadow-sm text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all">
                  <Plus size={14} /> Nota
                </button>
              </div>

              {/* SERIES LIST (CORE) - High Precision Scroll */}
              <div className="px-4 space-y-3 pb-8">
                {currentEx?.sets_json?.map((setPlan, idx) => {
                  const isCurrent = idx === currentSet - 1;
                  const isPast = idx < currentSet - 1;
                  
                  return (
                    <div 
                      key={idx}
                      ref={(el) => (setRefs.current[idx] = el)}
                      className={`flex items-center justify-between px-5 py-6 rounded-[2.5rem] transition-all duration-300 border-2 ${
                        isCurrent 
                          ? "bg-white border-orange-500 shadow-xl shadow-orange-500/10 ring-8 ring-orange-500/5 scale-[1.02] translate-x-1" 
                          : isPast 
                            ? "bg-slate-100/50 border-transparent opacity-60" 
                            : "bg-white border-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          isCurrent ? "bg-orange-500 text-white shadow-lg" : isPast ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                        }`}>
                          {isPast ? <Check size={18} strokeWidth={4} /> : idx + 1}
                        </div>
                        
                        <div className="flex items-center gap-6">
                           <div className="text-center">
                              <input 
                                type="number"
                                value={isCurrent ? weight : setPlan.weight}
                                onChange={(e) => isCurrent && setWeight(parseFloat(e.target.value) || 0)}
                                className={`text-3xl font-[1000] w-16 bg-transparent border-none p-0 focus:ring-0 text-center transition-colors ${
                                  isCurrent ? "text-slate-900" : "text-slate-400"
                                }`}
                                onFocus={(e) => e.target.select()}
                                disabled={!isCurrent}
                                autoFocus={isCurrent}
                              />
                              <p className="text-[9px] font-black text-slate-300 tracking-widest mt-1 opacity-60 uppercase">Carga (kg)</p>
                           </div>
                           <div className="text-center">
                              <input 
                                type="number"
                                value={isCurrent ? reps : setPlan.reps}
                                onChange={(e) => isCurrent && setReps(parseInt(e.target.value) || 0)}
                                className={`text-3xl font-[1000] w-14 bg-transparent border-none p-0 focus:ring-0 text-center transition-colors ${
                                  isCurrent ? "text-slate-900" : "text-slate-400"
                                }`}
                                onFocus={(e) => e.target.select()}
                                disabled={!isCurrent}
                              />
                              <p className="text-[9px] font-black text-slate-300 tracking-widest mt-1 opacity-60 uppercase">Reps</p>
                           </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex flex-col items-center">
                           <div className="flex gap-1.5">
                              {[8, 9, 10].map(v => (
                                <button 
                                  key={v}
                                  onClick={() => setRpe(v)}
                                  className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                                    rpe === v ? "bg-slate-900 text-white shadow-lg scale-110" : "bg-slate-50 text-slate-300 hover:text-slate-400"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                           </div>
                           <p className="text-[8px] font-black text-slate-300 mt-2 tracking-widest uppercase">Esforço (RPE)</p>
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-slate-200">
                          {!isPast && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FEEDBACK INTELIGENTE (IA) */}
              <AnimatePresence mode="wait">
                {(feedback || preHint) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="px-4 mb-4"
                  >
                    <div className="bg-blue-600 p-6 rounded-[2.5rem] flex items-start gap-4 shadow-xl shadow-blue-500/20">
                      <Zap size={20} className="text-white fill-white mt-1 flex-shrink-0" />
                      <p className="text-sm font-bold text-white leading-relaxed">
                        {feedback || preHint}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* NAVIGATION BETWEEN EXERCISES */}
              <div className="flex justify-between px-8 mt-12 pb-32">
                <button 
                  onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors flex items-center gap-2"
                >
                  <ChevronLeft size={14} strokeWidth={4} /> Anterior
                </button>
                <button 
                  onClick={() => currentIndex < exercises.length - 1 && setCurrentIndex(currentIndex + 1)}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors flex items-center gap-2"
                >
                  Próxima <ChevronRight size={14} strokeWidth={4} />
                </button>
              </div>

            </div>

            {/* 3. FOOTER FIXO (CENTRALIZED TIMER) */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t p-4 pb-8 max-w-md mx-auto shadow-[0_-20px_60px_rgba(0,0,0,0.12)] rounded-t-[3rem]">
              
              <div className="flex flex-col items-center mb-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
                  {isResting ? "Intervalo de Descanso" : "Descanso Recomendado"}
                </p>
                
                <div className="flex items-center gap-10">
                  <button 
                    onClick={() => { setTimeLeft(prev => Math.max(0, prev - 10)); }}
                    className="w-14 h-14 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center active:bg-slate-100 active:scale-90 transition-all font-[1000] text-sm shadow-sm"
                  >
                    -10
                  </button>

                  <div className="flex flex-col items-center min-w-[120px]">
                    <span className={`text-6xl font-[1000] tabular-nums tracking-tighter leading-none transition-colors ${
                      isResting 
                        ? (timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-blue-600") 
                        : "text-slate-100"
                    }`}>
                      {isResting ? formatTime(timeLeft) : "0:00"}
                    </span>
                    {isResting && restOvertime > 0 && (
                      <span className="text-[10px] font-black text-red-500 mt-2 uppercase tracking-widest">
                        Limite +{restOvertime}s
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => { setTimeLeft(prev => prev + 10); }}
                    className="w-14 h-14 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center active:bg-slate-100 active:scale-90 transition-all font-[1000] text-sm shadow-sm"
                  >
                    +10
                  </button>
                </div>
              </div>

              <button
                onClick={isResting ? () => { setIsResting(false); setRestOvertime(0); } : handleCompleteSet}
                disabled={saving}
                className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.96] flex items-center justify-center gap-3 shadow-2xl ${
                  isResting 
                    ? "bg-slate-900 text-white shadow-slate-900/30" 
                    : "bg-orange-500 text-white shadow-orange-500/40"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isResting ? "Voltar ao Treino" : "Confirmar Série"}
                    {!isResting && <ArrowRight size={18} strokeWidth={4} />}
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
