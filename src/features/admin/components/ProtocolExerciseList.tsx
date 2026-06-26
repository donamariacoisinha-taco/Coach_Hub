import React, { useState, useMemo } from 'react';
import { Plus, Search, Dumbbell, Play, PlusCircle, Check, HelpCircle, Copy, Trash2 } from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { Exercise } from '../../../types';
import { ProtocolExerciseCard } from './ProtocolExerciseCard';
import { motion, AnimatePresence } from 'motion/react';

interface ProtocolExerciseListProps {
  exercises: PremiumProtocolExercise[];
  exerciseLibrary: Exercise[];
  onAddExercise: (exerciseId: string) => void;
  onUpdateExercise: (index: number, field: keyof PremiumProtocolExercise, value: any) => void;
  onDeleteExercise: (index: number) => void;
  onDuplicateExercise: (index: number) => void;
  onMoveExercise: (index: number, direction: 'up' | 'down') => void;
  selectedDayTitle: string;
  selectedDayId: string | null;

  // Bulk Actions & Checkbox state mapping
  selectedExerciseIds: string[];
  onToggleSelectExercise: (id: string) => void;
  onSelectAllExercises: (dayId: string, select: boolean) => void;
  onBulkUpdateField: (field: keyof PremiumProtocolExercise, value: any) => void;
  onBulkDuplicate: () => void;
  onBulkDelete: () => void;
  onReorderExercises?: (dayId: string, fromIndex: number, toIndex: number) => void;
  onMoveExerciseToDay?: (fromDayId: string, fromIndex: number, toDayId: string) => void;
}

export const ProtocolExerciseList: React.FC<ProtocolExerciseListProps> = ({
  exercises,
  exerciseLibrary,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onDuplicateExercise,
  onMoveExercise,
  selectedDayTitle,
  selectedDayId,
  selectedExerciseIds,
  onToggleSelectExercise,
  onSelectAllExercises,
  onBulkUpdateField,
  onBulkDuplicate,
  onBulkDelete,
  onReorderExercises,
  onMoveExerciseToDay
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTag, setActiveTag] = useState('Todos');

  // Load Recents list from LocalStorage for ultra-high trainer productivity
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kyron_recent_exercise_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unique dynamic muscle groups list
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exerciseLibrary.forEach((ex) => {
      if (ex.muscle_group) groups.add(ex.muscle_group);
    });
    return ['Todos', 'Recentes', ...Array.from(groups).sort().slice(0, 8)];
  }, [exerciseLibrary]);

  // High performance filtered local list
  const filteredLibrary = useMemo(() => {
    let result = exerciseLibrary;

    // 1. Tag Filtering
    if (activeTag === 'Recentes') {
      result = result.filter((ex) => recentIds.includes(ex.id));
    } else if (activeTag !== 'Todos') {
      result = result.filter((ex) => (ex.muscle_group || '').toLowerCase() === activeTag.toLowerCase());
    }

    // 2. Query Search Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ex) => 
        ex.name.toLowerCase().includes(q) || 
        (ex.muscle_group || '').toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q)
      );
    }

    // Limit output to prevent UI lag while maintaining immediate responsiveness
    return result.slice(0, 10);
  }, [searchQuery, exerciseLibrary, activeTag, recentIds]);

  const handleSelectFromLibrary = (exerciseId: string) => {
    onAddExercise(exerciseId);
    setSearchQuery('');
    setShowDropdown(false);

    // Save and rotate recent exercise list
    const updatedRecents = [exerciseId, ...recentIds.filter(id => id !== exerciseId)].slice(0, 12);
    setRecentIds(updatedRecents);
    localStorage.setItem('kyron_recent_exercise_ids', JSON.stringify(updatedRecents));
  };

  const isAllChecked = useMemo(() => {
    if (exercises.length === 0) return false;
    return exercises.every((ex) => selectedExerciseIds.includes(ex.id));
  }, [exercises, selectedExerciseIds]);

  const toggleSelectAll = () => {
    if (!selectedDayId) return;
    onSelectAllExercises(selectedDayId, !isAllChecked);
  };

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exerciseLibrary.forEach((ex) => map.set(ex.id, ex));
    return map;
  }, [exerciseLibrary]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-5">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {exercises.length > 0 && (
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={toggleSelectAll}
              className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              title="Selecionar todos os exercícios"
            />
          )}
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Dumbbell size={16} className="text-blue-500" />
              Exercícios de {selectedDayTitle}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Prescrição Detalhada
            </p>
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 uppercase tracking-widest shrink-0 self-start sm:self-center">
          Total: {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'}
        </div>
      </div>

      {/* Bulk actions panel with framer-motion */}
      <AnimatePresence>
        {selectedExerciseIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col gap-3 overflow-hidden border border-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                  Ações em Massa ({selectedExerciseIds.length} selecionados)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectAllExercises(selectedDayId || '', false)}
                className="text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border-none cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Quick Param Updates */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Séries</label>
                <input
                  type="number"
                  placeholder="Alt. Séries"
                  onChange={(e) => onBulkUpdateField('sets', Number(e.target.value) || 3)}
                  className="h-8 w-full px-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 border-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Reps</label>
                <input
                  type="text"
                  placeholder="Alt. Repetições"
                  onBlur={(e) => { if (e.target.value) onBulkUpdateField('reps', e.target.value); }}
                  className="h-8 w-full px-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 border-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Descanso</label>
                <input
                  type="number"
                  placeholder="Alt. Descanso"
                  onChange={(e) => onBulkUpdateField('rest_seconds', Number(e.target.value) || 60)}
                  className="h-8 w-full px-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 border-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Carga</label>
                <input
                  type="text"
                  placeholder="Alt. Carga"
                  onBlur={(e) => { if (e.target.value) onBulkUpdateField('load_type', e.target.value); }}
                  className="h-8 w-full px-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 border-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">RPE</label>
                <input
                  type="text"
                  placeholder="Alt. RPE"
                  onBlur={(e) => { if (e.target.value) onBulkUpdateField('rpe', e.target.value); }}
                  className="h-8 w-full px-2 rounded-lg bg-slate-800 text-white placeholder:text-slate-500 border-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-2.5 mt-1">
              <button
                type="button"
                onClick={onBulkDuplicate}
                className="h-8 px-3 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-500 border-none cursor-pointer transition-colors"
              >
                <Copy size={12} /> Duplicar Selecionados
              </button>
              <button
                type="button"
                onClick={onBulkDelete}
                className="h-8 px-3 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-rose-700 border-none cursor-pointer transition-colors"
              >
                <Trash2 size={12} /> Excluir Selecionados
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Search & Add Exercise bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar & Adicionar exercício..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs placeholder:text-slate-400 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Horizontal tag pills for filtering */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar max-w-full">
          {muscleGroups.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setActiveTag(tag);
                setShowDropdown(true);
              }}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full transition-all border shrink-0 cursor-pointer ${
                activeTag === tag
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Results Dropdown Overlay */}
        <AnimatePresence>
          {showDropdown && (searchQuery.trim().length > 0 || activeTag !== 'Todos') && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="relative bg-white border border-slate-200 shadow-xl rounded-2xl z-50 p-2 overflow-hidden max-h-[300px] overflow-y-auto mt-1"
            >
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-50">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Exercícios Disponíveis ({activeTag})
                </span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {filteredLibrary.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Nenhum exercício correspondente.
                </div>
              ) : (
                filteredLibrary.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectFromLibrary(ex.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors border-none text-left cursor-pointer"
                  >
                    <img
                      src={ex.image_url || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop"}
                      alt={ex.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 truncate">{ex.name}</p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{ex.muscle_group || 'Geral'}</p>
                    </div>
                    <PlusCircle size={14} className="text-blue-500 hover:text-blue-600 shrink-0" />
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercises Cards list */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {exercises.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
              <Dumbbell size={32} className="text-slate-300 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-slate-600">Nenhum exercício neste dia</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Use o campo acima para buscar e adicionar exercícios para criar o treino deste dia.
                </p>
              </div>
            </div>
          ) : (
            exercises.map((ex, idx) => {
              const details = exerciseMap.get(ex.exercise_id);
              const isChecked = selectedExerciseIds.includes(ex.id);
              return (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProtocolExerciseCard
                    exercise={ex}
                    details={details ? {
                      name: details.name,
                      muscle_group: details.muscle_group || 'Geral',
                      image_url: details.image_url
                    } : undefined}
                    index={idx}
                    onUpdateField={(field, val) => onUpdateExercise(idx, field, val)}
                    onDelete={() => onDeleteExercise(idx)}
                    onDuplicate={() => onDuplicateExercise(idx)}
                    onMove={(dir) => onMoveExercise(idx, dir)}
                    isFirst={idx === 0}
                    isLast={idx === exercises.length - 1}
                    isSelected={isChecked}
                    onToggleSelect={() => onToggleSelectExercise(ex.id)}
                    onReorder={(fromIdx, toIdx) => onReorderExercises && onReorderExercises(selectedDayId || '', fromIdx, toIdx)}
                    onMoveToDay={(fromDayId, fromIdx, toDayId) => onMoveExerciseToDay && onMoveExerciseToDay(fromDayId, fromIdx, toDayId)}
                  />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
