
import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutExercise, Exercise, SetConfig, WorkoutFolder, MuscleGroup, SetType } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';

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

  // Estados para edição de séries (Fine-tuning)
  const [editingSetsIndex, setEditingSetsIndex] = useState<number | null>(null);

  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorMuscle, setSelectorMuscle] = useState('Todos');
  const [selectorSide, setSelectorSide] = useState<'all' | 'front' | 'back'>('all');

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

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    const newExs = [...exercises];
    const [movedItem] = newExs.splice(fromIndex, 1);
    newExs.splice(toIndex, 0, movedItem);
    setExercises(newExs);
    if ('vibrate' in navigator) navigator.vibrate(5);
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
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando Editor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col relative text-slate-900">
      <header className="px-6 pt-12 pb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => goBack()} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-slate-900 transition-all">
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900">{workoutId ? 'Editar Treino' : 'Nova Ficha'}</h2>
        </div>
        <button 
          onClick={() => setShowSaveModal(true)} 
          disabled={saving} 
          className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all text-white"
        >
          {saving ? <i className="fas fa-spinner animate-spin"></i> : 'SALVAR'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-12 max-w-4xl mx-auto w-full pb-40">
        <section className="space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Identificação</label>
            <input 
              type="text" placeholder="NOME DO TREINO" value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-5 bg-white border border-slate-50 rounded-[1.5rem] font-black text-sm outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all text-slate-900" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Pasta / Categoria</label>
            <div className="relative">
              <select 
                value={folderId} onChange={e => setFolderId(e.target.value)} 
                className="w-full p-5 bg-white border border-slate-50 rounded-[1.5rem] font-black text-sm outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all text-slate-900 appearance-none"
              >
                <option value="">SELECIONAR PASTA</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
            </div>
          </div>
        </section>

        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Estrutura do Treino</p>
          {exercises.map((ex, idx) => (
            <div 
              key={ex.tempId}
              draggable
              onDragStart={() => setDraggedIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedIndex !== null && draggedIndex !== idx) {
                  handleReorder(draggedIndex, idx);
                  setDraggedIndex(null);
                }
              }}
              className={`flex items-center gap-6 py-8 active:bg-slate-50 transition-all ${idx !== exercises.length - 1 ? 'border-b border-slate-100' : ''} ${draggedIndex === idx ? 'opacity-30 scale-95' : ''}`}
            >
              <div className="flex flex-col gap-3 text-slate-200">
                <button onClick={() => handleReorder(idx, idx - 1)} className="active:text-blue-600"><i className="fas fa-caret-up"></i></button>
                <div className="cursor-grab active:cursor-grabbing"><i className="fas fa-grip-vertical"></i></div>
                <button onClick={() => handleReorder(idx, idx + 1)} className="active:text-blue-600"><i className="fas fa-caret-down"></i></button>
              </div>

              <div className="w-16 h-16 bg-white rounded-[1.5rem] overflow-hidden shrink-0 flex items-center justify-center p-3 border border-slate-50 shadow-sm">
                <img src={ex.exercise_image || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-lg tracking-tighter text-slate-900 truncate pr-4 uppercase">{ex.exercise_name}</h4>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{ex.sets_json?.length || 3} Séries Configuradas</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingSetsIndex(idx)}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"
                >
                  <i className="fas fa-sliders-h"></i>
                </button>
                <button 
                  onClick={() => { setReplacingIndex(idx); setShowExerciseSelector(true); }}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"
                >
                  <i className="fas fa-exchange-alt"></i>
                </button>
                <button 
                  onClick={() => setExercises(prev => prev.filter(e => e.tempId !== ex.tempId))} 
                  className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-red-500 transition-colors"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => { setReplacingIndex(null); setShowExerciseSelector(true); }} 
            className="w-full py-12 mt-10 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-200 active:text-blue-600 active:border-blue-100 transition-all bg-white/30"
          >
             <i className="fas fa-plus-circle text-3xl"></i>
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Adicionar Movimento</span>
          </button>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE SÉRIES (FINE-TUNING) */}
      {editingSetsIndex !== null && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="px-6 pt-12 pb-8 flex justify-between items-center border-b border-slate-50">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Ajuste Técnico</h3>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{exercises[editingSetsIndex].exercise_name}</p>
              </div>
              <button onClick={() => setEditingSetsIndex(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
              <div className="space-y-4">
                {exercises[editingSetsIndex].sets_json?.map((set, sIdx) => (
                  <div key={sIdx} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-2xl shadow-slate-200/50 space-y-8">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Série {sIdx + 1}</span>
                       <button 
                        onClick={() => {
                          const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                          newSets.splice(sIdx, 1);
                          handleUpdateSets(editingSetsIndex!, newSets);
                        }}
                        className="text-red-500 text-[10px] font-black uppercase tracking-widest"
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
                            className="w-full bg-[#F7F8FA] p-4 rounded-2xl text-center font-black text-blue-600 outline-none border border-transparent focus:border-blue-600 focus:bg-white transition-all" 
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
                            className="w-full bg-[#F7F8FA] p-4 rounded-2xl text-center font-black text-slate-900 outline-none border border-transparent focus:border-blue-600 focus:bg-white transition-all" 
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
                            className="w-full bg-[#F7F8FA] p-4 rounded-2xl text-center font-black text-orange-500 outline-none border border-transparent focus:border-blue-600 focus:bg-white transition-all" 
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
                className="w-full py-6 border-2 border-dashed border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 active:text-blue-600 transition-all"
              >+ Adicionar Série</button>
           </div>
           
           <footer className="px-6 py-10 border-t border-slate-50 bg-white pb-safe">
              <button 
                onClick={() => setEditingSetsIndex(null)}
                className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
              >Confirmar Ajustes</button>
           </footer>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[4rem] p-10 space-y-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-4">
                <i className="fas fa-save text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Salvar Alterações?</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[250px] mx-auto">Deseja que essas edições sejam permanentes para os próximos treinos?</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => handleSave(true)} className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">Sim, tornar permanente</button>
              <button onClick={() => handleSave(false)} className="w-full py-6 bg-slate-100 rounded-[2rem] font-black text-slate-600 uppercase text-[10px] tracking-[0.2em] active:bg-slate-200 transition-all">Não, apenas para agora</button>
              <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showExerciseSelector && (
        <div className="fixed inset-0 z-[1200] bg-[#F7F8FA] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 pt-12 pb-8 flex justify-between items-center bg-white border-b border-slate-50">
            <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
              {replacingIndex !== null ? 'Substituir' : 'Biblioteca'}
            </h3>
            <button onClick={() => setShowExerciseSelector(false)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
          </header>

          <div className="px-6 py-8 space-y-10 flex-1 overflow-y-auto no-scrollbar">
            <div className="relative">
              <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input 
                type="text" placeholder="BUSCAR EXERCÍCIO..." value={selectorSearch}
                onChange={e => setSelectorSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-50 rounded-[2rem] text-slate-900 font-black text-sm outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all"
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
                    <div className="w-14 h-14 bg-white border border-slate-50 rounded-[1.5rem] overflow-hidden flex items-center justify-center p-3 shrink-0 shadow-sm">
                      <img src={ex.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{ex.name}</h4>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{ex.muscle_group}</p>
                    </div>
                  </div>
                  <i className={`fas ${replacingIndex !== null ? 'fa-exchange-alt' : 'fa-plus-circle'} text-blue-600 opacity-20 text-lg`}></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutEditor;
