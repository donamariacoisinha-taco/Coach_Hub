
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { adminApi } from '../lib/api/adminApi';
import { Exercise, MuscleGroup } from '../types';
import { useNavigation } from '../App';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ScreenState } from './ui/ScreenState';
import { ExerciseSkeleton } from './ui/Skeleton';
import { useSmartQuery } from '../hooks/useSmartQuery';
import ExerciseAdminPro from './ExerciseAdminPro';
import BulkCreateModal from './BulkCreateModal';
import { 
  ChevronLeft, Search, Dumbbell, Pencil, Trash2, 
  ChevronUp, ChevronDown, Plus, X, Camera, Image as ImageIcon,
  Loader2, Activity, Play, Zap
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { current } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedSide, setSelectedSide] = useState<'all' | 'front' | 'back'>('all');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingMuscle, setEditingMuscle] = useState<Partial<MuscleGroup> | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialTab = current.params?.initialTab || 'exercises';
  const [activeTab, setActiveTab] = useState(initialTab);

  const adminQuery = useSmartQuery('admin_data', async () => {
    return adminApi.getAdminData();
  }, {
    revalidateOnFocus: true
  });

  const { data, status, isFetching, refresh, mutate } = adminQuery;
  const exercises = data?.exercises || [];
  const muscleGroups = data?.muscleGroups || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingExercise) return;
    setUploadingImage(true);
    try {
      const publicUrl = await adminApi.uploadExerciseImage(file, editingExercise.id);
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
      await adminApi.updateExercise(editingExercise.id, {
        name: editingExercise.name,
        muscle_group: editingExercise.muscle_group,
        instructions: editingExercise.instructions,
        is_active: editingExercise.is_active,
        type: editingExercise.type,
        difficulty_level: editingExercise.difficulty_level,
        image_url: editingExercise.image_url
      });
      if (data) {
        mutate({
          ...data,
          exercises: data.exercises.map(ex => ex.id === editingExercise.id ? editingExercise : ex)
        });
      }
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
        await adminApi.updateMuscleGroup(editingMuscle.id, payload);
      } else {
        const siblings = muscleGroups.filter(m => m.parent_id === payload.parent_id);
        const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order || 0)) + 1 : 1;
        
        await adminApi.createMuscleGroup({ ...payload, sort_order: nextOrder });
      }
      await refresh();
      setEditingMuscle(null);
      showSuccess('Anatomia salva', 'As configurações musculares foram atualizadas.');
    } catch (err: any) {
      showError(err);
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

    setSaving(true);
    try {
      const currentOrder = currentItem.sort_order || 0;
      const neighborOrder = neighborItem.sort_order || 0;

      await adminApi.reorderMuscleGroups([
        { id: currentItem.id, sort_order: neighborOrder },
        { id: neighborItem.id, sort_order: currentOrder }
      ]);
      
      await refresh();
      if ('vibrate' in navigator) navigator.vibrate(10);
    } catch (err: any) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (ex: Exercise) => {
    if (!confirm(`⚠️ Excluir "${ex.name}" permanentemente?\nEsta ação não pode ser desfeita.`)) return;
    
    setSaving(true);
    try {
      await adminApi.deleteExercise(ex.id);

      if (data) {
        mutate({
          ...data,
          exercises: data.exercises.filter(item => item.id !== ex.id)
        });
      }
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
      await adminApi.deleteMuscleGroup(id);
      if (data) {
        mutate({
          ...data,
          muscleGroups: data.muscleGroups.filter(m => m.id !== id)
        });
      }
      showSuccess('Grupo removido', 'O grupo muscular foi excluído.');
    } catch (err: any) {
      showError(err);
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

  const handleCreateExercise = () => {
    const newEx: Exercise = {
      id: `temp-${Date.now()}`,
      name: '',
      muscle_group: selectedMuscle !== 'Todos' ? selectedMuscle : (parentMuscleGroups[0]?.name || 'Peito'),
      muscle_group_id: parentMuscleGroups.find(m => m.name === selectedMuscle)?.id || parentMuscleGroups[0]?.id || '',
      type: 'free_weight',
      instructions: '',
      is_active: true,
      difficulty_level: 'beginner',
      image_url: ''
    };
    setEditingExercise(newEx);
  };

  const allPossibleParents = useMemo(() => {
    // Apenas grupos sem parent_id podem ser pais
    return muscleGroups.filter(mg => !mg.parent_id);
  }, [muscleGroups]);

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
            <div className="flex justify-between items-end">
              <div className="flex-1 mr-6">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    type="text" placeholder="BUSCAR NO ACERVO..." value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full p-5 pl-14 bg-white border border-slate-50 rounded-[2rem] text-slate-900 text-[10px] font-black outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all uppercase tracking-widest" 
                  />
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button 
                  onClick={() => setShowBulkCreate(true)}
                  className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 active:text-slate-900 transition-all shadow-sm"
                  title="Criação em Lote"
                >
                  <Zap size={24} />
                </button>
                <button 
                  onClick={handleCreateExercise}
                  className="px-8 py-5 bg-slate-900 rounded-2xl font-black text-[10px] text-white uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all mb-1"
                >
                  Novo Movimento
                </button>
              </div>
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

            <ScreenState
              status={status}
              isFetching={isFetching}
              skeleton={<ExerciseSkeleton />}
              onRetry={refresh}
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
              status={status}
              isFetching={isFetching}
              skeleton={<ExerciseSkeleton />}
              onRetry={refresh}
            >
              <div className="space-y-1">
                {parentMuscleGroups.map((mg, idx) => (
                  <div key={mg.id} className="space-y-4 py-8 border-b border-slate-100">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-2 text-slate-200">
                          <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(mg), 'up')} className="active:text-blue-600 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(mg), 'down')} className="active:text-blue-600 transition-colors"><ChevronDown className="w-4 h-4" /></button>
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
                      {muscleGroups.filter(sub => sub.parent_id === mg.id).map((sub, sIdx) => (
                        <div key={sub.id} className="flex items-center justify-between py-4 group">
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col gap-1 text-slate-200">
                                <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(sub), 'up')} className="active:text-blue-600 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                <button onClick={() => handleMoveMuscle(muscleGroups.indexOf(sub), 'down')} className="active:text-blue-600 transition-colors"><ChevronDown className="w-3 h-3" /></button>
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
        <ExerciseAdminPro 
          exercise={editingExercise}
          muscleGroups={muscleGroups}
          onBack={() => setEditingExercise(null)}
          onSave={async (updated) => {
            if (updated.id.startsWith('temp-')) {
               await refresh();
            } else {
              if (data) {
                mutate({
                  ...data,
                  exercises: data.exercises.map(ex => ex.id === updated.id ? updated : ex)
                });
              }
            }
            setEditingExercise(null);
          }}
          onDelete={handleDeleteExercise}
        />
      )}

      {showBulkCreate && (
        <BulkCreateModal 
          muscleGroups={muscleGroups}
          onClose={() => setShowBulkCreate(false)}
          onSuccess={() => {
            setShowBulkCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default AdminPanel;
