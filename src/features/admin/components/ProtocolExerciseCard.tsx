import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';
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
  onMoveToDay
}) => {
  const fallbackImg = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop";
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    </div>
  );
});

ProtocolExerciseCard.displayName = 'ProtocolExerciseCard';
