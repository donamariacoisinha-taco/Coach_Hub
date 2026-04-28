
import React, { useState } from 'react';
import { 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  ArrowUpDown, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Dumbbell,
  Play
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const ExerciseLibrary: React.FC = () => {
  const { exercises, openEditor, searchQuery } = useAdminStore();
  const [view, setView] = useState<'table' | 'grid'>('table');

  const filtered = exercises.filter(ex => 
    (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.muscle_group || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Biblioteca Profissional</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie {exercises.length} movimentos ativos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
             <button 
                onClick={() => setView('table')}
                className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
             >
                <List size={18} />
             </button>
             <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}
             >
                <LayoutGrid size={18} />
             </button>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm hover:border-blue-500 transition-all">
            <Filter size={18} />
            Filtros
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Thumb</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Exercício</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Grupo Muscular</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ex) => (
                  <tr 
                    key={ex.id} 
                    onClick={() => openEditor(ex)}
                    className="group hover:bg-[#F8FAFC] cursor-pointer transition-all duration-300"
                  >
                    <td className="px-8 py-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                        {ex.image_url ? (
                          <img src={ex.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Dumbbell size={20} className="text-slate-200" />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 tracking-tight uppercase leading-none">{ex.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipamento: {ex.type || 'Peso Livre'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest leading-none">
                        {ex.muscle_group}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                ex.quality_score >= 85 ? 'bg-emerald-500' : 
                                ex.quality_score >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                              }`} 
                              style={{ width: `${ex.quality_score}%` }} 
                           />
                        </div>
                        <span className="text-xs font-black text-slate-900 leading-none">{ex.quality_score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={ex.quality_status || 'improvable'} active={ex.is_active} />
                    </td>
                    <td className="px-8 py-6">
                      <button className="p-2 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((ex) => (
            <div 
              key={ex.id}
              onClick={() => openEditor(ex)}
              className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="h-48 bg-slate-50 relative group-hover:h-52 transition-all">
                 {ex.image_url ? (
                    <img src={ex.image_url} alt="" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                       <Dumbbell size={48} />
                    </div>
                 )}
                 <div className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center bg-white/90 backdrop-blur rounded-full shadow-sm text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={16} fill="currentColor" />
                 </div>
              </div>
              <div className="p-8 space-y-4">
                <div>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-2">{ex.muscle_group}</p>
                   <h3 className="text-lg font-black tracking-tight uppercase leading-tight line-clamp-1 group-hover:line-clamp-none">{ex.name}</h3>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400">SCORE: </span>
                      <span className="text-[10px] font-black text-slate-900">{ex.quality_score || 0}%</span>
                   </div>
                   <StatusBadge status={ex.quality_status || 'improvable'} active={ex.is_active} compact />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function StatusBadge({ status, active, compact = false }: { status: string, active?: boolean, compact?: boolean }) {
  if (!active) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest leading-none rounded-lg bg-slate-100 text-slate-400 ${compact ? 'px-2 py-1 text-[8px]' : 'px-3 py-1.5 text-[9px]'}`}>
        <Clock size={compact ? 10 : 12} />
        {!compact && 'Arquivado'}
      </span>
    );
  }

  const styles = {
    premium: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    good: 'bg-blue-50 text-blue-600 border-blue-100',
    improvable: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  const icons = {
    premium: <CheckCircle className="shrink-0" />,
    good: <CheckCircle className="shrink-0" />,
    improvable: <AlertTriangle className="shrink-0" />,
  };

  const labels = {
    premium: 'Premium',
    good: 'Bom',
    improvable: 'Crítico',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest leading-none rounded-lg border ${styles[status as keyof typeof styles] || styles.improvable} ${compact ? 'px-2 py-1 text-[8px]' : 'px-3 py-1.5 text-[9px]'}`}>
      {React.cloneElement(icons[status as keyof typeof icons] || icons.improvable, { size: compact ? 10 : 12 })}
      {!compact && (labels[status as keyof typeof labels] || 'Refazer')}
    </span>
  );
}

export default ExerciseLibrary;
