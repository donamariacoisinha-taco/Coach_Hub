
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Exercise, MuscleGroup } from '../types';
import { useNavigation } from '../App';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ScreenState } from './ui/ScreenState';
import { ExerciseSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { 
  ChevronLeft, Search, Dumbbell, Pencil, Trash2, 
  ChevronUp, ChevronDown, Plus, X, Camera, Image as ImageIcon,
  Loader2, Activity
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { current } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  
  const exercisesState = useAsyncState<Exercise[]>([]);
  const muscleGroupsState = useAsyncState<MuscleGroup[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedSide, setSelectedSide] = useState<'all' | 'front' | 'back'>('all');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingMuscle, setEditingMuscle] = useState<Partial<MuscleGroup> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialTab = current.params?.initialTab || 'exercises';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    exercisesState.setLoading(true);
    muscleGroupsState.setLoading(true);
    try {
      const [exRes, mgRes] = await Promise.all([
        supabase.from('exercises').select('*').order('name'),
        supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true })
      ]);
      
      if (exRes.error) throw exRes.error;
      if (mgRes.error) throw mgRes.error;

      if (exRes.data) exercisesState.setData(exRes.data);
      if (mgRes.data) muscleGroupsState.setData(mgRes.data);
    } catch (err) {
      exercisesState.setError(err);
      muscleGroupsState.setError(err);
      showError(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingExercise) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingExercise.id}-${Math.random()}.${fileExt}`;
      const filePath = `exercises/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('exercise-images').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('exercise-images').getPublicUrl(filePath);
      setEditingExercise({ ...editingExercise, image_url: publicUrl });
      showSuccess('Imagem enviada', 'A imagem do exercício foi atualizada.');
    } catch (err: any) {
      showError(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('exercises').update({
        name: editingExercise.name,
        muscle_group: editingExercise.muscle_group,
        instructions: editingExercise.instructions,
        is_active: editingExercise.is_active,
        type: editingExercise.type,
        difficulty_level: editingExercise.difficulty_level,
        image_url: editingExercise.image_url
      }).eq('id', editingExercise.id);
      if (error) throw error;
      exercisesState.setData((exercisesState.data || []).map(ex => ex.id === editingExercise.id ? editingExercise : ex));
      setEditingExercise(null);
      showSuccess('Exercício atualizado', 'As alterações foram salvas com sucesso.');
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMuscleGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMuscle || !editingMuscle.name) return;
    setSaving(true);
    try {
      const muscleGroups = muscleGroupsState.data || [];
      // Se for subgrupo, herda o body_side do novo pai para consistência anatômica
      let side = editingMuscle.body_side || 'front';
      if (editingMuscle.parent_id) {
        const parent = muscleGroups.find(m => m.id === editingMuscle.parent_id);
        if (parent) side = parent.body_side;
      }

      const payload = {
        name: editingMuscle.name,
        body_side: side,
        parent_id: editingMuscle.parent_id || null
      };

      if (editingMuscle.id) {
        const { error } = await supabase.from('muscle_groups').update(payload).eq('id', editingMuscle.id);
        if (error) throw error;
      } else {
        const siblings = muscleGroups.filter(m => m.parent_id === payload.parent_id);
        const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order || 0)) + 1 : 1;
        
        const { error } = await supabase.from('muscle_groups').insert([{ ...payload, sort_order: nextOrder }]);
        if (error) throw error;
      }
      await fetchData();
      setEditingMuscle(null);
      showSuccess('Anatomia salva', 'As configurações musculares foram atualizadas.');
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveMuscle = async (index: number, direction: 'up' | 'down') => {
    const muscleGroups = muscleGroupsState.data || [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= muscleGroups.length) return;

    const currentItem = muscleGroups[index];
    const neighborItem = muscleGroups[targetIndex];

    if (currentItem.parent_id !== neighborItem.parent_id) return;

    muscleGroupsState.setLoading(true);
    try {
      const currentOrder = currentItem.sort_order || 0;
      const neighborOrder = neighborItem.sort_order || 0;

      const { error: err1 } = await supabase.from('muscle_groups').update({ sort_order: neighborOrder }).eq('id', currentItem.id);
      const { error: err2 } = await supabase.from('muscle_groups').update({ sort_order: currentOrder }).eq('id', neighborItem.id);
      
      if (err1 || err2) throw new Error("Falha na reordenação");
      await fetchData();
      if ('vibrate' in navigator) navigator.vibrate(10);
    } catch (err: any) {
      showError(err);
    } finally {
      muscleGroupsState.setLoading(false);
    }
  };

  const handleDeleteExercise = async (ex: Exercise) => {
    if (!confirm(`⚠️ Excluir "${ex.name}" permanentemente?\nEsta ação não pode ser desfeita.`)) return;
    
    setSaving(true);
    try {
      const { error, count } = await supabase
        .from('exercises')
        .delete({ count: 'exact' }) 
        .eq('id', ex.id);
      
      if (error) throw error;
      if (count === 0) throw new Error("Permissão negada.");

      exercisesState.setData((exercisesState.data || []).filter(item => item.id !== ex.id));
      if ('vibrate' in navigator) navigator.vibrate([10, 30]);
      showSuccess('Exercício removido', 'O exercício foi excluído com sucesso.');
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMuscle = async (id: string) => {
    if (!confirm("⚠️ Excluir grupo? Exercícios vinculados podem ficar sem categoria.")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('muscle_groups').delete().eq('id', id);
      if (error) throw error;
      muscleGroupsState.setData((muscleGroupsState.data || []).filter(m => m.id !== id));
      showSuccess('Grupo removido', 'O grupo muscular foi excluído.');
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercisesList = useMemo(() => {
    const exercises = exercisesState.data || [];
    const muscleGroups = muscleGroupsState.data || [];
    return exercises.filter(ex => {
      const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'active' ? ex.is_active : !ex.is_active);
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
      const mg = muscleGroups.find(m => m.name === ex.muscle_group);
      const matchesMuscle = selectedMuscle === 'Todos' || ex.muscle_group === selectedMuscle || (mg?.parent_id && muscleGroups.find(p => p.id === mg.parent_id)?.name === selectedMuscle);
      const matchesSide = selectedSide === 'all' || mg?.body_side === selectedSide;
      return matchesStatus && matchesSearch && matchesMuscle && matchesSide;
    });
  }, [exercisesState.data, statusFilter, searchQuery, selectedMuscle, selectedSide, muscleGroupsState.data]);

  const parentMuscleGroups = useMemo(() => {
    const muscleGroups = muscleGroupsState.data || [];
    return muscleGroups.filter(mg => !mg.parent_id && (selectedSide === 'all' || mg.body_side === selectedSide));
  }, [muscleGroupsState.data, selectedSide]);

  const allPossibleParents = useMemo(() => {
    const muscleGroups = muscleGroupsState.data || [];
    // Apenas grupos sem parent_id podem ser pais
    return muscleGroups.filter(mg => !mg.parent_id);
  }, [muscleGroupsState.data]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col text-slate-900">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-slate-900 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Coach <span className="text-blue-600">Hub</span></h2>
        </div>
      </header>

      <main className="flex-1 px-6 max-w-5xl mx-auto w-full space-y-12 pb-32">
        <nav className="flex gap-8 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('exercises')} 
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'exercises' ? 'text-blue-600' : 'text-slate-300'}`}
          >
            Exercícios
            {activeTab === 'exercises' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('anatomy')} 
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'anatomy' ? 'text-blue-600' : 'text-slate-300'}`}
          >
            Anatomia
            {activeTab === 'anatomy' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
          </button>
        </nav>

        {activeTab === 'exercises' && (
          <div className="space-y-12">
            <div className="space-y-8">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="text" placeholder="BUSCAR NO ACERVO..." value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-full p-5 pl-14 bg-white border border-slate-50 rounded-[2rem] text-slate-900 text-[10px] font-black outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all uppercase tracking-widest" 
                />
              </div>

              <div className="space-y-6">
                <div className="flex gap-6 border-b border-slate-50 pb-4 overflow-x-auto no-scrollbar">
                  {['all', 'front', 'back'].map(side => (
                    <button 
                      key={side} 
                      onClick={() => { setSelectedSide(side as any); setSelectedMuscle('Todos'); }} 
                      className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${selectedSide === side ? 'text-blue-600' : 'text-slate-300'}`}
                    >
                      {side === 'all' ? 'Tudo' : side === 'front' ? 'Anterior' : 'Posterior'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  <button 
                    onClick={() => setSelectedMuscle('Todos')} 
                    className={`px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedMuscle === 'Todos' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}
                  >
                    Todos
                  </button>
                  {parentMuscleGroups.map(mg => (
                    <button 
                      key={mg.id} 
                      onClick={() => setSelectedMuscle(mg.name)} 
                      className={`px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedMuscle === mg.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}
                    >
                      {mg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ScreenState
              state={exercisesState.uiState}
              loadingComponent={<ExerciseSkeleton />}
              onRetry={fetchData}
              emptyTitle="Nenhum exercício"
              emptyDescription="Não encontramos exercícios com os filtros selecionados."
              emptyIcon={<Dumbbell className="w-12 h-12 text-slate-200" />}
            >
              <div className="space-y-1">
                {filteredExercisesList.map((ex, idx) => (
                  <div 
                    key={ex.id} 
                    className={`flex items-center gap-6 py-8 active:bg-slate-50 transition-all ${idx !== filteredExercisesList.length - 1 ? 'border-b border-slate-100' : ''} ${!ex.is_active ? 'opacity-40' : ''}`}
                  >
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] overflow-hidden shrink-0 flex items-center justify-center p-3 border border-slate-50 shadow-sm">
                      {ex.image_url ? <img src={ex.image_url} alt={ex.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <Dumbbell className="w-6 h-6 text-slate-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{ex.name}</h4>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{ex.muscle_group} {!ex.is_active && '(Inativo)'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingExercise(ex)} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExercise(ex)} disabled={saving} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-red-500 transition-colors">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScreenState>
          </div>
        )}

        {activeTab === 'anatomy' && (
          <div className="space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Anatomia</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-2">Organize a hierarquia muscular</p>
              </div>
              <button 
                onClick={() => setEditingMuscle({ name: '', body_side: 'front', parent_id: null })}
                className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                Novo Grupo
              </button>
            </div>

            <ScreenState
              state={muscleGroupsState.uiState}
              loadingComponent={<ExerciseSkeleton />}
              onRetry={fetchData}
              emptyTitle="Anatomia vazia"
              emptyDescription="Comece definindo os grupos musculares principais."
              emptyIcon={<Activity className="w-12 h-12 text-slate-200" />}
            >
              <div className="space-y-1">
                {parentMuscleGroups.map((mg, idx) => (
                  <div key={mg.id} className="space-y-4 py-8 border-b border-slate-100">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-2 text-slate-200">
                          <button onClick={() => handleMoveMuscle((muscleGroupsState.data || []).indexOf(mg), 'up')} className="active:text-blue-600 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => handleMoveMuscle((muscleGroupsState.data || []).indexOf(mg), 'down')} className="active:text-blue-600 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{mg.name}</h4>
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1.5 block">{mg.body_side === 'front' ? 'Anterior' : 'Posterior'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingMuscle({ name: '', body_side: mg.body_side, parent_id: mg.id })} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors" title="Adicionar Subgrupo"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => setEditingMuscle(mg)} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteMuscle(mg.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="ml-14 space-y-1">
                      {(muscleGroupsState.data || []).filter(sub => sub.parent_id === mg.id).map((sub, sIdx) => (
                        <div key={sub.id} className="flex items-center justify-between py-4 group">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col gap-1 text-slate-200">
                                <button onClick={() => handleMoveMuscle((muscleGroupsState.data || []).indexOf(sub), 'up')} className="active:text-blue-600 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                <button onClick={() => handleMoveMuscle((muscleGroupsState.data || []).indexOf(sub), 'down')} className="active:text-blue-600 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                             </div>
                             <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{sub.name}</h5>
                          </div>
                          <div className="flex gap-4">
                             <button onClick={() => setEditingMuscle(sub)} className="text-slate-300 active:text-blue-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                             <button onClick={() => handleDeleteMuscle(sub.id)} className="text-slate-300 active:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScreenState>
          </div>
        )}
      </main>

      {editingMuscle && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[4rem] p-10 space-y-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center">
              {editingMuscle.id ? 'Editar' : 'Criar'} {editingMuscle.parent_id ? 'Subgrupo' : 'Grupo'}
            </h3>
            <form onSubmit={handleSaveMuscleGroup} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Grupo</label>
                <input 
                  type="text" 
                  value={editingMuscle.name || ''} 
                  onChange={e => setEditingMuscle({...editingMuscle, name: e.target.value})} 
                  className="w-full p-5 bg-[#F7F8FA] border border-transparent rounded-[1.5rem] text-slate-900 font-black uppercase outline-none focus:border-blue-600 focus:bg-white transition-all" 
                  required 
                />
              </div>
              
              {!editingMuscle.parent_id ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lado do Corpo</label>
                  <div className="relative">
                    <select 
                      value={editingMuscle.body_side || 'front'} 
                      onChange={e => setEditingMuscle({...editingMuscle, body_side: e.target.value as any})} 
                      className="w-full p-5 bg-[#F7F8FA] border border-transparent rounded-[1.5rem] text-slate-900 font-black outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                    >
                      <option value="front">ANTERIOR (FRENTE)</option>
                      <option value="back">POSTERIOR (COSTAS)</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grupo Principal</label>
                  <div className="relative">
                    <select 
                      value={editingMuscle.parent_id || ''} 
                      onChange={e => setEditingMuscle({...editingMuscle, parent_id: e.target.value})} 
                      className="w-full p-5 bg-[#F7F8FA] border border-transparent rounded-[1.5rem] text-slate-900 font-black outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                    >
                      {allPossibleParents.map(parent => (
                        <option key={parent.id} value={parent.id}>{parent.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                  </div>
                  <p className="text-[9px] font-black text-blue-600 uppercase mt-3 ml-1 opacity-70 italic tracking-widest">* Herda o lado do corpo do novo pai.</p>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4">
                <button type="submit" disabled={saving} className="w-full py-6 bg-blue-600 rounded-[2rem] text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">
                  {saving ? <i className="fas fa-spinner animate-spin"></i> : 'CONFIRMAR'}
                </button>
                <button type="button" onClick={() => setEditingMuscle(null)} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExercise && (
        <div className="fixed inset-0 z-[1300] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 pt-12 pb-8 flex justify-between items-center bg-white border-b border-slate-50">
            <div><h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Editar Movimento</h3></div>
            <button onClick={() => setEditingExercise(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
          </header>
          <form onSubmit={handleUpdateExercise} className="flex-1 overflow-y-auto p-6 space-y-12 no-scrollbar bg-[#F7F8FA]">
            <div className="flex flex-col items-center gap-8 bg-white p-10 rounded-[3rem] border border-slate-50 shadow-2xl shadow-slate-200/50">
              <div onClick={() => fileInputRef.current?.click()} className="relative w-40 h-40 bg-[#F7F8FA] rounded-[2rem] overflow-hidden shrink-0 flex items-center justify-center p-4 border border-slate-50 cursor-pointer group transition-all">
                {editingExercise.image_url ? <img src={editingExercise.image_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <ImageIcon className="w-10 h-10 text-slate-200" />}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity"><Camera className="w-6 h-6 mb-2" /><span className="text-[9px] font-black uppercase tracking-widest">Alterar</span></div>
                {uploadingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              <div className="w-full space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">URL da Imagem</label>
                <input type="url" value={editingExercise.image_url || ''} onChange={e => setEditingExercise({...editingExercise, image_url: e.target.value})} className="w-full p-5 bg-[#F7F8FA] border border-transparent rounded-[1.5rem] text-slate-900 font-black text-[10px] outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="URL Direta" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Exercício</label>
              <input type="text" value={editingExercise.name} onChange={e => setEditingExercise({...editingExercise, name: e.target.value})} className="w-full p-5 bg-white border border-slate-50 rounded-[1.5rem] text-slate-900 font-black outline-none uppercase focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grupo Muscular</label>
                <input type="text" value={editingExercise.muscle_group} onChange={e => setEditingExercise({...editingExercise, muscle_group: e.target.value})} className="w-full p-5 bg-white border border-slate-50 rounded-[1.5rem] text-slate-900 font-black outline-none uppercase focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all" required />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Equipamento</label>
                <div className="relative">
                  <select value={editingExercise.type} onChange={e => setEditingExercise({...editingExercise, type: e.target.value})} className="w-full p-5 bg-white border border-slate-50 rounded-[1.5rem] text-slate-900 font-black outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all appearance-none">
                    <option value="machine">MÁQUINA</option>
                    <option value="free_weight">PESO LIVRE</option>
                    <option value="bodyweight">PESO CORPORAL</option>
                    <option value="cable">CABO / POLIA</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Protocolo (Instruções)</label>
              <textarea rows={6} value={editingExercise.instructions || ''} onChange={e => setEditingExercise({...editingExercise, instructions: e.target.value})} className="w-full p-6 bg-white border border-slate-50 rounded-[2rem] text-slate-900 font-medium text-sm outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all leading-relaxed" placeholder="biomecânica correta..." />
            </div>
            <div className="h-20"></div>
          </form>
          <footer className="px-6 py-10 border-t border-slate-50 bg-white pb-safe">
            <button onClick={handleUpdateExercise} disabled={saving} className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-4">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SINCRONIZAR ALTERAÇÕES'}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
