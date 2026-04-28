
import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutExercise, Exercise, SetConfig, WorkoutFolder, MuscleGroup, SetType, WorkoutCategory } from '../types';
import { authApi } from '../lib/api/authApi';
import { workoutApi } from '../lib/api/workoutApi';
import { useNavigation } from '../App';
import { ExerciseReplaceScreen } from './ExerciseReplaceScreen';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ScreenState } from './ui/ScreenState';
import { WorkoutSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { ChevronLeft, Save, PlusCircle, GripVertical, SlidersHorizontal, Trash2, Search, X, MoreVertical, Play, Edit2, Replace, Copy, Clock, Dumbbell, Sparkles, ArrowUpCircle, Info, CheckCircle2, AlertCircle, Loader2, Shield, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import { workoutEngine } from '../domain/workout/workoutEngine';
import { cacheStore } from '../lib/cache/cacheStore';
import { ekeService } from '../domain/eke/ekeService';
import { Goal, ExperienceLevel } from '../types';

interface SortableItemProps {
  ex: EditorExercise;
  idx: number;
  total: number;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  setEditingSetsIndex: (idx: number) => void;
  setReplacingIndex: (idx: number) => void;
  setShowExerciseSelector: (show: boolean) => void;
  setExercises: React.Dispatch<React.SetStateAction<EditorExercise[]>>;
}

const SortableExerciseItem: React.FC<SortableItemProps & { 
  onDuplicate: (idx: number) => void, 
  lastAddedId: string | null,
  showGroupLabel?: string | null
}> = ({
  ex,
  idx,
  total,
  activeMenuId,
  setActiveMenuId,
  setEditingSetsIndex,
  setReplacingIndex,
  setShowExerciseSelector,
  setExercises,
  onDuplicate,
  lastAddedId,
  showGroupLabel
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: ex.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const isNew = lastAddedId === ex.tempId;

  return (
    <div className="relative">
      {showGroupLabel && (
        <div className="px-6 py-3 bg-slate-50/50 border-y border-slate-50 flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{showGroupLabel}</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
        </div>
      )}
      <motion.div 
        ref={setNodeRef} 
        style={style} 
        initial={isNew ? { scale: 0.8, opacity: 0 } : false}
        animate={isNew ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
        className="relative"
      >
      {/* SWIPE ACTIONS BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-between px-6 overflow-hidden pointer-events-none">
        <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest">
          <Copy size={16} /> Duplicar
        </div>
        <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest">
          Remover <Trash2 size={16} />
        </div>
      </div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) onDuplicate(idx);
          if (info.offset.x < -80) setExercises(prev => prev.filter(e => e.tempId !== ex.tempId));
        }}
        className={`flex items-center gap-4 py-2.5 transition-all bg-white relative z-10 border-b border-slate-50 ${isDragging ? 'shadow-2xl rounded-2xl scale-[1.02] border-none z-50 px-4' : ''} ${isNew ? 'bg-blue-50/30' : ''}`}
      >
        {/* DRAG HANDLE */}
        <div 
          {...attributes} 
          {...listeners} 
          className="flex items-center justify-center w-6 h-10 text-slate-200 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </div>

        {/* EXERCISE IMAGE */}
        <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1.5 border border-slate-100">
          <img 
            src={ex.exercise_image || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} 
            className="w-full h-full object-contain mix-blend-multiply" 
            referrerPolicy="no-referrer" 
          />
        </div>

        {/* INFO */}
        <div 
          className="flex-1 min-w-0 cursor-pointer py-0.5"
          onClick={() => setEditingSetsIndex(idx)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[15px] text-slate-900 leading-tight break-words">
              {ex.exercise_name}
            </h4>
            {ex.type?.toLowerCase().includes('composto') && (
              <div className="px-1.5 py-0.5 bg-blue-50 rounded text-[7px] font-black text-blue-600 uppercase tracking-widest shrink-0">
                Base
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-tight">
            {ex.sets_json?.length || 3} Séries • {ex.sets_json?.[0]?.reps || '12'} Reps
          </p>
        </div>

        {/* QUICK ACTIONS INLINE */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onDuplicate(idx)}
            className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-blue-500 transition-colors"
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          <button 
            onClick={() => { setReplacingIndex(idx); setShowExerciseSelector(true); }}
            className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-slate-900 transition-colors"
            title="Substituir"
          >
            <Replace size={14} />
          </button>
          <button 
            onClick={() => setActiveMenuId(activeMenuId === ex.tempId ? null : ex.tempId)}
            className="w-8 h-8 flex items-center justify-center text-slate-200 active:text-slate-900 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeMenuId === ex.tempId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-2xl border border-slate-50 p-4 min-w-[160px] space-y-2"
          >
            <button 
              onClick={() => { setEditingSetsIndex(idx); setActiveMenuId(null); }}
              className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
            >
              <SlidersHorizontal size={14} /> Ajustar Séries
            </button>
            <button 
              onClick={() => { setReplacingIndex(idx); setShowExerciseSelector(true); setActiveMenuId(null); }}
              className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
            >
              <Replace size={14} /> Substituir
            </button>
            <button 
              onClick={() => { setExercises(prev => prev.filter(e => e.tempId !== ex.tempId)); setActiveMenuId(null); }}
              className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
            >
              <Trash2 size={14} /> Remover
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>
);
};

interface WorkoutEditorProps {
  workoutId: string | null;
  initialFolderId?: string;
}

interface EditorExercise extends Partial<WorkoutExercise> {
  tempId: string;
}

const WorkoutEditor: React.FC<WorkoutEditorProps> = ({ workoutId, initialFolderId }) => {
  const { navigate, goBack, current } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string>(initialFolderId || current.params?.folderId || '');
  const [folders, setFolders] = useState<WorkoutFolder[]>([]);
  const [exercises, setExercises] = useState<EditorExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const editorState = useAsyncState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicParams, setMagicParams] = useState({
    goal: Goal.HYPERTROPHY,
    duration: 60,
    level: ExperienceLevel.BEGINNER,
    focusMuscles: [] as string[]
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const [editingSetsIndex, setEditingSetsIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets_json?.length || 0), 0);
    const estimatedMinutes = totalSets * 3; // 3 mins per set avg
    const muscles = Array.from(new Set(exercises.map(ex => {
      const available = availableExercises.find(ae => ae.id === ex.exercise_id);
      return available?.muscle_group;
    }).filter(Boolean)));
    
    return { totalSets, estimatedMinutes, muscles };
  }, [exercises, availableExercises]);

  const qualityScore = useMemo(() => {
    if (exercises.length === 0) return null;
    
    // Heurística simples de qualidade
    const hasCompound = exercises.some(ex => ex.type?.toLowerCase().includes('composto'));
    const muscleVariety = stats.muscles.length;
    const volumePerMuscle = exercises.length / (muscleVariety || 1);
    
    let score = 70; // Base
    if (hasCompound) score += 15;
    if (muscleVariety > 1) score += 10;
    if (volumePerMuscle > 2 && volumePerMuscle < 5) score += 5;
    
    return Math.min(score, 100);
  }, [exercises, stats.muscles]);

  const suggestions = useMemo(() => {
    // Only suggest active exercises
    const activeAvailable = availableExercises.filter(ex => ex.is_active !== false);

    if (exercises.length === 0) return activeAvailable.slice(0, 5);
    
    const lastEx = exercises[exercises.length - 1];
    const lastMuscle = lastEx.muscle_group;
    
    // Sugerir exercícios do mesmo grupo muscular que ainda não estão no treino
    return activeAvailable
      .filter(ex => ex.muscle_group === lastMuscle && !exercises.some(ee => ee.exercise_id === ex.id))
      .slice(0, 4);
  }, [exercises, availableExercises]);

  const handleMagicBuild = async () => {
    if (magicParams.focusMuscles.length === 0) {
        showError("Selecione pelo menos um grupo muscular!");
        return;
    }
    setMagicLoading(true);
    try {
        const workout = await ekeService.generateWorkoutPlan(magicParams);
        const editorExercises = workout.map(ex => ({
            ...ex,
            tempId: crypto.randomUUID()
        })) as EditorExercise[];
        setExercises(editorExercises);
        setName(`Magic ${magicParams.goal}: ${magicParams.focusMuscles.join(' & ')}`);
        setShowMagicModal(false);
        showSuccess('EKE Ativada', 'O motor inteligente montou o treino ideal para seu contexto.');
        if ('vibrate' in navigator) navigator.vibrate([20, 100, 20]);
    } catch (err: any) {
        showError(err);
    } finally {
        setMagicLoading(false);
    }
  };

  const handleSmartSort = () => {
    const sorted = [...exercises].sort((a, b) => {
      // Compostos primeiro
      const aComp = a.type?.toLowerCase().includes('composto') ? 0 : 1;
      const bComp = b.type?.toLowerCase().includes('composto') ? 0 : 1;
      if (aComp !== bComp) return aComp - bComp;
      
      // Depois por grupo muscular
      return (a.muscle_group || '').localeCompare(b.muscle_group || '');
    });
    setExercises(sorted);
    if ('vibrate' in navigator) navigator.vibrate([10, 50]);
  };

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

  useEffect(() => {
    fetchData();
  }, [workoutId]);

  const fetchData = async () => {
    editorState.setLoading(true);
    try {
      const user = await authApi.getUser();
      if (!user) return;

      const data = await workoutApi.getWorkoutEditorData(user.id, workoutId);
      
      setAvailableExercises(data.exercises);
      setFolders(data.folders);
      setMuscleGroups(data.muscleGroups);

      if (data.category) {
        setName(data.category.name);
        setDescription(data.category.description || '');
        setFolderId(data.category.folder_id || '');
      }
      
      if (data.workoutExercises) {
        setExercises(data.workoutExercises.map((item: any) => ({
          id: item.id,
          tempId: item.id,
          exercise_id: item.exercise_id,
          exercise_name: item.exercises?.name || item.exercise_name_snapshot || item.exercise_name || 'Exercício Indisponível',
          exercise_image: item.exercises?.image_url || item.exercise_image,
          muscle_group: item.exercises?.muscle_group || item.muscle_group,
          type: item.exercises?.type || item.type,
          sets_json: item.sets_json || [],
          superset_id: item.superset_id
        })));
      }
      editorState.setData(true);
    } catch (err) { 
      editorState.setError(err);
      showError(err);
    }
  };

  const handleAddOrReplaceExercise = (ex: Exercise) => {
    const tempId = crypto.randomUUID();
    const newEx: EditorExercise = {
      tempId,
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_image: ex.image_url,
      muscle_group: ex.muscle_group,
      type: ex.type,
      sets_json: [
        { reps: '12', weight: 0, rest_time: 60, type: SetType.NORMAL },
        { reps: '12', weight: 0, rest_time: 60, type: SetType.NORMAL },
        { reps: '12', weight: 0, rest_time: 60, type: SetType.NORMAL }
      ],
      superset_id: null
    };

    if (replacingIndex !== null) {
      const newExs = [...exercises];
      newExs[replacingIndex] = newEx;
      setExercises(newExs);
      setReplacingIndex(null);
    } else {
      setExercises([...exercises, newEx]);
      setLastAddedId(tempId);
      setTimeout(() => setLastAddedId(null), 1000);
    }
    setShowExerciseSelector(false);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleDuplicate = (idx: number) => {
    const tempId = crypto.randomUUID();
    const original = exercises[idx];
    const duplicate = { ...original, tempId, id: undefined };
    const newExs = [...exercises];
    newExs.splice(idx + 1, 0, duplicate);
    setExercises(newExs);
    setLastAddedId(tempId);
    setTimeout(() => setLastAddedId(null), 1000);
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
  };

  const handleUpdateSets = (idx: number, newSets: SetConfig[]) => {
    const newExs = [...exercises];
    newExs[idx].sets_json = newSets;
    setExercises(newExs);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.tempId === active.id);
        const newIndex = items.findIndex((item) => item.tempId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  };

  const handleSave = async (isPermanent: boolean) => {
    if (!name.trim()) {
      showError({ message: 'validation: Dê um nome ao treino!' });
      return;
    }
    
    setSaving(true);
    const previousDashboardData = cacheStore.get('dashboard_data') as any;

    try {
      const user = await authApi.getUser();
      if (!user) throw new Error("Não autenticado");
      
      let currentId = workoutId;
      const payload = { user_id: user.id, name, description, folder_id: folderId || null };

      if (isPermanent) {
        // Optimistic Dashboard Update
        if (previousDashboardData) {
          const optimisticWorkout = {
            id: currentId || `temp-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString()
          };
          
          const newWorkouts = currentId 
            ? (previousDashboardData.workouts as any[]).map((w: any) => w.id === currentId ? optimisticWorkout : w)
            : [optimisticWorkout, ...previousDashboardData.workouts];

          cacheStore.set('dashboard_data', {
            ...previousDashboardData,
            workouts: newWorkouts
          });
        }

        // Navigate immediately
        navigate('dashboard', { folderId });

        // Background Save
        if (!currentId) {
          const data = await workoutApi.createCategory(payload);
          currentId = data.id;
        } else {
          await workoutApi.updateCategory(currentId, payload);
          // Invalidate cache for this workout
          cacheStore.clear(`workout_init_${currentId}`);
        }

        await workoutApi.deleteExercisesByCategory(currentId!);
        if (exercises.length > 0) {
          const exercisesPayload = workoutEngine.prepareSavePayload(exercises, currentId!);
          await workoutApi.insertWorkoutExercises(exercisesPayload);
        }

        showSuccess('Treino salvo', 'Tudo pronto! Seu treino foi atualizado com sucesso.');
        
        // Revalidate dashboard to get real IDs and data
        // (The mutate in Dashboard will handle this when it mounts)
      } else {
        // Just starting a workout session
        if (!currentId) {
          const data = await workoutApi.createCategory({ user_id: user.id, name, description, folder_id: folderId || null });
          currentId = data.id;
        }
        
        await workoutApi.upsertPartialWorkoutSession({
          user_id: user.id,
          workout_id: currentId,
          current_index: 0,
          current_set: 1,
          exercises_json: exercises,
          updated_at: new Date().toISOString()
        });
        
        navigate('workout', { id: currentId });
      }
    } catch (err) {
      // Rollback dashboard if needed
      if (isPermanent && previousDashboardData) {
        cacheStore.set('dashboard_data', previousDashboardData);
      }
      showError(err);
    } finally {
      setSaving(false);
      setShowSaveModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative text-slate-900 pb-32">
      <header className="px-6 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="w-8 h-8 flex items-center justify-center text-slate-400 active:text-slate-900 active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
              {name || 'Novo Treino'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {folders.find(f => f.id === folderId)?.name || 'Sem Pasta'}
            </p>
            <div className="flex items-center gap-1 mt-0.5 opacity-60">
                <Shield size={8} className="text-blue-500" />
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">EKE v1.0 Engaged</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSaveModal(true)} 
          disabled={saving} 
          className="px-5 py-2.5 bg-slate-900 rounded-full text-white font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
        </button>
      </header>

      <ScreenState
        status={editorState.status}
        skeleton={<WorkoutSkeleton />}
        onRetry={fetchData}
      >
        <div className="flex-1 px-6 py-4 space-y-6 w-full">
          {/* WORKOUT STATS CONTEXT */}
          <div className="flex items-center gap-6 py-0.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <Clock size={12} className="text-slate-300" />
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{stats.estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Dumbbell size={12} className="text-slate-300" />
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{exercises.length} Exer.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex -space-x-2">
                {stats.muscles.slice(0, 3).map((m, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                    <span className="text-[6px] font-black text-slate-400 uppercase">{m?.charAt(0)}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {stats.muscles.length > 0 ? stats.muscles[0] : 'Vazio'}
              </span>
            </div>

            {qualityScore !== null && (
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Qualidade</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${qualityScore > 85 ? 'text-emerald-500' : qualityScore > 70 ? 'text-blue-500' : 'text-amber-500'}`}>
                    {qualityScore}%
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-slate-50 flex items-center justify-center relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" 
                      className="text-slate-50"
                    />
                    <circle 
                      cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" 
                      strokeDasharray={88}
                      strokeDashoffset={88 - (88 * qualityScore) / 100}
                      className={qualityScore > 85 ? 'text-emerald-500' : qualityScore > 70 ? 'text-blue-500' : 'text-amber-500'}
                    />
                  </svg>
                  <Sparkles size={10} className="absolute text-slate-300" />
                </div>
              </div>
            )}
          </div>

          {/* BASIC INFO SECTION */}
          <section className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome do Treino" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full py-4 bg-transparent border-b border-slate-100 font-bold text-3xl outline-none focus:border-slate-900 transition-all text-slate-900 tracking-tight placeholder:text-slate-200" 
            />
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Pasta:</span>
              <select 
                value={folderId} onChange={e => setFolderId(e.target.value)} 
                className="flex-1 py-2 bg-transparent font-bold text-[13px] outline-none text-slate-500 appearance-none tracking-tight focus:text-slate-900 transition-all"
              >
                <option value="">Nenhuma</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </section>

          {/* EXERCISES SECTION */}
          <div className="space-y-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exercícios</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowMagicModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Sparkles size={12} /> Magic Builder
                </button>
                <button 
                  onClick={handleSmartSort}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-widest active:scale-95 transition-all"
                >
                  Smart Sort
                </button>
              </div>
            </div>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={exercises.map(ex => ex.tempId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="w-full">
                  {exercises.map((ex, idx) => {
                    const prevEx = idx > 0 ? exercises[idx - 1] : null;
                    const showGroupLabel = prevEx?.muscle_group !== ex.muscle_group ? ex.muscle_group : null;
                    
                    return (
                      <SortableExerciseItem 
                        key={ex.tempId}
                        ex={ex}
                        idx={idx}
                        total={exercises.length}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        setEditingSetsIndex={setEditingSetsIndex}
                        setReplacingIndex={setReplacingIndex}
                        setShowExerciseSelector={setShowExerciseSelector}
                        setExercises={setExercises}
                        onDuplicate={handleDuplicate}
                        lastAddedId={lastAddedId}
                        showGroupLabel={showGroupLabel}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* INLINE SUGGESTIONS */}
            {suggestions.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sugeridos para você</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {suggestions.map((ex) => (
                    <button 
                      key={ex.id}
                      onClick={() => handleAddOrReplaceExercise(ex)}
                      className="shrink-0 w-40 bg-slate-50 rounded-2xl p-4 text-left space-y-3 active:scale-95 transition-all border border-transparent hover:border-blue-100"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm relative">
                        <img src={ex.image_url} className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        {ex.quality_status === 'premium' && (
                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                             <Shield size={6} fill="currentColor" />
                           </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h5 className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2">{ex.name}</h5>
                          {(ex.performance_score || 0) > 85 && <Star size={8} className="text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => { setReplacingIndex(null); setShowExerciseSelector(true); }} 
              className="w-full py-6 mt-8 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400 active:text-slate-900 active:bg-slate-50 transition-all bg-white shadow-sm"
            >
               <PlusCircle size={18} />
               <span className="text-[12px] font-bold tracking-tight">Adicionar Exercício</span>
            </button>
          </div>
        </div>
      </ScreenState>

      {/* MODAL DE EDIÇÃO DE SÉRIES */}
      <AnimatePresence>
        {editingSetsIndex !== null && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col"
          >
            <header className="px-6 pt-12 pb-8 flex justify-between items-center border-b border-slate-50">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Ajuste Técnico</h3>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{exercises[editingSetsIndex].exercise_name}</p>
              </div>
              <button onClick={() => setEditingSetsIndex(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
              <div className="space-y-4">
                {exercises[editingSetsIndex].sets_json?.map((set, sIdx) => (
                  <div key={sIdx} className="bg-[#F7F8FA] p-8 rounded-3xl space-y-8">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Série {sIdx + 1}</span>
                       <button 
                        onClick={() => {
                          const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                          newSets.splice(sIdx, 1);
                          handleUpdateSets(editingSetsIndex!, newSets);
                        }}
                        className="text-red-500 text-[10px] font-black uppercase tracking-widest active:opacity-50 transition"
                       >Remover</button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                          <input 
                            type="number" value={set.weight} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].weight = parseFloat(e.target.value) || 0;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-white p-4 rounded-2xl text-center font-black text-slate-900 outline-none border border-transparent focus:border-slate-900 tabular-nums transition-all" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Reps</label>
                          <input 
                            type="text" value={set.reps} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].reps = e.target.value;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-white p-4 rounded-2xl text-center font-black text-slate-900 outline-none border border-transparent focus:border-slate-900 transition-all" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rest (s)</label>
                          <input 
                            type="number" value={set.rest_time} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].rest_time = parseInt(e.target.value) || 0;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-white p-4 rounded-2xl text-center font-black text-slate-900 outline-none border border-transparent focus:border-slate-900 tabular-nums transition-all" 
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                  const lastSet = newSets[newSets.length - 1] || { reps: '12', weight: 0, rest_time: 60, type: SetType.NORMAL };
                  newSets.push({ ...lastSet });
                  handleUpdateSets(editingSetsIndex!, newSets);
                }}
                className="w-full py-6 border-2 border-dashed border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 active:text-slate-900 transition-all"
              >+ Adicionar Série</button>
            </div>
            
            <footer className="px-6 py-10 border-t border-slate-50 bg-white pb-safe">
              <button 
                onClick={() => setEditingSetsIndex(null)}
                className="w-full py-6 bg-slate-900 rounded-3xl font-black text-white uppercase text-xs tracking-[0.3em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
              >Confirmar</button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE SALVAMENTO */}
      <AnimatePresence>
        {showMagicModal && (
          <div className="fixed inset-0 z-[1200] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMagicModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full bg-white rounded-t-[3rem] p-10 space-y-10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
               <div className="text-center space-y-4">
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Configurar Motor EKE</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">Personalize seu treino inteligente</p>
               </div>
               
               <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo</label>
                    <div className="grid grid-cols-2 gap-3">
                       {Object.values(Goal).map(g => (
                         <button 
                          key={g} onClick={() => setMagicParams({...magicParams, goal: g})}
                          className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${magicParams.goal === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                         >{g}</button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foco Muscular</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                       {muscleGroups.filter(mg => !mg.parent_id).map(mg => (
                         <button 
                          key={mg.id} 
                          onClick={() => {
                            const current = magicParams.focusMuscles;
                            if (current.includes(mg.name)) setMagicParams({...magicParams, focusMuscles: current.filter(m => m !== mg.name)});
                            else setMagicParams({...magicParams, focusMuscles: [...current, mg.name]});
                          }}
                          className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${magicParams.focusMuscles.includes(mg.name) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-400'}`}
                         >{mg.name}</button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo Disponível: {magicParams.duration} min</label>
                    <input 
                      type="range" min="20" max="120" step="5" value={magicParams.duration} 
                      onChange={e => setMagicParams({...magicParams, duration: parseInt(e.target.value)})}
                      className="w-full accent-slate-900"
                    />
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleMagicBuild} 
                    disabled={magicLoading}
                    className="w-full py-6 bg-blue-600 rounded-3xl font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {magicLoading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Montar Treino Mágico</>}
                  </button>
                  <button onClick={() => setShowMagicModal(false)} className="w-full py-2 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors">Cancelar</button>
               </div>
            </motion.div>
          </div>
        )}
        {showSaveModal && (
          <div className="fixed inset-0 z-[1100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[3rem] p-10 space-y-10 shadow-2xl relative z-10"
            >
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Salvar Alterações?</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed max-w-[250px] mx-auto">Deseja tornar essas edições permanentes?</p>
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={() => handleSave(true)} className="w-full py-6 bg-slate-900 rounded-3xl font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">Sim, Permanente</button>
                <button onClick={() => handleSave(false)} className="w-full py-6 bg-slate-100 rounded-3xl font-black text-slate-600 uppercase text-[10px] tracking-[0.2em] active:bg-slate-200 transition-all">Não, apenas agora</button>
                <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SELETOR DE EXERCÍCIOS - PREMIUM BOTTOM SHEET */}
      <ExerciseReplaceScreen 
        isOpen={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        availableExercises={availableExercises}
        onSelect={handleAddOrReplaceExercise}
        replacingIndex={replacingIndex}
        currentExercise={replacingIndex !== null ? exercises[replacingIndex] : undefined}
      />
    </div>
  );
};

export default WorkoutEditor;
