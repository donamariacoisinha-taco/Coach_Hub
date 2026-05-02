
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  MoreHorizontal,
  Play,
  Loader2,
  WifiOff,
  RefreshCw,
  Zap,
  ArrowRight,
  Target,
  Flame,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/api/supabase";
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
import { calculateStreak } from "../../domain/streak/streakEngine";

type UserLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Sub-component for individual set cards to manage local input state
// This prevents re-renders from clearing input focus or jumping values during typing
const SetCard = ({ 
  idx, 
  setData, 
  isCurrent, 
  isCompleted, 
  isPending, 
  isPast, 
  intensity, 
  showPR, 
  lastSet, 
  delta, 
  updateSetData, 
  rollbackToSet, 
  setFocusedIdx, 
  setIsInputFocused, 
  setIsFooterVisible, 
  setRowRef, 
  setInputRef, 
  focusedIdx,
  userLevel = 'BEGINNER' 
}: any) => {
  const [localWeight, setLocalWeight] = useState(setData.weight.toString());
  const [localReps, setLocalReps] = useState(setData.reps.toString());

  // Level attributes
  const isBeginner = userLevel === 'BEGINNER';
  const isAdvanced = userLevel === 'ADVANCED';
  
  // Transition timing
  const transitionConfig = isAdvanced 
    ? { type: "tween", duration: 0.15 } 
    : { type: "spring", stiffness: isBeginner ? 200 : 300, damping: isBeginner ? 30 : 25 };

  // Use refs to track if user is currently typing to avoid overwriting from global state
  const isEditing = useRef(false);

  // Sync local state with global state when global state changes from outside (e.g. auto-progression)
  useEffect(() => {
    if (!isEditing.current) {
      setLocalWeight(setData.weight.toString());
    }
  }, [setData.weight]);

  useEffect(() => {
    if (!isEditing.current) {
      setLocalReps(setData.reps.toString());
    }
  }, [setData.reps]);

  const commitWeight = () => {
    isEditing.current = false;
    updateSetData(idx, 'weight', localWeight);
    setFocusedIdx(null);
    setIsInputFocused(false);
  };

  const commitReps = () => {
    isEditing.current = false;
    updateSetData(idx, 'reps', localReps);
    setFocusedIdx(null);
    setIsInputFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, commitFn: () => void) => {
    if (e.key === 'Enter') {
      commitFn();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <motion.div 
      layout
      ref={setRowRef}
      initial={false}
      animate={{
        opacity: isCompleted ? (focusedIdx === idx ? 0.85 : 0.45) : 1,
        scale: isCurrent 
          ? (showPR ? 1.02 : (intensity === 'LOW' ? [1, 1.01, 1] : (focusedIdx === idx ? 1.02 : 1))) 
          : isPast && !isCurrent ? 0.96 : 0.98,
        height: "auto",
        marginTop: (idx === 0 ? 0 : 12),
        borderColor: isPending ? '#cbd5e1' : (isCurrent ? (showPR ? '#fb923c' : '#f97316') : (focusedIdx === idx && isCompleted ? '#94a3b8' : 'rgba(241, 245, 249, 0.5)')),
        boxShadow: isCurrent && !isPending
          ? (showPR ? '0 20px 40px -5px rgba(249, 115, 22, 0.35)' : (intensity === 'HIGH' ? '0 15px 35px -5px rgba(249, 115, 22, 0.25)' : '0 10px 25px -5px rgba(249, 115, 22, 0.1)')) 
          : (focusedIdx === idx && isCompleted ? '0 4px 12px rgba(0,0,0,0.05)' : '0 0px 0px 0px rgba(0,0,0,0)'),
      }}
      style={{ overflow: "visible" }}
      onClick={isCompleted ? () => {
        // Focus the input of the completed set for editing
        const input = (setInputRef as any)?.current;
        if (input) input.focus();
      } : undefined}
      transition={isCurrent && intensity === 'LOW' ? {
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        default: transitionConfig
      } : transitionConfig}
      className={`flex flex-col items-stretch ${isAdvanced ? 'p-3' : 'p-4'} rounded-2xl transition-all duration-300 border-2 ${
        isCompleted ? "bg-slate-50/50 cursor-pointer hover:bg-slate-100" : 
        isPending ? "bg-slate-50 border-dashed animate-pulse cursor-wait" :
        "bg-white"
      } ${isCurrent && intensity === 'HIGH' && !isPending ? 'border-orange-400 ring-4 ring-orange-500/10' : ''}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
            isCompleted ? "bg-emerald-500 text-white" : 
            isCurrent ? "bg-orange-500 text-white shadow-md" : 
            "bg-slate-200 text-slate-400"
          }`}>
            {isCompleted ? <Check size={16} strokeWidth={4} /> : idx + 1}
          </div>
          
          <div className="flex items-center gap-6 relative">
             <div className="text-center group">
                <motion.input 
                  ref={setInputRef}
                  type="text"
                  inputMode="decimal"
                  value={localWeight}
                  onChange={(e) => {
                    isEditing.current = true;
                    setLocalWeight(e.target.value);
                  }}
                  onBlur={commitWeight}
                  onKeyDown={(e) => handleKeyDown(e, commitWeight)}
                  whileFocus={{ scale: 1.15, color: "#f97316" }}
                  className={`text-xl font-black w-20 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                    isCurrent ? "text-slate-900" : "text-slate-400"
                  }`}
                  onFocus={(e) => {
                    e.target.select();
                    setFocusedIdx(idx);
                    setIsInputFocused(true);
                    setIsFooterVisible(true);
                  }}
                />
                <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5 uppercase">
                  {isBeginner ? 'Peso' : 'Kg'}
                </p>
                
                {/* DELTA WEIGHT */}
                {delta && !isBeginner && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    className={`text-[9px] font-black mt-1 ${
                      delta.dWeight > 0 
                        ? (showPR ? 'text-emerald-400' : 'text-emerald-500') 
                        : delta.dWeight < 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  >
                    {delta.dWeight > 0 ? `↑ +${delta.dWeight}` : delta.dWeight < 0 ? `↓ ${delta.dWeight}` : '= igual'}
                  </motion.p>
                )}
             </div>
             <div className="text-center">
                <motion.input 
                  type="text"
                  inputMode="numeric"
                  value={localReps}
                  onChange={(e) => {
                    isEditing.current = true;
                    setLocalReps(e.target.value);
                  }}
                  onBlur={commitReps}
                  onKeyDown={(e) => handleKeyDown(e, commitReps)}
                  whileFocus={{ scale: 1.15, color: "#f97316" }}
                  className={`text-xl font-black w-14 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                    isCurrent ? "text-slate-900" : "text-slate-400"
                  }`}
                  onFocus={(e) => {
                    e.target.select();
                    setFocusedIdx(idx);
                    setIsInputFocused(true);
                    setIsFooterVisible(true);
                  }}
                />
                <p className="text-[8px] font-black text-slate-300 tracking-widest mt-0.5 uppercase">
                  {isBeginner ? 'Repetições' : 'Reps'}
                </p>
                
                {/* DELTA REPS */}
                {delta && !isBeginner && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    className={`text-[9px] font-black mt-1 ${
                      delta.dReps > 0 
                        ? (showPR ? 'text-emerald-400' : 'text-emerald-500') 
                        : delta.dReps < 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  >
                    {delta.dReps > 0 ? `+${delta.dReps}` : delta.dReps < 0 ? `${delta.dReps}` : '='}
                  </motion.p>
                )}
             </div>
          </div>

          {/* EXPLICIT ROLLBACK BUTTON */}
          {isCompleted && !isCurrent && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                rollbackToSet(idx);
              }}
              className="absolute right-3 top-3 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-300 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-90 group"
              title="Voltar para esta série"
            >
              <RefreshCw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
            </button>
          )}
        </div>

        {!isBeginner && (
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
        )}
      </div>

      {/* BEGINNER HELPER TEXT */}
      {isBeginner && isCurrent && (
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] font-bold text-blue-500 uppercase tracking-wide mt-3 text-center"
        >
          Use um peso confortável
        </motion.p>
      )}

      {/* MINI PROGRESS BAR COMPARISON */}
      {delta && !isBeginner && (
        <div className="w-full mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ 
               width: delta.dWeight > 0 || (delta.dWeight === 0 && delta.dReps >= 0) ? '100%' : '50%',
               backgroundColor: delta.dWeight > 0 || (delta.dWeight === 0 && delta.dReps > 0) ? '#10b981' : (delta.dWeight === 0 && delta.dReps === 0 ? '#94a3b8' : '#ef4444')
             }}
             className="h-full"
           />
        </div>
      )}
    </motion.div>
  );
};

export default function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { navigate, goBack } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authApi.getUser().then(setUser).catch(console.error);
  }, []);
  
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
  const [userLevel, setUserLevel] = useState<UserLevel>('BEGINNER');
  const isBeginner = userLevel === 'BEGINNER';
  const isIntermediate = userLevel === 'INTERMEDIATE';
  const isAdvanced = userLevel === 'ADVANCED';
  
  // Momentum & Compression
  const momentum = currentSet >= 3 || userLevel === 'ADVANCED';
  
  // Track all sets for the current exercise
  const [activeSetsData, setActiveSetsData] = useState<{weight: number, reps: number, rpe: number}[]>([]);
  
  // Track performance for ALL exercises in the session to guarantee persistence
  const [workoutPerformance, setWorkoutPerformance] = useState<Record<number, {weight: number, reps: number, rpe: number}[]>>({});
  
  const [lastSet, setLastSet] = useState<LastSetData | null>(null);
  const [previousSet, setPreviousSet] = useState<LastSetData | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showExercisesList, setShowExercisesList] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [pendingSetToComplete, setPendingSetToComplete] = useState<number | null>(null);
  const [completedSetIndices, setCompletedSetIndices] = useState<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const isAdvancingRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [fatigueDetected, setFatigueDetected] = useState(false);
  const [anomalyDetected, setAnomalyDetected] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [historicalSets, setHistoricalSets] = useState<{weight_achieved: number, reps_achieved: number, set_number: number}[]>([]);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoverySession, setRecoverySession] = useState<any>(null);

  useEffect(() => {
    if (!historyId || exercises.length === 0) return;
    
    async function hydrate() {
      log("[RECOVERY] Hydrating session from logs", { historyId });
      setIsHydrating(true);
      try {
        const logs = await workoutApi.getWorkoutLogsSimple(historyId);
        if (logs && logs.length > 0) {
           const newPerf: Record<number, {weight: number, reps: number, rpe: number}[]> = {};
           logs.forEach(l => {
              const exIdx = exercises.findIndex(ex => ex.exercise_id === l.exercise_id);
              if (exIdx === -1) return;
              if (!newPerf[exIdx]) newPerf[exIdx] = [];
              newPerf[exIdx][l.set_number - 1] = {
                weight: l.weight_achieved,
                reps: l.reps_achieved,
                rpe: l.rpe || 8
              };
           });
           setWorkoutPerformance(newPerf);
           
           // Populate completed sets for current exercise
           const currentExLogs = logs.filter(l => l.exercise_id === exercises[currentIndex]?.exercise_id);
           if (currentExLogs.length > 0) {
             const completed = new Set<number>();
             currentExLogs.forEach(l => completed.add(l.set_number - 1));
             setCompletedSetIndices(completed);
           }
        }
      } catch (err) {
        console.error("Failed to hydrate session", err);
      } finally {
        setIsHydrating(false);
      }
    }
    hydrate();
  }, [historyId, exercises.length]);

  useEffect(() => {
    async function checkRecovery() {
      const user = await authApi.getUser();
      if (!user) return;
      
      const partial = await workoutApi.getPartialSession(user.id);
      if (partial && partial.history_id && partial.workout_id === workoutId && partial.history_id !== historyId) {
        setRecoverySession(partial);
        setShowRecoveryPrompt(true);
      }
    }
    checkRecovery();
  }, [workoutId, historyId]);

  useEffect(() => {
    async function loadStreak() {
      try {
        const user = await authApi.getUser();
        if (user) {
          const history = await workoutApi.getWorkoutHistory(user.id);
          const currentStreak = calculateStreak(history.map((h: any) => h.completed_at));
          setStreak(currentStreak);
        }
      } catch (e) {
        console.error("Error loading streak", e);
      }
    }
    loadStreak();
  }, []);

  useEffect(() => {
    async function determineLevel() {
      try {
        const u = await authApi.getUser();
        if (u) {
          const history = await workoutApi.getWorkoutHistory(u.id);
          const count = history.length;
          if (count < 10) setUserLevel('BEGINNER');
          else if (count < 40) setUserLevel('INTERMEDIATE');
          else setUserLevel('ADVANCED');
          log("[LEVEL_DETECTED]", { count, level: count < 10 ? 'BEGINNER' : count < 40 ? 'INTERMEDIATE' : 'ADVANCED' });
        }
      } catch (e) {
        console.error("Error determining level", e);
      }
    }
    determineLevel();
  }, []);

  const log = (msg: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[WorkoutPlayer] ${msg}`, data || "");
    }
  };

  const rollbackToSet = (idx: number) => {
    log("[SET_ROLLBACK] Reverting to set", { idx });
    setCurrentSet(idx + 1);
    setIsResting(false);
    setRestOvertime(0);
    setPendingSetToComplete(null);
    hasTriggeredRef.current = false;
    isAdvancingRef.current = false;
    setIsTransitioning(false);
    
    // Remove completion for this set and all subsequent sets in this exercise
    setCompletedSetIndices(prev => {
      const next = new Set(prev);
      for (let i = idx; i < (currentEx?.sets_json?.length || 0); i++) {
        next.delete(i);
      }
      return next;
    });
  };

  const handleAdjustTimer = (delta: number) => {
    setTimeLeft(prev => {
      const newVal = Math.max(0, prev + delta);
      if (newVal === 0 && prev > 0) {
        log("[REST_SKIPPED] Timer adjusted to 0");
        // We'll let the useEffect handle the 1s delay for "VAI LÁ"
        // But if we want immediate:
        // advanceWorkout(pendingSetToComplete!);
      }
      return newVal;
    });
  };

  // Smart Footer Logic
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Background Sync / Interrupt Resilience
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save current timestamp if resting
        if (isResting) {
          localStorage.setItem('workout_rest_start', Date.now().toString());
          localStorage.setItem('workout_rest_time_left', timeLeft.toString());
        }
        // Save overall progress
        if (user && workoutId && historyId) {
          workoutApi.upsertPartialSession(
            user.id, 
            workoutId, 
            historyId, 
            new Date().toISOString()
          ).catch(console.error);
        }
      } else {
        // Returned to app
        const restStart = localStorage.getItem('workout_rest_start');
        const restTimeLeft = localStorage.getItem('workout_rest_time_left');
        
        if (isResting && restStart && restTimeLeft) {
          const elapsed = Math.floor((Date.now() - parseInt(restStart)) / 1000);
          const newTimeLeft = Math.max(0, parseInt(restTimeLeft) - elapsed);
          setTimeLeft(newTimeLeft);
        }
        
        localStorage.removeItem('workout_rest_start');
        localStorage.removeItem('workout_rest_time_left');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isResting, timeLeft, user, workoutId, historyId]);

  // Debounced Auto-Save of progress
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't auto-save if we are already finishing the workout to avoid locks
      if (user && historyId && activeSetsData.length > 0 && !finishing && !isWorkoutComplete) {
        workoutApi.updatePartialSession(historyId, currentIndex, currentSet).catch(err => {
          // Silent log for auto-saves to not interrupt user
          console.warn("[AUTO-SAVE] Failed", err);
        });
      }
    }, 2000); // Increased debounce to 2s
    return () => clearTimeout(timer);
  }, [activeSetsData, currentIndex, currentSet, historyId, user, finishing, isWorkoutComplete]);

  // Intensity Levels
  const getIntensity = () => {
    const currentRPE = activeSetsData[currentSet - 1]?.rpe || 0;
    if (currentRPE >= 8 || currentSet > 2) return 'HIGH';
    if (currentSet === 1 && currentRPE < 6) return 'LOW';
    return 'MEDIUM';
  };
  const intensity = getIntensity();
  
  const getSetDelta = (idx: number, currentWeight: number, currentReps: number) => {
    if (!historicalSets || historicalSets.length === 0) return null;
    
    let historicalSet = historicalSets.find(s => s.set_number === idx + 1);
    
    // Fallback: closest match (last set of previous session)
    if (!historicalSet) {
       historicalSet = historicalSets[historicalSets.length - 1];
    }
    
    if (!historicalSet) return null;

    const dWeight = currentWeight - historicalSet.weight_achieved;
    const dReps = currentReps - historicalSet.reps_achieved;
    
    return {
      dWeight,
      dReps,
      historicalSet
    };
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const maxScroll = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
    
    // Always show if at top or bottom
    if (currentScrollY < 20 || currentScrollY >= maxScroll - 20) {
      setIsFooterVisible(true);
      setIsHeaderVisible(true);
    } else if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
      if (currentScrollY > lastScrollY.current) {
        setIsFooterVisible(false);
        setIsHeaderVisible(false);
      } else {
        setIsFooterVisible(true);
        setIsHeaderVisible(true);
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
  }, [queryStatus]); // Re-attach when data loads and footer is rendered

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
  const nextEx = useMemo(() => (exercises && exercises[currentIndex + 1]) || null, [exercises, currentIndex]);

  // Failsafe & Consistency Guard
  useEffect(() => {
    if (!exercises || exercises.length === 0) return;
    
    // Recovery: Ensure current index and set are within valid ranges
    if (currentIndex >= exercises.length) {
      log("[FAILSAFE] Index out of bounds, resetting", { currentIndex });
      setCurrentIndex(exercises.length - 1);
    }
    
    const ex = exercises[currentIndex];
    const maxSets = ex?.sets_json?.length || 1;
    if (currentSet > maxSets) {
       log("[FAILSAFE] Set out of bounds, resetting", { currentSet, maxSets });
       setCurrentSet(maxSets);
    }

    // Integrity: Ensure completed sets don't have gaps (optional but requested)
    // We strictly control this via advanceWorkout and rollbackToSet, 
    // but we can monitor it here if needed.
  }, [currentIndex, currentSet, exercises]);

  // Timers
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Subtle Beep Helper
  const playTimerBeep = (isTerminal = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(isTerminal ? 880 : 440, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { /* Ignore audio errors */ }
  };

  // CENTRALIZED PROGRESSION LOGIC
  const advanceWorkout = async (completedIdx: number) => {
    if (!currentEx || !historyId || isTransitioning || isAdvancingRef.current || isWorkoutComplete) return;
    
    log("[ADVANCE_WORKOUT] Start", { completedIdx });
    isAdvancingRef.current = true;
    setIsTransitioning(true);

    // 1. Mark as completed
    setCompletedSetIndices(prev => {
      const next = new Set(prev);
      next.add(completedIdx);
      return next;
    });
    
    // 2. Sound & Haptic
    playTimerBeep(true);
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

    // 3. Reset states for progression
    setIsResting(false);
    setRestOvertime(0);
    hasTriggeredRef.current = false; // Prepare for next rest

    // 4. Determine next step
    const setsTarget = currentEx.sets_json?.length || 0;
    const isLastSet = currentSet >= setsTarget;

    if (isLastSet) {
      if (currentIndex < exercises.length - 1) {
        log("[ADVANCE_WORKOUT] Next Exercise");
        showSuccess(`Excelente! ${currentEx.exercise_name} concluído.`);
        setCurrentIndex(currentIndex + 1);
        setCurrentSet(1);
        setCompletedSetIndices(new Set()); 
      } else {
        log("[ADVANCE_WORKOUT] Workout Finished");
        finishWorkout(true);
      }
    } else {
      log("[ADVANCE_WORKOUT] Next Set");
      setCurrentSet(currentSet + 1);
    }

    // 5. Update Remote Session
    workoutApi.updatePartialSession(historyId, currentIndex, currentSet).catch(console.error);
    setPendingSetToComplete(null);

    // 6. Natural Delay for UI stability & Focus
    setTimeout(() => {
      setIsTransitioning(false);
      isAdvancingRef.current = false;
      log("[ADVANCE_WORKOUT] Transition Complete");
    }, isAdvanced ? 150 : 400); 
  };

  // Scroll and focus handler
  useEffect(() => {
    const activeIdx = currentSet - 1;
    const activeRef = setRefs.current[activeIdx];
    
    if (activeRef && !isResting) {
      // Use requestAnimationFrame for a jitter-free scroll after layout paint
      requestAnimationFrame(() => {
        activeRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-focus input with stable delay
        const input = inputRefs.current[activeIdx];
        if (input) {
          setTimeout(() => {
            input.focus();
            try { input.select(); } catch(e) {}
          }, 120); // 120ms for stability
        }
      });
    }
  }, [currentSet, currentIndex, isResting]);

  useEffect(() => {
    if (!isResting) {
      vibratedAlert5s.current = false;
      hasTriggeredRef.current = false;
      return;
    }
    
    // Progression trigger at 0
    if (timeLeft <= 0) {
      setRestOvertime(prev => prev + 1);
      
      // Auto-advance after 1s of showing "VAI LÁ!"
      if (restOvertime === 1 && !hasTriggeredRef.current) { 
        hasTriggeredRef.current = true;
        if (pendingSetToComplete !== null) {
          advanceWorkout(pendingSetToComplete);
        }
      }
      return;
    }
    
    // Beep & Vibrate during final 5 seconds
    if (timeLeft <= 5 && timeLeft > 0) {
      playTimerBeep(false);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isResting, timeLeft, restOvertime, pendingSetToComplete]);

  // 1. Fetch History Effect - Independent of data initialization
  useEffect(() => {
    if (!currentEx?.exercise_id) return;
    const fetchHistory = async () => {
      try {
        const [last, historical] = await Promise.all([
          workoutApi.getLastSet(currentEx.exercise_id),
          workoutApi.getHistoricalSets(currentEx.exercise_id, historyId || undefined)
        ]);

        if (last) {
          const formattedLast = { weight: last.weight_achieved, reps: last.reps_achieved, rpe: last.rpe };
          setLastSet(prev => {
            if (JSON.stringify(prev) === JSON.stringify(formattedLast)) return prev;
            return formattedLast;
          });
        } else {
          setLastSet(null);
        }
        
        setHistoricalSets(historical);
      } catch (err) {
        console.error("Error fetching exercise history:", err);
      }
    };
    fetchHistory();
  }, [currentEx?.exercise_id, historyId]);

  // 2. Initialize Sets Data Effect - Only run on major context changes (exercise, index, hydration)
  const lastInitializedIdx = useRef<number | null>(null);

  useEffect(() => {
    if (!currentEx || isHydrating) return;

    // PROTECTION: Prevent infinite re-initialization loops
    // Only initialize if we changed index (exercise) or if we have no data at all
    const hasData = activeSetsData && activeSetsData.length > 0;
    const isNewIndex = lastInitializedIdx.current !== currentIndex;
    
    // If it's the SAME index we already have data for, DON'T overwrite from workoutPerformance
    // WorkoutPerformance might be lagging behind activeSetsData
    if (!isNewIndex && hasData) {
      log("[INIT] Already initialized for this index, skipping re-init");
      return;
    }

    let nextSets: { weight: number, reps: number, rpe: number }[] = [];

    // Prioritize existing performance data (from current session or hydration)
    if (workoutPerformance[currentIndex] && workoutPerformance[currentIndex].length > 0) {
      nextSets = workoutPerformance[currentIndex];
    } else if (currentEx.sets_json && currentEx.sets_json.length > 0) {
      nextSets = currentEx.sets_json.map((s, idx) => {
        // Auto-progression Memory: use lastSet for the first set if session is new
        if (idx === 0 && lastSet) {
          return {
            weight: lastSet.weight,
            reps: lastSet.reps,
            rpe: lastSet.rpe || 8
          };
        }
        return {
          weight: typeof s.weight === 'number' ? s.weight : 0,
          reps: parseInt(s.reps as string) || 10,
          rpe: 8
        };
      });
    } else {
      // Empty state safety: ensure at least one set exists
      const initialWeight = lastSet?.weight || 0;
      const initialReps = lastSet?.reps || 10;
      nextSets = [{ weight: initialWeight, reps: initialReps, rpe: 8 }];
    }

    // PROTECTIVE CHECK: Only update state if data has actually changed OR we are changing exercises
    setActiveSetsData(prev => {
      if (prev.length === nextSets.length && JSON.stringify(prev) === JSON.stringify(nextSets)) {
        log("[INIT] Data identical, preserving identity");
        lastInitializedIdx.current = currentIndex;
        return prev;
      }
      log("[INIT] Setting active sets for index", { currentIndex, sets: nextSets.length });
      lastInitializedIdx.current = currentIndex;
      return nextSets;
    });
  }, [currentIndex, currentEx?.exercise_id, lastSet, isHydrating]);

  // Sync activeSetsData to workoutPerformance
  useEffect(() => {
    if (!isHydrating && activeSetsData.length > 0 && currentEx && !isTransitioning) {
      setWorkoutPerformance(prev => {
        const current = prev[currentIndex];
        // If the data is already identical, don't update to avoid triggering dependent effects
        if (current && JSON.stringify(current) === JSON.stringify(activeSetsData)) {
          return prev;
        }
        return {
          ...prev,
          [currentIndex]: activeSetsData
        };
      });
    }
  }, [activeSetsData, currentIndex, currentEx?.exercise_id, isHydrating, isTransitioning]);

  // Update a single set's data
  const updateSetData = (idx: number, field: 'weight' | 'reps' | 'rpe', value: number | string) => {
    setActiveSetsData(prev => {
      // Use map to ensure we create a new array and new objects, preventing any reference sharing issues
      return prev.map((item, i) => {
        if (i !== idx) return item;
        
        let numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        
        // Safety limits
        if (field === 'weight' && numericValue > 1000) numericValue = 1000;
        if (field === 'reps' && numericValue > 500) numericValue = 500;
        if (field === 'rpe' && (numericValue < 1 || numericValue > 10)) numericValue = 8;
        
        const updatedValue = isNaN(numericValue) ? 0 : numericValue;
        
        // Anomaly detection: check for huge jumps from historical data
        if (field === 'weight' && i === idx && historicalSets.length > 0) {
          const histSet = historicalSets.find(s => s.set_number === idx + 1) || historicalSets[0];
          if (updatedValue > histSet.weight_achieved * 1.5 && updatedValue > histSet.weight_achieved + 20) {
            log("[ANOMALY] Huge weight increase detected", { from: histSet.weight_achieved, to: updatedValue });
            setAnomalyDetected(true);
          } else {
            setAnomalyDetected(false);
          }
        }

        return { ...item, [field]: updatedValue };
      });
    });
  };

  const handleCompleteSet = async () => {
    if (saving || !currentEx || !historyId || isResting) return;
    
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

    // FATIGUE DETECTION
    if (previousSet && !isBeginner) {
       if (reps < previousSet.reps || rpe >= 9) {
          setFatigueDetected(true);
       } else {
          setFatigueDetected(false);
       }
    }

    // PREDICTIVE LOAD SUGGESTION (Intermediate & Advanced only)
    if (!isBeginner) {
      if (decision.action === 'increase') {
         setSuggestion(`Próxima: ${decision.nextWeight}kg ↑`);
      } else if (decision.action.startsWith('decrease')) {
         setSuggestion(`Próxima: ${decision.nextWeight}kg ↓`);
      } else {
         setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }

    // SET PENDING FOR PROGRESSION
    setPendingSetToComplete(setIdx);
    if (!isAdvanced) {
      setFeedback(emotional);
      setTimeout(() => setFeedback(null), 3000);
    }
    setPreviousSet(currentSetData);

    // INITIATE REST
    setTimeLeft(adaptiveRest);
    setRestOvertime(0);
    setIsResting(true);
    
    if ('vibrate' in navigator) navigator.vibrate(30);

    // SAVE DATA (ASYNC)
    setSaving(true);
    try {
      const user = await authApi.getUser();
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

      log("[SET_SAVED] Progress recorded");

      // CRITICAL PERSISTENCE: Also update the template immediately for this exercise 
      // to ensure that even if the user exits abruptly, their changes to weight/reps are saved for next time.
      const formattedSetsForTemplate = activeSetsData.map(s => ({
        weight: typeof s.weight === 'string' ? parseFloat(s.weight) : s.weight,
        reps: s.reps.toString(),
        rest_time: currentEx.rest_time || 60,
        type: SetType.NORMAL
      }));
      
      if (currentEx.id) {
        await workoutApi.updateWorkoutExerciseSets(currentEx.id, formattedSetsForTemplate);
        log("[TEMPLATE_AUTO_SYNC_SUCCESS]");
      }
    } catch (err) {
      log("[SET_SAVE_ERROR]", err);
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const saveWorkoutExecution = async (histId: string, userId: string) => {
    log("[SAVE_WORKOUT_START]");
    
    // 1. Preparelogs for all completed exercises/sets
    const logs: any[] = [];
    const progressions: {exerciseId: string, weight: number, reps: number, rpe: number}[] = [];

    // Ensure we have the latest activeSetsData for the current exercise merged into the map
    const finalPerformance = {
      ...workoutPerformance,
      [currentIndex]: activeSetsData
    };

    Object.entries(finalPerformance).forEach(([exIdxStr, setsUntyped]) => {
      const exIdx = parseInt(exIdxStr);
      const ex = exercises[exIdx];
      if (!ex) return;
      
      const sets = setsUntyped as {weight: number, reps: number, rpe: number}[];

      sets.forEach((set, setIdx) => {
        // Only save sets that have at least 1 rep or some weight
        if (set.reps > 0 || set.weight > 0) {
          logs.push({
            history_id: histId,
            user_id: userId,
            exercise_id: ex.exercise_id,
            set_number: setIdx + 1,
            weight_achieved: typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight,
            reps_achieved: typeof set.reps === 'string' ? parseInt(set.reps) : set.reps,
            rpe: set.rpe,
            set_type: SetType.NORMAL,
            created_at: new Date().toISOString()
          });
        }
      });

      if (sets.length > 0) {
        const lastSetVal = sets[sets.length - 1];
        if (lastSetVal.reps > 0) {
          progressions.push({
            exerciseId: ex.exercise_id,
            weight: typeof lastSetVal.weight === 'string' ? parseFloat(lastSetVal.weight) : lastSetVal.weight,
            reps: typeof lastSetVal.reps === 'string' ? parseInt(lastSetVal.reps) : lastSetVal.reps,
            rpe: lastSetVal.rpe
          });
        }
      }
    });

    if (logs.length === 0) {
      log("[SAVE_WORKOUT_EMPTY] No sets to save");
      return;
    }

    // 2. Database Write (Batch)
    try {
      // Clean existing logs for this history to prevent duplicates from incremental saves
      const { error: deleteError } = await supabase.from('workout_sets_log').delete().eq('history_id', histId);
      if (deleteError) log("[SAVE_WORKOUT_CLEAN_WARN]", deleteError);

      // Now save the final state
      await workoutApi.saveWorkoutBatch(histId, logs);

      // 3. Single Source of Truth Validation: re-fetch and check
      const isValid = await workoutApi.validateWorkoutIntegrity(histId, logs.length);
      if (!isValid) {
        log("[INTEGRITY_FAIL] Mismatch between saved and expected logs. Retrying...");
        // One retry attempt
        await supabase.from('workout_sets_log').delete().eq('history_id', histId);
        await workoutApi.saveWorkoutBatch(histId, logs);
      }

      // 4. Save to Last Valid State Cache
      localStorage.setItem('last_valid_workout', JSON.stringify({
        historyId: histId,
        logs,
        timestamp: Date.now()
      }));

      setIsSavedSuccessfully(true);
      setTimeout(() => setIsSavedSuccessfully(false), 3000);

      // 5. Update template and progressions (Synchronous and Critical)
      try {
        // Update global progressions first
        await workoutApi.updateProgressionFromLogs(userId, histId);
        
        // Update the specific workout exercises (the template)
        const updatePromises = Object.entries(finalPerformance).map(([idx, setsUntyped]) => {
          const sets = setsUntyped as {weight: number, reps: number, rpe: number}[];
          const ex = exercises[parseInt(idx)];
          if (!ex?.id) return Promise.resolve();
          
          // Map to SetConfig format
          const formattedSets = sets.map(s => ({
            weight: typeof s.weight === 'string' ? parseFloat(s.weight) : s.weight,
            reps: s.reps.toString(),
            rest_time: ex.rest_time || 60,
            type: SetType.NORMAL
          }));
          
          return workoutApi.updateWorkoutExerciseSets(ex.id, formattedSets);
        });
        
        await Promise.all(updatePromises);
        log("[TEMPLATE_UPDATE_SUCCESS]");
      } catch (err) {
        log("[TEMPLATE_UPDATE_FAIL]", err);
      }

      log("[SAVE_WORKOUT_SUCCESS]");
    } catch (err) {
      log("[SAVE_WORKOUT_ERROR]", err);
      throw err;
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
      const u = await authApi.getUser();
      if (!u) throw new Error("Usuário não autenticado");

      const finalDuration = Math.round((Date.now() - (currentStartTime || Date.now())) / 60000);

      if (isSuccess) {
        // GUARANTEE PERSISTENCE BEFORE COMPLETING
        await saveWorkoutExecution(currentHistoryId, u.id);

        const finalExCount = Object.keys(workoutPerformance).length;
        
        // Only mark as finished if there are actually exercises recorded
        if (finalExCount > 0) {
          await workoutApi.finishWorkout(currentHistoryId, finalDuration, finalExCount);
          
          // UPDATE PROGRESSION FROM LOGS (Source of Truth)
          await workoutApi.updateProgressionFromLogs(u.id, currentHistoryId);
          
          // Background Sync / Cache Invalidation
          cacheStore.clear(`exercise_progression_${u.id}`);
          exercises.forEach(ex => cacheStore.clear(`exercise_stats_${ex.exercise_id}`));

          await workoutApi.clearPartialSession(u.id);
          
          cacheStore.clear(`workout_init_${workoutId}`);
          setWorkoutDuration(finalDuration);
          setIsWorkoutComplete(true);
          setIsFinished(true);
          showSuccess("Treino salvo com sucesso!");
        } else {
          // If no exercises recorded, just abandon it to keep history clean
          await workoutApi.abandonWorkout(currentHistoryId);
          if (user) await workoutApi.clearPartialSession(user.id);
          cacheStore.clear(`workout_init_${workoutId}`);
          resetWorkout();
          navigate('dashboard');
          showSuccess("Sessão vazia descartada.");
        }
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

  const isFinalSetOfExercise = currentEx && currentSet >= (currentEx.sets_json?.length || 0);
  const isFinalExercise = exercises && currentIndex >= exercises.length - 1;
  const isWorkoutTerminal = isFinalSetOfExercise && isFinalExercise;

  const preHint = useMemo(() => {
    if (!currentEx || isAdvanced) return null;
    return getPreSetHint({
      lastSet,
      targetReps: parseInt(currentEx.sets_json?.[currentSet - 1]?.reps as string) || 10
    });
  }, [currentEx, currentSet, lastSet, isAdvanced]);

  return (
    <div className="h-screen bg-[#F7F8FA] text-slate-900 flex flex-col font-sans overflow-hidden">
      {showRecoveryPrompt && recoverySession && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter mb-2">Recuperar Treino?</h3>
            <p className="text-sm text-slate-500 mb-8">Detectamos um treino não finalizado. Deseja continuar de onde parou?</p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setWorkout({
                    id: workoutId,
                    exercises: playerQuery.data.exercises,
                    historyId: recoverySession.history_id,
                    startTime: new Date(recoverySession.start_time).getTime(),
                    currentIndex: recoverySession.current_index || 0,
                    currentSet: recoverySession.current_set || 1
                  });
                  setShowRecoveryPrompt(false);
                  showSuccess("Treino recuperado!");
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase"
              >
                Sim, recuperar
              </button>
              <button 
                onClick={() => setShowRecoveryPrompt(false)}
                className="w-full py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase"
              >
                Não, começar novo
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
        {!isAdvanced && (
          <div className={`transition-all duration-500 overflow-hidden ${isResting ? 'h-0' : 'h-auto border-b border-slate-50 bg-[#F8FAFC]'}`}>
            <div className="px-4 py-1.5 flex items-center justify-center gap-2">
              <p className="text-[8px] font-[1000] text-slate-400 uppercase tracking-[0.2em]">
                {isBeginner ? "Modo Iniciante • Guiado" : "Modo Intermediário • Adaptativo"}
              </p>
            </div>
          </div>
        )}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col h-full items-center"
        >
          <div className="w-full max-w-md flex flex-col h-full bg-white relative">
            
            {/* 1. HEADER & PROGRESS */}
            <motion.header 
              initial={false}
              animate={{ 
                y: (isHeaderVisible || isResting) ? 0 : -100,
                opacity: (isHeaderVisible || isResting) ? 1 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`sticky top-0 z-50 bg-white transition-all duration-500 overflow-hidden ${
              momentum ? "h-12 border-b-0 shadow-sm" : "h-16 border-b"
            } px-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowExitModal(true)}
                  className="p-1 -ml-1 text-slate-400 hover:text-slate-900 active:scale-90 transition-all font-bold"
                >
                  <X size={24} strokeWidth={3} />
                </button>
                <div className={`flex flex-col transition-all duration-500 ${momentum ? "scale-90 origin-left" : ""}`}>
                  <span className="text-sm font-[1000] text-slate-900 truncate max-w-[150px] uppercase tracking-tighter">
                    {currentEx?.exercise_name || 'Carregando...'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5 ${momentum ? "hidden" : ""}`}>
                      EX {currentIndex + 1}/{exercises.length} • SÉRIE {currentSet}/{activeSetsData.length}
                    </span>
                    <AnimatePresence>
                      {isSavedSuccessfully && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0 }}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"
                        >
                          <Check size={8} strokeWidth={4} /> Salvo
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                {streak > 0 && !momentum && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-full border border-orange-100 hidden sm:flex">
                    <Flame size={12} className="text-orange-500 fill-orange-500" />
                    <span className="text-[10px] font-black text-orange-600 tabular-nums">{streak}</span>
                  </div>
                )}
                <div className="flex flex-col items-end">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Tempo</p>
                   <p className="text-xs font-bold tabular-nums text-slate-900">{formatTime(workoutDuration)}</p>
                </div>
              </div>
            </motion.header>

            {/* 2. CONTEÚDO SCROLLABLE */}
            <div 
              className="flex-1 overflow-y-auto bg-[#F8FAFC]"
              onScroll={handleScroll}
              onClick={() => setIsFooterVisible(true)}
              style={{ paddingBottom: `calc(${footerHeight + 48}px + env(safe-area-inset-bottom))` }}
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
                      <div className="flex justify-between items-start">
                        <h1 className="text-base font-bold text-slate-900 leading-tight">
                          {currentEx?.exercise_name}
                        </h1>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg tabular-nums">
                          {currentSet}/{activeSetsData.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5 line-clamp-1">
                        {currentEx?.muscle_group} • {currentEx?.equipment || 'Sem equipamento'}
                      </p>
                      {!isAdvanced && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          Foco na amplitude e contração lenta.
                        </p>
                      )}
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
              <div className={`px-4 ${isAdvanced ? 'space-y-2' : 'space-y-3'} pb-8 overflow-hidden`}>
                {activeSetsData.map((setData, idx) => {
                  const isCurrent = idx === currentSet - 1;
                  const isCompleted = completedSetIndices.has(idx);
                  const isPending = pendingSetToComplete === idx;
                  const isPast = idx < currentSet - 1; // Used for animation
                  const delta = getSetDelta(idx, setData.weight, setData.reps);
                  
                  return (
                    <SetCard 
                      key={`${currentIndex}_${idx}`}
                      idx={idx}
                      setData={setData}
                      isCurrent={isCurrent}
                      isCompleted={isCompleted}
                      isPending={isPending}
                      isPast={isPast}
                      intensity={intensity}
                      showPR={showPR}
                      lastSet={lastSet}
                      delta={delta}
                      updateSetData={updateSetData}
                      rollbackToSet={rollbackToSet}
                      setFocusedIdx={setFocusedIdx}
                      setIsInputFocused={setIsInputFocused}
                      setIsFooterVisible={setIsFooterVisible}
                      setRowRef={(el: any) => (setRefs.current[idx] = el)}
                      setInputRef={(el: any) => (inputRefs.current[idx] = el)}
                      focusedIdx={focusedIdx}
                      userLevel={userLevel}
                    />
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

                {nextEx && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.8, y: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="mt-10 px-2 transition-all duration-300"
                  >
                    <p className="text-[7px] font-[1000] text-slate-400 uppercase tracking-[0.25em] mb-3 text-center">Prepare-se: Próximo Exercício</p>
                    <div className="flex items-center gap-4 bg-white/40 backdrop-blur-sm rounded-[2rem] p-4 border border-slate-100 shadow-sm">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-white shadow-inner">
                        {nextEx.image_url ? (
                          <img src={nextEx.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <Play size={18} className="text-slate-200 fill-slate-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter">{nextEx.exercise_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {nextEx.sets_json?.[0]?.weight || 0}kg × {nextEx.sets_json?.[0]?.reps || 10}
                           </span>
                           <div className="w-1 h-1 rounded-full bg-slate-200" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {nextEx.sets_json?.length || 0} séries
                           </span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <ArrowRight size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* FEEDBACK INTELIGENTE (IA) */}
              <AnimatePresence mode="wait">
                {(feedback || preHint) && !isAdvanced && (
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
              <div className="flex justify-between px-8 mt-12 mb-8">
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
              <div style={{ height: footerHeight + 40 }} />

            </div>

            {/* 3. FOOTER FIXO */}
            <motion.footer 
              ref={footerRef}
              initial={{ y: 0, opacity: 1 }}
              animate={{ 
                y: (isFooterVisible || isResting || isInputFocused) ? 0 : '100%',
                opacity: (isFooterVisible || isResting || isInputFocused) ? 1 : 0,
                scale: (isResting && timeLeft <= 0) ? 1.03 : 1
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t p-4 pb-10 max-w-md mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.06)] rounded-t-2xl ${isResting && timeLeft <= 5 && timeLeft > 0 ? 'ring-2 ring-orange-500/20' : ''}`}
            >
              
              {/* PR / FEEDBACK / SUGGESTION OVERLAY */}
              <AnimatePresence>
                {(feedback || suggestion || anomalyDetected || fatigueDetected || (isResting && restOvertime > 15)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[90%] max-w-[320px] pointer-events-none z-50"
                  >
                    <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex flex-col gap-2 border border-slate-800 backdrop-blur-md bg-opacity-95 items-center text-center">
                      {suggestion && (
                         <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                           <Target size={12} /> {suggestion}
                         </div>
                      )}
                      
                      {feedback && (
                        <p className="text-xs font-black uppercase tracking-tight leading-snug">
                          {feedback}
                        </p>
                      )}

                      {anomalyDetected && (
                         <div className="flex items-center gap-2 text-yellow-400 font-bold text-[10px] uppercase tracking-widest">
                           Progressão incomum detectada — verifique a carga
                         </div>
                      )}

                      {isResting && restOvertime > 15 && (
                        <div className="flex items-center gap-2 text-orange-400 animate-pulse font-bold text-[10px] uppercase tracking-widest">
                          Vamos para a próxima?
                        </div>
                      )}

                      {fatigueDetected && (
                         <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                           Fadiga detectada — mantenha a carga
                         </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COMPACT TIMER BAR (CENTERED CONTROL BAR) */}
              <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-2 mb-4 border border-slate-100">
                <button 
                  onClick={() => handleAdjustTimer(-10)}
                  className="w-14 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all font-black text-[10px] tracking-widest shadow-sm border border-slate-100"
                >
                  -10S
                </button>

                <div className="flex flex-col items-center">
                  <motion.span 
                    key={isResting ? 'active' : 'idle'}
                    animate={isResting && timeLeft <= 5 ? {
                      scale: [1, 1.2, 1],
                      color: timeLeft <= 0 ? '#10b981' : '#ef4444'
                    } : {
                      scale: 1,
                      opacity: isResting ? 1 : 0.4,
                      color: isResting ? '#0f172a' : '#94a3b8'
                    }}
                    transition={isResting && timeLeft <= 5 ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : { duration: 0.3 }}
                    className="text-2xl font-black tabular-nums transition-all tracking-tighter"
                  >
                    {isResting ? (timeLeft <= 0 ? "VAI LÁ!" : formatTime(timeLeft)) : "0:00"}
                  </motion.span>
                  <p className="text-[7px] font-[1000] text-slate-400/60 uppercase tracking-[0.2em] -mt-1">Descanso</p>
                </div>

                <button 
                  onClick={() => handleAdjustTimer(10)}
                  className="w-14 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all font-black text-[10px] tracking-widest shadow-sm border border-slate-100"
                >
                  +10S
                </button>
              </div>

              <motion.button
                onClick={isResting ? () => { 
                  log("[REST_SKIPPED] Manual skip");
                  if (pendingSetToComplete !== null) advanceWorkout(pendingSetToComplete);
                } : handleCompleteSet}
                disabled={saving || isTransitioning}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                animate={isResting && timeLeft <= 0 ? {
                  backgroundColor: '#f97316',
                  boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.4)'
                } : {}}
                className={`w-full h-16 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isResting 
                    ? (timeLeft <= 0 ? "bg-orange-500 text-white" : "bg-slate-900 text-white") 
                    : "bg-orange-500 text-white shadow-orange-500/30"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isResting 
                      ? (timeLeft <= 0 ? "Próxima série" : "Pular Descanso") 
                      : (isWorkoutTerminal ? "Finalizar Treino" : "Concluir Série")}
                    {!isResting && (isWorkoutTerminal ? <CheckCircle2 size={18} strokeWidth={4} /> : <ArrowRight size={18} strokeWidth={4} />)}
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowExitModal(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-50 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                  <Target size={32} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter mb-2">Interromper Treino?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  Deseja salvar seu progresso atual ou descartar totalmente esta sessão?
                </p>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => finishWorkout(true)} 
                    disabled={finishing}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar e Sair"}
                  </button>
                  <button 
                    onClick={() => finishWorkout(false)} 
                    disabled={finishing}
                    className="w-full py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={() => setShowExitModal(false)}
                    className="w-full py-2 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
