import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  Sparkles, 
  Zap, 
  Layers, 
  Play, 
  ImageIcon, 
  Trash2, 
  History, 
  Search, 
  Globe,
  Plus,
  ChevronRight,
  Eye,
  EyeOff,
  Wand2,
  Brain,
  Hash,
  Activity,
  Dumbbell
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';
import { VisibilityBadge, VisibilityToggle } from './VisibilityBadge';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { AssetMediaHub } from './media/AssetMediaHub';
import { ImageUploader } from './media/ImageUploader';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { mediaApi } from '../api/mediaApi';
import { UploadProgress } from './media/UploadProgress';

const ExerciseEditorV2: React.FC = () => {
  const { isEditorOpen, closeEditor, selectedExercise, updateExercise, createExercise, loading: storeLoading } = useAdminStore();
  const { showSuccess, showError } = useErrorHandler();
  const { uploadFile, isUploading, uploads } = useMediaUpload();
  const [activeTab, setActiveTab] = useState<'basic' | 'technique' | 'ai' | 'media' | 'seo' | 'history'>('basic');
  const [form, setForm] = useState<Partial<Exercise>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedExercise) {
      setForm(selectedExercise);
    } else {
      setForm({
        name: '',
        muscle_group: '',
        type: 'Força',
        difficulty_level: 'beginner',
        is_active: true
      });
    }
    setActiveTab('basic');
  }, [selectedExercise, isEditorOpen]);

  const handleMediaUpdate = async (updates: Partial<Exercise>) => {
    console.log('[DB_UPDATE_START]', updates);
    const newForm = { ...form, ...updates };
    setForm(newForm);
    
    // Auto-save media to database if exercise exists
    if (newForm.id) {
       try {
         setSaving(true);
         // Ensure static_frame syncs with image_url if it's the primary static frame
         const finalUpdates = { ...updates };
         if (updates.static_frame_url) {
            finalUpdates.image_url = updates.static_frame_url;
            console.log('[SYNC] Mapping static_frame_url to image_url for preview affinity');
         }

         await updateExercise(newForm.id, finalUpdates);
         console.log('[DB_UPDATE_SUCCESS]', finalUpdates);
         showSuccess('Assets Sincronizados', 'A mídia foi salva e sincronizada com o sistema.');
       } catch (err: any) {
         console.error('[DB_UPDATE_ERROR]', err);
         showError('Erro ao auto-salvar mídia: ' + err.message);
       } finally {
         setSaving(false);
       }
    }
  };

  if (!isEditorOpen) return null;

  const handleSave = async () => {
    try {
      if (form.id) {
        await updateExercise(form.id, form);
      } else {
        await createExercise(form);
      }
      closeEditor();
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Básico', icon: Layers },
    { id: 'technique', label: 'Técnica', icon: Activity },
    { id: 'ai', label: 'Rubi AI', icon: Brain },
    { id: 'seo', label: 'SEO / Search', icon: Hash },
    { id: 'media', label: 'Conteúdo', icon: ImageIcon },
    { id: 'history', label: 'Timeline', icon: History },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end pointer-events-none">
       {/* Backdrop */}
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={closeEditor}
         className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
       />

       {/* Editor Panel - Elite Drawer */}
       <motion.div 
         initial={{ x: '100%', y: 0 }}
         animate={{ x: 0, y: 0 }}
         exit={{ x: '100%', y: 0 }}
         transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
         className="relative w-full lg:max-w-6xl bg-[#F7F8FA] h-full sm:h-full shadow-[-30px_0_100px_rgba(0,0,0,0.4)] pointer-events-auto flex flex-col md:rounded-l-[3rem] overflow-hidden"
       >
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between z-10">
             <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={closeEditor} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all active:scale-95 text-slate-400 hover:text-slate-950">
                   <X size={20} />
                </button>
                <div>
                   <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-none">
                         {selectedExercise ? 'Edit Architecture' : 'Forge New Asset'}
                      </h2>
                      {form.id && <VisibilityBadge isPublished={!!form.is_active} />}
                   </div>
                   <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 hidden sm:flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Auto-save enabled • {form.is_active ? 'Publicado' : 'Oculto'}
                   </p>
                </div>
             </div>

             <div className="flex items-center gap-3 sm:gap-4">
                <button className="hidden sm:flex items-center gap-2 px-6 h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-slate-400 transition-all">
                   <Eye size={18} className="text-slate-400" />
                   Preview
                </button>
                <button 
                  onClick={handleSave}
                  disabled={storeLoading || saving}
                  className="px-6 sm:px-8 h-12 sm:h-14 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-950/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                   {(storeLoading || saving) ? <Sparkles size={18} className="animate-pulse" /> : <Save size={18} />}
                   {selectedExercise ? 'Commit' : 'Publish'}
                </button>
             </div>
          </header>

          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
             {/* Sidebar Navigation */}
             <aside className="w-full sm:w-72 bg-white border-r border-slate-200 flex flex-row sm:flex-col p-4 sm:p-6 gap-2 overflow-x-auto sm:overflow-y-auto no-scrollbar">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex items-center gap-4 px-4 py-3 sm:py-4 rounded-2xl transition-all duration-300 group ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                          : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-600'} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto text-white/50 hidden sm:block" />}
                    </button>
                  );
                })}
             </aside>

             {/* Content Area */}
             <main className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 lg:p-14">
                <div className="max-w-3xl mx-auto">
                   <AnimatePresence mode="wait">
                      {activeTab === 'basic' && (
                         <motion.div 
                           key="basic"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="space-y-10 sm:space-y-12"
                         >
                            <SectionHeader title="Identidade & Core" desc="Definições fundamentais e enquadramento estrutural." />
                             
                             <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                <div className="flex items-center gap-4">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${form.is_active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                                      {form.is_active ? <Eye size={20} /> : <EyeOff size={20} />}
                                   </div>
                                   <div>
                                      <h4 className="text-[13px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1.5 flex items-center gap-2">
                                         Status de Publicação
                                         <VisibilityBadge isPublished={!!form.is_active} compact />
                                      </h4>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Controlar visibilidade para alunos da plataforma</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                   <VisibilityToggle 
                                     isPublished={!!form.is_active} 
                                     onToggle={(e: any) => {
                                       e?.stopPropagation();
                                       setForm({...form, is_active: !form.is_active});
                                     }} 
                                     variant="button" 
                                   />
                                </div>
                             </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                               <Input label="Asset Performance Name" value={form.name} onChange={(val) => setForm({...form, name: val})} placeholder="Ex: Supino Reto Barra" />
                               <Input label="Commercial Variant / Alias" value={form.alt_name} onChange={(val) => setForm({...form, alt_name: val})} placeholder="Ex: Bench Press Barbell" />
                               
                               
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Primary Muscle Cluster</label>
                                  <select 
                                    value={form.muscle_group}
                                    onChange={(e) => setForm({...form, muscle_group: e.target.value})}
                                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all appearance-none"
                                  >
                                     <option value="">Select Cluster</option>
                                     {['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen', 'Full Body', 'Cardio', 'Mobilidade'].map(m => (
                                       <option key={m} value={m}>{m}</option>
                                     ))}
                                  </select>
                               </div>

                               <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Experience Level Tier</label>
                                  <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 gap-1 shadow-sm">
                                     {['beginner', 'intermediate', 'advanced'].map(lvl => (
                                        <button 
                                          key={lvl}
                                          onClick={() => setForm({...form, difficulty_level: lvl as any})}
                                          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                            form.difficulty_level === lvl ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                                          }`}
                                        >
                                           {lvl}
                                        </button>
                                     ))}
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Operational Description</label>
                               <textarea 
                                  value={form.description}
                                  onChange={(e) => setForm({...form, description: e.target.value})}
                                  placeholder="Centro de gravidade, pontos de contato e objetivo principal..."
                                  className="w-full h-44 bg-white border border-slate-200 rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none leading-relaxed"
                               />
                            </div>
                         </motion.div>
                      )}

                      {activeTab === 'technique' && (
                         <motion.div 
                           key="technique"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="space-y-12"
                         >
                            <SectionHeader title="Biomechanics & Execution" desc="Instruções de elite para performance de altíssimo nível." />
                            <div className="space-y-8">
                               <Textarea label="Execution Step-by-Step" value={form.instructions} onChange={(val) => setForm({...form, instructions: val})} />
                               <Textarea label="Technical Pro Tips (Advanced)" value={form.technical_tips} onChange={(val) => setForm({...form, technical_tips: val})} />
                               <div className="grid grid-cols-2 gap-8">
                                   <Input label="Primary Equipment" value={form.type} onChange={(val) => setForm({...form, type: val})} />
                                   <Input label="Motor Pattern" value={form.movement_pattern} onChange={(val: any) => setForm({...form, movement_pattern: val})} />
                               </div>
                            </div>
                         </motion.div>
                      )}

                      {activeTab === 'ai' && (
                         <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            <SectionHeader title="Rubi Intelligence Engine" desc="Optimize asset metadata using advanced neural orchestration." />
                            <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl shadow-slate-950/30">
                               <div className="flex items-center gap-4 mb-8">
                                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                                     <Zap size={22} fill="currentColor" />
                                  </div>
                                  <div>
                                     <h4 className="text-xl font-black uppercase tracking-tight italic">Rubi Generator v4</h4>
                                     <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Enterprise Content Orchestration</p>
                                  </div>
                               </div>
                               
                               <div className="space-y-4">
                                  <AIAction icon={<Wand2 size={16} />} label="Enhance Description" />
                                  <AIAction icon={<Sparkles size={16} />} label="Standardize Technical Tone" />
                                  <AIAction icon={<Layers size={16} />} label="Deep SEO Extraction" />
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">AI Context Prompt</label>
                               <textarea 
                                  value={form.technical_prompt}
                                  onChange={(e) => setForm({...form, technical_prompt: e.target.value})}
                                  placeholder="Instruções específicas para o modelo de linguagem sobre este exercício..."
                                  className="w-full h-44 bg-white border border-slate-200 rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none leading-relaxed"
                               />
                            </div>
                         </motion.div>
                      )}

                      {activeTab === 'media' && (
                         <motion.div key="media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 h-full flex flex-col">
                            <SectionHeader title="Asset Media Hub" desc="Management of visual performance guides and biomechanical cuts." />
                            
                            {form.id ? (
                               <div className="flex-1 min-h-0">
                                  <AssetMediaHub 
                                     exercise={form as Exercise} 
                                     onUpdate={(updated) => setForm(updated)}
                                  />
                               </div>
                            ) : (
                               <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                     <ImageIcon size={32} />
                                  </div>
                                  <h4 className="text-lg font-black uppercase tracking-tight">Identity Required</h4>
                                  <p className="max-w-xs mx-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                     Salve o exercício pela primeira vez para habilitar o Asset Media Hub e gerenciar mídias avançadas.
                                  </p>
                                  <button 
                                     onClick={handleSave}
                                     className="mt-8 px-8 py-4 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-widest"
                                  >
                                     Salvar & Habilitar Mídia
                                  </button>
                               </div>
                            )}
                         </motion.div>
                      )}
                      
                      {activeTab === 'seo' && <ModuleProgress tab="Internal SEO & Discovery" />}
                      {activeTab === 'history' && <ModuleProgress tab="Version Control & Timeline" />}
                   </AnimatePresence>
                </div>
             </main>
          </div>
       </motion.div>
       <UploadProgress uploads={uploads} />
    </div>
  );
};

function Input({ label, value, onChange, placeholder }: { label: string, value: any, onChange: (val: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-3">
       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
       <input 
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
       />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string, value: any, onChange: (val: string) => void }) {
  return (
    <div className="space-y-3">
       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
       <textarea 
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-32 bg-white border border-slate-200 rounded-3xl p-6 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none shadow-sm"
       />
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="pb-8 border-b border-slate-200">
       <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{title}</h3>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{desc}</p>
    </div>
  );
}

function AIAction({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white group">
       <div className="flex items-center gap-4">
          <div className="text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <ChevronRight size={14} className="text-white/20" />
    </button>
  );
}

function ModuleProgress({ tab }: { tab: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center">
       <div className="w-20 h-20 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-slate-200 mb-8">
          <Dumbbell size={32} />
       </div>
       <h4 className="text-xl font-black uppercase tracking-tight">{tab}</h4>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Architecture under construction.</p>
    </div>
  );
}

export default ExerciseEditorV2;
