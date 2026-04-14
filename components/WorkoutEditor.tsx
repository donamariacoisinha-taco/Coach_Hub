
import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutExercise, Exercise, SetConfig, WorkoutFolder, MuscleGroup, SetType } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';
import { ChevronLeft, Save, PlusCircle, GripVertical, SlidersHorizontal, Trash2, Search, X, MoreVertical, Play, Edit2, Replace } from 'lucide-react';
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

const SortableExerciseItem: React.FC<SortableItemProps> = ({
  ex,
  idx,
  total,
  activeMenuId,
  setActiveMenuId,
  setEditingSetsIndex,
  setReplacingIndex,
  setShowExerciseSelector,
  setExercises
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

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div 
        className={`flex items-center gap-4 py-5 px-1 transition-all active:bg-slate-50 ${isDragging ? 'bg-white shadow-2xl rounded-3xl scale-[1.02] z-50 border border-slate-100' : ''}`}
      >
        {/* DRAG HANDLE */}
        <div 
          {...attributes} 
          {...listeners} 
          className="flex items-center justify-center w-6 h-12 text-slate-200 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </div>

        {/* EXERCISE IMAGE */}
        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 border border-slate-100">
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
          <h4 className="font-semibold text-[16px] text-slate-900 leading-snug break-words pr-2">
            {ex.exercise_name}
          </h4>
          <p className="text-[12px] font-medium text-slate-400 mt-0.5">
            {ex.sets_json?.length || 3} Séries • {ex.sets_json?.[0]?.reps || '12'} Reps
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center">
          <button 
            onClick={() => setActiveMenuId(activeMenuId === ex.tempId ? null : ex.tempId)}
            className="w-10 h-10 flex items-center justify-center text-slate-200 active:text-slate-900 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string>(initialFolderId || current.params?.folderId || '');
  const [folders, setFolders] = useState<WorkoutFolder[]>([]);
  const [exercises, setExercises] = useState<EditorExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [editingSetsIndex, setEditingSetsIndex] = useState<number | null>(null);

  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorMuscle, setSelectorMuscle] = useState('Todos');
  const [selectorSide, setSelectorSide] = useState<'all' | 'front' | 'back'>('all');

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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [exRes, foldersRes, mgRes] = await Promise.all([
        supabase.from('exercises').select('*').eq('is_active', true).order('name'),
        supabase.from('workout_folders').select('*').eq('user_id', user.id).order('name'),
        supabase.from('muscle_groups').select('*').order('name')
      ]);

      if (exRes.data) setAvailableExercises(exRes.data);
      if (foldersRes.data) setFolders(foldersRes.data);
      if (mgRes.data) setMuscleGroups(mgRes.data);

      if (workoutId) {
        const { data: catData } = await supabase.from('workout_categories').select('*').eq('id', workoutId).single();
        const { data: workExData } = await supabase.from('workout_exercises').select(`*, exercises (*)`).eq('category_id', workoutId).order('sort_order');
        if (catData) {
          setName(catData.name);
          setDescription(catData.description || '');
          setFolderId(catData.folder_id || '');
        }
        if (workExData) {
          setExercises(workExData.map((item: any) => ({
            id: item.id,
            tempId: item.id,
            exercise_id: item.exercise_id,
            exercise_name: item.exercises?.name || 'Exercício Removido',
            exercise_image: item.exercises?.image_url,
            sets_json: item.sets_json || [],
            superset_id: item.superset_id
          })));
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddOrReplaceExercise = (ex: Exercise) => {
    const newEx: EditorExercise = {
      tempId: crypto.randomUUID(),
      exercise_id: ex.id,
      exercise_name: ex.name,
      exercise_image: ex.image_url,
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
    }
    setShowExerciseSelector(false);
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
    if (!name.trim()) return alert("Dê um nome ao treino!");
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      
      let currentId = workoutId;

      if (isPermanent) {
        const payload = { user_id: user.id, name, description, folder_id: folderId || null };
        if (!currentId) {
          const { data } = await supabase.from('workout_categories').insert([payload]).select().single();
          currentId = data.id;
        } else {
          await supabase.from('workout_categories').update(payload).eq('id', currentId);
        }

        await supabase.from('workout_exercises').delete().eq('category_id', currentId);
        if (exercises.length > 0) {
          await supabase.from('workout_exercises').insert(exercises.map((ex, i) => ({
            category_id: currentId,
            exercise_id: ex.exercise_id,
            sets: ex.sets_json?.length || 3,
            sets_json: ex.sets_json,
            sort_order: i + 1,
            superset_id: ex.superset_id
          })));
        }
        navigate('dashboard', { folderId });
      } else {
        if (!currentId) {
          const { data } = await supabase.from('workout_categories').insert([{ user_id: user.id, name, description, folder_id: folderId || null }]).select().single();
          currentId = data.id;
        }
        
        await supabase.from('partial_workout_sessions').upsert({
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
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
      setShowSaveModal(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    return availableExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(selectorSearch.toLowerCase());
      const matchesMuscle = selectorMuscle === 'Todos' || ex.muscle_group === selectorMuscle;
      const mg = muscleGroups.find(m => m.name === ex.muscle_group);
      const matchesSide = selectorSide === 'all' || (mg && mg.body_side === selectorSide);
      return matchesSearch && matchesMuscle && matchesSide;
    });
  }, [availableExercises, selectorSearch, selectorMuscle, selectorSide, muscleGroups]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
      <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Editor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col relative text-slate-900 pb-32">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-4">
          <button onClick={() => goBack()} className="w-10 h-10 flex items-center justify-center text-slate-400 active:text-slate-900 active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
              {name || 'Novo Treino'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {folders.find(f => f.id === folderId)?.name || 'Sem Pasta'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowSaveModal(true)} 
          disabled={saving} 
          className="px-6 py-3 bg-slate-900 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-90 transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Salvar'}
        </button>
      </header>

      <div className="flex-1 px-6 py-4 space-y-12 w-full">
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
        <div className="space-y-2">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={exercises.map(ex => ex.tempId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {exercises.map((ex, idx) => (
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
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button 
            onClick={() => { setReplacingIndex(null); setShowExerciseSelector(true); }} 
            className="w-full py-6 mt-4 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400 active:text-slate-900 active:bg-slate-50 transition-all bg-white shadow-sm"
          >
             <PlusCircle size={18} />
             <span className="text-[12px] font-bold tracking-tight">Adicionar Exercício</span>
          </button>
        </div>
      </div>

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

      {/* SELETOR DE EXERCÍCIOS */}
      <AnimatePresence>
        {showExerciseSelector && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1200] bg-[#F7F8FA] flex flex-col"
          >
            <header className="px-6 pt-12 pb-8 flex justify-between items-center bg-white border-b border-slate-50">
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                {replacingIndex !== null ? 'Substituir' : 'Biblioteca'}
              </h3>
              <button onClick={() => setShowExerciseSelector(false)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="px-6 py-8 space-y-10 flex-1 overflow-y-auto no-scrollbar">
              <div className="relative">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" placeholder="BUSCAR..." value={selectorSearch}
                  onChange={e => setSelectorSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-50 rounded-3xl text-slate-900 font-black text-sm outline-none focus:border-slate-900 transition-all uppercase tracking-widest"
                />
              </div>

              <div className="space-y-1">
                {filteredCatalog.map((ex, idx) => (
                  <div 
                    key={ex.id} 
                    onClick={() => handleAddOrReplaceExercise(ex)} 
                    className={`flex items-center justify-between py-6 active:bg-slate-50 transition-colors cursor-pointer ${idx !== filteredCatalog.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-white border border-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-3 shrink-0 shadow-sm">
                        <img src={ex.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{ex.name}</h4>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{ex.muscle_group}</p>
                      </div>
                    </div>
                    <div className="text-slate-200">
                      {replacingIndex !== null ? <Replace size={18} /> : <PlusCircle size={18} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutEditor;
