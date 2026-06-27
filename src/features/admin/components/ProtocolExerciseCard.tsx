import React, { useState, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  Flame, 
  Zap, 
  Layers,
  GripVertical,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search
} from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { Exercise } from '../../../types';
import { getExerciseBiomechanics } from '../../../lib/exercises/exerciseTaxonomy';
import { motion, AnimatePresence } from 'motion/react';

interface ExerciseDetails {
  name: string;
  muscle_group: string;
  image_url?: string;
}

interface ProtocolExerciseCardProps {
  exercise: PremiumProtocolExercise;
  details: ExerciseDetails | undefined;
  index: number;
  onUpdateField: (field: keyof PremiumProtocolExercise, value: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onMoveToDay?: (fromDayId: string, fromIndex: number, toDayId: string) => void;
  exerciseLibrary?: Exercise[];
  onReplaceExercise?: (newExerciseId: string) => void;
}

export const ProtocolExerciseCard: React.FC<ProtocolExerciseCardProps> = React.memo(({
  exercise,
  details,
  index,
  onUpdateField,
  onDelete,
  onDuplicate,
  onMove,
  isFirst,
  isLast,
  isSelected = false,
  onToggleSelect,
  onReorder,
  onMoveToDay,
  exerciseLibrary,
  onReplaceExercise
}) => {
  const fallbackImg = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop";
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');

  const filteredReplaceLibrary = useMemo(() => {
    if (!exerciseLibrary) return [];
    
    const currentEx = exerciseLibrary.find(ex => ex.id === exercise.exercise_id);
    const getBiomechanics = (ex: Exercise) => ex.biomechanics || getExerciseBiomechanics(ex);
    
    // Calculate match score for replacement candidates
    const getReplacementScore = (candidate: Exercise) => {
      if (!currentEx) {
        // Fallback to legacy muscle_group match
        const sameMuscle = (candidate.muscle_group || '').toLowerCase() === (details?.muscle_group || '').toLowerCase();
        return sameMuscle ? 10 : 0;
      }
      
      const curBio = getBiomechanics(currentEx);
      const candBio = getBiomechanics(candidate);
      
      let score = 0;
      
      // Pattern match: Isolation vs Compound
      if (curBio.movement_pattern && candBio.movement_pattern && curBio.movement_pattern === candBio.movement_pattern) {
        score += 5;
      }
      
      // Primary group match
      if (curBio.primary_group && candBio.primary_group && curBio.primary_group === candBio.primary_group) {
        score += 10;
      }
      
      // Agonist muscle overlap
      const curAgonists = curBio.agonist_muscles || [];
      const candAgonists = candBio.agonist_muscles || [];
      curAgonists.forEach(am => {
        if (candAgonists.includes(am)) {
          score += 6;
        }
      });

      // Synergist overlap
      const curSynergists = curBio.synergist_muscles || [];
      const candSynergists = candBio.synergist_muscles || [];
      curSynergists.forEach(sm => {
        if (candSynergists.includes(sm)) {
          score += 2;
        }
      });
      
      // Equipment overlap
      const curEquip = curBio.equipment_needed || [];
      const candEquip = candBio.equipment_needed || [];
      curEquip.forEach(eq => {
        if (candEquip.includes(eq)) {
          score += 1;
        }
      });
      
      return score;
    };

    // Filter library candidates excluding the current exercise itself
    let candidates = exerciseLibrary.filter(ex => ex.id !== exercise.exercise_id);

    // Apply text query filtering if present
    if (replaceSearchQuery.trim()) {
      const q = replaceSearchQuery.toLowerCase();
      candidates = candidates.filter(ex => 
        ex.name.toLowerCase().includes(q) || 
        (ex.muscle_group || '').toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q)
      );
    }

    // Sort candidates by replacement suitability score (descending) and alphabetically
    return candidates.sort((a, b) => {
      const scoreA = getReplacementScore(a);
      const scoreB = getReplacementScore(b);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    }).slice(0, 5);
  }, [replaceSearchQuery, exerciseLibrary, exercise.exercise_id, details?.muscle_group]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDraggedOver) {
      setIsDraggedOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    try {
      const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data.type === 'exercise') {
        const fromIndex = data.index;
        const fromDayId = data.dayId;
        if (fromIndex !== undefined) {
          if (fromDayId === exercise.day_id) {
            if (onReorder) onReorder(fromIndex, index);
          } else {
            if (onMoveToDay) onMoveToDay(fromDayId, fromIndex, exercise.day_id);
          }
        }
      }
    } catch (err) {
      console.error('[ProtocolExerciseCard] Drop failed:', err);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-xl border transition-all flex flex-col ${
        isDraggedOver 
          ? 'border-dashed border-blue-500 bg-blue-50/10 scale-[1.002] shadow-sm' 
          : isSelected 
          ? 'border-blue-300 bg-blue-50/5 shadow-sm' 
          : 'border-slate-100 hover:border-slate-200/80'
      }`}
    >
      {/* 1. STUNNING HIGH-DENSITY COMPACT STATE (Exactly one horizontal line on Desktop) */}
      <div className="p-2 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 select-none text-[11px]">
        {/* Left Section: Drag, Checkbox, Image & Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 lg:max-w-[40%]">
          {/* Grab Handle */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'exercise',
                index,
                dayId: exercise.day_id,
                exerciseId: exercise.id
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 rounded shrink-0 flex items-center justify-center"
            title="Arraste para reordenar"
          >
            <GripVertical size={13} />
          </div>

          {/* Selector Checkbox */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0 cursor-pointer"
              title="Selecionar"
            />
          )}

          {/* Exercise Image */}
          <img
            src={details?.image_url || fallbackImg}
            alt={details?.name || "Exercício"}
            className="w-7 h-7 rounded-md object-cover shrink-0 border border-slate-100/80"
            referrerPolicy="no-referrer"
          />

          {/* Exercise Meta (Name & Muscle) */}
          <div className="min-w-0 flex-1">
            <h5 className="font-extrabold text-slate-800 truncate leading-none">
              {details?.name || "Carregando Exercício..."}
            </h5>
            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
              {details?.muscle_group || "Geral"}
            </span>
          </div>
        </div>

        {/* Middle Section: Quick Inline Fields (Sets, Reps, Rest, RPE) aligned horizontally */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 py-1 px-2 rounded-lg bg-slate-50/50 border border-slate-100/80">
          {/* Sets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Séries</span>
            <input
              type="number"
              min={1}
              value={exercise.sets}
              onChange={(e) => onUpdateField('sets', Number(e.target.value) || 3)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* Reps */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reps</span>
            <input
              type="text"
              placeholder="10"
              value={exercise.reps}
              onChange={(e) => onUpdateField('reps', e.target.value)}
              className="h-6 w-12 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* Rest */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rest</span>
            <input
              type="number"
              placeholder="60"
              value={exercise.rest_seconds || ''}
              onChange={(e) => onUpdateField('rest_seconds', Number(e.target.value) || 0)}
              className="h-6 w-11 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
            <span className="text-[9px] text-slate-400 font-bold">s</span>
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* RPE */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RPE</span>
            <input
              type="text"
              placeholder="9"
              value={exercise.rpe || ''}
              onChange={(e) => onUpdateField('rpe', e.target.value)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>
        </div>

        {/* Right Section: Compact toolbar actions */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto lg:ml-0">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 bg-transparent border-none cursor-pointer"
            title="Mover para cima"
          >
            <ArrowUp size={11} />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={isLast}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 bg-transparent border-none cursor-pointer"
            title="Mover para baixo"
          >
            <ArrowDown size={11} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-transparent border-none cursor-pointer"
            title="Duplicar"
          >
            <Copy size={11} />
          </button>
          <button
            type="button"
            onClick={() => setIsReplacing(!isReplacing)}
            className={`p-1 rounded cursor-pointer border-none transition-colors flex items-center justify-center ${
              isReplacing ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title="Substituir exercício"
          >
            <RefreshCw size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-transparent border-none cursor-pointer"
            title="Remover"
          >
            <Trash2 size={11} />
          </button>
          
          <div className="w-px h-3.5 bg-slate-200 mx-1 hidden lg:block" />

          {/* Expand/Collapse Toggle Arrow */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded cursor-pointer border-none transition-colors flex items-center justify-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 ${
              isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
            title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            Detalhes
            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>

      {/* 2. EXPANDED STATE PANEL (Smooth dropdown) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-slate-50 bg-slate-50/20"
          >
            <div className="p-4 flex flex-col gap-3.5 text-[11px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Carga */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Carga / Tipo</span>
                  <input
                    type="text"
                    placeholder="Ex: 40kg, Halteres"
                    value={exercise.load_type || ''}
                    onChange={(e) => onUpdateField('load_type', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Cadência */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Cadência</span>
                  <input
                    type="text"
                    placeholder="Ex: 3010, Controlada"
                    value={exercise.cadence || ''}
                    onChange={(e) => onUpdateField('cadence', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tempo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Tempo sob Tensão</span>
                  <input
                    type="text"
                    placeholder="Ex: 45s, Sem pausa"
                    value={exercise.tempo || ''}
                    onChange={(e) => onUpdateField('tempo', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Advanced Methodology Toggle Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Drop-set */}
                <button
                  type="button"
                  onClick={() => onUpdateField('drop_set', !exercise.drop_set)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.drop_set
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Flame size={11} />
                  Drop-Set
                </button>

                {/* Rest-pause */}
                <button
                  type="button"
                  onClick={() => onUpdateField('rest_pause', !exercise.rest_pause)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.rest_pause
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Zap size={11} />
                  Rest-Pause
                </button>

                {/* Super-série */}
                <button
                  type="button"
                  onClick={() => onUpdateField('superset', !exercise.superset)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.superset
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={11} />
                  Super-Série
                </button>
              </div>

              {/* Instructions / Notes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Instruções Técnicas / Observações / Notas</span>
                <textarea
                  placeholder="Instruções específicas para o atleta..."
                  rows={2}
                  value={exercise.notes || ''}
                  onChange={(e) => onUpdateField('notes', e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INLINE REPLACEMENT UI */}
      <AnimatePresence>
        {isReplacing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Substituir por...
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false);
                  setReplaceSearchQuery('');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                Cancelar
              </button>
            </div>
            
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar exercício substituto..."
                value={replaceSearchQuery}
                onChange={(e) => setReplaceSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-slate-200 text-xs placeholder:text-slate-400 font-semibold focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {filteredReplaceLibrary.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[10px] font-semibold">
                  Nenhum exercício encontrado.
                </div>
              ) : (
                filteredReplaceLibrary.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      if (onReplaceExercise) {
                        onReplaceExercise(ex.id);
                      } else {
                        onUpdateField('exercise_id', ex.id);
                      }
                      setIsReplacing(false);
                      setReplaceSearchQuery('');
                    }}
                    className="w-full flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-white border-none text-left cursor-pointer"
                  >
                    <img
                      src={ex.image_url || fallbackImg}
                      alt={ex.name}
                      className="w-6 h-6 rounded object-cover border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-extrabold text-slate-800 truncate">{ex.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{ex.muscle_group || 'Geral'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ProtocolExerciseCard.displayName = 'ProtocolExerciseCard';
