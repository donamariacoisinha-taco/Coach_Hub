import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Pause,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { Exercise } from '../../../../types';
import { aiMediaFinder } from '../../services/aiMediaFinder';
import { mediaApi } from '../../api/mediaApi';
import { useAdminStore } from '../../../../store/adminStore';
import { cn } from '../../../../lib/utils';

interface Props {
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  results?: any;
}

export const BulkMediaQueue: React.FC<Props> = ({ selectedIds, isOpen, onClose }) => {
  const { exercises, updateExercise } = useAdminStore();
  const [queue, setQueue] = useState<ProcessItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && selectedIds.length > 0) {
      const initialQueue = selectedIds.map(id => {
        const ex = exercises.find(e => e.id === id);
        return {
          id,
          name: ex?.name || 'Exercício Desconhecido',
          status: 'pending' as const
        };
      });
      setQueue(initialQueue);
      setCurrentIndex(0);
      setIsPaused(false);
    }
  }, [isOpen, selectedIds]);

  useEffect(() => {
    if (!isOpen || isPaused || currentIndex >= queue.length) return;

    const processNext = async () => {
      const item = queue[currentIndex];
      if (item.status !== 'pending') {
          setCurrentIndex(prev => prev + 1);
          return;
      }

      setQueue(prev => prev.map((it, idx) => 
        idx === currentIndex ? { ...it, status: 'processing' } : it
      ));

      try {
        const fullEx = exercises.find(e => e.id === item.id);
        if (!fullEx) throw new Error("Exercise not found");

        const results = await aiMediaFinder.findMedia(fullEx);
        
        const updates: Partial<Exercise> = {
          image_url: results.main_images?.[0]?.url,
          video_url: results.videos?.[0]?.url,
          thumbnail_url: results.main_images?.[0]?.url,
          updated_at: new Date().toISOString()
        };

        await mediaApi.updateExerciseMedia(item.id, updates);
        updateExercise(item.id, updates);

        setQueue(prev => prev.map((it, idx) => 
          idx === currentIndex ? { ...it, status: 'completed' as const } : it
        ));
      } catch (err: any) {
        setQueue(prev => prev.map((it, idx) => 
          idx === currentIndex ? { ...it, status: 'error' as const, error: err.message } : it
        ));
      } finally {
        setCurrentIndex(prev => prev + 1);
      }
    };

    const timer = setTimeout(processNext, 1000); // Small delay between items
    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, isOpen, queue]);

  if (!isOpen) return null;

  const completedCount = queue.filter(q => q.status === 'completed').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const progress = (currentIndex / queue.length) * 100;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <Zap size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Media Processor</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando {queue.length} exercícios</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <XCircle size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
           {queue.map((item, idx) => (
             <div 
               key={idx}
               className={cn(
                 "p-5 rounded-[2rem] border transition-all flex items-center justify-between",
                 idx === currentIndex - 1 ? "bg-white border-indigo-200 shadow-xl scale-[1.02]" : 
                 item.status === 'completed' ? "bg-green-50/50 border-green-100 opacity-60" :
                 item.status === 'error' ? "bg-rose-50/50 border-rose-100" :
                 "bg-white border-slate-100"
               )}
             >
                <div className="flex items-center gap-4">
                   {item.status === 'processing' ? (
                     <Loader2 size={18} className="text-indigo-600 animate-spin" />
                   ) : item.status === 'completed' ? (
                     <CheckCircle2 size={18} className="text-green-500" />
                   ) : item.status === 'error' ? (
                     <XCircle size={18} className="text-rose-500" />
                   ) : (
                     <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200" />
                   )}
                   <div>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.name}</p>
                      {item.error && <p className="text-[9px] font-bold text-rose-400 uppercase">{item.error}</p>}
                   </div>
                </div>
                
                {item.status === 'processing' && (
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                     Localizando...
                  </div>
                )}
             </div>
           ))}
        </div>

        <div className="p-8 border-t border-slate-50 bg-white">
           <div className="flex items-center justify-between mb-6">
              <div className="flex gap-8">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                       <p className="text-lg font-black text-slate-900">{completedCount} / {queue.length}</p>
                       <span className="text-[10px] font-bold text-green-500 uppercase">Concluídos</span>
                    </div>
                 </div>
                 {errorCount > 0 && (
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Erros</p>
                      <div className="flex items-center gap-2">
                         <p className="text-lg font-black text-rose-500">{errorCount}</p>
                         <span className="text-[10px] font-bold text-rose-500 uppercase">Falhas</span>
                      </div>
                   </div>
                 )}
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsPaused(!isPaused)}
                   className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all"
                 >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                 </button>
                 {currentIndex >= queue.length && (
                   <button 
                     onClick={onClose}
                     className="px-8 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/40"
                   >
                      Concluir Processo <ChevronRight size={16} />
                   </button>
                 )}
              </div>
           </div>

           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600"
                animate={{ width: `${progress}%` }}
              />
           </div>
        </div>
      </motion.div>
    </div>
  );
};
