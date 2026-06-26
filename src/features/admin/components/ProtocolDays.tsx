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

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {days.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Calendar size={28} className="text-slate-300" />
              <p className="text-xs font-bold">Nenhum dia cadastrado</p>
              <p className="text-[10px] text-slate-400">Adicione dias para estruturar a periodização</p>
            </div>
          ) : (
            days.map((day, index) => {
              const isSelected = selectedDayId === day.id;
              const isDraggedOver = draggedOverDayId === day.id;
              const letter = getDayLetter(index);
              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onSelectDay(day.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, day.id)}
                  onDragOver={(e) => handleDragOver(e, day.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index, day.id)}
                  className={`group p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                    isDraggedOver
                      ? 'border-dashed border-blue-500 bg-blue-50/50 scale-[1.02] shadow-md shadow-blue-500/10'
                      : isSelected
                      ? 'bg-blue-50/40 border-blue-300 shadow-md shadow-blue-500/5'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Row 1: Letter, Title, Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black uppercase shrink-0 cursor-grab active:cursor-grabbing ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`} title="Arraste para reordenar o dia">
                        {letter}
                      </div>
                      <div className="min-w-0">
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
                            isSelected ? 'text-blue-900 font-extrabold' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick actions bar */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveDay(day.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveDay(day.id, 'down');
                        }}
                        disabled={index === days.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateDay(day);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        title="Duplicar dia"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveDay(day.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        title="Excluir dia"
                      >
                        <Trash2 size={12} />
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
                    placeholder="Descrição breve (ex: Peito, Tríceps e Ombro)"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none p-0 text-[10px] text-slate-400 font-medium focus:outline-none focus:ring-0 w-full"
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
