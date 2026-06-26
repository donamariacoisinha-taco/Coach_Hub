import React from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { PremiumProtocolDay } from '../../../types/protocol_4_0';
import { motion, AnimatePresence } from 'motion/react';

interface ProtocolDaysProps {
  days: PremiumProtocolDay[];
  selectedDayId: string | null;
  onSelectDay: (id: string) => void;
  onAddDay: () => void;
  onRemoveDay: (id: string) => void;
  onDuplicateDay: (day: PremiumProtocolDay) => void;
  onMoveDay: (id: string, direction: 'up' | 'down') => void;
  onUpdateDayField?: (dayId: string, field: keyof PremiumProtocolDay, value: any) => void;
  onReorderDays?: (fromIndex: number, toIndex: number) => void;
  onMoveExerciseToDay?: (fromDayId: string, exerciseIndex: number, toDayId: string) => void;
  exercises?: Record<string, any[]>;
}

export const ProtocolDays: React.FC<ProtocolDaysProps> = ({
  days,
  selectedDayId,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onMoveDay,
  onUpdateDayField,
  onReorderDays,
  onMoveExerciseToDay,
  exercises = {}
}) => {
  const [draggedOverDayId, setDraggedOverDayId] = React.useState<string | null>(null);

  // Simple helper to get alphabetic indicator (A, B, C...)
  const getDayLetter = (index: number) => {
    return String.fromCharCode(65 + (index % 26));
  };

  const handleDragStart = (e: React.DragEvent, index: number, dayId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'day',
      index,
      dayId
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dayId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverDayId !== dayId) {
      setDraggedOverDayId(dayId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverDayId(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, targetDayId: string) => {
    e.preventDefault();
    setDraggedOverDayId(null);
    try {
      const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'day') {
        const fromIndex = data.index;
        if (onReorderDays && fromIndex !== undefined && fromIndex !== targetIndex) {
          onReorderDays(fromIndex, targetIndex);
        }
      } else if (data.type === 'exercise') {
        const { dayId: fromDayId, index: exerciseIndex } = data;
        if (onMoveExerciseToDay && fromDayId && fromDayId !== targetDayId && exerciseIndex !== undefined) {
          onMoveExerciseToDay(fromDayId, exerciseIndex, targetDayId);
        }
      }
    } catch (err) {
      console.error('[ProtocolDays] Drop failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Microciclo
          </h4>
        </div>
        <button
          type="button"
          onClick={onAddDay}
          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all border-none bg-transparent cursor-pointer"
          title="Adicionar Novo Dia"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="relative pl-1 max-h-[500px] overflow-y-auto pr-1 scrollbar-none">
        {/* Continuous vertical timeline track line */}
        {days.length > 1 && (
          <div className="absolute left-[13px] top-4 bottom-8 w-px bg-slate-100" />
        )}

        <AnimatePresence initial={false}>
          {days.length === 0 ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Calendar size={20} className="text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-wider">Sem treinos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, index) => {
                const isSelected = selectedDayId === day.id;
                const isDraggedOver = draggedOverDayId === day.id;
                const letter = getDayLetter(index);
                const exerciseCount = exercises[day.id]?.length || 0;
                
                return (
                  <motion.div
                    key={day.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSelectDay(day.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, day.id)}
                    onDragOver={(e) => handleDragOver(e, day.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, day.id)}
                    className={`group relative flex items-start gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                      isDraggedOver
                        ? 'bg-blue-50/40 ring-1 ring-dashed ring-blue-400'
                        : isSelected
                        ? 'bg-slate-50/80 border border-slate-150 shadow-sm'
                        : 'hover:bg-slate-50/40 border border-transparent'
                    }`}
                  >
                    {/* Minimal Timeline dot indicator */}
                    <div className="flex items-center justify-center h-5 shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100/60 z-10" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-slate-400 z-10 transition-colors" />
                      )}
                    </div>

                    {/* Timeline text inputs and counters */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={day.title || ''}
                            onChange={(e) => {
                              if (onUpdateDayField) {
                                onUpdateDayField(day.id, 'title', e.target.value);
                              } else {
                                day.title = e.target.value;
                                onSelectDay(day.id);
                              }
                            }}
                            placeholder={`Treino ${letter}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`bg-transparent border-none p-0 text-xs font-black text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 w-full truncate ${
                              isSelected ? 'text-blue-600 font-extrabold' : ''
                            }`}
                          />
                        </div>

                        {/* Floating actions on Hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveDay(day.id, 'up');
                            }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition-colors border-none bg-transparent cursor-pointer disabled:opacity-20"
                            title="Mover para cima"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveDay(day.id, 'down');
                            }}
                            disabled={index === days.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition-colors border-none bg-transparent cursor-pointer disabled:opacity-20"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateDay(day);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Duplicar dia"
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveDay(day.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Excluir dia"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Day description (e.g. Muscle focus: Upper) */}
                      <input
                        type="text"
                        value={day.description || ''}
                        onChange={(e) => {
                          if (onUpdateDayField) {
                            onUpdateDayField(day.id, 'description', e.target.value);
                          } else {
                            day.description = e.target.value;
                            onSelectDay(day.id);
                          }
                        }}
                        placeholder="Ex: Upper"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none p-0 text-[10px] text-slate-400 placeholder:text-slate-300 font-semibold focus:outline-none focus:ring-0 w-full"
                      />

                      {/* Exercise Count indicator */}
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">
                        {exerciseCount} {exerciseCount === 1 ? 'exercício' : 'exercícios'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

