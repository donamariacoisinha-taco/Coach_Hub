
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  List,
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
  Award,
  Sparkles,
  Dumbbell,
  Search,
  Heart,
  History,
  Filter,
  Trash2,
  MoreVertical,
  GripVertical,
  LayoutList,
  Info
} from "lucide-react";
import { exerciseApi } from "../../lib/api/exerciseApi";
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
import { fetchWithRetry } from "../../lib/utils";
import { athleteMemoryEngine, playSensoryTone, playHapticFeedback } from "../../services/athleteMemoryEngine";


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
  userLevel = 'BEGINNER',
  focusMode = false
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
    playSensoryTone('click');
    playHapticFeedback('light');
 
    // Track if load was reduced
    try {
      const parsedVal = parseFloat(localWeight.replace(',', '.'));
      if (!isNaN(parsedVal) && parsedVal < setData.weight) {
        const uId = localStorage.getItem('coach_rubi_user_id') || 'guest';
        if (uId) {
          athleteMemoryEngine.trackExerciseIntensityReduction(uId, setData.exercise_id);
        }
      }
    } catch (e) {}
  };
 
  const commitReps = () => {
    isEditing.current = false;
    updateSetData(idx, 'reps', localReps);
    setFocusedIdx(null);
    setIsInputFocused(false);
    playSensoryTone('click');
    playHapticFeedback('light');
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
        opacity: isCompleted 
          ? (focusedIdx === idx ? 0.85 : (focusMode ? 0.35 : 0.45)) 
          : (focusMode && !isCurrent ? 0.45 : 1),
        scale: isCurrent 
          ? (showPR ? 1.02 : (intensity === 'LOW' ? [1, 1.01, 1] : (focusedIdx === idx ? 1.02 : 1))) 
          : isPast && !isCurrent ? 0.96 : 0.98,
        height: "auto",
        marginTop: (idx === 0 ? 0 : 12),
        borderColor: isPending 
          ? '#cbd5e1' 
          : (isCurrent 
              ? (showPR ? '#A5C8FF' : '#7BA7FF') 
              : (focusedIdx === idx && isCompleted 
                  ? (focusMode ? '#475569' : '#94a3b8') 
                  : (focusMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.5)'))),
        boxShadow: isCurrent && !isPending
          ? (showPR ? '0 20px 40px -5px rgba(123, 167, 255, 0.25)' : (intensity === 'HIGH' ? '0 15px 35px -5px rgba(123, 167, 255, 0.15)' : '0 10px 25px -5px rgba(123, 167, 255, 0.05)')) 
          : (focusedIdx === idx && isCompleted ? '0 4px 12px rgba(15,23,42,0.04)' : '0 0px 0px 0px rgba(0,0,0,0)'),
      }}
      style={{ overflow: "visible" }}
      transition={isCurrent && intensity === 'LOW' ? {
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        default: transitionConfig
      } : transitionConfig}
      className={`flex flex-col items-stretch ${isAdvanced ? 'p-3' : 'p-4'} rounded-2xl transition-all duration-300 border-2 ${
        isCompleted ? (focusMode ? "bg-slate-900/30 border-slate-900/60" : "bg-slate-50/50") : 
        isPending ? "bg-slate-50 border-dashed animate-pulse cursor-wait" :
        (focusMode ? "bg-slate-900 border-slate-900/60" : "bg-white")
      } ${isCurrent && intensity === 'HIGH' && !isPending ? (focusMode ? 'border-[#7BA7FF] ring-4 ring-[#7BA7FF]/25 shadow-[0_0_30px_rgba(123,167,255,0.2)]' : 'border-[#7BA7FF] ring-4 ring-[#7BA7FF]/10') : ''}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
            isCompleted ? "bg-emerald-500 text-white" : 
            isCurrent ? "bg-[#7BA7FF] text-white shadow-md shadow-[#7BA7FF]/15" : 
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
                  whileFocus={{ scale: 1.15, color: "#7BA7FF" }}
                  className={`text-xl font-black w-20 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                    isCurrent ? (focusMode ? "text-white" : "text-slate-900") : (focusMode ? "text-slate-500" : "text-slate-400")
                  }`}
                  onFocus={(e) => {
                    e.target.select();
                    setFocusedIdx(idx);
                    setIsInputFocused(true);
                    setIsFooterVisible(true);
                  }}
                />
                <p className={`text-[8px] font-black tracking-widest mt-0.5 uppercase ${focusMode ? 'text-slate-500' : 'text-slate-300'}`}>
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
                  whileFocus={{ scale: 1.15, color: "#7BA7FF" }}
                  className={`text-xl font-black w-14 bg-transparent border-none p-2 focus:ring-0 text-center transition-colors ${
                    isCurrent ? (focusMode ? "text-white" : "text-slate-900") : (focusMode ? "text-slate-500" : "text-slate-400")
                  }`}
                  onFocus={(e) => {
                    e.target.select();
                    setFocusedIdx(idx);
                    setIsInputFocused(true);
                    setIsFooterVisible(true);
                  }}
                />
                <p className={`text-[8px] font-black tracking-widest mt-0.5 uppercase ${focusMode ? 'text-slate-500' : 'text-slate-300'}`}>
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
              className="absolute right-3 top-3 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-300 hover:text-indigo-500 hover:border-indigo-200 transition-all active:scale-90 group"
              title="Voltar para esta série"
            >
              <RefreshCw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
            </button>
          )}
        </div>

        <div className={`flex flex-col items-center p-1 px-1.5 transition-all duration-300 rounded-[14px] w-[110px] select-none shrink-0 ${
          focusMode 
            ? "bg-slate-900/60 backdrop-blur-md border border-slate-800/80" 
            : "bg-white/65 backdrop-blur-md border border-slate-200/50 shadow-sm"
        }`}>
           <div className="relative w-full overflow-hidden flex items-center justify-center">
             {/* Gradient visual fades indicating scrollable area */}
             <div className={`absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r pointer-events-none z-10 ${
               focusMode ? "from-slate-900 to-transparent" : "from-white to-transparent"
             }`} />
             
             {/* Super-compact Horizontally scrollable track */}
             <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex gap-1 py-0.5 px-1.5 items-center snap-x snap-mandatory">
                {[5, 6, 7, 8, 9, 10].map(v => {
                  const isSelected = setData.rpe === v;
                  let activeBg = 'bg-[#7BA7FF]';
                  if (v === 8) activeBg = 'bg-[#34D399]';
                  if (v === 9) activeBg = 'bg-[#F59E0B]';
                  if (v === 10) activeBg = 'bg-[#FB7185]';

                  return (
                    <motion.button 
                      key={v}
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        updateSetData(idx, 'rpe', v);
                        playSensoryTone('click');
                        if ('vibrate' in navigator) navigator.vibrate(10);
                      }}
                      className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all flex items-center justify-center shrink-0 snap-center ${
                        isSelected 
                          ? `${activeBg} text-white shadow-sm scale-110`
                          : focusMode 
                            ? "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300" 
                            : "text-slate-400 bg-slate-50/60 hover:bg-slate-100 hover:text-slate-600"
                      }`}
                    >
                      {v}
                    </motion.button>
                  );
                })}
             </div>

             <div className={`absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l pointer-events-none z-10 ${
               focusMode ? "from-slate-900 to-transparent" : "from-white to-transparent"
             }`} />
           </div>
           <p className={`text-[7px] font-black tracking-widest mt-1 uppercase leading-none ${
             focusMode ? 'text-slate-500' : 'text-slate-400/80'
           }`}>RPE (Rolar ↔)</p>
        </div>
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
  const [memoryLoadSuggestion, setMemoryLoadSuggestion] = useState<any>(null);

  useEffect(() => {
    async function fetchSuggestion() {
      try {
        const u = await authApi.getUser();
        const activeEx = exercises && exercises[currentIndex];
        if (u && activeEx?.exercise_id) {
          const sug = await athleteMemoryEngine.predictLoadSuggestion(
            u.id, 
            activeEx.exercise_id, 
            userLevel as any
          );
          setMemoryLoadSuggestion(sug);
        } else {
          setMemoryLoadSuggestion(null);
        }
      } catch (e) {
        setMemoryLoadSuggestion(null);
      }
    }
    fetchSuggestion();
  }, [exercises, currentIndex, userLevel]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [originalExercises, setOriginalExercises] = useState<WorkoutExercise[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [showExercisesList, setShowExercisesList] = useState(false);
  
  // Adaptive Protocol Management States
  const [allAvailableExercises, setAllAvailableExercises] = useState<any[]>([]);
  const [loadingExercisesDetail, setLoadingExercisesDetail] = useState(false);
  const [exerciseSelectorMode, setExerciseSelectorMode] = useState<'add' | 'replace' | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('Tudo');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [editingSeriesLoad, setEditingSeriesLoad] = useState<number>(0);
  const [editingSeriesCount, setEditingSeriesCount] = useState<number>(3);

  // Fetch all exercises and favorites for smart replacement/selector
  useEffect(() => {
    async function loadAllExercisesData() {
      setLoadingExercisesDetail(true);
      try {
        const list = await exerciseApi.getExercises();
        setAllAvailableExercises(list || []);
        
        const u = await authApi.getUser();
        if (u) {
          const favs = await exerciseApi.getFavorites(u.id);
          setFavoritesList(favs || []);
        }
      } catch (err) {
        console.error("Failed to load exercises for adaptive planner in player", err);
      } finally {
        setLoadingExercisesDetail(false);
      }
    }
    loadAllExercisesData();
  }, []);

  const handleAddExerciseToSession = (ex: any) => {
    // Construct a beautiful new WorkoutExercise object conforming to state definitions
    const newEx: WorkoutExercise = {
      id: "ex-live-" + Math.random().toString(36).substring(2, 9),
      category_id: workoutId,
      exercise_id: ex.id,
      order: exercises.length,
      sets: 3,
      reps: "10",
      weight: 0,
      rest_time: 60,
      sets_json: Array.from({ length: 3 }).map(() => ({
        reps: "10",
        weight: 0,
        rest_time: 60,
        type: SetType.NORMAL
      })),
      exercise_name: ex.name,
      muscle_group: ex.muscle_group || "Outros",
      exercise_image: ex.image_url || undefined,
      exercise_name_snapshot: ex.name
    };

    const updatedExercises = [...exercises, newEx];
    useWorkoutStore.setState({ exercises: updatedExercises } as any);
    
    // Auto-update live tracker performance map
    setWorkoutPerformance(prev => {
      const nextIdx = updatedExercises.length - 1;
      return {
        ...prev,
        [nextIdx]: Array.from({ length: 3 }).map(() => ({
          weight: 0, reps: 10, rpe: 8
        }))
      };
    });

    showSuccess(`Adicionado: ${ex.name}`);
    setExerciseSelectorMode(null);
    setSearchQuery('');
    playSensoryTone('success');
    playHapticFeedback('success');
  };

  const handleReplaceExerciseInSession = (ex: any) => {
    if (replaceIndex === null) return;

    const target = exercises[replaceIndex];
    if (!target) return;

    const updatedExercises = [...exercises];
    updatedExercises[replaceIndex] = {
      ...target,
      exercise_id: ex.id,
      exercise_name: ex.name,
      muscle_group: ex.muscle_group || target.muscle_group,
      exercise_image: ex.image_url || target.exercise_image,
      exercise_name_snapshot: ex.name
    };

    useWorkoutStore.setState({ exercises: updatedExercises } as any);

    // If we're replacing the CURRENT ACTIVE exercise, synchronize UI inputs
    if (replaceIndex === currentIndex) {
      const numSets = target.sets_json?.length || target.sets || 3;
      const defaultSets = Array.from({ length: numSets }).map(() => ({
        weight: target.weight || 0,
        reps: parseInt(target.reps) || 10,
        rpe: 8
      }));
      setActiveSetsData(defaultSets);
      setCurrentSet(1);
      setCompletedSetIndices(new Set());
      setLastSet(null); // Invalidate cache to refetch history for new ID
    }

    showSuccess(`Substituído por: ${ex.name}`);
    setExerciseSelectorMode(null);
    setReplaceIndex(null);
    setSearchQuery('');
    playSensoryTone('success');
    playHapticFeedback('success');
  };

  const handleRemoveExerciseFromSession = (index: number) => {
    if (exercises.length <= 1) {
      showError(new Error("O protocolo exige no mínimo 1 exercício ativo."));
      return;
    }

    const exName = exercises[index]?.exercise_name || "Exercício";
    const updatedExercises = exercises.filter((_, i) => i !== index);

    // Dynamic index adjustment
    let newCurrentIdx = currentIndex;
    if (currentIndex === index) {
      newCurrentIdx = Math.min(index, updatedExercises.length - 1);
    } else if (currentIndex > index) {
      newCurrentIdx = currentIndex - 1;
    }

    // Dynamic state logs map shifting to prevent indices misalignment
    setWorkoutPerformance(prev => {
      const next: Record<number, any> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const kInt = parseInt(key);
        if (kInt < index) {
          next[kInt] = val;
        } else if (kInt > index) {
          next[kInt - 1] = val;
        }
      });
      return next;
    });

    setCompletedSetsByExercise(prev => {
      const next: Record<number, any> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const kInt = parseInt(key);
        if (kInt < index) {
          next[kInt] = val;
        } else if (kInt > index) {
          next[kInt - 1] = val;
        }
      });
      return next;
    });

    useWorkoutStore.setState({
      exercises: updatedExercises,
      currentIndex: newCurrentIdx,
      currentSet: 1
    } as any);

    if (newCurrentIdx === currentIndex) {
      const savedCompleted = completedSetsByExercise[newCurrentIdx] || new Set();
      setCompletedSetIndices(savedCompleted);
    }

    showSuccess(`Removido do protocolo: ${exName}`);
    playSensoryTone('warning');
    playHapticFeedback('medium');
    setContextMenuIndex(null);
  };

  const handleAdjustExerciseWeight = (index: number, newWeight: number) => {
    const target = exercises[index];
    if (!target) return;

    const updatedExercises = [...exercises];
    updatedExercises[index] = {
      ...target,
      weight: newWeight
    };
    useWorkoutStore.setState({ exercises: updatedExercises } as any);

    // If adjusting current exercise, synchronize active performance loads state
    if (index === currentIndex) {
      setActiveSetsData(prev => prev.map(s => ({ ...s, weight: newWeight })));
    }

    setWorkoutPerformance(prev => {
      const existing = prev[index] || [];
      const nextSets = existing.map(s => ({ ...s, weight: newWeight }));
      return { ...prev, [index]: nextSets };
    });

    showSuccess(`Carga padrão ajustada para ${newWeight}kg`);
    setContextMenuIndex(null);
    playSensoryTone('click');
  };

  const handleAdjustExerciseSets = (index: number, newSetsCount: number) => {
    if (newSetsCount < 1 || newSetsCount > 10) return;
    const target = exercises[index];
    if (!target) return;

    const updatedExercises = [...exercises];
    const currentSetsCount = target.sets_json?.length || target.sets || 3;
    let nextSetsJson = [...(target.sets_json || [])];

    if (newSetsCount > currentSetsCount) {
      const lastSet = nextSetsJson[nextSetsJson.length - 1] || { reps: "10", weight: target.weight || 0, rest_time: target.rest_time || 60, type: SetType.NORMAL };
      for (let i = currentSetsCount; i < newSetsCount; i++) {
        nextSetsJson.push({ ...lastSet });
      }
    } else {
      nextSetsJson = nextSetsJson.slice(0, newSetsCount);
    }

    updatedExercises[index] = {
      ...target,
      sets: newSetsCount,
      sets_json: nextSetsJson
    };

    useWorkoutStore.setState({ exercises: updatedExercises } as any);

    if (index === currentIndex) {
      setActiveSetsData(prev => {
        let next = [...prev];
        if (newSetsCount > prev.length) {
          const last = prev[prev.length - 1] || { weight: target.weight || 0, reps: 10, rpe: 8 };
          for (let i = prev.length; i < newSetsCount; i++) {
            next.push({ ...last });
          }
        } else {
          next = next.slice(0, newSetsCount);
        }
        return next;
      });

      if (currentSet > newSetsCount) {
        setCurrentSet(newSetsCount);
      }
    }

    showSuccess(`Total de séries ajustado para ${newSetsCount}`);
    setContextMenuIndex(null);
    playSensoryTone('click');
  };

  const getSmartSelectorContext = () => {
    const currentEx = exercises[currentIndex];
    const currentMc = currentEx?.muscle_group || "Peito";
    const advices = [];
    if (currentMc === "Peito" || currentMc.includes("Peito") || currentMc.includes("Peito")) {
      advices.push({
        title: "Academia cheia?",
        desc: "Substitua Supino Máquina por Supino Inclinado com Halteres.",
        badge: "Adaptativo",
        searchPreset: "Halteres"
      });
      advices.push({
        title: "Consistência Neuromuscular",
        desc: "Substituir por Cross Over mantém a mesma ativação de polia alta.",
        badge: "Biomecânica",
        searchPreset: "Cross"
      });
    } else if (currentMc.includes("Perna") || currentMc.includes("Quadríceps") || currentMc.includes("Glúteo") || currentMc.includes("Pernas")) {
      advices.push({
        title: "Equipamento ocupado?",
        desc: "Trocar o Leg Press por agachamento búlgaro com halteres mantém alto estímulo tônico.",
        badge: "Halteres",
        searchPreset: "Búlgaro"
      });
    } else {
      advices.push({
        title: "Alternate Inteligente",
        desc: "Substitutos com Polia reduzem o estresse articular tardio nesta série.",
        badge: "Fisiológico",
        searchPreset: "Polia"
      });
    }
    return advices;
  };

  const filteredSelectorExercises = useMemo(() => {
    if (!allAvailableExercises) return [];
    return allAvailableExercises.filter(ex => {
      const nameMatches = (ex.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (ex.equipment && ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const muscleMatches = !selectedMuscleGroup || selectedMuscleGroup === 'Tudo' || ex.muscle_group === selectedMuscleGroup || (selectedMuscleGroup === 'Cardio' && (ex.muscle_group || "").toLowerCase().includes('cardio'));
      
      return nameMatches && muscleMatches;
    });
  }, [allAvailableExercises, searchQuery, selectedMuscleGroup]);

  const [finishing, setFinishing] = useState(false);
  const [pendingSetToComplete, setPendingSetToComplete] = useState<number | null>(null);
  const [completedSetIndices, setCompletedSetIndices] = useState<Set<number>>(new Set());
  const [isHydrating, setIsHydrating] = useState(false);
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState<Record<number, Set<number>>>({});

  // Sync completedSetIndices with completedSetsByExercise
  useEffect(() => {
    if (!isHydrating) {
      setCompletedSetsByExercise(prev => ({
        ...prev,
        [currentIndex]: completedSetIndices
      }));
    }
  }, [completedSetIndices, currentIndex, isHydrating]);

  // Load completedSetIndices for the new currentIndex
  const lastIndexForCompletionRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastIndexForCompletionRef.current !== currentIndex && !isHydrating) {
      const savedCompleted = completedSetsByExercise[currentIndex];
      if (savedCompleted) {
        setCompletedSetIndices(savedCompleted);
      } else {
        // Fallback: check if we have workoutPerformance logs already completed
        if (workoutPerformance[currentIndex] && workoutPerformance[currentIndex].length > 0) {
          const defaultCompleted = new Set<number>();
          workoutPerformance[currentIndex].forEach((_, sIdx) => defaultCompleted.add(sIdx));
          setCompletedSetIndices(defaultCompleted);
        } else {
          setCompletedSetIndices(new Set());
        }
      }
      lastIndexForCompletionRef.current = currentIndex;
    }
  }, [currentIndex, completedSetsByExercise, isHydrating, workoutPerformance]);

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    // 1. Swap exercises
    const updatedExercises = [...exercises];
    const tempEx = updatedExercises[index];
    updatedExercises[index] = updatedExercises[newIndex];
    updatedExercises[newIndex] = tempEx;

    // 2. Swap workoutPerformance
    setWorkoutPerformance(prev => {
      const next = { ...prev };
      const valIndex = next[index];
      const valNewIndex = next[newIndex];
      
      if (valIndex !== undefined) {
        next[newIndex] = valIndex;
      } else {
        delete next[newIndex];
      }
      
      if (valNewIndex !== undefined) {
        next[index] = valNewIndex;
      } else {
        delete next[index];
      }
      return next;
    });

    // 3. Swap completedSetsByExercise
    setCompletedSetsByExercise(prev => {
      const next = { ...prev };
      const valIndex = next[index];
      const valNewIndex = next[newIndex];
      
      if (valIndex !== undefined) {
        next[newIndex] = valIndex;
      } else {
        delete next[newIndex];
      }
      
      if (valNewIndex !== undefined) {
        next[index] = valNewIndex;
      } else {
        delete next[index];
      }
      return next;
    });

    // 4. Update currentIndex if we are moving the active exercise
    let newCurrentIdx = currentIndex;
    if (currentIndex === index) {
      newCurrentIdx = newIndex;
    } else if (currentIndex === newIndex) {
      newCurrentIdx = index;
    }

    // 5. Update Zustand store
    useWorkoutStore.setState({
      exercises: updatedExercises,
      currentIndex: newCurrentIdx
    } as any);

    playSensoryTone('click');
    playHapticFeedback('light');
  };
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const isAdvancingRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [fatigueDetected, setFatigueDetected] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [anomalyDetected, setAnomalyDetected] = useState(false);
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
           const newCompletedByEx: Record<number, Set<number>> = {};
           logs.forEach(l => {
              const exIdx = exercises.findIndex(ex => ex.exercise_id === l.exercise_id);
              if (exIdx === -1) return;
              if (!newPerf[exIdx]) newPerf[exIdx] = [];
              newPerf[exIdx][l.set_number - 1] = {
                weight: l.weight_achieved,
                reps: l.reps_achieved,
                rpe: l.rpe || 8
              };
              if (!newCompletedByEx[exIdx]) newCompletedByEx[exIdx] = new Set();
              newCompletedByEx[exIdx].add(l.set_number - 1);
           });
           setWorkoutPerformance(newPerf);
           setCompletedSetsByExercise(newCompletedByEx);
           
           // Populate completed sets for current exercise
           const currentCompleted = newCompletedByEx[currentIndex] || new Set<number>();
           setCompletedSetIndices(currentCompleted);
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
          const history = await fetchWithRetry(() => workoutApi.getWorkoutHistory(user.id));
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
          const history = await fetchWithRetry(() => workoutApi.getWorkoutHistory(u.id));
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

    let exercisesToUse = loadedExercises;
    const tempKey = `workout_session_temp_${workoutId}`;
    const localSaved = localStorage.getItem(tempKey);
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          exercisesToUse = parsed;
        }
      } catch (e) {
        console.warn("Failed to load pre-planned exercises", e);
      }
    }

    return {
      exercises: exercisesToUse,
      originalExercises: loadedExercises,
      ...sessionData
    };
  }, { revalidateOnFocus: false });

  const { status: queryStatus, isFetching, refresh } = playerQuery;

  useEffect(() => {
    // Consolidated height observer for footer to ensure scroll padding is always accurate
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.clientHeight;
        if (height > 0) {
          setFooterHeight(height);
        }
      }
    });

    const currentFooter = footerRef.current;
    if (currentFooter) {
      observer.observe(currentFooter);
    }

    // Default height if observer hasn't run yet or returned 0
    if (footerHeight === 0) setFooterHeight(200);

    return () => {
      if (currentFooter) {
        observer.unobserve(currentFooter);
      }
      observer.disconnect();
    };
  }, [playerQuery.status]); // Re-run when status changes as footer might be newly rendered

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
      if (playerQuery.data.originalExercises) {
        setOriginalExercises(playerQuery.data.originalExercises);
      }
    } else if (playerQuery.data && !playerQuery.data.historyId) {
      playerQuery.refresh();
    }
  }, [playerQuery.data, workoutId, setWorkout]);

  const currentEx = useMemo(() => (exercises && exercises[currentIndex]) || null, [exercises, currentIndex]);
  const nextEx = useMemo(() => (exercises && exercises[currentIndex + 1]) || null, [exercises, currentIndex]);

  const biologicalState = useMemo(() => {
    const currentSetsHighRpe = activeSetsData.some((s: any) => s.rpe >= 9);
    const completedWithLowReps = Array.from(completedSetIndices).some((idx) => {
      const perf = activeSetsData[idx];
      const targetReps = parseInt(currentEx?.sets_json?.[idx]?.reps as string) || 10;
      return perf ? perf.reps < targetReps - 2 : false;
    });

    if (anomalyDetected || completedWithLowReps) {
      return "OVERREACH";
    }
    if (fatigueDetected || currentSetsHighRpe || workoutDuration > 1500) {
      return "FATIGUE";
    }
    return "RECOVERY";
  }, [fatigueDetected, anomalyDetected, activeSetsData, completedSetIndices, currentEx, workoutDuration]);

  const liveTelemetry = useMemo(() => {
    let totalVolume = 0;
    let completedSetsCount = 0;
    let rpeSum = 0;
    let highestWeight = 0;

    Object.entries(workoutPerformance).forEach(([exIdx, sets]: [string, any]) => {
      if (Array.isArray(sets)) {
        sets.forEach((set: any) => {
          if (set.weight && set.reps) {
            totalVolume += set.weight * set.reps;
            completedSetsCount++;
            rpeSum += set.rpe || 8;
            if (set.weight > highestWeight) highestWeight = set.weight;
          }
        });
      }
    });

    const averageRpe = completedSetsCount > 0 ? (rpeSum / completedSetsCount).toFixed(1) : "0.0";
    return {
      volume: totalVolume,
      avgRpe: averageRpe,
      completedCount: completedSetsCount,
      overload: highestWeight > 0 ? "+2.5%" : "Estável"
    };
  }, [workoutPerformance]);

  const sessionDiff = useMemo(() => {
    if (!originalExercises || originalExercises.length === 0 || !exercises || exercises.length === 0) {
      return { hasChanges: false, diffs: [] as string[] };
    }

    const diffsList: string[] = [];
    let changed = false;

    // 1. Order changed?
    const origIds = originalExercises.map(ex => ex.exercise_id);
    const activeIds = exercises.map(ex => ex.exercise_id);
    const isSameSet = origIds.length === activeIds.length && 
                      origIds.every(id => activeIds.includes(id));
    const orderChanged = isSameSet && origIds.some((id, idx) => id !== activeIds[idx]);
    
    if (orderChanged) {
      diffsList.push("Ordem dos exercícios alterada");
      changed = true;
    }

    // 2. Exercise substitutions / added / removed
    const substitutedNames: string[] = [];
    exercises.forEach((ex) => {
      if (ex.id) {
        const orig = originalExercises.find(o => o.id === ex.id);
        if (orig && orig.exercise_id !== ex.exercise_id) {
          substitutedNames.push(ex.exercise_name);
        }
      }
    });

    if (substitutedNames.length > 0) {
      diffsList.push(`Substituição de exercício realizada (${substitutedNames.join(', ')})`);
      changed = true;
    }

    const addedCount = exercises.filter(ex => !ex.id).length;
    if (addedCount > 0) {
      diffsList.push(`${addedCount} novos exercícios adicionados`);
      changed = true;
    }

    const activeIdsSet = new Set(exercises.map(ex => ex.id).filter(Boolean));
    const removedCount = originalExercises.filter(ex => ex.id && !activeIdsSet.has(ex.id)).length;
    if (removedCount > 0) {
      diffsList.push(`${removedCount} exercícios removidos da ficha`);
      changed = true;
    }

    // 3. Weight/Carga adjustments
    const weightChanges: string[] = [];
    exercises.forEach((ex) => {
      if (ex.id) {
        const orig = originalExercises.find(o => o.id === ex.id);
        if (orig && orig.weight !== ex.weight) {
          weightChanges.push(`${ex.exercise_name} para ${ex.weight}kg`);
        }
      }
    });
    if (weightChanges.length > 0) {
      diffsList.push(`Carga base ajustada (${weightChanges.join(', ')})`);
      changed = true;
    }

    // 4. Rest adjustments
    const restChanges: string[] = [];
    exercises.forEach((ex) => {
      if (ex.id) {
        const orig = originalExercises.find(o => o.id === ex.id);
        if (orig && orig.rest_time !== ex.rest_time) {
          restChanges.push(`${ex.exercise_name} para ${ex.rest_time}s`);
        }
      }
    });
    if (restChanges.length > 0) {
      diffsList.push(`Tempo de descanso alterado (${restChanges.join(', ')})`);
      changed = true;
    }

    // 5. Sets/reps count target adjustments
    const targetChanges: string[] = [];
    exercises.forEach((ex) => {
      if (ex.id) {
        const orig = originalExercises.find(o => o.id === ex.id);
        const originalSets = orig ? (orig.sets_json?.length || orig.sets || 3) : 3;
        const activeSets = ex.sets_json?.length || ex.sets || 3;
        if (orig && (orig.reps !== ex.reps || originalSets !== activeSets)) {
          targetChanges.push(`${ex.exercise_name}`);
        }
      }
    });
    if (targetChanges.length > 0) {
      diffsList.push(`Target de Séries/Reps de ${targetChanges.join(', ')}`);
      changed = true;
    }

    return {
      hasChanges: changed,
      diffs: diffsList
    };
  }, [originalExercises, exercises]);

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

  // Scroll handler
  useEffect(() => {
    const activeIdx = currentSet - 1;
    const activeRef = setRefs.current[activeIdx];
    
    if (activeRef && !isResting) {
      // Use requestAnimationFrame for a jitter-free scroll after layout paint
      requestAnimationFrame(() => {
        activeRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      // 5. Update global progressions (Critical)
      try {
        await workoutApi.updateProgressionFromLogs(userId, histId);
        log("[PROGRESSIONS_UPDATE_SUCCESS]");
      } catch (err) {
        log("[PROGRESSIONS_UPDATE_FAIL]", err);
      }

      log("[SAVE_WORKOUT_SUCCESS]");
    } catch (err) {
      log("[SAVE_WORKOUT_ERROR]", err);
      throw err;
    }
  };

  const finishWorkout = async (isSuccess: boolean) => {
    // Clear temporary workout planning session cache
    localStorage.removeItem(`workout_session_temp_${workoutId}`);

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
          
          // Learn from Completed Session in Athlete Memory
          try {
            const mappedLogs = Object.entries(workoutPerformance).map(([exIdxStr, setsUntyped]) => {
              const exIdx = parseInt(exIdxStr);
              const ex = exercises[exIdx];
              return {
                exercise_id: ex?.exercise_id,
                exercise_name: ex?.exercise_name_snapshot || ex?.exercise_name,
                muscle_group: ex?.muscle_group,
                sets: setsUntyped
              };
            }).filter(item => item.exercise_id);

            await athleteMemoryEngine.learnFromWorkoutSession(
              u.id,
              currentHistoryId,
              playerQuery?.data?.category?.name || "Treino Rubi",
              finalDuration,
              mappedLogs
            );
          } catch (memErr) {
            console.error("[AthleteMemory] learning failed", memErr);
          }

          // Play pristine success bells and heavy haptics
          playSensoryTone('success');
          playHapticFeedback('success');
          
          // UPDATE PROGRESSION FROM LOGS (Source of Truth)
          await workoutApi.updateProgressionFromLogs(u.id, currentHistoryId);
          
          // Background Sync / Cache Invalidation
          cacheStore.clear(`exercise_progression_${u.id}`);
          exercises.forEach(ex => cacheStore.clear(`exercise_stats_${ex.exercise_id}`));

          await workoutApi.clearPartialSession(u.id);
          
          cacheStore.clear(`workout_init_${workoutId}`);
          setWorkoutDuration(finalDuration);
          if (sessionDiff.hasChanges) {
            setShowEvolutionModal(true);
          } else {
            setIsWorkoutComplete(true);
            setIsFinished(true);
            showSuccess("Treino salvo com sucesso!");
          }
        } else {
          // If no exercises recorded, just abandon it to keep history clean
          await athleteMemoryEngine.trackWorkoutAbandonment(u.id);
          await workoutApi.abandonWorkout(currentHistoryId);
          if (user) await workoutApi.clearPartialSession(user.id);
          cacheStore.clear(`workout_init_${workoutId}`);
          resetWorkout();
          navigate('dashboard');
          showSuccess("Sessão vazia descartada.");
        }
      } else {
        // Track abandonment
        try {
          await athleteMemoryEngine.trackWorkoutAbandonment(u.id);
          playSensoryTone('warning');
        } catch (e) {}
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

  const handleApplyTemplateEvolution = async () => {
    setSaving(true);
    try {
      const u = await authApi.getUser();
      if (!u) throw new Error("Usuário não autenticado");

      // 1. Process active exercises in their new sequence
      for (let index = 0; index < exercises.length; index++) {
        const ex = exercises[index];
        const numSets = ex.sets_json?.length || ex.sets || 3;
        const targetReps = ex.reps?.toString() || "10";
        const targetWeight = typeof ex.weight === 'string' ? parseFloat(ex.weight) : (ex.weight || 0);
        const targetRest = ex.rest_time || 60;

        if (ex.id) {
          // Existed in original template -> Update granularly
          const orig = originalExercises.find(o => o.id === ex.id);
          const patch: any = {};
          if (orig) {
            if (orig.exercise_id !== ex.exercise_id) {
              patch.exercise_id = ex.exercise_id;
              patch.exercise_name_snapshot = ex.exercise_name;
            }
            if (orig.sort_order !== index) {
              patch.sort_order = index;
            }
            if (orig.sets !== numSets) {
              patch.sets = numSets;
            }
            if (orig.reps !== targetReps) {
              patch.reps = targetReps;
            }
            if (orig.weight !== targetWeight) {
              patch.weight = targetWeight;
            }
            if (orig.rest_time !== targetRest) {
              patch.rest_time = targetRest;
            }

            const baseSetsJson = Array.from({ length: numSets }).map(() => ({
              reps: targetReps,
              weight: targetWeight,
              rest_time: targetRest,
              type: SetType.NORMAL
            }));

            if (JSON.stringify(orig.sets_json) !== JSON.stringify(baseSetsJson)) {
              patch.sets_json = baseSetsJson;
            }

            if (Object.keys(patch).length > 0) {
              const { error } = await supabase.from('workout_exercises').update(patch).eq('id', ex.id);
              if (error) throw error;
            }
          }
        } else {
          // Newly added exercise -> Create row
          const newRow = {
            category_id: workoutId,
            exercise_id: ex.exercise_id,
            sort_order: index,
            sets: numSets,
            reps: targetReps,
            weight: targetWeight,
            rest_time: targetRest,
            sets_json: Array.from({ length: numSets }).map(() => ({
              reps: targetReps,
              weight: targetWeight,
              rest_time: targetRest,
              type: SetType.NORMAL
            })),
            exercise_name_snapshot: ex.exercise_name || 'Exercício'
          };
          const { error } = await supabase.from('workout_exercises').insert([newRow]);
          if (error) throw error;
        }
      }

      // 2. Remove deleted exercises
      const activeIdsSet = new Set(exercises.map(ex => ex.id).filter(Boolean));
      const removedExercises = originalExercises.filter(ex => ex.id && !activeIdsSet.has(ex.id));
      for (const rem of removedExercises) {
        const { error } = await supabase.from('workout_exercises').delete().eq('id', rem.id);
        if (error) throw error;
      }

      showSuccess("Ficha de treino atualizada com sucesso!");
      cacheStore.clear(`workout_init_${workoutId}`);
      
      setShowEvolutionModal(false);
      setIsWorkoutComplete(true);
      setIsFinished(true);
    } catch (err) {
      log("[TEMPLATE_EVOLUTION_ERROR]", err);
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardTemplateEvolution = () => {
    setShowEvolutionModal(false);
    setIsWorkoutComplete(true);
    setIsFinished(true);
    showSuccess("Alterações salvas apenas para hoje!");
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
              <div className="flex gap-3 items-center">
                <motion.button 
                  onClick={() => setShowExercisesList(true)}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="w-10 h-10 bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_8px_30px_rgba(15,23,42,0.08)] flex items-center justify-center text-slate-600 hover:text-slate-900 shrink-0 select-none outline-none focus:outline-none"
                  title="Painel de Protocolo Adaptativo"
                  id="header-ficha-list-btn"
                >
                  <LayoutList size={18} strokeWidth={2.5} />
                </motion.button>
                {streak > 0 && !momentum && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#818CF8]/10 rounded-full border border-[#818CF8]/20 hidden sm:flex">
                    <Flame size={12} className="text-[#818CF8] fill-[#818CF8]/30" />
                    <span className="text-[10px] font-black text-[#818CF8] tabular-nums">{streak}</span>
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

              className={`flex-1 overflow-y-auto transition-all duration-500 ${
                focusMode ? "bg-slate-950 text-slate-100" : "bg-[#F8FAFC] text-slate-900"
              }`}
              onScroll={handleScroll}
              onClick={() => setIsFooterVisible(true)}
              style={{ paddingBottom: `calc(${footerHeight + 120}px + env(safe-area-inset-bottom))` }}
            >
              
              {/* KYRON OS BIOLOGICAL STATE CONTROL CENTER */}
              <div className="p-4 pb-1 shrink-0">
                <div className={`p-4 rounded-[1.6rem] transition-all duration-500 border ${
                  focusMode 
                    ? "bg-slate-900/40 border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)]" 
                    : "bg-white border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                        biologicalState === 'RECOVERY' ? 'bg-indigo-400 shadow-[0_0_12px_#818cf8]' :
                        biologicalState === 'FATIGUE' ? 'bg-purple-500 shadow-[0_0_12px_#a855f7]' :
                        'bg-amber-500 shadow-[0_0_12px_#f59e0b]'
                      }`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${focusMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        ESTADO BIOMÉTRICO
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      biologicalState === 'RECOVERY' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400' :
                      biologicalState === 'FATIGUE' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {biologicalState === 'RECOVERY' ? 'Prontidão Estável' :
                       biologicalState === 'FATIGUE' ? 'Fadiga Acumulada' :
                       'Alerta de Sobrecarga'}
                    </span>
                  </div>

                  {/* MINI TELEMETRY LAYOUT */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2 rounded-xl ${focusMode ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Volume</p>
                      <p className={`text-sm font-black tabular-nums ${focusMode ? 'text-white' : 'text-slate-800'}`}>{liveTelemetry.volume} kg</p>
                    </div>
                    <div className={`p-2 rounded-xl ${focusMode ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Esforço Médio</p>
                      <p className={`text-sm font-black tabular-nums ${focusMode ? 'text-white' : 'text-slate-800'}`}>RPE {liveTelemetry.avgRpe}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${focusMode ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Progressão</p>
                      <p className="text-sm font-black text-[#7BA7FF]">{liveTelemetry.overload}</p>
                    </div>
                  </div>

                  {/* AI COACH REALTIME INSIGHT */}
                  <div className={`mt-3 pt-3 border-t text-[10.5px] font-medium leading-relaxed flex gap-2 ${
                    focusMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <Sparkles size={14} className="text-[#7BA7FF] shrink-0 mt-0.5" />
                    <span>
                      {biologicalState === 'RECOVERY' && "Sinalização tônica ideal. Você está performando consistentemente em relação ao seu volume de base."}
                      {biologicalState === 'FATIGUE' && "Fadiga neuromuscular detectada. Considere estender o intervalo de descanso para 120s nesta fase."}
                      {biologicalState === 'OVERREACH' && "Alerta de estresse tônico limitante. Aconselhamos redução preventiva de 5-10% na carga para manter ativação limpa."}
                    </span>
                  </div>
                </div>
              </div>

              {/* COMPACT EXERCISE HEADER (DYNAMIC COMPRESSION) */}
              <AnimatePresence>
                {!momentum && (
                  <motion.div 
                    initial={{ height: "auto", opacity: 1 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
                    className={`p-4 flex gap-4 items-center mb-2 overflow-hidden transition-all duration-500 ${
                      focusMode 
                        ? 'bg-slate-900/40 border-y border-slate-900/30 text-white' 
                        : 'bg-white text-slate-900 border-b border-slate-100'
                    }`}
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
                        <h1 className="text-base font-bold leading-tight">
                          {currentEx?.exercise_name}
                        </h1>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg tabular-nums ${
                          focusMode ? 'text-slate-300 bg-slate-800' : 'text-slate-400 bg-slate-50 border border-slate-100'
                        }`}>
                          {currentSet}/{activeSetsData.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-404 font-medium uppercase tracking-wider mt-0.5 line-clamp-1">
                        {currentEx?.muscle_group} • {currentEx?.equipment || 'Sem equipamento'}
                      </p>
                      {!isAdvanced && (
                        <p className={`text-xs line-clamp-1 mt-0.5 ${focusMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
                  className={`flex-1 rounded-xl py-2.5 shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all h-[44px] ${
                    focusMode ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw size={12} /> Substituir
                </button>
                <button 
                  onClick={() => {
                    setFocusMode(!focusMode);
                    playSensoryTone(focusMode ? 'click' : 'focus');
                    if ('vibrate' in navigator) navigator.vibrate(30);
                  }}
                  className={`flex-1 rounded-xl py-2.5 shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all h-[44px] ${
                    focusMode ? 'bg-indigo-950 border border-indigo-900 text-indigo-400 animate-pulse' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Target size={12} className={focusMode ? "animate-pulse text-[#7BA7FF]" : ""} />
                  {focusMode ? "Foco Ativo" : "Modo Foco"}
                </button>
              </div>

              {/* RETORNAR AO ANTERIOR JÁ EXECUTADO */}
              {currentIndex > 0 && (
                <div className="px-4 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <button 
                    onClick={() => {
                      setCurrentIndex(currentIndex - 1);
                      setCurrentSet(1);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all border border-slate-200/50 rounded-xl py-2 px-3 text-[10px] font-black tracking-[0.05em] text-slate-500 hover:text-slate-800 uppercase flex items-center justify-center gap-1.5 h-[38px] shadow-sm"
                  >
                    <ChevronLeft size={14} strokeWidth={4} /> Voltar ao anterior: {exercises[currentIndex - 1]?.exercise_name}
                  </button>
                </div>
              )}

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
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#7BA7FF]/30 hover:text-[#7BA7FF] transition-all flex items-center justify-center gap-2 mt-4 hover:bg-[#7BA7FF]/5 h-[56px]"
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
                {(feedback || memoryLoadSuggestion?.message || preHint) && !isAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="px-4 mb-4"
                  >
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex items-start gap-4 shadow-xl">
                      <Zap size={20} className="text-[#7BA7FF] fill-[#7BA7FF]/35 mt-1 flex-shrink-0" />
                      <p className="text-sm font-bold text-slate-100 leading-relaxed">
                        {feedback || memoryLoadSuggestion?.message || preHint}
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
              <div style={{ height: `calc(${footerHeight + 120}px + env(safe-area-inset-bottom))` }} />

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
              className={`fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t p-4 pb-10 max-w-md mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.06)] rounded-t-2xl ${isResting && timeLeft <= 5 && timeLeft > 0 ? 'ring-2 ring-[#7BA7FF]/20' : ''}`}
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
                        <div className="flex items-center gap-2 text-[#7BA7FF] animate-pulse font-bold text-[10px] uppercase tracking-widest">
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
                      color: timeLeft <= 0 ? '#10b981' : '#7BA7FF'
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
                  backgroundColor: '#7BA7FF',
                  boxShadow: '0 20px 25px -5px rgba(123, 167, 255, 0.4)'
                } : {}}
                className={`w-full h-16 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isResting 
                    ? (timeLeft <= 0 ? "bg-[#7BA7FF] text-white" : "bg-slate-900 text-white") 
                    : "bg-[#7BA7FF] text-white shadow-lg shadow-[#7BA7FF]/25"
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

      {/* OVERLAY DE LISTA DE EXERCÍCIOS / PAINEL DE PROTOCOLO ADAPTATIVO */}
      <AnimatePresence>
        {showExercisesList && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end">
            {/* Background Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (exerciseSelectorMode) {
                  setExerciseSelectorMode(null);
                } else {
                  setShowExercisesList(false);
                  setContextMenuIndex(null);
                }
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Float Full-Height Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="mt-auto bg-white/95 backdrop-blur-3xl rounded-t-[3rem] p-6 shadow-2xl relative z-10 max-w-md mx-auto w-full max-h-[92vh] overflow-hidden flex flex-col border border-white/40"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1 bg-slate-200/80 rounded-full mx-auto mb-5 shrink-0" />

              {exerciseSelectorMode !== null ? (
                /* ================= PREMIUM EXERCISE SELECTOR ================= */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Selector Header */}
                  <div className="flex items-center gap-3 mb-4 shrink-0">
                    <button 
                      onClick={() => setExerciseSelectorMode(null)}
                      className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800 leading-none">
                        {exerciseSelectorMode === 'add' ? "Adicionar Exercício" : "Substituir Exercício"}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-404 mt-1 uppercase tracking-wider">
                        {exerciseSelectorMode === 'replace' && replaceIndex !== null && exercises[replaceIndex]
                          ? `Substituindo: ${exercises[replaceIndex].exercise_name}` 
                          : "Explore a Biblioteca KYRON"}
                      </p>
                    </div>
                  </div>

                  {/* Selector Search Input */}
                  <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Pesquisar por nome, equipamento, músculo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/30 focus:border-[#7BA7FF] transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Horizontal Scroll Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 shrink-0">
                    {/* Muscle Groups Pills */}
                    {['Tudo', 'Peito', 'Costas', 'Quadríceps', 'Glúteo', 'Ombro', 'Bíceps', 'Tríceps', 'Cardio'].map((cat) => {
                      const isActive = selectedMuscleGroup === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedMuscleGroup(cat);
                            playHapticFeedback('light');
                          }}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                            isActive 
                              ? "bg-slate-900 text-white border-slate-950" 
                              : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* KYRON SMART BIOLOGICAL CONTEXT ADVICES */}
                  <div className="space-y-2 mb-4 shrink-0">
                    {getSmartSelectorContext().map((adv, idx) => (
                      <motion.div 
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSearchQuery(adv.searchPreset);
                          playHapticFeedback('light');
                        }}
                        className="bg-blue-50/50 border border-blue-100/55 rounded-2xl p-3 flex items-start gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-100/60 flex items-center justify-center text-blue-500 shrink-0">
                          <Sparkles size={14} className="fill-blue-500/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">{adv.badge}</span>
                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none bg-white px-1.5 py-0.5 rounded border">Auto</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">{adv.title}</p>
                          <p className="text-[9px] text-slate-500 leading-snug mt-0.2">{adv.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Exercises Selector Results View */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 select-none no-scrollbar">
                    {loadingExercisesDetail ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <Loader2 className="w-8 h-8 text-[#7BA7FF] animate-spin" />
                        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">KYRON OS sintonizando...</p>
                      </div>
                    ) : filteredSelectorExercises.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-xs font-semibold text-slate-400">Nenhum exercício científico correspondente.</p>
                      </div>
                    ) : (
                      filteredSelectorExercises.map((ex) => {
                        const isFav = favoritesList.includes(ex.id);
                        return (
                          <motion.div 
                            key={ex.id}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (exerciseSelectorMode === 'add') {
                                handleAddExerciseToSession(ex);
                              } else if (exerciseSelectorMode === 'replace') {
                                handleReplaceExerciseInSession(ex);
                              }
                            }}
                            className="bg-slate-50 hover:bg-[#7BA7FF]/5 border border-slate-100 hover:border-[#7BA7FF]/20 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center relative">
                                {ex.image_url ? (
                                  <img src={ex.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Dumbbell size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-800 block truncate group-hover:text-slate-900 transition-colors">{ex.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide mt-0.5">
                                  {ex.muscle_group} • {ex.equipment || 'Livre'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 pl-2">
                              {isFav && <Heart size={12} className="text-rose-500 fill-rose-500" />}
                              <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-150 flex items-center justify-center text-[#7BA7FF] shadow-sm">
                                <Plus size={12} strokeWidth={3} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* ================= ADAPTIVE LAYER MANAGER PANEL ================= */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Panel Header */}
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Protocolo Adaptativo</h3>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Ajuste de performance em tempo real</p>
                    </div>
                    <p className="text-[10px] font-black text-[#7BA7FF] uppercase tracking-widest bg-[#7BA7FF]/15 border border-[#7BA7FF]/30 px-3 py-1 rounded-full">{exercises.length} EXS</p>
                  </div>

                  {/* Exercises Segment Tracker */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-5 no-scrollbar">
                    
                    {/* 1. COMPLETED BLOCK */}
                    {exercises.filter((_, idx) => idx < currentIndex).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Segmento Concluído</h4>
                        </div>
                        <div className="space-y-2">
                          {exercises.map((ex, idx) => {
                            if (idx >= currentIndex) return null;
                            return (
                              <div 
                                key={ex.exercise_id || idx}
                                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between opacity-50 select-none animate-fadeIn"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-[9px] font-black w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-150">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-slate-500 block truncate line-through">{ex.exercise_name}</span>
                                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{ex.muscle_group}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Ok</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. ACTIVE EXERCISE (Pulse / Biological glow) */}
                    {exercises[currentIndex] && (
                      <div className="space-y-2 animate-fadeIn">
                        <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.15em] px-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse animate-duration-1000" />
                          Protocolo em execução
                        </h4>
                        <div 
                          className="bg-white border-2 border-[#7BA7FF]/80 shadow-[0_12px_32px_rgba(123,167,255,0.18)] rounded-3xl p-4 relative overflow-hidden transition-all duration-300"
                        >
                          {/* Inner soft blue glow overlay */}
                          <div className="absolute right-0 top-0 w-24 h-24 bg-[#7BA7FF]/5 blur-xl pointer-events-none rounded-full" />
                          
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[10px] font-black w-7 h-7 rounded-full bg-[#7BA7FF] text-white flex items-center justify-center shadow-md shadow-[#7BA7FF]/20">
                                {currentIndex + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="font-black text-sm text-slate-900 block truncate leading-tight">{exercises[currentIndex]?.exercise_name}</span>
                                <span className="text-[9px] font-extrabold text-[#7BA7FF] uppercase tracking-wider mt-1 block">
                                  {exercises[currentIndex]?.sets_json?.length || exercises[currentIndex]?.sets || 3} Séries • {exercises[currentIndex]?.weight || 0}kg
                                </span>
                              </div>
                            </div>
                            
                            {/* Actions Group */}
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenuIndex(contextMenuIndex === currentIndex ? null : currentIndex);
                                  playHapticFeedback('light');
                                }}
                                className={`p-2 rounded-xl transition-all ${
                                  contextMenuIndex === currentIndex 
                                    ? "bg-slate-900 text-white" 
                                    : "bg-slate-100 text-slate-500 hover:text-slate-850"
                                }`}
                              >
                                <MoreVertical size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>

                          {/* CONTEXTUAL TRAY ROW */}
                          <AnimatePresence>
                            {contextMenuIndex === currentIndex && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden border-t border-slate-100 pt-3 relative z-10"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Replace standard biomechanic */ }
                                  <button 
                                    onClick={() => {
                                      setReplaceIndex(currentIndex);
                                      setExerciseSelectorMode('replace');
                                    }}
                                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase text-slate-600 rounded-xl flex items-center justify-center gap-1.5 transition-colors border"
                                  >
                                    <RefreshCw size={12} /> Substituir
                                  </button>
                                  
                                  {/* Carga Standard */}
                                  <button 
                                    onClick={() => {
                                      const currentWt = exercises[currentIndex]?.weight || 0;
                                      const delta = prompt("Ajustar carga básica do protocolo (kg):", currentWt.toString());
                                      if (delta !== null) {
                                        const parsed = parseFloat(delta);
                                        if (!isNaN(parsed)) handleAdjustExerciseWeight(currentIndex, parsed);
                                      }
                                    }}
                                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase text-slate-600 rounded-xl flex items-center justify-center gap-1.5 transition-colors border"
                                  >
                                    <Dumbbell size={12} /> Carga ({exercises[currentIndex]?.weight || 0}kg)
                                  </button>

                                  {/* Sets edits */}
                                  <button 
                                    onClick={() => {
                                      const curSets = exercises[currentIndex]?.sets_json?.length || exercises[currentIndex]?.sets || 3;
                                      const setsStr = prompt("Total de séries (1-10):", curSets.toString());
                                      if (setsStr !== null) {
                                        const parsed = parseInt(setsStr);
                                        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                                          handleAdjustExerciseSets(currentIndex, parsed);
                                        }
                                      }
                                    }}
                                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase text-slate-600 rounded-xl flex items-center justify-center gap-1.5 transition-colors border"
                                  >
                                    <Plus size={12} /> Séries ({exercises[currentIndex]?.sets_json?.length || exercises[currentIndex]?.sets || 3}s)
                                  </button>

                                  {/* Remove option directly */}
                                  <button 
                                    onClick={() => {
                                      if (confirm(`Remover ${exercises[currentIndex]?.exercise_name} do treino?`)) {
                                        handleRemoveExerciseFromSession(currentIndex);
                                      }
                                    }}
                                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-[10px] font-black uppercase text-rose-500 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-rose-100"
                                  >
                                    <Trash2 size={12} /> Excluir
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* 3. FUTURE/UPCOMING BLOCK */}
                    {exercises.filter((_, idx) => idx > currentIndex).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Próximos Protocolos</h4>
                        <div className="space-y-2">
                          {exercises.map((ex, idx) => {
                            if (idx <= currentIndex) return null;
                            const isMenuOpened = contextMenuIndex === idx;
                            return (
                              <motion.div 
                                key={ex.exercise_id || idx}
                                layout
                                className="bg-slate-50/70 backdrop-blur-md border border-slate-100 rounded-2xl p-3 flex flex-col transition-all hover:bg-slate-100"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[9px] font-black w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-300">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <span className="font-bold text-xs text-slate-800 block truncate">{ex.exercise_name}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-0.5">
                                        {ex.sets_json?.length || ex.sets || 3}s • {ex.weight || 0}kg • {ex.muscle_group}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {/* Action trigger menu */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenuIndex(isMenuOpened ? null : idx);
                                        playHapticFeedback('light');
                                      }}
                                      className={`p-1.5 rounded-lg transition-all ${
                                        isMenuOpened 
                                          ? "bg-slate-900 text-white" 
                                          : "bg-slate-200/50 text-slate-500 hover:text-slate-800"
                                      }`}
                                    >
                                      <MoreVertical size={12} strokeWidth={2.5} />
                                    </button>

                                    {/* Reorder Buttons */}
                                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200/60">
                                      <button
                                        disabled={idx === currentIndex + 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveExercise(idx, 'up');
                                        }}
                                        className={`p-1 text-slate-400 hover:text-slate-900 transition-colors ${
                                          idx === currentIndex + 1 ? "opacity-20 cursor-not-allowed" : ""
                                        }`}
                                        title="Subir na fila"
                                      >
                                        <ChevronUp size={14} strokeWidth={3} />
                                      </button>
                                      <button
                                        disabled={idx === exercises.length - 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveExercise(idx, 'down');
                                        }}
                                        className={`p-1 text-slate-400 hover:text-slate-900 transition-colors ${
                                          idx === exercises.length - 1 ? "opacity-20 cursor-not-allowed" : ""
                                        }`}
                                        title="Descer na fila"
                                      >
                                        <ChevronDown size={14} strokeWidth={3} />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Context Menu Options Tray for Future Exercise */}
                                <AnimatePresence>
                                  {isMenuOpened && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                      animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                      className="overflow-hidden border-t border-slate-200/60 pt-2.5 mt-2"
                                    >
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Substituir */}
                                        <button 
                                          onClick={() => {
                                            setReplaceIndex(idx);
                                            setExerciseSelectorMode('replace');
                                          }}
                                          className="p-2 bg-white hover:bg-slate-50 text-[9px] font-black uppercase text-slate-500 rounded-lg flex items-center justify-center gap-1 border transition-all"
                                        >
                                          <RefreshCw size={11} /> Substituir
                                        </button>
                                        
                                        {/* Ajustar Carga */}
                                        <button 
                                          onClick={() => {
                                            const currentWt = exercises[idx]?.weight || 0;
                                            const loadVal = prompt(`Carga base para ${ex.exercise_name} (kg):`, currentWt.toString());
                                            if (loadVal !== null) {
                                              const parsed = parseFloat(loadVal);
                                              if (!isNaN(parsed)) handleAdjustExerciseWeight(idx, parsed);
                                            }
                                          }}
                                          className="p-2 bg-white hover:bg-slate-50 text-[9px] font-black uppercase text-slate-500 rounded-lg flex items-center justify-center gap-1 border transition-all"
                                        >
                                          <Dumbbell size={11} /> Carga ({ex.weight || 0}kg)
                                        </button>

                                        {/* Editar Séries */}
                                        <button 
                                          onClick={() => {
                                            const curSets = exercises[idx]?.sets_json?.length || exercises[idx]?.sets || 3;
                                            const setsStr = prompt("Total de séries (1-10):", curSets.toString());
                                            if (setsStr !== null) {
                                              const parsed = parseInt(setsStr);
                                              if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                                                handleAdjustExerciseSets(idx, parsed);
                                              }
                                            }
                                          }}
                                          className="p-2 bg-white hover:bg-slate-50 text-[9px] font-black uppercase text-slate-500 rounded-lg flex items-center justify-center gap-1 border transition-all"
                                        >
                                          <Plus size={11} /> Séries ({ex.sets_json?.length || ex.sets || 3}s)
                                        </button>

                                        {/* Excluir Exercício */}
                                        <button 
                                          onClick={() => {
                                            if (confirm(`Remover ${ex.exercise_name} do treino?`)) {
                                              handleRemoveExerciseFromSession(idx);
                                            }
                                          }}
                                          className="p-2 bg-rose-50 hover:bg-rose-100 text-[9px] font-black uppercase text-rose-500 rounded-lg flex items-center justify-center gap-1 border border-rose-100 transition-all"
                                        >
                                          <Trash2 size={11} /> Remover
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM FLOATING ACTIONS WORKOUT AREA */}
                  <div className="pt-4 border-t border-slate-100 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setExerciseSelectorMode('add');
                        playHapticFeedback('light');
                      }}
                      className="w-full h-14 rounded-2xl bg-[#7BA7FF] hover:bg-[#6c9bf0] text-white font-extrabold uppercase text-xs tracking-widest shadow-[0_12px_30px_rgba(123,167,255,0.35)] flex items-center justify-center gap-2 border-none transition-all active:translate-y-0.5 shrink-0"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Adicionar exercício
                    </motion.button>
                  </div>
                </div>
              )}
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
                <div className="w-16 h-16 bg-[#7BA7FF]/10 rounded-full flex items-center justify-center mb-6">
                  <Target size={32} className="text-[#7BA7FF]" />
                </div>
                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter mb-2">Interromper Treino?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  Deseja salvar seu progresso atual ou descartar totalmente esta sessão?
                </p>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => finishWorkout(true)} 
                    disabled={finishing}
                    className="w-full py-4 bg-[#7BA7FF] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7BA7FF]/25 active:scale-95 transition-all flex items-center justify-center gap-2"
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

      {/* MODAL DE EVOLUÇÃO DA FICHA */}
      <AnimatePresence>
        {showEvolutionModal && (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => handleDiscardTemplateEvolution()} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-100/50 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-violet-50 border border-violet-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                  <Sparkles size={28} className="text-violet-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 bg-violet-600 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider animate-bounce">
                    Novo
                  </span>
                </div>
                
                <h3 className="text-xl font-[1000] text-slate-800 tracking-tight leading-6 mb-2">
                  Salvar alterações no treino original?
                </h3>
                
                <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
                  Você ajustou este treino durante a sessão. Deseja transformar essas alterações no novo padrão da ficha?
                </p>

                {/* Box de Resumo de Mudanças */}
                <div className="w-full bg-slate-50 border border-slate-200/50 rounded-3xl p-4 mb-8 text-left space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Dumbbell size={11} className="text-violet-500" strokeWidth={3} /> Alterações detectadas:
                  </p>
                  {sessionDiff.diffs.map((diff, dIdx) => (
                    <motion.div 
                      key={dIdx} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: dIdx * 0.08 }}
                      className="flex items-start gap-2 text-slate-700 text-xs font-bold animate-fadeIn"
                    >
                      <Check size={14} className="text-violet-500 shrink-0 mt-0.5" strokeWidth={3} />
                      <span className="leading-tight text-slate-655">{diff}</span>
                    </motion.div>
                  ))}
                </div>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => handleApplyTemplateEvolution()} 
                    disabled={saving}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-violet-700/10"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar ficha"}
                  </button>
                  <button 
                    onClick={() => handleDiscardTemplateEvolution()} 
                    disabled={saving}
                    className="w-full py-4 bg-white border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center"
                  >
                    Manter apenas hoje
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
