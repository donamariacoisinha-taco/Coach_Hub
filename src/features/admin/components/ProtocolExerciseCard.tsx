import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  Clock, 
  Flame, 
  Zap, 
  Layers,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FileText
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
      className={`bg-white rounded-2xl border transition-all flex flex-col ${
        isDraggedOver 
          ? 'border-dashed border-blue-500 bg-blue-50/10 scale-[1.005] shadow-md' 
          : isSelected 
          ? 'border-blue-300 bg-blue-50/5 shadow-sm' 
          : 'border-slate-100 hover:border-slate-200/80 hover:shadow-sm'
      }`}
    >
      {/* 1. COMPACT STATE PANEL */}
      <div className="p-2 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 select-none">
        {/* Left Section: Drag, Checkbox, Image & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
            className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 rounded flex items-center justify-center shrink-0"
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
              title="Selecionar exercício"
            />
          )}

          {/* Exercise Image */}
          <img
            src={details?.image_url || fallbackImg}
            alt={details?.name || "Exercício"}
            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-100/80"
            referrerPolicy="no-referrer"
          />

          {/* Exercise Meta */}
          <div className="min-w-0 flex-1 lg:max-w-[220px]">
            <h5 className="font-bold text-xs text-slate-800 truncate leading-none">
              {details?.name || "Carregando Exercício..."}
            </h5>
            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-slate-400 mt-1">
              {details?.muscle_group || "Geral"}
            </span>
          </div>
        </div>

        {/* Middle Section: Quick Inline Fields (Sets, Reps, Rest, RPE) */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50/50 p-1 px-2 rounded-lg border border-slate-100/85">
          {/* Sets */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Séries</span>
            <input
              type="number"
              min={1}
              value={exercise.sets}
              onChange={(e) => onUpdateField('sets', Number(e.target.value) || 3)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all text-center"
            />
          </div>

          <div className="w-px h-3.5 bg-slate-200" />

          {/* Reps */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reps</span>
            <input
              type="text"
              placeholder="10"
              value={exercise.reps}
              onChange={(e) => onUpdateField('reps', e.target.value)}
              className="h-6 w-12 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all text-center"
            />
          </div>

          <div className="w-px h-3.5 bg-slate-200" />

          {/* Rest */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rest</span>
            <input
              type="number"
              placeholder="60"
              value={exercise.rest_seconds || ''}
              onChange={(e) => onUpdateField('rest_seconds', Number(e.target.value) || 0)}
              className="h-6 w-11 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all text-center"
            />
            <span className="text-[9px] text-slate-400 font-bold">s</span>
          </div>

          <div className="w-px h-3.5 bg-slate-200" />

          {/* RPE */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RPE</span>
            <input
              type="text"
              placeholder="9"
              value={exercise.rpe || ''}
              onChange={(e) => onUpdateField('rpe', e.target.value)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all text-center"
            />
          </div>
        </div>

        {/* Right Section: Compact toolbar actions */}
        <div className="flex items-center justify-end gap-1 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
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
          
          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* Expand/Collapse Toggle Arrow */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded cursor-pointer border-none transition-colors ${
              isExpanded ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* 2. EXPANDED STATE PANEL */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-slate-50 bg-slate-50/30"
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Carga */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Carga / Tipo</span>
                  <input
                    type="text"
                    placeholder="Ex: 40kg, Halteres"
                    value={exercise.load_type || ''}
                    onChange={(e) => onUpdateField('load_type', e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Cadência */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Cadência</span>
                  <input
                    type="text"
                    placeholder="Ex: 3010, Controlada"
                    value={exercise.cadence || ''}
                    onChange={(e) => onUpdateField('cadence', e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Tempo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Tempo sob Tensão</span>
                  <input
                    type="text"
                    placeholder="Ex: 45s, Sem pausa"
                    value={exercise.tempo || ''}
                    onChange={(e) => onUpdateField('tempo', e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Advanced Methodology Toggle Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Drop-set */}
                <button
                  type="button"
                  onClick={() => onUpdateField('drop_set', !exercise.drop_set)}
                  className={`h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.drop_set
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Flame size={11} className={exercise.drop_set ? 'text-white' : 'text-amber-500'} />
                  Drop-Set
                </button>

                {/* Rest-pause */}
                <button
                  type="button"
                  onClick={() => onUpdateField('rest_pause', !exercise.rest_pause)}
                  className={`h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.rest_pause
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Zap size={11} className={exercise.rest_pause ? 'text-white' : 'text-indigo-500'} />
                  Rest-Pause
                </button>

                {/* Super-série */}
                <button
                  type="button"
                  onClick={() => onUpdateField('superset', !exercise.superset)}
                  className={`h-8 px-3 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.superset
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={11} className={exercise.superset ? 'text-white' : 'text-blue-500'} />
                  Super-Série
                </button>
              </div>

              {/* Instructions / Notes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Instruções Técnicas / Observações</span>
                <textarea
                  placeholder="Ex: Focar na máxima contração isométrica no final do movimento, cadenciar bem a descida."
                  rows={2}
                  value={exercise.notes || ''}
                  onChange={(e) => onUpdateField('notes', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-slate-100 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
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
