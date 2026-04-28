
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ImageIcon, 
  Layers, 
  Activity, 
  Play, 
  Search, 
  Save,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Exercise } from '../../../../types';
import { ImageUploader } from './ImageUploader';
import { MediaGallery } from './MediaGallery';
import { VideoManager } from './VideoManager';
import { UploadProgress } from './UploadProgress';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { mediaApi } from '../../api/mediaApi';
import { useErrorHandler } from '../../../../hooks/useErrorHandler';
import { aiMediaFinder } from '../../services/aiMediaFinder';
import { AIMediaFinderModal } from './AIMediaFinderModal';
import { cn } from '../../../../lib/utils';
// const { cn } = utils; // Removed incorrect destructuring

interface Props {
  exercise: Exercise;
  onUpdate: (updatedExercise: Exercise) => void;
}

type Tab = 'main' | 'guides' | 'biomechanics' | 'videos' | 'metadata';

export const AssetMediaHub: React.FC<Props> = ({ exercise, onUpdate }) => {
  const { showError, showSuccess } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const { uploadFile, uploads, isUploading } = useMediaUpload();
  const [saving, setSaving] = useState(false);
  const [localData, setLocalData] = useState<Exercise>(exercise);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  // Auto-save logic
  React.useEffect(() => {
    if (!hasChanges) return;
    
    const timeout = setTimeout(() => {
      handleSave();
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    return () => clearTimeout(timeout);
  }, [localData, hasChanges]);

  const handleUpdate = (updates: Partial<Exercise>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    setHasChanges(true);
  };

  const handleAIMediaApply = (updates: Partial<Exercise>) => {
    setLocalData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
    showSuccess('Inteligência Media Finder', 'Ativos aplicados com sucesso. Salvando automaticamente...');
  };

  const handleAutoComplete = async () => {
    if (saving || isUploading) return;
    setSaving(true);
    try {
      showSuccess('Cérebro Rubi Ativado', 'Iniciando modo 1-Tap Complete. Localizando mídias...');
      const results = await aiMediaFinder.findMedia(exercise);
      
      const updates: Partial<Exercise> = {
        image_url: results.main_images?.[0]?.url,
        video_url: results.videos?.[0]?.url,
        thumbnail_url: results.main_images?.[0]?.url // Reuse for thumb
      };

      handleUpdate(updates);
      showSuccess('⚡ Exercício Completado', 'Mídias localizadas e aplicadas via IA.');
    } catch (err: any) {
      showError('Falha no Modo Completo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving || isUploading) return;
    setSaving(true);
    console.log('[DB_UPDATE_START]', localData);
    try {
      await mediaApi.updateExerciseMedia(exercise.id, localData);
      console.log('[DB_UPDATE_SUCCESS]');
      onUpdate(localData);
      setHasChanges(false);
      showSuccess('Mídias Atualizadas', 'As alterações foram sincronizadas com o servidor.');
    } catch (err: any) {
      console.error('[DB_UPDATE_ERROR]', err);
      showError(err.message || 'Erro ao salvar mídias');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'main', label: 'Imagem Principal', icon: ImageIcon },
    { id: 'guides', label: 'Guias Visuais', icon: Layers },
    { id: 'biomechanics', label: 'Biomechanical Cuts', icon: Activity },
    { id: 'videos', label: 'Vídeos', icon: Play },
    { id: 'metadata', label: 'SEO / Metadata', icon: Search },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="flex flex-1 gap-2 p-1.5 bg-slate-100 rounded-[2rem] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon size={16} className={cn(isActive ? "text-blue-500" : "text-slate-300")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button 
             onClick={() => setIsFinderOpen(true)}
             className="flex items-center gap-3 px-8 py-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-lg active:scale-95 group"
          >
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            <span>Buscar Mídia com IA</span>
          </button>

          <button 
             onClick={handleAutoComplete}
             disabled={saving || isUploading}
             className="flex items-center gap-3 px-8 py-4 bg-amber-50 border border-amber-100 text-amber-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all shadow-lg active:scale-95 group disabled:opacity-50"
          >
            <Zap size={16} className="group-hover:scale-125 transition-transform" />
            <span>Completar Exercício</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 gap-10"
            >
              <div className="space-y-10">
                <ImageUploader 
                  label="Upload 1:1 Static Frame"
                  value={localData.static_frame_url || localData.image_url || ''}
                  onChange={(url) => {
                    console.log('[PUBLIC_URL_READY]', url);
                    handleUpdate({ 
                      static_frame_url: url,
                      image_url: url // Sync for preview affinity
                    });
                  }}
                  onUpload={(file) => uploadFile(file, `static-frames/${exercise.id}`, { compress: true })}
                />
                <ImageUploader 
                  label="Thumbnail do App (Premium Cache)"
                  value={localData.thumbnail_url || ''}
                  onChange={(url) => handleUpdate({ thumbnail_url: url })}
                  onUpload={(file) => uploadFile(file, `thumbnails/${exercise.id}`, { compress: true })}
                  className="w-1/2"
                />
              </div>

              <div className="space-y-8">
                 <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                          <Sparkles size={20} />
                       </div>
                       <div>
                          <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">IA Auto-Optimization</h4>
                          <p className="text-[9px] font-bold text-blue-800/60 uppercase tracking-tight">Rubi Engine processa e otimiza todas as imagens para WebP 2.0.</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <InfoItem label="Performance" value="Load time < 100ms" />
                       <InfoItem label="Seo" value="Alt-tags automáticas" />
                       <InfoItem label="Storage" value="Bucket: exercise-assets" />
                    </div>
                 </div>

                 <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Dica Pro</p>
                       <p className="text-sm font-bold leading-relaxed text-slate-300">
                         Utilize imagens com fundo limpo (neutral background) para garantir a melhor experiência na galeria do usuário.
                       </p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[60px]" />
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MediaGallery 
                label="Passo a Passo (Visual Guides)"
                items={localData.guide_images || []}
                onChange={(items) => handleUpdate({ guide_images: items })}
                onUpload={(file) => uploadFile(file, 'guides', { compress: true })}
              />
            </motion.div>
          )}

          {activeTab === 'biomechanics' && (
            <motion.div
              key="biomechanics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MediaGallery 
                label="Cortes Biomecânicos Precisos"
                items={localData.biomechanics_images || []}
                onChange={(items) => handleUpdate({ biomechanics_images: items })}
                onUpload={(file) => uploadFile(file, 'cuts', { compress: true })}
              />
            </motion.div>
          )}

          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <VideoManager 
                value={localData.video_url || ''}
                onChange={(url) => handleUpdate({ video_url: url })}
                onUpload={(file) => uploadFile(file, 'videos')}
              />
            </motion.div>
          )}

          {activeTab === 'metadata' && (
            <motion.div
              key="metadata"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Internal ID</label>
                     <input 
                       type="text" 
                       readOnly 
                       value={localData.id} 
                       className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-mono text-[10px] text-slate-400" 
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Version</label>
                     <input 
                       type="text" 
                       readOnly 
                       value={localData.version || '1.0.0'} 
                       className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-mono text-[10px] text-slate-400" 
                     />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80]">
         <motion.button
           onClick={handleSave}
           disabled={saving || isUploading || !hasChanges}
           className={cn(
             "h-16 px-12 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-3",
             (saving || isUploading)
               ? "bg-slate-200 text-slate-400 cursor-not-allowed"
               : !hasChanges 
                 ? "bg-green-50 text-green-500 border border-green-100"
                 : "bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-slate-900/30"
           )}
         >
           {saving ? (
             <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
           ) : !hasChanges ? (
             <CheckCircle2 size={18} />
           ) : (
             <Save size={18} />
           )}
           {saving ? 'Persistenting...' : !hasChanges ? 'All Assets Saved' : 'Save Media Changes'}
         </motion.button>
      </div>

      {/* Global Upload Progress */}
      <UploadProgress uploads={uploads} />

      <AIMediaFinderModal 
        exercise={localData}
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
        onApply={handleAIMediaApply}
      />
    </div>
  );
};

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest bg-blue-100/50 px-3 py-1 rounded-full">{value}</span>
    </div>
  );
}

function Field({ label, value, readOnly = false, onChange }: { label: string, value: string, readOnly?: boolean, onChange?: (v: string) => void }) {
  return (
    <div className="space-y-3">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
       <input 
         type="text" 
         value={value} 
         readOnly={readOnly}
         onChange={e => onChange?.(e.target.value)}
         className={cn(
           "w-full p-5 rounded-2xl font-bold text-xs outline-none transition-all",
           readOnly ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-100 focus:ring-4 focus:ring-blue-500/5"
         )}
       />
    </div>
  );
}
