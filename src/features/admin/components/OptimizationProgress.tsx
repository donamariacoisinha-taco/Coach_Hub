import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  XCircle,
  Clock,
  LayoutGrid,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useIntelligenceStore } from '../store/intelligenceStore';

const OptimizationProgress: React.FC = () => {
  const { progress, results, operation, finishProcessing } = useIntelligenceStore();
  
  const percent = Math.round((progress.current / progress.total) * 100) || 0;
  const isFinished = progress.current === progress.total && progress.total > 0;

  const elapsedTime = progress.startTime ? (Date.now() - progress.startTime) / 1000 : 0;
  const estimatedTotal = percent > 0 ? (elapsedTime / percent) * 100 : 0;
  const remaining = Math.max(0, Math.round(estimatedTotal - elapsedTime));

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-12">
       {/* Status Top */}
       <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Sparkles size={24} className="text-indigo-400 animate-pulse" />
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Otimização Neural em Curso</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                   Operação: {operation?.replace('_', ' ')}
                </p>
             </div>
          </div>
          <div className="text-right">
             <span className="text-5xl font-black">{percent}%</span>
          </div>
       </div>

       {/* Big Progress Bar */}
       <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-12">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          />
       </div>

       {/* Realtime Terminal */}
       <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-8 font-mono text-[11px] overflow-y-auto no-scrollbar space-y-3 mb-10">
          {results.slice(-10).map((res, i) => (
            <div key={res.id + i} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
               {res.status === 'processing' && <Loader2 size={12} className="text-indigo-400 animate-spin" />}
               {res.status === 'completed' && <CheckCircle2 size={12} className="text-emerald-500" />}
               {res.status === 'failed' && <XCircle size={12} className="text-red-500" />}
               {res.status === 'pending' && <Clock size={12} className="text-slate-600" />}
               
               <span className="text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  {res.status.toUpperCase()}
               </span>
               <span className="text-white font-bold">{res.name}</span>
               {res.status === 'completed' && (
                 <span className="text-emerald-500 opacity-60">✓ Optimization payload verified</span>
               )}
            </div>
          ))}
          {results.length === 0 && <div className="text-slate-600 italic">Initializing neural connections...</div>}
       </div>

       {/* Stats Footer */}
       <div className="grid grid-cols-3 gap-8 mb-10">
          <StatBox icon={<Activity size={16} />} label="Itens" value={`${progress.current}/${progress.total}`} />
          <StatBox icon={<Clock size={16} />} label="Estimado" value={`${remaining}s`} />
          <StatBox icon={<LayoutGrid size={16} />} label="Queue" value="Active" />
       </div>

       {isFinished && (
         <motion.button 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           onClick={() => console.log('Show Results')}
           className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
         >
            Ver Relatório Operacional
           <ArrowRight size={18} />
         </motion.button>
       )}
    </div>
  );
};

function StatBox({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
       <div className="flex items-center gap-2 text-slate-500 mb-2">
          {icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <div className="text-lg font-black">{value}</div>
    </div>
  );
}

export default OptimizationProgress;
