import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Check, 
  X, 
  ArrowRight, 
  ChevronRight, 
  Brain,
  MessageSquare,
  Sparkles,
  Maximize2,
  Trash2,
  Filter
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';
import { getQualityBadge } from '../services/qualityScoreV2';
import CompareChanges from './CompareChanges';

const AutoFixQueue: React.FC = () => {
  const { exercises } = useAdminStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'auto_fixed'>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const items = exercises.filter(ex => {
    if (filter === 'critical') return (ex.quality_score || 0) < 50 || ex.needs_human_review;
    if (filter === 'auto_fixed') return ex.ai_review_status === 'auto_fixed';
    return true;
  }).sort((a, b) => (a.quality_score || 0) - (b.quality_score || 0));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fila de Revisão & Problemas</h3>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
          <FilterButton active={filter === 'critical'} onClick={() => setFilter('critical')}>Críticos</FilterButton>
          <FilterButton active={filter === 'auto_fixed'} onClick={() => setFilter('auto_fixed')}>Auto-Corrigidos</FilterButton>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
           <thead>
              <tr className="bg-slate-50/50">
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exercício</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Principais Problemas</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Confiança IA</th>
                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ação</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {items.map((ex) => (
                <tr key={ex.id} className="group hover:bg-slate-50/50 transition-colors">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                            {ex.image_url ? (
                              <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                 <Brain size={20} />
                              </div>
                            )}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ex.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                         {ex.ai_issues && ex.ai_issues.length > 0 ? (
                           ex.ai_issues.map((issue, i) => (
                             <span key={i} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${
                               issue.category === 'content' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               issue.category === 'structural' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                             }`}>
                                {issue.description}
                             </span>
                           ))
                         ) : (
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Saudável</span>
                         )}
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <QualityTag score={ex.quality_score || 0} />
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="flex-1 max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(ex.ai_confidence || 0) * 100}%` }}
                            />
                         </div>
                         <span className="text-[10px] font-black text-slate-900">{(ex.ai_confidence || 0) * 100}%</span>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedExercise(ex)}
                        className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all"
                      >
                         <Maximize2 size={16} />
                      </button>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>

        {items.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <Check size={40} />
             </div>
             <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Tudo Limpo!</p>
             <p className="text-slate-400 text-sm font-bold mt-1">Sua biblioteca está premium e higienizada.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedExercise && (
          <CompareChanges 
            exercise={selectedExercise} 
            onClose={() => setSelectedExercise(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function FilterButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {children}
    </button>
  );
}

function QualityTag({ score }: { score: number }) {
  const badge = getQualityBadge(score);
  return (
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 rounded-xl ${badge.color} ${badge.textColor} flex items-center justify-center text-[10px] font-black`}>
          {score}
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${badge.textColor.replace('text-', 'text-opacity-60 text-')}`}>
          {badge.label}
       </span>
    </div>
  );
}

export default AutoFixQueue;
