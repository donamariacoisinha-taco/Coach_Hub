
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
  const [showPR, setShowPR] = useState(false);
  
  // Momentum & Compression
  const momentum = currentSet >= 3;
  
  // Track all sets for the current exercise
  const [activeSetsData, setActiveSetsData] = useState<{weight: number, reps: number, rpe: number}[]>([]);
  
  const [lastSet, setLastSet] = useState<LastSetData | null>(null);
  const [previousSet, setPreviousSet] = useState<LastSetData | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showExercisesList, setShowExercisesList] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Smart Footer Logic
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const maxScroll = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
    
    // Always show if at top or bottom
    if (currentScrollY < 20 || currentScrollY >= maxScroll - 20) {
      setIsFooterVisible(true);
    } else if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
      if (currentScrollY > lastScrollY.current) {
        setIsFooterVisible(false);
      } else {
        setIsFooterVisible(true);
      }
    }
    
    lastScrollY.current = currentScrollY;

    // Show after stopping
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsFooterVisible(true);
    }, 600);
  };

  // Auto-scroll refs
  const setRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const vibratedAlert5s = useRef(false);
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState(180);

  useEffect(() => {
    if (footerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setFooterHeight(entry.target.clientHeight);
        }
      });
      observer.observe(footerRef.current);
      return () => observer.disconnect();
    }
  }, []);

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
    const activeRef = setRefs.current[currentSet - 1];
    if (activeRef) {
      activeRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Auto-focus input of next set
      setTimeout(() => {
        inputRefs.current[currentSet - 1]?.focus();
      }, 500); // Slight delay to wait for scroll
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
    if (!isResting) {
      vibratedAlert5s.current = false;
      return;
    }
    if (timeLeft <= 0) {
      setRestOvertime(prev => prev + 1);
      return;
    }
    
    // Audio alert at 5s (triggered once)
    if (timeLeft === 5 && !vibratedAlert5s.current) {
      vibratedAlert5s.current = true;
      if (audioRef.current) audioRef.current.play().catch(() => {});
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

    // Initialize active sets data
    if (currentEx.sets_json) {
      setActiveSetsData(currentEx.sets_json.map(s => ({
        weight: s.weight || 0,
        reps: parseInt(s.reps as string) || 10,
        rpe: 8
      })));
    }
  }, [currentEx]);

  // Update a single set's data
  const updateSetData = (idx: number, field: 'weight' | 'reps' | 'rpe', value: number) => {
    setActiveSetsData(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleCompleteSet = async () => {
    if (saving || !currentEx || !historyId) return;
    
    const setIdx = currentSet - 1;
    const currentSetData = activeSetsData[setIdx];
    if (!currentSetData) return;

    const { weight, reps, rpe } = currentSetData;
    const repsTarget = parseInt(currentEx.sets_json?.[setIdx]?.reps as string) || 10;
    
    const emotional = getEmotionalFeedback({
      current: currentSetData,
      lastSet: lastSet || undefined,
      previousSet: previousSet || undefined,
    });

    const decision = getNextSetDecision(
      { weight, repsDone: reps, repsTarget, rpe },
      lastSet || undefined
    );

    // ADAPTIVE REST TIMER
    let adaptiveRest = currentEx.rest_time || 90;
    if (rpe >= 9) adaptiveRest += 15;
    if (previousSet && reps < previousSet.reps) adaptiveRest += 10;

    // PR MOMENT DETECTION
    const isPR = lastSet ? (weight > lastSet.weight || (weight === lastSet.weight && reps > lastSet.reps)) : false;
    if (isPR) {
      setShowPR(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setShowPR(false), 2000);
    }

    // MICRO DELAY FOR PERCEIVED PRECISION
    setTimeout(async () => {
      // Optimistic UI for NEXT set
      if (setIdx + 1 < activeSetsData.length) {
         setActiveSetsData(prev => {
           const next = [...prev];
           next[setIdx + 1] = { ...next[setIdx + 1], weight: decision.nextWeight };
           return next;
         });
      }
      
      setFeedback(emotional);
      setPreviousSet(currentSetData);
      setTimeout(() => setFeedback(null), 3000);

      setTimeLeft(adaptiveRest);
      setRestOvertime(0);
      setIsResting(true);
      
      if ('vibrate' in navigator) navigator.vibrate(30);

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
        
        // Advance to next set or next exercise
        if (currentSet < (currentEx.sets_json?.length || 0)) {
          setCurrentSet(currentSet + 1);
        }
        
        workoutApi.updatePartialSession(historyId, currentIndex, currentSet).catch(console.error);
      } catch (err) {
        showError(err);
      } finally {
        setSaving(false);
      }
    }, 200); // 200ms momentum delay
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col h-full items-center"
        >
          <div className="w-full max-w-md flex flex-col h-full bg-white relative">
            
            {/* 1. HEADER & PROGRESS */}
            <header className={`sticky top-0 z-50 bg-white transition-all duration-500 overflow-hidden ${
              momentum ? "h-12 border-b-0 shadow-sm" : "h-16 border-b"
            } px-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowExitModal(true)}
                  className="p-1 -ml-1 text-slate-900 active:scale-90 transition-all font-bold"
                >
                  <ChevronLeft size={22} strokeWidth={3} />
                </button>
                <div className={`flex flex-col transition-all duration-500 ${momentum ? "scale-90 origin-left" : ""}`}>
                  <span className="text-sm font-[1000] text-slate-900 truncate max-w-[180px] uppercase tracking-tighter">
                    {currentEx?.exercise_name || 'Carregando...'}
                  </span>
                   <span className={`text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5 ${momentum ? "hidden" : ""}`}>
                    {currentIndex + 1} de {exercises.length} • {exercises[currentIndex]?.muscle_group || 'Geral'}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Tempo</p>
                   <p className="text-xs font-bold tabular-nums text-slate-900">{formatTime(workoutDuration)}</p>
                </div>
              </div>
            </header>

            {/* 2. CONTEÚDO SCROLLABLE */}
            <div 
              className="flex-1 overflow-y-auto bg-[#F8FAFC]"
              onScroll={handleScroll}
              onClick={() => setIsFooterVisible(true)}
              style={{ paddingBottom: `calc(${footerHeight + 32}px + env(safe-area-inset-bottom))` }}
            >
              
              {/* COMPACT EXERCISE HEADER (DYNAMIC COMPRESSION) */}
              <AnimatePresence>
                {!momentum && (
                  <motion.div 
                    initial={{ height: "auto", opacity: 1 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
                    className="p-4 flex gap-4 items-center bg-white mb-2 overflow-hidden"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-50">
                      {currentEx?.image_url ? (
                        <img 
                          src={currentEx.image_url} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <Play className="text-slate-300 fill-slate-300" size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h1 className="text-base font-bold text-slate-900 leading-tight">
                        {currentEx?.exercise_name}
                      </h1>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5 line-clamp-1">
                        {currentEx?.muscle_group} • {currentEx?.equipment || 'Sem equipamento'}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        Foco na amplitude e contração lenta.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AÇÕES QUICK */}
              <div className={`flex gap-2 px-4 transition-all duration-500 ${momentum ? "mb-2 mt-2" : "mb-4"}`}>
                <button 
                  onClick={() => setShowExercisesList(true)}
                  className="flex-1 bg-white border border-slate-100 rounded-xl py-2.5 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all h-[44px]"
                >
                  <RefreshCw size={12} /> Substituir
                </button>
                <button 
                  onClick={() => showSuccess("Nota adicionada ao exercício!")}
                  className="flex-1 bg-white border border-slate-100 rounded-xl py-2.5 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all h-[44px]"
                >
                  <Plus size={12} /> Nota
                </button>
              </div>

              {/* SERIES LIST (CORE) */}
              <div className="px-4 space-y-3 pb-8 overflow-hidden">
                {activeSetsData.map((setData, idx) => {
                  const isCurrent = idx === currentSet - 1;
                  const isPast = idx < currentSet - 1;
                  
                  return (
                    <motion.div 
                      key={idx}
                      layout
                      ref={(el) => (setRefs.current[idx] = el)}
                      initial={false}
                      animate={{
                        opacity: isCurrent ? 1 : isPast ? 0.45 : 0.7,
                        scale: isCurrent ? 1 : 0.98,
                        borderColor: isCurrent ? '#f97316' : 'rgba(241, 245, 249, 0.5)',
                        boxShadow: isCurrent ? '0 10px 25px -5px rgba(249, 115, 22, 0.1)' : '0 0px 0px 0px rgba(0,0,0,0)',
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-colors duration-300 border-2 bg-white`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          isCurrent ? "bg-orange-500 text-white shadow-md" : isPast ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                        }`}>
                          {isPast ? <Check size={16} strokeWidth={4} /> : idx + 1}
                        </div>
                        
                        <div className="flex items-center gap-6 relative">
                           {/* PR TAG */}
                           <AnimatePresence>
                             {isCurrent && showPR && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                 animate={{ opacity: 1, y: -25, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.5 }}
                                 className="absolute top-0 left-0 right-0 flex justify-center z-10"
                               >
                                 <span className="bg-yellow-400 text-yellow-900 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg border border-yellow-200 uppercase tracking-tighter flex items-center gap-1">
                                    🏆 NOVO RECORDE
                                 </span>
                               </motion.div>
                             )}
                           </AnimatePresence>

                           <div className="text-center group">
                              <motion.input 
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="number"
                                value={setData.weight}
                                onChange={(e) => updateSetData(idx, 'weight', parseFloat(e.target.value) || 0)}
                                whileFocus={{ scale: 1.15, color: "#f97316" }}
                                className={`text-xl font-black w-20 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                                  isCurrent ? "text-slate-900" : "text-slate-400"
                                }`}
                                onFocus={(e) => {
                                  e.target.select();
                                  setIsInputFocused(true);
                                  setIsFooterVisible(true);
                                }}
                                onBlur={() => setIsInputFocused(false)}
                              />
                              <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5 uppercase">Kg</p>
                              
                              {/* PREDICTIVE SUGGESTION */}
                              {isCurrent && lastSet && !isPast && (
                                <p className="text-[7px] font-bold text-orange-400 mt-1 animate-pulse">
                                   Recomendado: {lastSet.weight + 1}kg
                                </p>
                              )}
                           </div>
                           <div className="text-center">
                              <motion.input 
                                type="number"
                                value={setData.reps}
                                onChange={(e) => updateSetData(idx, 'reps', parseInt(e.target.value) || 0)}
                                whileFocus={{ scale: 1.15, color: "#f97316" }}
                                className={`text-xl font-black w-14 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                                  isCurrent ? "text-slate-900" : "text-slate-400"
                                }`}
                                onFocus={(e) => {
                                  e.target.select();
                                  setIsInputFocused(true);
                                  setIsFooterVisible(true);
                                }}
                                onBlur={() => setIsInputFocused(false)}
                              />
                              <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5 uppercase">Reps</p>
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                         <div className="flex gap-1">
                            {[8, 9, 10].map(v => (
                              <button 
                                key={v}
                                onClick={() => updateSetData(idx, 'rpe', v)}
                                className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${
                                  setData.rpe === v 
                                    ? (isCurrent ? "bg-slate-900 text-white shadow-md scale-110" : "bg-slate-400 text-white")
                                    : "bg-slate-50 text-slate-300 hover:text-slate-400 font-bold"
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                         </div>
                         <p className="text-[8px] font-black text-slate-300 mt-1 tracking-widest uppercase">RPE</p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* BOTÃO ADICIONAR SÉRIE (ERGO) */}
                <button 
                  onClick={() => {
                    const lastData = activeSetsData[activeSetsData.length - 1] || { weight: 0, reps: 10, rpe: 8 };
                    setActiveSetsData(prev => [...prev, { ...lastData }]);
                    // O auto-scroll lidará com o foco se for a próxima série
                  }}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-orange-200 hover:text-orange-500 transition-all flex items-center justify-center gap-2 mt-4 hover:bg-orange-50/30 h-[56px]"
                >
                  <Plus size={14} /> Adicionar Série
                </button>
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

              {/* FAILSAFE SPACER */}
              <div style={{ height: footerHeight }} />

            </div>

            {/* 3. FOOTER FIXO */}
            <motion.footer 
              ref={footerRef}
              initial={{ y: 0, opacity: 1 }}
              animate={{ 
                y: (isFooterVisible || isResting || isInputFocused) ? 0 : '100%',
                opacity: (isFooterVisible || isResting || isInputFocused) ? 1 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t p-4 pb-10 max-w-md mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.06)] rounded-t-2xl"
            >
              
              {/* COMPACT TIMER BAR (CENTERED) */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <button 
                  onClick={() => setTimeLeft(prev => Math.max(0, prev - 10))}
                  className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all font-black text-sm"
                >
                  -10
                </button>

                <div className="flex flex-col items-center min-w-[120px]">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Descanso</p>
                  <motion.span 
                    key={isResting ? 'active' : 'idle'}
                    animate={isResting && timeLeft <= 5 ? {
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.6, 1],
                      color: ['#ef4444', '#ef4444', '#ef4444']
                    } : {
                      scale: 1,
                      opacity: isResting ? 1 : 0.3,
                      color: isResting ? '#2563eb' : '#f1f5f9'
                    }}
                    transition={isResting && timeLeft <= 5 ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : { duration: 0.3 }}
                    className="text-4xl font-black tabular-nums transition-all"
                  >
                    {isResting ? (timeLeft <= 0 ? "VAI LÁ!" : formatTime(timeLeft)) : "0:00"}
                  </motion.span>
                </div>

                <button 
                  onClick={() => setTimeLeft(prev => prev + 10)}
                  className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center active:scale-90 transition-all font-black text-sm"
                >
                  +10
                </button>
              </div>

              <motion.button
                onClick={isResting ? () => { setIsResting(false); setRestOvertime(0); } : handleCompleteSet}
                disabled={saving}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={`w-full h-16 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isResting 
                    ? "bg-slate-900 text-white" 
                    : "bg-orange-500 text-white shadow-orange-500/30"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isResting ? (timeLeft <= 0 ? "Próxima série" : "Pular Descanso") : "Concluir Série"}
                    {!isResting && <ArrowRight size={18} strokeWidth={4} />}
                  </>
                )}
              </motion.button>
            </motion.footer>
          </div>
        </motion.div>
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
