import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  Activity,
  Zap,
  Target,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const TopMovers: React.FC = () => {
  const { exercises } = useAdminStore();
  
  const movers = exercises
    .filter(e => e.usage_count && e.avg_progression_rate)
    .sort((a, b) => (b.avg_progression_rate || 0) - (a.avg_progression_rate || 0))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
       <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">RISING STARS</h3>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">TENDÊNCIA ALTA</span>
       </div>

       <div className="space-y-6">
          {movers.map((ex, i) => (
            <div key={ex.id} className="group flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black group-hover:bg-slate-950 group-hover:text-white transition-all">
                     {i + 1}
                  </div>
                  <div>
                     <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{ex.name}</h4>
                     <div className="flex items-center gap-2 mt-0.5">
                        <TrendingUp size={10} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400">+{Math.round((ex.avg_progression_rate || 0) * 100)}% Progressão</span>
                     </div>
                  </div>
               </div>
               <button className="p-2 text-slate-300 group-hover:text-slate-950 transition-all">
                  <ChevronRight size={18} />
               </button>
            </div>
          ))}

          {movers.length === 0 && (
            <div className="py-10 text-center space-y-4">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                  <BarChart3 size={24} />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando tendências...</p>
            </div>
          )}
       </div>

       <button className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all group">
          Ver Relatório Completo
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
       </button>
    </div>
  );
};

export default TopMovers;
