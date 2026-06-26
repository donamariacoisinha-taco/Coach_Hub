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
  onUpdateDayField?: (dayId: string, field: any, value: any) => void;
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
  onMoveExerciseToDay,
  onUpdateDayField
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTag, setActiveTag] = useState('Todos');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  // Load Recents list from LocalStorage for ultra-high trainer productivity
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kyron_recent_exercise_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Predefined Groups and Subgroups for KYRON OS
  const MAIN_GROUPS = useMemo(() => [
    'Todos',
    'Recentes',
    'Peitoral',
    'Costas',
    'Ombros',
    'Braços',
    'Core',
    'Pernas',
    'Cardio',
    'Mobilidade'
  ], []);

  const SUB_GROUPS = useMemo(() => [
    'Peitoral Superior',
    'Peitoral Médio',
    'Peitoral Inferior',
    'Dorsais',
    'Espessura de Costas',
    'Trapézio',
    'Lombar / Eretores',
    'Deltoide Anterior',
    'Deltoide Lateral',
    'Deltoide Posterior',
    'Bíceps',
    'Tríceps',
    'Antebraço',
    'Abdômen Superior',
    'Abdômen Inferior',
    'Oblíquos',
    'Core Profundo',
    'Quadríceps',
    'Posterior de Coxa',
    'Glúteos',
    'Panturrilhas',
    'Adutores',
    'Abdutores'
  ], []);

  // Helper to check if muscle group matches the filter tag including variations and subgrupos
  const checkMuscleMatch = (exercise: Exercise, filter: string): boolean => {
    if (!exercise) return false;
    const mg = (exercise.muscle_group || '').toLowerCase().trim();
    const name = (exercise.name || '').toLowerCase().trim();
    const desc = ((exercise.description || '') + ' ' + (exercise.instructions || '')).toLowerCase();
    const sec = (exercise.secondary_muscles || []).map(s => s.toLowerCase());
    const f = filter.toLowerCase().trim();

    if (f === 'todos') return true;

    // Helper functions for easy searching
    const hasWord = (term: string) => name.includes(term) || desc.includes(term) || sec.some(s => s.includes(term));

    // MAIN GROUPS MAPPING
    if (f === 'peitoral') {
      return mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo') || hasWord('peitoral') || hasWord('peito');
    }
    if (f === 'costas') {
      return mg === 'costas' || mg === 'back' || mg === 'dorsais' || mg === 'eretores' || hasWord('remada') || hasWord('puxada') || hasWord('pulldown') || hasWord('pullover') || hasWord('dorsal');
    }
    if (f === 'ombros') {
      return mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'deltoids' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro') || hasWord('elevação lateral') || hasWord('desenvolvimento');
    }
    if (f === 'braços') {
      return mg === 'braço' || mg === 'braços' || mg === 'arms' || mg === 'bíceps' || mg === 'tríceps' || mg === 'antebraço' || 
             hasWord('bíceps') || hasWord('tríceps') || hasWord('antebraço') || hasWord('rosca') || hasWord('triceps') || hasWord('biceps') || hasWord('braço');
    }
    if (f === 'core') {
      return mg === 'core' || mg === 'abdômen' || mg === 'abs' || mg === 'obliquos' || mg === 'eretores' || mg === 'lombar' || 
             hasWord('core') || hasWord('prancha') || hasWord('lombar') || hasWord('transverso') || hasWord('abdominal');
    }
    if (f === 'pernas') {
      return mg === 'perna' || mg === 'pernas' || mg === 'legs' || mg === 'quadríceps' || mg === 'posterior' || mg === 'glúteos' || mg === 'panturrilhas' || mg === 'adutores' || mg === 'abdutores' ||
             hasWord('agachamento') || hasWord('leg press') || hasWord('extensora') || hasWord('flexora') || hasWord('stiff') || hasWord('glúteo') || hasWord('panturrilha');
    }
    if (f === 'cardio') {
      return mg === 'cardio' || mg === 'aerobico' || mg === 'aeróbico' || hasWord('corrida') || hasWord('esteira') || hasWord('bike') || hasWord('elíptico') || hasWord('cardio');
    }
    if (f === 'mobilidade') {
      return mg === 'mobilidade' || mg === 'alongamento' || mg === 'flexibilidade' || hasWord('mobilidade') || hasWord('alongamento') || hasWord('flexibilidade');
    }

    // SUBGROUPS MAPPING
    // Peitoral subgrupos
    if (f === 'peitoral superior') {
      const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo') || hasWord('peitoral') || hasWord('peito');
      return isPeito && (hasWord('inclinado') || hasWord('superior') || hasWord('inclined') || hasWord('clavicular'));
    }
    if (f === 'peitoral médio') {
      const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo') || hasWord('peitoral') || hasWord('peito');
      return isPeito && (hasWord('reto') || hasWord('médio') || hasWord('medio') || hasWord('flat') || (!hasWord('inclinado') && !hasWord('superior') && !hasWord('declinado') && !hasWord('inferior')));
    }
    if (f === 'peitoral inferior') {
      const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo') || hasWord('peitoral') || hasWord('peito');
      return isPeito && (hasWord('declinado') || hasWord('inferior') || hasWord('declined') || hasWord('infra') || hasWord('cross over alto') || hasWord('crossover alto') || hasWord('cross over baixo'));
    }

    // Costas / Dorsais subgrupos
    if (f === 'dorsais') {
      return mg === 'dorsais' || mg === 'dorsal' || mg === 'lats' || hasWord('dorsal') || hasWord('puxada') || hasWord('pulldown') || hasWord('puxador');
    }
    if (f === 'espessura de costas') {
      const isCostas = mg === 'costas' || mg === 'back' || mg === 'dorsais' || mg === 'eretores' || hasWord('remada') || hasWord('puxada') || hasWord('pulldown') || hasWord('pullover') || hasWord('dorsal');
      return isCostas && (hasWord('remada') || hasWord('row') || hasWord('meio de costas') || hasWord('espessura'));
    }
    if (f === 'trapézio') {
      return mg === 'trapezio' || mg === 'trapézio' || mg === 'trapezius' || hasWord('trapézio') || hasWord('trapezio') || hasWord('encolhimento') || hasWord('remada alta');
    }
    if (f === 'lombar / eretores') {
      return mg === 'eretores' || mg === 'erectors' || mg === 'lombar' || hasWord('eretor') || hasWord('lombar') || hasWord('extensão de tronco') || hasWord('hiperextensão');
    }

    // Ombros subgrupos
    if (f === 'deltoide anterior') {
      const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
      return isOmbro && (hasWord('anterior') || hasWord('desenvolvimento') || hasWord('front'));
    }
    if (f === 'deltoide lateral') {
      const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
      return isOmbro && (hasWord('lateral') || hasWord('elevação lateral') || hasWord('side deltoid'));
    }
    if (f === 'deltoide posterior') {
      const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
      return isOmbro && (hasWord('posterior') || hasWord('reverso') || hasWord('crucifixo inverso') || hasWord('rear deltoid'));
    }

    // Braços subgrupos
    if (f === 'bíceps') {
      return mg === 'biceps' || mg === 'bíceps' || hasWord('bíceps') || hasWord('biceps') || hasWord('rosca');
    }
    if (f === 'tríceps') {
      return mg === 'triceps' || mg === 'tríceps' || hasWord('tríceps') || hasWord('triceps') || hasWord('testa') || hasWord('corda') || hasWord('pulley');
    }
    if (f === 'antebraço') {
      return mg === 'antebraço' || mg === 'antebraços' || mg === 'forearm' || hasWord('antebraço') || hasWord('forearm') || hasWord('punho');
    }

    // Core subgrupos
    if (f === 'abdômen') {
      return mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen');
    }
    if (f === 'abdômen superior') {
      const isAbs = mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen');
      return isAbs && (hasWord('superior') || hasWord('supra') || hasWord('crunch'));
    }
    if (f === 'abdômen inferior') {
      const isAbs = mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen');
      return isAbs && (hasWord('inferior') || hasWord('infra') || hasWord('leg raise') || hasWord('elevação de perna'));
    }
    if (f === 'oblíquos') {
      return mg === 'oblíquos' || mg === 'obliquos' || mg === 'oblique' || hasWord('oblíquo') || hasWord('obliquo') || hasWord('obliques') || hasWord('russian twist');
    }
    if (f === 'core profundo') {
      const isCore = mg === 'core' || mg === 'abdômen' || mg === 'obliquos' || mg === 'eretores' || mg === 'lombar' || hasWord('core');
      return isCore && (hasWord('prancha') || hasWord('plank') || hasWord('transverso') || hasWord('profundo') || hasWord('perdigueiro'));
    }

    // Pernas subgrupos
    if (f === 'quadríceps') {
      return mg === 'quadriceps' || mg === 'quad' || mg === 'quadríceps' || mg === 'quads' || hasWord('quadríceps') || hasWord('quadriceps') || hasWord('extensora') || hasWord('leg press') || hasWord('hack') || hasWord('agachamento');
    }
    if (f === 'posterior de coxa') {
      return mg === 'posterior' || mg === 'posterior de coxa' || mg === 'isquiotibiais' || mg === 'hamstrings' || hasWord('posterior de coxa') || hasWord('isquiotibiais') || hasWord('flexora') || hasWord('stiff');
    }
    if (f === 'glúteos') {
      return mg === 'gluteo' || mg === 'glúteo' || mg === 'glutes' || mg === 'glúteos' || hasWord('glúteo') || hasWord('gluteo') || hasWord('pélvica') || hasWord('pelve');
    }
    if (f === 'panturrilhas') {
      return mg === 'panturrilha' || mg === 'panturrilhas' || mg === 'calves' || hasWord('panturrilha') || hasWord('gêmeos');
    }
    if (f === 'adutores') {
      return mg === 'adutores' || mg === 'adutor' || hasWord('adutor');
    }
    if (f === 'abdutores') {
      return mg === 'abdutores' || mg === 'abdutor' || hasWord('abdutor');
    }

    // Fallback exact/substring matching on muscle_group
    return mg.includes(f) || f.includes(mg);
  };

  // Unique dynamic uncovered muscle groups from database to avoid losing custom inputs
  const dbUncoveredGroups = useMemo(() => {
    const allPredefined = [...MAIN_GROUPS, ...SUB_GROUPS];
    const uncovered = new Set<string>();
    exerciseLibrary.forEach((ex) => {
      if (ex.muscle_group) {
        const mg = ex.muscle_group;
        const matched = allPredefined.some(fg => checkMuscleMatch(ex, fg));
        if (!matched) {
          uncovered.add(mg);
        }
      }
    });
    return Array.from(uncovered).sort();
  }, [exerciseLibrary, MAIN_GROUPS, SUB_GROUPS]);

  // High performance filtered local list
  const filteredLibrary = useMemo(() => {
    let result = exerciseLibrary;

    // 1. Tag Filtering
    if (activeTag === 'Recentes') {
      result = result.filter((ex) => recentIds.includes(ex.id));
    } else if (activeTag !== 'Todos') {
      result = result.filter((ex) => checkMuscleMatch(ex, activeTag));
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
    return result.slice(0, 40);
  }, [searchQuery, exerciseLibrary, activeTag, recentIds]);

  // Reset highlighted index when filtered library changes
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredLibrary]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelectFromLibrary = (exerciseId: string, keepOpen = true) => {
    onAddExercise(exerciseId);
    if (!keepOpen) {
      setSearchQuery('');
      setShowDropdown(false);
    } else {
      setSearchQuery('');
      setShowDropdown(true);
    }

    // Maintain focus on search input for continuous workflow
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    // Save and rotate recent exercise list
    const updatedRecents = [exerciseId, ...recentIds.filter(id => id !== exerciseId)].slice(0, 12);
    setRecentIds(updatedRecents);
    localStorage.setItem('kyron_recent_exercise_ids', JSON.stringify(updatedRecents));
  };

  const handleAddSelected = () => {
    // 1. Preserve visual list order of library items
    const orderedSelectedIds = [...selectedLibraryIds];
    
    // 2. Add each exercise to the workout
    orderedSelectedIds.forEach((id) => {
      onAddExercise(id);
    });

    // 3. Clear selection and close list
    setSelectedLibraryIds([]);
    setShowDropdown(false);
  };

  const toggleSelectLibraryId = (id: string) => {
    setSelectedLibraryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
    <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-6 flex flex-col gap-5">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
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
            <div className="flex items-center gap-2">
              <Dumbbell size={15} className="text-blue-500 shrink-0" />
              {onUpdateDayField && selectedDayId ? (
                <input
                  type="text"
                  value={selectedDayTitle}
                  onChange={(e) => onUpdateDayField(selectedDayId, 'title', e.target.value)}
                  placeholder="Nome do Treino"
                  title="Clique para renomear este treino"
                  className="bg-transparent border-none p-0 text-sm font-black text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 w-48 sm:w-64 transition-all focus:bg-slate-50 rounded px-1"
                />
              ) : (
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Exercícios de {selectedDayTitle}
                </h4>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Prescrição e Carga
            </p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 uppercase tracking-wider shrink-0 self-start sm:self-center">
          {exercises.length} {exercises.length === 1 ? 'exercício' : 'exercícios'}
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

      {/* macOS Spotlight-like Fixed Search Bar (at the top of Editor Column) */}
      <div className="flex flex-col gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 relative">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar & adicionar exercício ao treino..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (!showDropdown || filteredLibrary.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % filteredLibrary.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev - 1 + filteredLibrary.length) % filteredLibrary.length);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredLibrary[highlightedIndex];
                if (selected) {
                  // Enter still triggers individual selection keeping panel open
                  handleSelectFromLibrary(selected.id, true);
                }
              } else if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs placeholder:text-slate-400 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all shadow-inner"
          />
        </div>

        {/* Filter Rows: Desktop Multi-line Wrap & Mobile Ergonomic Scroll */}
        <div className="space-y-3.5 pt-1.5">
          {/* Row 1: Grupos Principais */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 select-none pl-1">
              Grupos Principais
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto md:flex-wrap pb-1 md:pb-0 no-scrollbar max-w-full">
              {MAIN_GROUPS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag);
                    setShowDropdown(true);
                  }}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full transition-all border shrink-0 cursor-pointer select-none ${
                    activeTag === tag
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Subgrupos Refinados */}
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-2.5">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 select-none pl-1">
              Subgrupos Refinados
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto md:flex-wrap pb-1 md:pb-0 no-scrollbar max-w-full">
              {[...SUB_GROUPS, ...dbUncoveredGroups].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag);
                    setShowDropdown(true);
                  }}
                  className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-full transition-all border shrink-0 cursor-pointer select-none ${
                    activeTag === tag
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Backdrop for click outside close */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => {
              if (selectedLibraryIds.length === 0) {
                setShowDropdown(false);
              } else {
                setShowCloseWarning(true);
                setTimeout(() => setShowCloseWarning(false), 3000);
              }
            }}
          />
        )}

        {/* Search Results Dropdown Overlay */}
        <AnimatePresence>
          {showDropdown && (searchQuery.trim().length > 0 || activeTag !== 'Todos') && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 p-3 flex flex-col max-h-[420px] overflow-hidden mt-11 left-0 right-0 w-full"
            >
              {/* Warning Banner */}
              {showCloseWarning && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-amber-500 text-white px-3 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider mb-2 animate-pulse leading-snug"
                >
                  Você tem exercícios selecionados! Adicione-os ou cancele a seleção para fechar.
                </motion.div>
              )}

              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Exercícios Disponíveis ({activeTag})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLibraryIds([]);
                    setShowDropdown(false);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 border-none bg-transparent cursor-pointer hover:underline transition-all"
                >
                  Fechar
                </button>
              </div>

              {filteredLibrary.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold flex-1 flex items-center justify-center">
                  Nenhum exercício correspondente.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredLibrary.map((ex, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    const isSelected = selectedLibraryIds.includes(ex.id);
                    const isAlreadyAdded = exercises.some(item => item.exercise_id === ex.id);

                    return (
                      <div
                        key={ex.id}
                        onClick={() => toggleSelectLibraryId(ex.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border-none text-left cursor-pointer group ${
                          isSelected 
                            ? 'bg-blue-50/60 border-l-4 border-l-blue-500 font-bold shadow-sm' 
                            : isHighlighted
                              ? 'bg-slate-50/80'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by click of row
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                        />

                        {/* Image cropped to 1408x768 */}
                        <div className="w-14 h-8 aspect-[1408/768] rounded-lg overflow-hidden border border-slate-100 shrink-0 relative bg-slate-50">
                          <img
                            src={ex.image_url || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop"}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-[11px] truncate leading-tight ${isSelected ? 'text-blue-700 font-extrabold' : 'text-slate-800 font-bold'}`}>
                              {ex.name}
                            </p>
                            
                            {isAlreadyAdded && (
                              <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                                Já adicionado
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                              {ex.muscle_group || 'Geral'}
                            </span>
                            {ex.equipment && (
                              <>
                                <span className="text-slate-300 text-[8px]">•</span>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                  {ex.equipment}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFromLibrary(ex.id, true);
                          }}
                          className="p-1.5 hover:bg-blue-100 text-blue-500 hover:text-blue-600 rounded-lg transition-colors border-none cursor-pointer flex items-center justify-center shrink-0"
                          title="Adicionar imediatamente"
                        >
                          <PlusCircle size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Multi-Select Actions Bar */}
              {selectedLibraryIds.length > 0 && (
                <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex items-center justify-between gap-2 mt-2 shadow-xl border border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 pl-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                      {selectedLibraryIds.length} {selectedLibraryIds.length === 1 ? 'selecionado' : 'selecionados'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddSelected}
                      className="h-7 px-3 bg-blue-600 text-white hover:bg-blue-500 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 border-none cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      <Check size={11} />
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLibraryIds([])}
                      className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[9px] uppercase tracking-wider border-none cursor-pointer transition-all active:scale-95"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLibraryIds([]);
                        setShowDropdown(false);
                      }}
                      className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-bold text-[9px] uppercase tracking-wider border-none cursor-pointer transition-all active:scale-95"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercises Cards list */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {exercises.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100 rounded-2xl p-6">
              <Dumbbell size={32} className="text-slate-300 animate-bounce" />
              <div>
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Este treino ainda não tem exercícios.</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Busque um exercício acima ou pressione Enter para adicionar rapidamente.
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="mt-4 h-8 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm mx-auto"
                >
                  <Plus size={11} />
                  + Adicionar primeiro exercício
                </button>
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
                    exerciseLibrary={exerciseLibrary}
                    onReplaceExercise={(newExId) => onUpdateExercise(idx, 'exercise_id', newExId)}
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
