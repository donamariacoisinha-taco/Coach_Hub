
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Exercise, MuscleGroup } from '../types';
import { useNavigation } from '../App';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { current } = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const [exRes, mgRes] = await Promise.all([
        supabase.from('exercises').select('*').order('name'),
        supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true })
      ]);
      
      if (exRes.data) setExercises(exRes.data);
      if (mgRes.data) setMuscleGroups(mgRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      alert("Erro ao subir imagem: " + err.message);
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
      setExercises(prev => prev.map(ex => ex.id === editingExercise.id ? editingExercise : ex));
      setEditingExercise(null);
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMuscleGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMuscle || !editingMuscle.name) return;
    setSaving(true);
    try {
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
    } catch (err: any) {
      alert("Erro ao salvar anatomia: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveMuscle = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= muscleGroups.length) return;

    const currentItem = muscleGroups[index];
    const neighborItem = muscleGroups[targetIndex];

    if (currentItem.parent_id !== neighborItem.parent_id) return;

    setLoading(true);
    try {
      const currentOrder = currentItem.sort_order || 0;
      const neighborOrder = neighborItem.sort_order || 0;

      const { error: err1 } = await supabase.from('muscle_groups').update({ sort_order: neighborOrder }).eq('id', currentItem.id);
      const { error: err2 } = await supabase.from('muscle_groups').update({ sort_order: currentOrder }).eq('id', neighborItem.id);
      
      if (err1 || err2) throw new Error("Falha na reordenação");
      await fetchData();
      if ('vibrate' in navigator) navigator.vibrate(10);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
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

      setExercises(prev => prev.filter(item => item.id !== ex.id));
      if ('vibrate' in navigator) navigator.vibrate([10, 30]);
    } catch (err: any) {
      alert("Falha ao remover: " + err.message);
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
      setMuscleGroups(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercisesList = useMemo(() => {
    return exercises.filter(ex => {
      const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'active' ? ex.is_active : !ex.is_active);
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
      const mg = muscleGroups.find(m => m.name === ex.muscle_group);
      const matchesMuscle = selectedMuscle === 'Todos' || ex.muscle_group === selectedMuscle || (mg?.parent_id && muscleGroups.find(p => p.id === mg.parent_id)?.name === selectedMuscle);
      const matchesSide = selectedSide === 'all' || mg?.body_side === selectedSide;
      return matchesStatus && matchesSearch && matchesMuscle && matchesSide;
    });
  }, [exercises, statusFilter, searchQuery, selectedMuscle, selectedSide, muscleGroups]);

  const parentMuscleGroups = useMemo(() => {
    return muscleGroups.filter(mg => !mg.parent_id && (selectedSide === 'all' || mg.body_side === selectedSide));
  }, [muscleGroups, selectedSide]);

  const allPossibleParents = useMemo(() => {
    // Apenas grupos sem parent_id podem ser pais
    return muscleGroups.filter(mg => !mg.parent_id);
  }, [muscleGroups]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-white/5">
            <i className="fas fa-chevron-left"></i>
          </button>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Coach Hub <span className="text-red-600">Admin</span></h2>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8 pb-32">
        <nav className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 max-w-sm shadow-inner">
          <button onClick={() => setActiveTab('exercises')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'exercises' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Exercícios</button>
          <button onClick={() => setActiveTab('anatomy')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'anatomy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Anatomia</button>
        </nav>

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="space-y-6 mb-10">
                <div className="relative group">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-500"></i>
                  <input type="text" placeholder="BUSCAR NO ACERVO..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl text-white text-[10px] font-black outline-none focus:border-blue-500/50 transition-all uppercase tracking-[0.2em]" />
                </div>

                <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                    {['all', 'front', 'back'].map(side => (
                      <button key={side} onClick={() => { setSelectedSide(side as any); setSelectedMuscle('Todos'); }} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedSide === side ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{side === 'all' ? 'Tudo' : side === 'front' ? 'Anterior' : 'Posterior'}</button>
                    ))}
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => setSelectedMuscle('Todos')} className={`px-5 py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedMuscle === 'Todos' ? 'bg-white text-slate-900 border-white' : 'bg-slate-900 text-slate-500 border-white/5'}`}>Todos</button>
                    {parentMuscleGroups.map(mg => (
                      <button key={mg.id} onClick={() => setSelectedMuscle(mg.name)} className={`px-5 py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedMuscle === mg.name ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-slate-900 text-slate-500 border-white/5'}`}>{mg.name}</button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExercisesList.map(ex => (
                    <div key={ex.id} className={`bg-slate-950/40 p-5 rounded-3xl border border-white/5 flex items-center gap-5 group transition-all ${!ex.is_active ? 'opacity-60' : 'hover:border-blue-500/30'}`}>
                      <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-2">
                        {ex.image_url ? <img src={ex.image_url} alt={ex.name} className="w-full h-full object-contain" /> : <i className="fas fa-dumbbell text-slate-200"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-white uppercase truncate">{ex.name}</h4>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{ex.muscle_group} {!ex.is_active && '(Inativo)'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingExercise(ex)} className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/10 active:scale-90 transition-all"><i className="fas fa-pencil-alt text-[10px]"></i></button>
                        <button onClick={() => handleDeleteExercise(ex)} disabled={saving} className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/10 active:scale-90 transition-all">
                          {saving ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash-alt text-[10px]"></i>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'anatomy' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Gestão Anatômica</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Organize grupos e subgrupos musculares</p>
                </div>
                <button 
                  onClick={() => setEditingMuscle({ name: '', body_side: 'front', parent_id: null })}
                  className="px-6 py-3 bg-blue-600 rounded-xl font-black text-[10px] text-white uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Novo Grupo
                </button>
              </div>

              <div className="space-y-4">
                {parentMuscleGroups.length === 0 && !loading && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Nenhum grupo encontrado</p>
                  </div>
                )}
                
                {parentMuscleGroups.map((mg, idx) => (
                  <div key={mg.id} className="space-y-3">
                    <div className="bg-slate-950/60 p-5 rounded-3xl border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(mg), 'up')} className="text-slate-700 hover:text-blue-500 transition-colors"><i className="fas fa-chevron-up text-[10px]"></i></button>
                          <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(mg), 'down')} className="text-slate-700 hover:text-blue-500 transition-colors"><i className="fas fa-chevron-down text-[10px]"></i></button>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-tight">{mg.name}</h4>
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{mg.body_side === 'front' ? 'Anterior' : 'Posterior'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingMuscle({ name: '', body_side: mg.body_side, parent_id: mg.id })} className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/10 active:scale-90 transition-all" title="Adicionar Subgrupo"><i className="fas fa-plus text-[10px]"></i></button>
                        <button onClick={() => setEditingMuscle(mg)} className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 border border-white/5 active:scale-90 transition-all"><i className="fas fa-pencil-alt text-[10px]"></i></button>
                        <button onClick={() => handleDeleteMuscle(mg.id)} className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 border border-red-500/10 active:scale-90 transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                      </div>
                    </div>

                    <div className="ml-10 space-y-2 border-l-2 border-white/5 pl-4">
                      {muscleGroups.filter(sub => sub.parent_id === mg.id).map((sub, sIdx) => (
                        <div key={sub.id} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                             <div className="flex flex-col gap-0.5">
                                <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(sub), 'up')} className="text-slate-700 hover:text-blue-500 transition-colors"><i className="fas fa-caret-up text-[10px]"></i></button>
                                <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(sub), 'down')} className="text-slate-700 hover:text-blue-500 transition-colors"><i className="fas fa-caret-down text-[10px]"></i></button>
                             </div>
                             <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sub.name}</h5>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setEditingMuscle(sub)} className="text-slate-600 hover:text-blue-500 transition-colors"><i className="fas fa-pencil-alt text-[9px]"></i></button>
                             <button onClick={() => handleDeleteMuscle(sub.id)} className="text-slate-600 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[9px]"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {editingMuscle && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">
              {editingMuscle.id ? 'Editar' : 'Criar'} {editingMuscle.parent_id ? 'Subgrupo' : 'Grupo'}
            </h3>
            <form onSubmit={handleSaveMuscleGroup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                <input 
                  type="text" 
                  value={editingMuscle.name || ''} 
                  onChange={e => setEditingMuscle({...editingMuscle, name: e.target.value})} 
                  className="w-full p-4 bg-slate-950 border border-white/5 rounded-xl text-white font-bold uppercase outline-none focus:border-blue-500 transition-all" 
                  required 
                />
              </div>
              
              {!editingMuscle.parent_id ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lado do Corpo</label>
                  <select 
                    value={editingMuscle.body_side || 'front'} 
                    onChange={e => setEditingMuscle({...editingMuscle, body_side: e.target.value as any})} 
                    className="w-full p-4 bg-slate-950 border border-white/5 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="front">ANTERIOR (FRENTE)</option>
                    <option value="back">POSTERIOR (COSTAS)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grupo Principal (Migrar)</label>
                  <select 
                    value={editingMuscle.parent_id || ''} 
                    onChange={e => setEditingMuscle({...editingMuscle, parent_id: e.target.value})} 
                    className="w-full p-4 bg-slate-950 border border-white/5 rounded-xl text-white font-bold outline-none"
                  >
                    {allPossibleParents.map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <p className="text-[8px] font-black text-blue-500 uppercase mt-2 ml-1 opacity-70 italic">* Herda o lado do corpo do novo pai.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingMuscle(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-blue-600 rounded-xl text-white font-black uppercase text-[10px] shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  {saving ? <i className="fas fa-spinner animate-spin"></i> : 'CONFIRMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExercise && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-6 pt-12 flex justify-between items-center shrink-0 border-b border-white/5">
            <div><h3 className="text-2xl font-black uppercase tracking-tighter text-white">Editar Movimento</h3></div>
            <button onClick={() => setEditingExercise(null)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all"><i className="fas fa-times"></i></button>
          </header>
          <form onSubmit={handleUpdateExercise} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-900/50 p-6 rounded-3xl border border-white/5">
              <div onClick={() => fileInputRef.current?.click()} className="relative w-32 h-32 bg-white rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-2xl cursor-pointer group hover:ring-4 ring-blue-500/30 transition-all">
                {editingExercise.image_url ? <img src={editingExercise.image_url} className="w-full h-full object-contain" /> : <i className="fas fa-image text-slate-200 text-3xl"></i>}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity"><i className="fas fa-camera mb-1"></i><span className="text-[8px] font-black uppercase">Alterar</span></div>
                {uploadingImage && <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center"><i className="fas fa-spinner animate-spin text-blue-500"></i></div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              <input type="url" value={editingExercise.image_url || ''} onChange={e => setEditingExercise({...editingExercise, image_url: e.target.value})} className="flex-1 w-full p-4 bg-slate-950 border border-white/5 rounded-xl text-white font-medium text-[10px] outline-none" placeholder="URL Direta da Imagem" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
              <input type="text" value={editingExercise.name} onChange={e => setEditingExercise({...editingExercise, name: e.target.value})} className="w-full p-5 bg-slate-900 border border-white/5 rounded-2xl text-white font-bold outline-none uppercase" required />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grupo Muscular</label>
                <input type="text" value={editingExercise.muscle_group} onChange={e => setEditingExercise({...editingExercise, muscle_group: e.target.value})} className="w-full p-5 bg-slate-900 border border-white/5 rounded-2xl text-white font-bold outline-none uppercase" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Equipamento</label>
                <select value={editingExercise.type} onChange={e => setEditingExercise({...editingExercise, type: e.target.value})} className="w-full p-5 bg-slate-900 border border-white/5 rounded-2xl text-white font-bold outline-none">
                  <option value="machine">MÁQUINA</option>
                  <option value="free_weight">PESO LIVRE</option>
                  <option value="bodyweight">PESO CORPORAL</option>
                  <option value="cable">CABO / POLIA</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocolo (Instruções)</label>
              <textarea rows={4} value={editingExercise.instructions || ''} onChange={e => setEditingExercise({...editingExercise, instructions: e.target.value})} className="w-full p-5 bg-slate-900 border border-white/5 rounded-2xl text-white font-medium text-sm outline-none" placeholder="biomecânica correta..." />
            </div>
            <div className="h-20"></div>
          </form>
          <footer className="p-6 border-t border-white/5 bg-slate-950 shrink-0 pb-10">
            <button onClick={handleUpdateExercise} disabled={saving} className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
              {saving ? <i className="fas fa-spinner animate-spin"></i> : 'SINCRONIZAR ALTERAÇÕES'}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
