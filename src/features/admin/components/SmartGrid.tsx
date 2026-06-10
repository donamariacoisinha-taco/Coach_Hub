import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  const { 
    exercises, 
    searchQuery, 
    selectedMuscleFilter, 
    openEditor, 
    updateExercise, 
    updateExerciseStatus, 
    deleteExercise, 
    duplicateExercise 
  } = useAdminStore();
  const { visibleColumns, viewMode } = useLibraryStore();
  const { showSuccess, showError } = useErrorHandler();
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Column Filters state
  const [colFilters, setColFilters] = useState({
    name: '',
    subgroups: '',
    group: 'Todos',
    visibility: 'Todos',
    score: 'Todos',
    usage: 'Todos',
    media: 'Todos'
  });

  // Sorting state
  const [sortField, setSortField] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  // Integrated Sorting & Filtering Engine
  const processedExercises = useMemo(() => {
    let result = [...exercises];

    // 1. Global Search query tracking
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ex => 
        (ex.name || '').toLowerCase().includes(q) || 
        (ex.muscle_group || '').toLowerCase().includes(q)
      );
    }

    // 2. Global Muscle filter pill selection
    if (selectedMuscleFilter !== 'Todos') {
      result = result.filter(ex => 
        ex.muscle_group === selectedMuscleFilter ||
        (selectedMuscleFilter === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||
        (selectedMuscleFilter === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||
        (selectedMuscleFilter === 'Ombros' && ex.muscle_group === 'Ombro')
      );
    }

    // 3. Column-specific filters
    if (colFilters.name) {
      const q = colFilters.name.toLowerCase();
      result = result.filter(ex => (ex.name || '').toLowerCase().includes(q));
    }

    if (colFilters.subgroups) {
      const q = colFilters.subgroups.toLowerCase();
      result = result.filter(ex => 
        (ex.secondary_muscles || []).some(m => m.toLowerCase().includes(q))
      );
    }

    if (colFilters.group !== 'Todos') {
      result = result.filter(ex => ex.muscle_group === colFilters.group);
    }

    if (colFilters.visibility !== 'Todos') {
      const isPublished = colFilters.visibility === 'Público';
      result = result.filter(ex => !!ex.is_active === isPublished);
    }

    if (colFilters.score !== 'Todos') {
      if (colFilters.score === 'Crítico (< 45)') {
        result = result.filter(ex => (ex.quality_score_v3 || 0) < 45);
      } else if (colFilters.score === 'Bom (45-75)') {
        result = result.filter(ex => (ex.quality_score_v3 || 0) >= 45 && (ex.quality_score_v3 || 0) <= 75);
      } else if (colFilters.score === 'Excelente (> 75)') {
        result = result.filter(ex => (ex.quality_score_v3 || 0) > 75);
      }
    }

    if (colFilters.usage !== 'Todos') {
      if (colFilters.usage === 'Nenhum') {
        result = result.filter(ex => (ex.usage_count || 0) === 0);
      } else if (colFilters.usage === 'Baixo (1-5)') {
        result = result.filter(ex => (ex.usage_count || 0) >= 1 && (ex.usage_count || 0) <= 5);
      } else if (colFilters.usage === 'Alto (> 5)') {
        result = result.filter(ex => (ex.usage_count || 0) > 5);
      }
    }

    if (colFilters.media !== 'Todos') {
      const hasMedia = colFilters.media === 'Com Mídia';
      result = result.filter(ex => !!(ex.image_url || ex.static_frame_url) === hasMedia);
    }

    // 4. Sorting Handler
    if (sortField) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortField === 'muscle_group') {
          valA = (a.muscle_group || '').toLowerCase();
          valB = (b.muscle_group || '').toLowerCase();
        } else if (sortField === 'secondary_muscles') {
          valA = (a.secondary_muscles || []).join(', ').toLowerCase();
          valB = (b.secondary_muscles || []).join(', ').toLowerCase();
        } else if (sortField === 'is_active') {
          valA = a.is_active ? 1 : 0;
          valB = b.is_active ? 1 : 0;
        } else if (sortField === 'quality_score') {
          valA = a.quality_score_v3 || 0;
          valB = b.quality_score_v3 || 0;
        } else if (sortField === 'usage_count') {
          valA = a.usage_count || 0;
          valB = b.usage_count || 0;
        } else if (sortField === 'thumb') {
          valA = (a.image_url || a.static_frame_url) ? 1 : 0;
          valB = (b.image_url || b.static_frame_url) ? 1 : 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [exercises, searchQuery, selectedMuscleFilter, colFilters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetAllFilters = () => {
    setColFilters({
      name: '',
      subgroups: '',
      group: 'Todos',
      visibility: 'Todos',
      score: 'Todos',
      usage: 'Todos',
      media: 'Todos'
    });
    setSortField('name');
    setSortDirection('asc');
  };

  const isAnyFilterActive = 
    colFilters.name !== '' ||
    colFilters.subgroups !== '' ||
    colFilters.group !== 'Todos' ||
    colFilters.visibility !== 'Todos' ||
    colFilters.score !== 'Todos' ||
    colFilters.usage !== 'Todos' ||
    colFilters.media !== 'Todos';

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <span className="opacity-30 hover:opacity-100 transition-opacity ml-1 text-[9px]">⇅</span>;
    return sortDirection === 'asc' ? <span className="text-blue-600 ml-1">▲</span> : <span className="text-blue-600 ml-1">▼</span>;
  };

  const handleSelectAll = () => {
    if (selectedIds.length === processedExercises.length) onSelectChange([]);
    else onSelectChange(processedExercises.map(ex => ex.id));
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
          newStatus ? '🚀 Publicado' : '🚫 Ocultado', 
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
         {processedExercises.map(ex => (
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
              <div className="w-24 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm overflow-hidden relative">
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
       <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm shadow-slate-100/50">
             <tr className="bg-slate-50/20">
                <th className="px-8 py-6 w-16 sticky left-0 z-30 bg-white">
                   <input 
                     type="checkbox"
                     checked={selectedIds.length === processedExercises.length && processedExercises.length > 0}
                     onChange={handleSelectAll}
                     className="w-5 h-5 rounded-lg border-2 border-slate-200 cursor-pointer"
                   />
                </th>
                
                {/* Media Column Header */}
                {visibleColumns.includes('thumb') && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32 bg-white">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('thumb')}>
                           <span>Media</span>
                           {renderSortIndicator('thumb')}
                        </div>
                        <select 
                          value={colFilters.media}
                          onChange={(e) => setColFilters({ ...colFilters, media: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all cursor-pointer"
                        >
                           <option value="Todos">Todos</option>
                           <option value="Com Mídia">Com Mídia</option>
                           <option value="Sem Mídia">Sem Mídia</option>
                        </select>
                     </div>
                  </th>
                )}

                {/* Name Column Header */}
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky left-16 sm:left-24 z-30 bg-white min-w-[220px]">
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('name')}>
                         <span>Nome</span>
                         {renderSortIndicator('name')}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Filtrar nome" 
                        value={colFilters.name}
                        onChange={(e) => setColFilters({ ...colFilters, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1 text-[11px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all"
                      />
                   </div>
                </th>

                {/* Subgrupos Column Header */}
                {visibleColumns.includes('secondary_muscles') && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[190px] bg-white">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('secondary_muscles')}>
                            <span>Subgrupos</span>
                            {renderSortIndicator('secondary_muscles')}
                         </div>
                         <input 
                           type="text" 
                           placeholder="Filtrar subgrupo" 
                           value={colFilters.subgroups}
                           onChange={(e) => setColFilters({ ...colFilters, subgroups: e.target.value })}
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1 text-[11px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all"
                         />
                      </div>
                  </th>
                )}

                {/* Grupo Column Header */}
                {visibleColumns.includes('muscle_group') && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[160px] bg-white">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('muscle_group')}>
                           <span>Grupo</span>
                           {renderSortIndicator('muscle_group')}
                        </div>
                        <select 
                          value={colFilters.group}
                          onChange={(e) => setColFilters({ ...colFilters, group: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all cursor-pointer"
                        >
                           <option value="Todos">Todos</option>
                           <option value="Peito">Peito</option>
                           <option value="Costas">Costas</option>
                           <option value="Ombros">Ombros</option>
                           <option value="Pernas">Pernas</option>
                           <option value="Bíceps">Bíceps</option>
                           <option value="Tríceps">Tríceps</option>
                           <option value="Abdominais">Abdominais</option>
                           <option value="Quadríceps">Quadríceps</option>
                           <option value="Posterior">Posterior</option>
                           <option value="Glúteos">Glúteos</option>
                           <option value="Panturrilha">Panturrilha</option>
                           <option value="Full Body">Full Body</option>
                           <option value="Cardio">Cardio</option>
                           <option value="Mobilidade">Mobilidade</option>
                        </select>
                     </div>
                  </th>
                )}

                {/* Visibilidade Column Header */}
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[160px] bg-white">
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('is_active')}>
                         <span>Visibilidade</span>
                         {renderSortIndicator('is_active')}
                      </div>
                      <select 
                        value={colFilters.visibility}
                        onChange={(e) => setColFilters({ ...colFilters, visibility: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all cursor-pointer"
                      >
                         <option value="Todos">Todas</option>
                         <option value="Público">Públicas/Ativas</option>
                         <option value="Oculto">Ocultas</option>
                      </select>
                   </div>
                </th>

                {/* Score Column Header */}
                {visibleColumns.includes('quality_score') && (
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[150px] bg-white">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('quality_score')}>
                            <span>Score</span>
                            {renderSortIndicator('quality_score')}
                         </div>
                         <select 
                           value={colFilters.score}
                           onChange={(e) => setColFilters({ ...colFilters, score: e.target.value })}
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all cursor-pointer"
                         >
                            <option value="Todos">Todos</option>
                            <option value="Crítico (< 45)">Crítico (&lt; 45)</option>
                            <option value="Bom (45-75)">Bom (45-75)</option>
                            <option value="Excelente (> 75)">Excelente (&gt; 75)</option>
                         </select>
                      </div>
                   </th>
                )}

                {/* Usage Column Header */}
                {visibleColumns.includes('usage_count') && (
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[130px] bg-white">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-1 cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort('usage_count')}>
                            <span>Uso</span>
                            {renderSortIndicator('usage_count')}
                         </div>
                         <select 
                           value={colFilters.usage}
                           onChange={(e) => setColFilters({ ...colFilters, usage: e.target.value })}
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all cursor-pointer"
                         >
                            <option value="Todos">Todos</option>
                            <option value="Nenhum">Nenhum</option>
                            <option value="Baixo (1-5)">Baixo (1-5)</option>
                            <option value="Alto (> 5)">Alto (&gt; 5)</option>
                         </select>
                      </div>
                   </th>
                )}

                {/* Actions Column Header with integrated Clear Filters */}
                {visibleColumns.includes('actions') && (
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right sticky right-0 z-30 bg-white w-44">
                      <div className="flex flex-col gap-2 items-end">
                         <span className="cursor-default text-right pr-2 select-none uppercase font-black text-slate-400">Ações</span>
                         {isAnyFilterActive ? (
                            <button
                              type="button"
                              onClick={resetAllFilters}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer scale-100 active:scale-95 shadow-sm shadow-blue-500/20 border-none"
                            >
                               Limpar
                            </button>
                         ) : (
                            <div className="h-[26px]" />
                         )}
                      </div>
                   </th>
                )}
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {processedExercises.map(ex => (
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
                       <div className="w-[72px] h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 shadow-inner overflow-hidden border border-slate-100">
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

                  {/* Subgrupos */}
                  {visibleColumns.includes('secondary_muscles') && (
                    <td className="px-6 py-6 max-w-[240px]">
                       <input 
                         key={`${ex.id}-${(ex.secondary_muscles || []).join(',')}`}
                         type="text"
                         defaultValue={(ex.secondary_muscles || []).join(', ')}
                         onBlur={async (e) => {
                           const val = e.target.value;
                           const currentStr = (ex.secondary_muscles || []).join(', ');
                           if (val.trim() !== currentStr.trim()) {
                             const arr = val ? val.split(',').map((item: string) => item.trim()).filter(Boolean) : [];
                             await handleInlineSave(ex.id, 'secondary_muscles', arr);
                           }
                         }}
                         onKeyDown={async (e) => {
                           if (e.key === 'Enter') {
                             const target = e.target as HTMLInputElement;
                             const val = target.value;
                             const currentStr = (ex.secondary_muscles || []).join(', ');
                             if (val.trim() !== currentStr.trim()) {
                               const arr = val ? val.split(',').map((item: string) => item.trim()).filter(Boolean) : [];
                               await handleInlineSave(ex.id, 'secondary_muscles', arr);
                             }
                             target.blur();
                           }
                         }}
                         placeholder="Ex: Trapézio, Romboides"
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all font-sans"
                       />
                    </td>
                  )}

                  {/* Muscle Group */}
                  {visibleColumns.includes('muscle_group') && (
                    <td className="px-6 py-6 min-w-[170px]">
                       <select
                         value={ex.muscle_group || ''}
                         onChange={async (e) => {
                           await handleInlineSave(ex.id, 'muscle_group', e.target.value);
                         }}
                         className="w-full bg-blue-50 hover:bg-blue-100/80 border border-blue-100/50 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-700 outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer transition-all font-sans"
                       >
                         <option value="">Selecione</option>
                         {['Peito', 'Costas', 'Ombros', 'Pernas', 'Bíceps', 'Tríceps', 'Abdominais', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Full Body', 'Cardio', 'Mobilidade'].map(opt => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </select>
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
                    <td className="px-6 py-6 text-right sticky right-0 z-30 bg-inherit border-l border-slate-100 w-44">
                       <div className={`flex items-center justify-end gap-2 transition-opacity bg-inherit ${
                         menuOpenId === ex.id 
                           ? 'opacity-100 sm:opacity-100' 
                           : 'opacity-100 sm:opacity-0 group-hover:opacity-100'
                       }`}>
                          {/* Quick Edit button */}
                          <button 
                            onClick={() => openEditor(ex)}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm cursor-pointer"
                            title="Editar Exercício"
                          >
                             <Edit3 size={16} />
                          </button>
                          
                          {/* Quick Delete button (visible directly in row) */}
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Tem certeza de que deseja excluir permanentemente o exercício "${ex.name}"? Esta ação não pode ser desfeita.`)) {
                                try {
                                  await deleteExercise(ex.id);
                                  showSuccess('Removido', 'Exercício excluído com sucesso.');
                                } catch (err: any) {
                                  showError('Erro ao deletar', err.message || 'Erro inesperado');
                                }
                              }
                            }}
                            className="p-2.5 rounded-xl bg-white border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm cursor-pointer"
                            title="Excluir Exercício"
                          >
                             <Trash2 size={16} />
                          </button>
                          
                          {/* More dropdown options menu */}
                          <div className="relative inline-block text-left" ref={menuOpenId === ex.id ? menuRef : null}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMenuOpenId(menuOpenId === ex.id ? null : ex.id);
                              }}
                              className={`p-2.5 rounded-xl bg-white border transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                                menuOpenId === ex.id 
                                  ? 'border-slate-400 text-slate-950 bg-slate-50' 
                                  : 'border-slate-200 text-slate-300 hover:text-slate-950 hover:border-slate-400'
                              }`}
                              title="Mais Opções"
                            >
                               <MoreHorizontal size={16} />
                            </button>

                            <AnimatePresence>
                              {menuOpenId === ex.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  transition={{ duration: 0.12 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 focus:outline-none origin-top-right overflow-hidden text-left"
                                >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(null);
                                        openEditor(ex);
                                      }}
                                      className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-all text-left cursor-pointer"
                                    >
                                      <Edit3 size={14} className="text-slate-400" />
                                      Editar
                                    </button>

                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(null);
                                        try {
                                          await duplicateExercise(ex);
                                          showSuccess('Duplicado', 'Exercício duplicado como rascunho.');
                                        } catch (err: any) {
                                          showError('Erro ao duplicar', err.message || 'Erro inesperado');
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-all text-left cursor-pointer"
                                    >
                                      <Zap size={14} className="text-yellow-500 fill-yellow-500/10" />
                                      Duplicar
                                    </button>

                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(null);
                                        try {
                                          const nextStatus = !ex.is_active;
                                          await updateExerciseStatus(ex.id, nextStatus);
                                          showSuccess(
                                            nextStatus ? '🚀 Publicado' : '🚫 Ocultado', 
                                            `${ex.name} agora está ${nextStatus ? 'visível' : 'oculto'}.`
                                          );
                                        } catch (err: any) {
                                          showError('Erro ao alterar status', err.message || 'Erro inesperado');
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-all border-b border-slate-100 pb-3 mb-1 text-left cursor-pointer"
                                    >
                                      {ex.is_active ? (
                                        <>
                                          <EyeOff size={14} className="text-slate-400" />
                                          Ocultar da App
                                        </>
                                      ) : (
                                        <>
                                          <Eye size={14} className="text-slate-400" />
                                          Publicar na App
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(null);
                                        if (window.confirm(`Tem certeza de que deseja excluir permanentemente o exercício "${ex.name}"? Esta ação não pode ser desfeita.`)) {
                                          try {
                                            await deleteExercise(ex.id);
                                            showSuccess('Removido', 'Exercício excluído com sucesso.');
                                          } catch (err: any) {
                                            showError('Erro ao deletar', err.message || 'Erro inesperado');
                                          }
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-all text-left font-black cursor-pointer"
                                    >
                                      <Trash2 size={14} className="text-red-500" />
                                      Excluir Exercício
                                    </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
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
