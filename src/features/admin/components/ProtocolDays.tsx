import React from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Sparkles, Calendar } from 'lucide-react';
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
  onMoveExerciseToDay
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
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            Dias do Protocolo
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estrutura de Treinos</p>
        </div>
        <button
          type="button"
          onClick={onAddDay}
          className="h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-blue-200/40 cursor-pointer"
        >
          <Plus size={14} />
          Add Dia
        </button>
      </div>

      <div className="relative pl-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {/* Timeline Axis Track */}
        {days.length > 1 && (
          <div className="absolute left-[19px] top-4 bottom-8 w-0.5 bg-slate-100" />
        )}

        <AnimatePresence initial={false}>
          {days.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Calendar size={24} className="text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider">Nenhum dia</p>
              <p className="text-[10px] text-slate-400">Adicione treinos para montar a periodização</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, index) => {
                const isSelected = selectedDayId === day.id;
                const isDraggedOver = draggedOverDayId === day.id;
                const letter = getDayLetter(index);
                return (
                  <motion.div
                    key={day.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => onSelectDay(day.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, day.id)}
                    onDragOver={(e) => handleDragOver(e, day.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, day.id)}
                    className={`group relative flex items-start gap-4 p-3.5 rounded-2xl cursor-pointer transition-all ${
                      isDraggedOver
                        ? 'bg-blue-50/40 ring-2 ring-dashed ring-blue-400 scale-[1.01]'
                        : isSelected
                        ? 'bg-slate-50/80 border border-slate-200/50 shadow-sm'
                        : 'hover:bg-slate-50/50 border border-transparent'
                    }`}
                  >
                    {/* Timeline Node Badge */}
                    <div
                      title="Arraste para reordenar"
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black uppercase shrink-0 transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-sm shadow-blue-500/20'
                          : 'bg-white text-slate-500 border border-slate-200 shadow-sm group-hover:border-slate-400 group-hover:text-slate-700'
                      }`}
                    >
                      {letter}
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {/* Row 1: Title Input & Floating actions */}
                      <div className="flex items-center justify-between gap-2">
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

                        {/* Hover Quick actions bar */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
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

                      {/* Row 2: Description input */}
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
                        placeholder="Ex: Quadríceps e Glúteos"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none p-0 text-[10px] text-slate-400 placeholder:text-slate-300 font-medium focus:outline-none focus:ring-0 w-full"
                      />
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
