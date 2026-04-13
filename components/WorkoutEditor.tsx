
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

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative text-white">
      <header className="sticky top-0 z-[100] px-6 pt-10 pb-5 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5">
            <i className="fas fa-chevron-left"></i>
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter truncate max-w-[150px]">{workoutId ? 'Editar Treino' : 'Nova Ficha'}</h2>
        </div>
        <button 
          onClick={() => setShowSaveModal(true)} 
          disabled={saving} 
          className="px-6 py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          {saving ? <i className="fas fa-spinner animate-spin"></i> : 'SALVAR'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full pb-40">
        <section className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 space-y-4">
          <input 
            type="text" placeholder="NOME DO TREINO" value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl font-black text-sm outline-none focus:border-blue-500 transition-all uppercase" 
          />
          <select 
            value={folderId} onChange={e => setFolderId(e.target.value)} 
            className="w-full p-4 bg-slate-950 border border-white/5 rounded-2xl font-bold text-sm outline-none"
          >
            <option value="">SELECIONAR PASTA</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>)}
          </select>
        </section>

        <div className="space-y-4">
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
              className={`bg-slate-900/60 p-4 rounded-3xl border border-white/5 flex items-center gap-4 transition-all ${draggedIndex === idx ? 'opacity-30 scale-95' : ''}`}
            >
              <div className="flex flex-col gap-2 text-slate-600">
                <button onClick={() => handleReorder(idx, idx - 1)} className="hover:text-blue-500"><i className="fas fa-caret-up"></i></button>
                <div className="cursor-grab active:cursor-grabbing"><i className="fas fa-grip-vertical"></i></div>
                <button onClick={() => handleReorder(idx, idx + 1)} className="hover:text-blue-500"><i className="fas fa-caret-down"></i></button>
              </div>

              <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                <img src={ex.exercise_image || 'https://via.placeholder.com/100'} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black uppercase text-xs truncate">{ex.exercise_name}</h4>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{ex.sets_json?.length || 3} Séries</p>
              </div>

              <div className="flex gap-2">
                {/* ÍCONE DE EDIÇÃO DE PARÂMETROS (SÉRIES) */}
                <button 
                  onClick={() => setEditingSetsIndex(idx)}
                  className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl border border-white/5 active:scale-90"
                  title="Ajustar Reps/Peso"
                >
                  <i className="fas fa-sliders-h text-xs"></i>
                </button>
                <button 
                  onClick={() => { setReplacingIndex(idx); setShowExerciseSelector(true); }}
                  className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 active:scale-90"
                  title="Substituir Exercício"
                >
                  <i className="fas fa-exchange-alt text-xs"></i>
                </button>
                <button onClick={() => setExercises(prev => prev.filter(e => e.tempId !== ex.tempId))} className="w-10 h-10 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 active:scale-90">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => { setReplacingIndex(null); setShowExerciseSelector(true); }} className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-blue-500 transition-all">
             <i className="fas fa-plus-circle text-2xl"></i>
             <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Movimento</span>
          </button>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE SÉRIES (FINE-TUNING) */}
      {editingSetsIndex !== null && (
        <div className="fixed inset-0 z-[600] bg-slate-950/98 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
           <header className="p-8 pt-12 flex justify-between items-center border-b border-white/5">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Ajuste Técnico</h3>
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Configurando {exercises[editingSetsIndex].exercise_name}</p>
              </div>
              <button onClick={() => setEditingSetsIndex(null)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5"><i className="fas fa-times"></i></button>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
              <div className="space-y-4">
                {exercises[editingSetsIndex].sets_json?.map((set, sIdx) => (
                  <div key={sIdx} className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Série {sIdx + 1}</span>
                       <button 
                        onClick={() => {
                          const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                          newSets.splice(sIdx, 1);
                          handleUpdateSets(editingSetsIndex!, newSets);
                        }}
                        className="text-red-500 text-[10px] font-black uppercase"
                       >Remover</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase ml-1">Peso (kg)</label>
                          <input 
                            type="number" value={set.weight} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].weight = parseFloat(e.target.value) || 0;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-slate-950 p-3 rounded-xl text-center font-black text-blue-500 outline-none border border-white/5 focus:border-blue-500" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase ml-1">Reps</label>
                          <input 
                            type="text" value={set.reps} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].reps = e.target.value;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-slate-950 p-3 rounded-xl text-center font-black text-white outline-none border border-white/5 focus:border-blue-500" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase ml-1">Rest (s)</label>
                          <input 
                            type="number" value={set.rest_time} 
                            onChange={(e) => {
                              const newSets = [...(exercises[editingSetsIndex!].sets_json || [])];
                              newSets[sIdx].rest_time = parseInt(e.target.value) || 0;
                              handleUpdateSets(editingSetsIndex!, newSets);
                            }}
                            className="w-full bg-slate-950 p-3 rounded-xl text-center font-black text-orange-400 outline-none border border-white/5 focus:border-blue-500" 
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
                className="w-full py-4 border border-dashed border-slate-800 rounded-2xl text-[9px] font-black uppercase text-slate-500"
              >+ Adicionar Série</button>
           </div>
           
           <footer className="p-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md pb-12">
              <button 
                onClick={() => setEditingSetsIndex(null)}
                className="w-full py-5 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-xs tracking-widest shadow-2xl"
              >Confirmar Ajustes</button>
           </footer>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-sm bg-slate-900 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-4">
                <i className="fas fa-save text-2xl"></i>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Confirmar Alterações?</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Deseja que essas edições sejam permanentes para os próximos treinos?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleSave(true)} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20">Sim, tornar permanente</button>
              <button onClick={() => handleSave(false)} className="w-full py-5 bg-slate-800 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest border border-white/5">Não, apenas para agora</button>
              <button onClick={() => setShowSaveModal(false)} className="w-full py-4 text-slate-500 font-black uppercase text-[9px] tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showExerciseSelector && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center mb-6 pt-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter">
              {replacingIndex !== null ? 'Substituir Por...' : 'Acervo de Elite'}
            </h3>
            <button onClick={() => setShowExerciseSelector(false)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 active:scale-90"><i className="fas fa-times"></i></button>
          </header>

          <div className="space-y-4 mb-6 sticky top-0 z-10 bg-slate-950 pb-2">
            <input 
              type="text" placeholder="BUSCAR EXERCÍCIO..." value={selectorSearch}
              onChange={e => setSelectorSearch(e.target.value)}
              className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl text-white text-[10px] font-black outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-20">
            {filteredCatalog.map(ex => (
              <div key={ex.id} onClick={() => handleAddOrReplaceExercise(ex)} className="p-4 bg-slate-900 border border-white/5 rounded-3xl flex items-center gap-4 active:scale-95 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                  <img src={ex.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black uppercase truncate">{ex.name}</h4>
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{ex.muscle_group}</p>
                </div>
                <i className={`fas ${replacingIndex !== null ? 'fa-exchange-alt' : 'fa-plus-circle'} text-blue-500 opacity-40`}></i>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutEditor;
