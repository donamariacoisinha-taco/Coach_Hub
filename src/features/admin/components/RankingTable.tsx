import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Skull, 
  FlaskConical,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const RankingTable: React.FC = () => {
  const { exercises } = useAdminStore();
  
  const items = [...exercises].sort((a, b) => (b.quality_score_v3 || 0) - (a.quality_score_v3 || 0)).slice(0, 10);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/30">
       <table className="w-full text-left border-collapse">
          <thead>
             <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exercício</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score V3</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Uso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ação</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
             {items.map((ex) => (
               <tr key={ex.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                           {ex.image_url ? (
                             <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover rounded-xl" />
                           ) : (
                             <Zap size={18} />
                           )}
                        </div>
                        <div>
                           <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{ex.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ex.muscle_group}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">{ex.quality_score_v3 || 0}</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-indigo-600 rounded-full" 
                             style={{ width: `${ex.quality_score_v3 || 0}%` }}
                           />
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <Activity size={14} className="text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-600">{ex.usage_count || 0}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <StatusTag status={ex.ranking_status || 'testing'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <Maximize2 size={16} />
                     </button>
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );
};

function StatusTag({ status }: { status: 'rising' | 'elite' | 'decline' | 'forgotten' | 'testing' }) {
  const configs: any = {
    rising: { label: 'Rising', color: 'bg-amber-50 text-amber-600', icon: TrendingUp },
    elite: { label: 'Elite', color: 'bg-indigo-50 text-indigo-600', icon: ShieldCheck },
    decline: { label: 'Decline', color: 'bg-red-50 text-red-600', icon: TrendingDown },
    forgotten: { label: 'Forgotten', color: 'bg-slate-100 text-slate-400', icon: Skull },
    testing: { label: 'Testing', color: 'bg-blue-50 text-blue-600', icon: FlaskConical },
  };

  const config = configs[status] || configs.testing;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${config.color}`}>
       <Icon size={12} />
       <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  );
}

export default RankingTable;
