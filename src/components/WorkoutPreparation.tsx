import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MoreVertical, 
  GripVertical, 
  FileText, 
  SlidersHorizontal, 
  Replace, 
  Trash2, 
  Plus, 
  Play, 
  Check, 
  X, 
  Clock, 
  Dumbbell, 
  Zap, 
  Sparkles,
  Award 
} from 'lucide-react';
import { useNavigation } from '../App';
import { workoutApi } from '../lib/api/workoutApi';
import { exerciseApi } from '../lib/api/exerciseApi';
import { authApi } from '../lib/api/authApi';
import { ExerciseReplaceScreen } from './ExerciseReplaceScreen';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { WorkoutExercise, Exercise, SetType, SetConfig, WorkoutCategory } from '../types';
import { useWorkoutStore } from '../app/store/workoutStore';
import { ScreenState } from './ui/ScreenState';

// Sortable item wrapper for an exercise card in the preparation screen
interface SortablePrepExerciseCardProps {
  ex: WorkoutExercise;
  idx: number;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onUpdateWeight: (idx: number, weight: number) => void;
  onUpdateReps: (idx: number, reps: string) => void;
  onEditSetsReps: (idx: number) => void;
  onAddNote: (idx: number) => void;
  onUpdateNote: (idx: number, note: string) => void;
  onRemoveNote: (idx: number) => void;
  onReplace: (idx: number) => void;
  onRemove: (idx: number) => void;
}

const SortablePrepExerciseCard: React.FC<SortablePrepExerciseCardProps> = ({
  ex,
  idx,
  activeMenuId,
  setActiveMenuId,
  onUpdateWeight,
  onUpdateReps,
  onEditSetsReps,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onReplace,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);

  // Auto-expand notes dynamically when they are first initialized inside this session
  const isMounted = React.useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (ex.notes === '') {
      setIsNotesExpanded(true);
    }
  }, [ex.notes]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layoutId={`prep-card-${ex.id}`}
      animate={{
        scale: isDragging ? 1.01 : 1,
        boxShadow: isDragging 
          ? '0 12px 28px rgba(15,23,42,0.08)' 
          : '0 1px 2px rgba(15,23,42,0.01)',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative bg-white border border-slate-100/80 p-4 rounded-2xl transition-colors ${
        isDragging ? 'bg-slate-50/90 md:bg-white border-blue-100' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle with reduced visual prominence */}
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg shrink-0 cursor-grab active:cursor-grabbing transition opacity-40 hover:opacity-100"
        >
          <GripVertical size={14} />
        </div>

        {/* Thumbnail Image: 56px size */}
        <div className="w-14 h-14 bg-slate-50 border border-slate-100/80 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-sm">
          <img
            src={ex.exercise_image || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'}
            alt={ex.exercise_name}
            className="w-full h-full object-contain mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Information Column with elegant text hierarchy */}
        <div 
          className="flex-1 min-w-0 pr-1 cursor-pointer select-none group"
          onClick={() => {
            if (ex.notes !== undefined) {
              setIsNotesExpanded(!isNotesExpanded);
            }
          }}
        >
          {/* LINE 1: Exercise Title */}
          <div className="flex items-start gap-1.5 justify-between">
            <h4 className="font-extrabold text-[14px] text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 break-words">
              {ex.exercise_name}
            </h4>
            {ex.notes !== undefined && (
              <span className="shrink-0 mt-0.5" title={isNotesExpanded ? "Ocultar Nota" : "Mostrar Nota"}>
                <FileText size={12} className={`transition-colors ${isNotesExpanded ? 'text-amber-500' : 'text-slate-300 group-hover:text-amber-400'}`} />
              </span>
            )}
          </div>

          {/* LINE 2: Primary muscle group */}
          <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
            {ex.muscle_group || 'Exercício'}
          </p>

          {/* LINE 3: Sets/reps summary */}
          <div className="text-[12px] font-medium text-slate-600 mt-1.5 leading-none">
            {ex.sets_json?.length || ex.sets || 3} séries • {ex.reps || '10'} reps
          </div>

          {/* LINE 4: Compact metadata row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center text-[10.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-100/60 px-2 py-0.5 rounded-md">
              Carga: <strong className="font-extrabold text-slate-850 ml-1">{ex.weight || '0'}kg</strong>
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-100/60 px-2 py-0.5 rounded-md">
              Descanso: <strong className="font-extrabold text-slate-850 ml-1">{ex.rest_time || 60}s</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 self-center">
          <button
            onClick={() => setActiveMenuId(activeMenuId === ex.id ? null : ex.id)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
              activeMenuId === ex.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-350 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Note Component - collapsable manual expansion */}
      <AnimatePresence>
        {isNotesExpanded && ex.notes !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 py-2 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2 focus-within:border-amber-300 focus-within:bg-white transition-all">
              <FileText size={12} className="text-amber-500 mt-1 shrink-0" />
              <textarea
                value={ex.notes}
                onChange={(e) => onUpdateNote(idx, e.target.value)}
                placeholder="Ex Focar na descida controlada..."
                className="flex-1 text-[11px] font-semibold text-slate-750 bg-transparent border-none focus:outline-none focus:ring-0 p-0 resize-none h-10 no-scrollbar leading-relaxed"
              />
              <button
                onClick={() => onRemoveNote(idx)}
                className="text-slate-350 hover:text-slate-500 shrink-0 p-0.5 mt-0.5"
                title="Remover anotação"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card context menu dropdown */}
      <AnimatePresence>
        {activeMenuId === ex.id && (
          <>
            {/* Backdrop to close click-outside */}
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setActiveMenuId(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-4 top-14 z-[105] bg-white rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] border border-slate-100 p-1.5 min-w-[160px] space-y-0.5"
            >
              <button
                onClick={() => {
                  onReplace(idx);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 text-[10px] font-black uppercase tracking-widest text-slate-650 hover:bg-slate-50 rounded-lg transition"
              >
                <Replace size={13} className="text-blue-500" /> Substituir
              </button>

              <button
                onClick={() => {
                  onEditSetsReps(idx);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 text-[10px] font-black uppercase tracking-widest text-slate-650 hover:bg-slate-50 rounded-lg transition"
              >
                <SlidersHorizontal size={13} className="text-amber-500" /> Ajustar Séries
              </button>

              <button
                onClick={() => {
                  if (ex.notes === undefined) {
                    onAddNote(idx);
                  } else {
                    setIsNotesExpanded(!isNotesExpanded);
                  }
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 text-[10px] font-black uppercase tracking-widest text-slate-650 hover:bg-slate-50 rounded-lg transition"
              >
                <FileText size={13} className="text-emerald-500" /> 
                {ex.notes === undefined ? 'Nota / Dica' : isNotesExpanded ? 'Ocultar Nota' : 'Mostrar Nota'}
              </button>

              <div className="h-px bg-slate-100/75 mx-1.5 my-1" />

              <button
                onClick={() => {
                  onRemove(idx);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2.5 p-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 size={13} /> Remover
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main WorkoutPreparation Screen Component
interface WorkoutPreparationProps {
  workoutId: string;
}

export const WorkoutPreparation: React.FC<WorkoutPreparationProps> = ({ workoutId }) => {
  const { navigate, goBack } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [workoutName, setWorkoutName] = useState('Preparando Treino');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [category, setCategory] = useState<WorkoutCategory | null>(null);

  // Bottom sheets
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Modal settings
  const [editingSetsIndex, setEditingSetsIndex] = useState<number | null>(null);
  const [editingSetsCount, setEditingSetsCount] = useState(3);
  const [editingRepsPattern, setEditingRepsPattern] = useState('10');
  const [editingWeight, setEditingWeight] = useState(0);
  const [editingRestTime, setEditingRestTime] = useState(60);

  // Supabase lists for Replace
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Setup sensors for dragging with tap-prevent criteria
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load database workout & favorites
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const user = await authApi.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Look for existing temporary session for today, to have continuous planning mode!
        const localKey = `workout_session_temp_${workoutId}`;
        const savedSession = localStorage.getItem(localKey);

        const { category: loadedCategory, exercises: loadedExercises } = await workoutApi.getWorkoutInitData(workoutId, user.id);
        
        setCategory(loadedCategory);
        setWorkoutName(loadedCategory?.name || 'Treino');

        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setExercises(parsed);
          } else {
            setExercises(loadedExercises);
          }
        } else {
          setExercises(loadedExercises);
        }

        // Fetch exercise pool for substitution
        const [exercs, favList] = await Promise.all([
          exerciseApi.getExercises(),
          exerciseApi.getFavorites(user.id)
        ]);

        setAvailableExercises(exercs);
        setFavoriteIds(new Set(favList));

      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workoutId, showError]);

  // Handle Drag & Drop Ended reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExercises((prev) => {
        const oldIdx = prev.findIndex((item) => item.id === active.id);
        const newIdx = prev.findIndex((item) => item.id === over.id);
        const next = arrayMove(prev, oldIdx, newIdx);
        
        // Re-calculate orders
        return next.map((item, index) => ({
          ...(item as any),
          order: index + 1,
        }));
      });
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  }, []);

  // Update load of index
  const handleUpdateWeight = useCallback((idx: number, weight: number) => {
    setExercises(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        weight,
        sets_json: next[idx].sets_json?.map(s => ({ ...s, weight })) || 
          Array.from({ length: next[idx].sets || 3 }).map(() => ({
            reps: next[idx].reps || '10',
            weight,
            rest_time: next[idx].rest_time || 60,
            type: SetType.NORMAL
          }))
      };
      
      // Save instantly to session Cache
      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  }, [workoutId]);

  // Update reps of index
  const handleUpdateReps = useCallback((idx: number, reps: string) => {
    setExercises(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        reps,
        sets_json: next[idx].sets_json?.map(s => ({ ...s, reps })) ||
          Array.from({ length: next[idx].sets || 3 }).map(() => ({
            reps,
            weight: next[idx].weight || 0,
            rest_time: next[idx].rest_time || 60,
            type: SetType.NORMAL
          }))
      };
      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
  }, [workoutId]);

  // Enable note editor
  const handleAddNote = useCallback((idx: number) => {
    setExercises(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        notes: ''
      };
      return next;
    });
  }, []);

  // Write Note
  const handleUpdateNote = useCallback((idx: number, notes: string) => {
    setExercises(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        notes
      };
      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
  }, [workoutId]);

  // Undo note
  const handleRemoveNote = useCallback((idx: number) => {
    setExercises(prev => {
      const next = [...prev];
      const target = { ...next[idx] };
      delete target.notes;
      next[idx] = target;
      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
  }, [workoutId]);

  // Substitute/Replace Exercise Selector open
  const handleOpenReplace = useCallback((idx: number) => {
    setReplacingIndex(idx);
    setShowExerciseSelector(true);
  }, []);

  // Substitute finalized selection or append new exercise
  const handleSelectSubstitute = useCallback((exercise: Exercise) => {
    if (replacingIndex !== null) {
      setExercises(prev => {
        const next = [...prev];
        const target = next[replacingIndex];

        next[replacingIndex] = {
          ...target,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          exercise_image: exercise.image_url || exercise.static_frame_url,
          muscle_group: exercise.muscle_group,
          type: exercise.type,
        };

        localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
        return next;
      });
      setShowExerciseSelector(false);
      setReplacingIndex(null);
      showSuccess('Exercício substituído', `Alterado para ${exercise.name} hoje.`);
    } else {
      // Adding a new exercise to the workout session
      setExercises(prev => {
        const newOrder = prev.length + 1;
        const tempId = `new-ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const numSets = 3;
        const targetReps = '10';
        const targetWeight = 10;
        const targetRest = 60;

        const defaultSetsJson = Array.from({ length: numSets }).map(() => ({
          reps: targetReps,
          weight: targetWeight,
          rest_time: targetRest,
          type: SetType.NORMAL
        }));

        const newWorkoutEx: WorkoutExercise = {
          id: tempId,
          category_id: workoutId,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          exercise_image: exercise.image_url || exercise.static_frame_url,
          muscle_group: exercise.muscle_group,
          type: exercise.type,
          sets: numSets,
          reps: targetReps,
          weight: targetWeight,
          rest_time: targetRest,
          sets_json: defaultSetsJson,
          order: newOrder
        };

        const next = [...prev, newWorkoutEx];
        localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
        return next;
      });
      setShowExerciseSelector(false);
      showSuccess('Exercício adicionado', `${exercise.name} adicionado ao treino de hoje.`);
    }
  }, [replacingIndex, workoutId, showSuccess]);

  // Delete exercise
  const handleRemoveExercise = useCallback((idx: number) => {
    setExercises(prev => {
      const next = prev.filter((_, i) => i !== idx).map((ex, i) => ({
        ...ex,
        order: i + 1
      }));
      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
    if ('vibrate' in navigator) navigator.vibrate([10, 20]);
  }, [workoutId]);

  // Sets count click modal open
  const handleEditSetsReps = useCallback((idx: number) => {
    const ex = exercises[idx];
    setEditingSetsIndex(idx);
    setEditingSetsCount(ex.sets_json?.length || ex.sets || 3);
    setEditingRepsPattern(ex.reps || '10');
    setEditingWeight(ex.weight || 0);
    setEditingRestTime(ex.rest_time || 60);
  }, [exercises]);

  // Save detailed sets configuration
  const handleSaveSetsRepsModal = () => {
    if (editingSetsIndex === null) return;
    setExercises(prev => {
      const next = [...prev];
      const ex = next[editingSetsIndex];
      const currentSets = ex.sets_json || [];

      let nextSets = [...currentSets];
      if (editingSetsCount > currentSets.length) {
        // Grow set pool
        const lastSet = currentSets[currentSets.length - 1] || {
          reps: editingRepsPattern,
          weight: editingWeight,
          rest_time: editingRestTime,
          type: SetType.NORMAL
        };
        for (let i = currentSets.length; i < editingSetsCount; i++) {
          nextSets.push({ ...lastSet, reps: editingRepsPattern, weight: editingWeight, rest_time: editingRestTime });
        }
      } else if (editingSetsCount < currentSets.length) {
        // Cut sets
        nextSets = nextSets.slice(0, editingSetsCount);
      } else {
        // Update repetitions content
        nextSets = nextSets.map(s => ({ ...s, reps: editingRepsPattern }));
      }

      // Sync updated common values across the set details array
      nextSets = nextSets.map(s => ({
        ...s,
        reps: editingRepsPattern,
        weight: editingWeight,
        rest_time: editingRestTime
      }));

      next[editingSetsIndex] = {
        ...ex,
        sets: editingSetsCount,
        reps: editingRepsPattern,
        weight: editingWeight,
        rest_time: editingRestTime,
        sets_json: nextSets
      };

      localStorage.setItem(`workout_session_temp_${workoutId}`, JSON.stringify(next));
      return next;
    });
    setEditingSetsIndex(null);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  // Compute stats of session
  const totalExercises = exercises.length;
  const uniqueMuscleGroups = useMemo(() => {
    const groups = exercises.map(ex => ex.muscle_group).filter(Boolean) as string[];
    return Array.from(new Set(groups));
  }, [exercises]);

  const totalSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => acc + (ex.sets_json?.length || ex.sets || 3), 0);
  }, [exercises]);

  // 12 exercises ~75min formula
  const estimatedWorkoutMinutes = useMemo(() => {
    return Math.max(15, Math.round(totalExercises * 5 + totalSetsCount * 1.5));
  }, [totalExercises, totalSetsCount]);

  // Start executing the session with these custom steps
  const handleStartWorkout = async () => {
    setLoading(true);
    try {
      // 1. Ensure any stale sessions in WorkoutPlayer has been cleaned
      useWorkoutStore.getState().resetWorkout();

      // 2. Clear old caches and trigger the session starting on workout view route
      // We explicitly leave `workout_session_temp_${workoutId}` persisted in localStorage.
      // WorkoutPlayer will fetch and read it!
      navigate('workout', { id: workoutId });
    } catch (err) {
      showError(err);
      setLoading(false);
    }
  };

  if (loading && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <ScreenState 
          loading={true} 
          title="Preparando Painel" 
          description="Iniciando motor de treino e configurando sua sessão..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-40 relative">
      {/* HEADER SECTION IN BLOCK FOR SCROLL */}
      <div className="max-w-md mx-auto px-6 pt-8 pb-4 relative z-10">
        <header className="space-y-4">
          {/* Sleek Light Top Navbar */}
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center max-w-[200px]">
              <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-[0.25em]">
                PLANEJAMENTO HOJE
              </span>
              <span className="text-xs font-black text-slate-800 tracking-tight truncate max-w-full">
                {workoutName}
              </span>
            </div>

            <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400">
              <Sparkles size={16} className="text-blue-500" />
            </div>
          </div>
        </header>

        {/* Exercises List utilizing dnd-kit */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Exercícios da Sessão ({exercises.length})
            </h3>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100/80 py-1 px-2.5 rounded-full">
              Reordenar
            </span>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-10 text-center space-y-4">
              <Dumbbell size={32} className="text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase">Lista Vazia</h4>
                <p className="text-xs font-semibold text-slate-400">Insira exercícios para iniciar hoje.</p>
              </div>
              <button 
                onClick={() => handleOpenReplace(0)}
                className="mx-auto flex items-center gap-2 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition"
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={exercises.map(ex => ex.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {exercises.map((ex, idx) => (
                      <SortablePrepExerciseCard
                        key={ex.id}
                        ex={ex}
                        idx={idx}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        onUpdateWeight={handleUpdateWeight}
                        onUpdateReps={handleUpdateReps}
                        onEditSetsReps={handleEditSetsReps}
                        onAddNote={handleAddNote}
                        onUpdateNote={handleUpdateNote}
                        onRemoveNote={handleRemoveNote}
                        onReplace={handleOpenReplace}
                        onRemove={handleRemoveExercise}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                onClick={() => {
                  setReplacingIndex(null);
                  setShowExerciseSelector(true);
                }}
                className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                <Plus size={14} strokeWidth={3} /> Adicionar Exercício
              </button>
            </>
          )}
        </div>

        {/* ELEGANT LIGHTWEIGHT SUMMARY SECTION */}
        {exercises.length > 0 && (
          <div className="mt-8 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.02)] text-center space-y-2.5">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {workoutName}
              </h2>
              <p className="text-[11.5px] font-medium text-slate-500">
                {totalExercises} {totalExercises === 1 ? 'exercício' : 'exercícios'} &bull; ~{estimatedWorkoutMinutes} min &bull; {uniqueMuscleGroups.length > 0 ? uniqueMuscleGroups.join(', ') : 'Treino'}
              </p>
            </div>
            <div className="h-px bg-slate-100/60 w-8 mx-auto" />
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Seu treino original permanece preservado.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER ACTION BUTTONS PANEL */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-100 py-6 px-6 pb-9 shadow-[0_-10px_35px_rgba(30,41,59,0.04)]">
        <div className="max-w-md mx-auto flex items-center gap-5">
          <div className="flex flex-col justify-center leading-tight shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Duração Est.
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-slate-800">
              <Clock size={16} className="text-slate-400 shrink-0" />
              <span className="text-xl font-black tracking-tight tabular-nums">
                ~{estimatedWorkoutMinutes}min
              </span>
            </div>
          </div>

          <button
            onClick={handleStartWorkout}
            disabled={exercises.length === 0}
            className="flex-1 py-5 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3.5"
          >
            <Play size={16} fill="currentColor" strokeWidth={0} />
            Iniciar Treino
          </button>
        </div>
      </footer>

      {/* DETAILED SETS/REPS SLIDE-UP MODAL PANEL */}
      <AnimatePresence>
        {editingSetsIndex !== null && (
          <div className="fixed inset-0 z-[1100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSetsIndex(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white rounded-t-[3rem] p-8 pb-10 space-y-8 relative z-10 shadow-[0_-15px_45px_rgba(0,0,0,0.15)] border-t border-slate-50"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              
              <div className="text-center space-y-2">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.25em]">Configuração de Series</span>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase truncate">
                  {exercises[editingSetsIndex]?.exercise_name}
                </h3>
              </div>

              <div className="space-y-6">
                {/* Stepper for selection of Sets Count */}
                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-800 uppercase text-left">Quantidade de Séries</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-left">Sets para executar</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                    <button
                      onClick={() => setEditingSetsCount(Math.max(1, editingSetsCount - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-850 font-black flex items-center justify-center transition-all"
                    >
                      -
                    </button>
                    <span className="text-base font-black w-7 text-center tabular-nums">{editingSetsCount}</span>
                    <button
                      onClick={() => setEditingSetsCount(editingSetsCount + 1)}
                      className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-850 font-black flex items-center justify-center transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Input for target repetitions pattern */}
                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-800 uppercase text-left">Repetições</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-left">Meta por série</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-sm">
                    <input
                      type="text"
                      value={editingRepsPattern}
                      onChange={(e) => setEditingRepsPattern(e.target.value)}
                      className="w-14 text-center font-black text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-base"
                      placeholder="e.g. 10"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase">reps</span>
                  </div>
                </div>

                {/* Input for Target Carga/Weight */}
                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-800 uppercase text-left">Carga Target</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-left">Peso hoje em kg</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-sm">
                    <input
                      type="number"
                      value={editingWeight}
                      onChange={(e) => setEditingWeight(parseFloat(e.target.value) || 0)}
                      className="w-14 text-center font-black text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-base"
                      placeholder="0"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase">kg</span>
                  </div>
                </div>

                {/* Input for Target Rest Time */}
                <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-800 uppercase text-left">Tempo de Descanso</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-left">Intervalo pós-série</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-sm">
                    <input
                      type="number"
                      value={editingRestTime}
                      onChange={(e) => setEditingRestTime(parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-black text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-base"
                      placeholder="60"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase">s</span>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <div className="flex gap-4">
                <button
                  onClick={() => setEditingSetsIndex(null)}
                  className="flex-1 py-5 bg-slate-100 rounded-2xl font-black text-slate-600 uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSetsRepsModal}
                  className="flex-1 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/10 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBSTITUTION SCREEN SELECTOR BOTTOM SHEET */}
      <ExerciseReplaceScreen 
        isOpen={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        availableExercises={availableExercises}
        onSelect={handleSelectSubstitute}
        replacingIndex={replacingIndex}
        currentExercise={replacingIndex !== null ? exercises[replacingIndex] : undefined}
        favoriteIds={favoriteIds}
      />
    </div>
  );
};
