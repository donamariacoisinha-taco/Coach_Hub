import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Skull, 
  FlaskConical,
  MoreHorizontal,
  ChevronRight,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { useLibraryStore } from '../store/libraryStore';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { Exercise } from '../../../types';
import InlineCellEditor from './InlineCellEditor';
import { adminApi } from '../../../lib/api/adminApi';
import { VisibilityBadge, VisibilityToggle } from './VisibilityBadge';

interface SmartGridProps {
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
}

const SmartGrid: React.FC<SmartGridProps> = ({ selectedIds, onSelectChange }) => {
  const { exercises, searchQuery, selectedMuscleFilter, openEditor, updateExercise, updateExerciseStatus } = useAdminStore();
  const { visibleColumns, viewMode } = useLibraryStore();
  const { showSuccess, showError } = useErrorHandler();
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);

  const filtered = useMemo(() => {
    let result = exercises;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ex => 
        (ex.name || '').toLowerCase().includes(q) || 
        (ex.muscle_group || '').toLowerCase().includes(q)
      );
    }
    if (selectedMuscleFilter !== 'Todos') {
      result = result.filter(ex => 
        ex.muscle_group === selectedMuscleFilter ||
        (selectedMuscleFilter === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||
        (selectedMuscleFilter === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||
        (selectedMuscleFilter === 'Ombros' && ex.muscle_group === 'Ombro')
      );
    }
    return result;
  }, [exercises, searchQuery, selectedMuscleFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) onSelectChange([]);
    else onSelectChange(filtered.map(ex => ex.id));
  };

  const handleInlineSave = async (id: string, field: string, value: any) => {
    setEditingCell(null);
    const ex = exercises.find(e => e.id === id);
    if (!ex) return;

    try {
      if (field === 'is_active') {
        const newStatus = !!value;
        await updateExerciseStatus(id, newStatus);
        showSuccess(
          newStatus ? '🚀 Pubblicado' : '🚫 Ocultado', 
          `${ex.name} agora está ${newStatus ? 'visível' : 'oculto'}.`
        );
      } else {
        await updateExercise(id, { [field]: value });
        showSuccess('Célula Atualizada', `O campo ${field} foi salvo com sucesso.`);
      }
    } catch (err: any) {
      showError('Erro ao salvar alteração', err.message || 'Ocorreu um erro inesperado.');
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-10">
         {filtered.map(ex => (
           <div 
             key={ex.id}
             onClick={() => openEditor(ex)}
             className="group bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-pointer relative"
           >
              <div className="absolute top-6 right-6">
                 <input 
                   type="checkbox" 
                   checked={selectedIds.includes(ex.id)}
                   onClick={(e) => e.stopPropagation()}
                   onChange={() => {
                     const next = selectedIds.includes(ex.id) 
                       ? selectedIds.filter(i => i !== ex.id)
                       : [...selectedIds, ex.id];
                     onSelectChange(next);
                   }}
                   className="w-5 h-5 rounded-lg border-2 border-slate-200 cursor-pointer"
                 />
              </div>
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm overflow-hidden relative">
                 {ex.image_url || ex.static_frame_url ? (
                  <img 
                    src={ex.image_url || ex.static_frame_url} 
                    className="w-full h-full object-contain rounded-3xl" 
                    referrerPolicy="no-referrer"
                  />
                ) : <Zap className="text-slate-200" />}
                 {!ex.is_active && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center"><EyeOff size={16} className="text-white" /></div>}
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-black text-slate-950 uppercase tracking-tight line-clamp-1">{ex.name}</h4>
                <VisibilityBadge isPublished={!!ex.is_active} compact />
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{ex.muscle_group}</span>
                 <span className="text-[9px] font-bold text-slate-400">Score: {ex.quality_score_v3 || 0}</span>
              </div>
           </div>
         ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto no-scrollbar">
       <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
             <tr>
                <th className="px-8 py-6 w-16 sticky left-0 z-30 bg-white">
                   <input 
                     type="checkbox"
                     checked={selectedIds.length === filtered.length && filtered.length > 0}
                     onChange={handleSelectAll}
                     className="w-5 h-5 rounded-lg border-2 border-slate-200 cursor-pointer"
                   />
                </th>
                {visibleColumns.includes('thumb') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Media</th>}
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky left-16 sm:left-24 z-30 bg-white min-w-[200px]">Nome</th>
                {visibleColumns.includes('muscle_group') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Grupo</th>}
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Visibilidade</th>
                {visibleColumns.includes('difficulty_level') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Dificuldade</th>}
                {visibleColumns.includes('quality_score') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>}
                {visibleColumns.includes('usage_count') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Uso</th>}
                {visibleColumns.includes('actions') && <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right sticky right-0 z-30 bg-white">Ações</th>}
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {filtered.map(ex => (
               <tr 
                 key={ex.id}
                 className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.includes(ex.id) ? 'bg-blue-50/30' : ''}`}
               >
                  <td className="px-8 py-6 sticky left-0 z-10 bg-inherit border-r border-slate-100">
                     <input 
                       type="checkbox"
                       checked={selectedIds.includes(ex.id)}
                       onChange={() => {
                         const next = selectedIds.includes(ex.id) 
                           ? selectedIds.filter(i => i !== ex.id)
                           : [...selectedIds, ex.id];
                         onSelectChange(next);
                       }}
                       className="w-5 h-5 rounded-lg border-2 border-slate-200 cursor-pointer"
                     />
                  </td>
                  {visibleColumns.includes('thumb') && (
                    <td className="px-6 py-6">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner overflow-hidden border border-slate-100">
                          {(ex.image_url || ex.static_frame_url) ? (
                            <img 
                              src={ex.image_url || ex.static_frame_url} 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          ) : <Zap size={18} />}
                       </div>
                    </td>
                  )}
                  
                  {/* Inline Editable Name */}
                  <td className="px-6 py-6 sticky left-16 sm:left-24 z-10 bg-inherit border-r border-slate-100 min-w-[200px]" onDoubleClick={() => setEditingCell({ id: ex.id, field: 'name' })}>
                     {editingCell?.id === ex.id && editingCell?.field === 'name' ? (
                       <InlineCellEditor 
                         value={ex.name} 
                         onSave={(val) => handleInlineSave(ex.id, 'name', val)} 
                         onCancel={() => setEditingCell(null)} 
                       />
                     ) : (
                       <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-950 uppercase tracking-tight">{ex.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Double click to edit</span>
                       </div>
                     )}
                  </td>

                  {/* Muscle Group */}
                  {visibleColumns.includes('muscle_group') && (
                    <td className="px-6 py-6 relative" onDoubleClick={() => setEditingCell({ id: ex.id, field: 'muscle_group' })}>
                      {editingCell?.id === ex.id && editingCell?.field === 'muscle_group' ? (
                         <InlineCellEditor 
                           value={ex.muscle_group} 
                           type="select"
                           options={['Peito', 'Costas', 'Ombros', 'Pernas', 'Bíceps', 'Tríceps', 'Abdominais']} 
                           onSave={(val) => handleInlineSave(ex.id, 'muscle_group', val)} 
                           onCancel={() => setEditingCell(null)} 
                         />
                      ) : (
                         <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">{ex.muscle_group}</span>
                      )}
                    </td>
                  )}

                  {/* Visibility Toggle */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                       <VisibilityBadge isPublished={!!ex.is_active} compact />
                       <VisibilityToggle 
                         isPublished={!!ex.is_active} 
                         onToggle={(e) => { e.stopPropagation(); handleInlineSave(ex.id, 'is_active', !ex.is_active); }} 
                       />
                    </div>
                  </td>

                  {visibleColumns.includes('difficulty_level') && (
                    <td className="px-6 py-6">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ex.difficulty_level || 'Beginner'}</span>
                    </td>
                  )}

                  {visibleColumns.includes('quality_score') && (
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-slate-900">{ex.quality_score_v3 || 0}</span>
                          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-slate-950" style={{ width: `${ex.quality_score_v3 || 0}%` }} />
                          </div>
                       </div>
                    </td>
                  )}

                  {visibleColumns.includes('usage_count') && (
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <Activity size={12} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-900">{ex.usage_count || 0}</span>
                       </div>
                    </td>
                  )}

                  {visibleColumns.includes('actions') && (
                    <td className="px-6 py-6 text-right sticky right-0 z-10 bg-inherit border-l border-slate-100">
                       <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-inherit">
                          <button 
                            onClick={() => openEditor(ex)}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          >
                             <Edit3 size={16} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-slate-950 transition-all shadow-sm">
                             <MoreHorizontal size={16} />
                          </button>
                       </div>
                    </td>
                  )}
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );
};

export default SmartGrid;
