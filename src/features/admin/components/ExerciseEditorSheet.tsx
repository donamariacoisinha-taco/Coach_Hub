
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Trash2, 
  Sparkles, 
  Dumbbell, 
  Play, 
  ImageIcon, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Wand2,
  Copy,
  Plus,
  Loader2
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

import { AssetMediaHub } from './media/AssetMediaHub';

const ExerciseEditorSheet: React.FC = () => {
  const { 
    isEditorOpen, 
    closeEditor, 
    selectedExercise, 
    updateExercise, 
    createExercise, 
    deleteExercise,
    muscleGroups,
    exercises // Make sure exercises is available if needed, or fetch fresh
  } = useAdminStore();
  
  const [formData, setFormData] = useState<Partial<Exercise>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'media'>('basic');

  useEffect(() => {
    if (selectedExercise) {
      setFormData(selectedExercise);
    } else {
      setFormData({
        name: '',
        muscle_group: '',
        type: 'free_weight',
        difficulty_level: 'beginner',
        instructions: '',
        image_url: '',
        video_url: '',
        is_active: true
      });
    }
  }, [selectedExercise]);

  if (!isEditorOpen) return null;

  const handleMediaUpdate = (updated: Exercise) => {
    setFormData(updated);
    // Refresh admin store to show new images in library instantly
    updateExercise(updated.id, updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedExercise?.id && !selectedExercise.id.startsWith('temp-')) {
        await updateExercise(selectedExercise.id, formData);
      } else {
        await createExercise(formData);
      }
      closeEditor();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExercise?.id || !window.confirm('Excluir exercício permanentemente?')) return;
    setSaving(true);
    try {
      await deleteExercise(selectedExercise.id);
      closeEditor();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const generateAIContent = async (field: string) => {
    // Mock AI Generation
    alert(`Gerando ${field} com Rubi Intelligence...`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeEditor}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Sheet Content */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1">Editor Premium</p>
              <h2 className="text-2xl font-black tracking-tighter uppercase">
                {selectedExercise ? 'Editar Movimento' : 'Novo Movimento'}
              </h2>
            </div>
            <button onClick={closeEditor} className="p-3 rounded-full hover:bg-slate-50 transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <div className="space-y-10">
              {/* Sections Nav */}
              <nav className="flex gap-4 p-1.5 bg-slate-50 rounded-2xl">
                 <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} label="Básico" />
                 <TabButton active={activeTab === 'technical'} onClick={() => setActiveTab('technical')} label="Técnico" />
                 <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Mídia" />
              </nav>

              {activeTab === 'basic' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Nome do Exercício" required>
                      <input 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
                        placeholder="Ex: Supino Reto com Barra"
                      />
                    </Field>
                    <Field label="Grupo Muscular">
                      <select 
                        value={formData.muscle_group || ''}
                        onChange={e => setFormData({ ...formData, muscle_group: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none appearance-none"
                      >
                         <option value="">Selecione...</option>
                         {muscleGroups.map(mg => <option key={mg.id} value={mg.name}>{mg.name}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Equipamento">
                        <select 
                          value={formData.type || 'free_weight'}
                          onChange={e => setFormData({ ...formData, type: e.target.value })}
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/5 outline-none appearance-none"
                        >
                          <option value="free_weight">Peso Livre</option>
                          <option value="machine">Máquina</option>
                          <option value="cable">Cabo</option>
                          <option value="bodyweight">Peso do Corpo</option>
                        </select>
                    </Field>
                    <Field label="Dificuldade">
                        <div className="flex bg-slate-50 p-1 rounded-2xl">
                           {['beginner', 'intermediate', 'advanced'].map(level => (
                             <button 
                                key={level}
                                onClick={() => setFormData({ ...formData, difficulty_level: level as any })}
                                className={`flex-1 py-3 px-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${formData.difficulty_level === level ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300'}`}
                             >
                                {level.replace('beginner', 'Init').replace('intermediate', 'Inter').replace('advanced', 'Adv')}
                             </button>
                           ))}
                        </div>
                    </Field>
                  </div>

                  <Field label="Descrição Curta Premium">
                     <div className="relative">
                       <textarea 
                        value={formData.instructions || ''} 
                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                        rows={5}
                        className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-sm focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                        placeholder="Descreva a execução perfeita..."
                       />
                       <button 
                        onClick={() => generateAIContent('descrição')}
                        className="absolute bottom-4 right-4 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-110 transition-all group"
                       >
                         <Wand2 size={16} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                       </button>
                     </div>
                  </Field>
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-300">
                   <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 flex items-start gap-4">
                      <Sparkles className="text-blue-600 shrink-0" size={24} />
                      <div>
                        <h4 className="font-black text-blue-900 uppercase tracking-widest text-[11px] mb-1">Módulo de IA Governança</h4>
                        <p className="text-blue-800/60 font-bold text-[10px] leading-relaxed uppercase tracking-tight">Campos técnicos ajudam a Rubi IA a entender o padrão motor e gerar variações inteligentes nos planos dos usuários.</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <Field label="Movimento Base">
                         <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none appearance-none">
                            <option>Push (Empurrar)</option>
                            <option>Pull (Puxar)</option>
                            <option>Legs (Pernas)</option>
                            <option>Hinge (Dobradiça)</option>
                         </select>
                      </Field>
                      <Field label="Plano Anatômico">
                         <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none appearance-none">
                            <option>Sagital</option>
                            <option>Frontal</option>
                            <option>Transversal</option>
                         </select>
                      </Field>
                   </div>

                   <Field label="Dicas Técnicas (Separadas por ponto)">
                       <textarea 
                         value={formData.technical_tips || ''} 
                         onChange={e => setFormData({ ...formData, technical_tips: e.target.value })}
                         rows={4} 
                         className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-sm outline-none resize-none" 
                       />
                   </Field>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="h-full animate-in fade-in slide-in-from-right-5 duration-300">
                   {selectedExercise ? (
                     <AssetMediaHub 
                        exercise={formData as Exercise} 
                        onUpdate={handleMediaUpdate} 
                     />
                   ) : (
                     <div className="p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200">
                           <Play size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salve as informações básicas antes de gerenciar mídias</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDelete}
                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 transition-all"
              >
                <Trash2 size={20} />
              </button>
              <button 
                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"
              >
                <Copy size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex gap-4">
              <button 
                onClick={closeEditor}
                className="flex-1 h-16 rounded-full font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-16 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Confirmar & Ativar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {label}
    </button>
  );
}

function Field({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-3">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5 leading-none">
          {label}
          {required && <span className="text-red-500">*</span>}
       </label>
       {children}
    </div>
  );
}

export default ExerciseEditorSheet;
