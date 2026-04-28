import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Sparkles, 
  X, 
  Check, 
  ChevronRight, 
  AlertCircle,
  Save,
  Zap,
  RotateCcw,
  RefreshCw,
  Library
} from 'lucide-react';
import { Exercise } from '../../../../types';
import { useMediaFinderStore } from '../../store/mediaFinderStore';
import { aiMediaFinder } from '../../services/aiMediaFinder';
import { mediaMatcher } from '../../services/mediaMatcher';
import { MediaSuggestionsGrid } from './MediaSuggestionsGrid';
import { MediaReviewCompare } from './MediaReviewCompare';
import { cn } from '../../../../lib/utils';
import { useAdminStore } from '../../../../store/adminStore';

interface Props {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onApply: (updates: Partial<Exercise>) => void;
}

export const AIMediaFinderModal: React.FC<Props> = ({ exercise, isOpen, onClose, onApply }) => {
  const { 
    isSearching, 
    setSearching, 
    suggestions, 
    setSuggestions, 
    selectedAssets, 
    setSelectedAssets,
    reset 
  } = useMediaFinderStore();
  
  const { exercises } = useAdminStore();
  const [activeStep, setActiveStep] = useState<'search' | 'selection' | 'review'>('search');
  const [similarExercises, setSimilarExercises] = useState<Partial<Exercise>[]>([]);

  useEffect(() => {
    if (isOpen) {
      handleSearch();
      const matched = mediaMatcher.findSimilarAssets(exercise, exercises);
      setSimilarExercises(matched);
    } else {
      reset();
      setActiveStep('search');
    }
  }, [isOpen, exercise.id]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const results = await aiMediaFinder.findMedia(exercise);
      setSuggestions(results);
      setActiveStep('selection');
      
      // Auto-select first options
      if (results.main_images?.[0]) {
        setSelectedAssets({
          ...selectedAssets,
          image_url: results.main_images[0].url,
          video_url: results.videos?.[0]?.url
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleApply = () => {
    onApply(selectedAssets);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
               <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Media Finder</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exercise.name}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F7F8FA] space-y-8">
           {isSearching ? (
             <div className="h-96 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                   <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-indigo-500 animate-pulse" size={32} />
                   </div>
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-lg font-black text-slate-900">Coach Rubi analisando biomecânica...</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Localizando as melhores fontes visuais</p>
                </div>
             </div>
           ) : (
             <>
               {activeStep === 'selection' && (
                 <div className="space-y-12 pb-24">
                   {/* Similar Assets Reuse */}
                   {similarExercises.length > 0 && (
                     <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-2">
                           <Library size={16} className="text-indigo-500" />
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reaproveitamento Inteligente</h4>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                           {similarExercises.map((e, idx) => (
                             <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                className="flex-shrink-0 w-48 aspect-video bg-slate-50 rounded-2xl overflow-hidden relative cursor-pointer border-2 border-transparent hover:border-indigo-500"
                                onClick={() => setSelectedAssets({ ...selectedAssets, image_url: e.image_url, video_url: e.video_url })}
                             >
                                <img src={e.image_url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                                   <p className="text-[8px] font-bold text-white uppercase truncate">{e.name}</p>
                                </div>
                             </motion.div>
                           ))}
                        </div>
                     </div>
                   )}

                   <MediaSuggestionsGrid 
                      title="Imagens Sugeridas" 
                      suggestions={suggestions.main_images || []}
                      selectedUrl={selectedAssets.image_url}
                      onSelect={(url) => setSelectedAssets({ ...selectedAssets, image_url: url })}
                      type="image"
                   />

                   <MediaSuggestionsGrid 
                      title="Demonstrações de Vídeo" 
                      suggestions={suggestions.videos || []}
                      selectedUrl={selectedAssets.video_url}
                      onSelect={(url) => setSelectedAssets({ ...selectedAssets, video_url: url })}
                      type="video"
                   />
                 </div>
               )}

               {activeStep === 'review' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                    <div className="p-8 bg-white rounded-[3rem] shadow-sm">
                       <h3 className="text-lg font-black text-slate-900 mb-8">Revisão de Ativos</h3>
                       <MediaReviewCompare original={exercise} suggested={selectedAssets} />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                       <div className="p-6 bg-white rounded-3xl shadow-sm space-y-2">
                          <h5 className="text-[8px] font-black uppercase text-slate-400">Visual Quality Score</h5>
                          <div className="text-2xl font-black text-slate-900">94%</div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="w-[94%] h-full bg-green-500" />
                          </div>
                       </div>
                       <div className="p-6 bg-white rounded-3xl shadow-sm space-y-2 text-center flex flex-col items-center justify-center">
                          <Check className="text-green-500 mb-2" size={24} />
                          <p className="text-[10px] font-black uppercase text-slate-400">Pronto para Publicar</p>
                       </div>
                       <div className="p-6 bg-white rounded-3xl shadow-sm text-center flex flex-col items-center justify-center">
                          <Zap className="text-amber-500 mb-2" size={24} />
                          <p className="text-[10px] font-black uppercase text-slate-400">Smart Meta Ready</p>
                       </div>
                    </div>
                 </div>
               )}
             </>
           )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-white flex items-center justify-between">
          <div className="flex gap-4">
             {activeStep !== 'search' && (
               <button 
                onClick={() => handleSearch()}
                className="flex items-center gap-2 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
               >
                 <RotateCcw size={16} /> Regerar
               </button>
             )}
          </div>

          <div className="flex gap-4">
            {activeStep === 'selection' ? (
              <button 
                onClick={() => setActiveStep('review')}
                disabled={!selectedAssets.image_url}
                className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Revisar Seleção <ChevronRight size={18} />
              </button>
            ) : activeStep === 'review' ? (
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveStep('selection')}
                  className="px-8 py-5 bg-slate-100 text-slate-600 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleApply}
                  className="flex items-center gap-4 px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                >
                  <Save size={18} /> Aplicar Agora
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
