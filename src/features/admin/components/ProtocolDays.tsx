import React from 'react';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
  // Simple helper to get alphabetic indicator (A, B, C...)
  const getDayLetter = (index: number) => {
    return String.fromCharCode(65 + (index % 26));
  };

  return (
    <div className="w-full bg-slate-50/40 p-2 rounded-2xl border border-slate-150 flex flex-row items-center justify-between gap-3 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible no-scrollbar">
      {/* Horizontal Tabs container */}
      <div className="flex flex-row items-center gap-1.5 flex-1 min-w-0 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible no-scrollbar">
        <AnimatePresence initial={false}>
          {days.map((day, index) => {
            const isSelected = selectedDayId === day.id;
            const letter = getDayLetter(index);
            const exerciseCount = exercises[day.id]?.length || 0;
            const isCompleted = day.description === 'completed';

            return (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onSelectDay(day.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDay(day.id);
                  }
                }}
                className={`group relative flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none h-12 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:scale-[1.015] active:scale-[0.985] ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-950/10'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Completed Toggle Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateDayField) {
                      onUpdateDayField(day.id, 'description', isCompleted ? '' : 'completed');
                    }
                  }}
                  className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isSelected
                      ? 'border-slate-700 hover:border-slate-500 bg-slate-800'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                  title={isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                >
                  {isCompleted && <Check size={10} strokeWidth={3} />}
                </button>

                {/* Inline editable tab title */}
                <input
                  type="text"
                  value={day.title || ''}
                  onChange={(e) => {
                    if (onUpdateDayField) {
                      onUpdateDayField(day.id, 'title', e.target.value);
                    }
                  }}
                  placeholder={`Treino ${letter}`}
                  onClick={(e) => {
                    if (!isSelected) {
                      onSelectDay(day.id);
                      e.preventDefault();
                    } else {
                      e.stopPropagation();
                    }
                  }}
                  className={`bg-transparent border-none p-0 text-xs font-black placeholder:text-slate-400 focus:outline-none focus:ring-0 w-24 sm:w-28 truncate cursor-pointer ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}
                />

                {/* Empty Workout Indicator Dot */}
                {exerciseCount === 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Treino vazio" />
                )}

                {/* Exercise Count badge */}
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  isSelected 
                    ? 'bg-slate-800 text-slate-300' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {exerciseCount}
                </span>

                {/* Inline Hover Actions - absolute minimum footprint, high density */}
                <div className="hidden lg:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-inherit">
                  {/* Left (was Up) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDay(day.id, 'up');
                    }}
                    disabled={index === 0}
                    className={`p-0.5 rounded hover:bg-slate-200/50 disabled:opacity-20 border-none bg-transparent cursor-pointer ${
                      isSelected ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Mover para esquerda"
                  >
                    <ChevronLeft size={11} />
                  </button>

                  {/* Right (was Down) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDay(day.id, 'down');
                    }}
                    disabled={index === days.length - 1}
                    className={`p-0.5 rounded hover:bg-slate-200/50 disabled:opacity-20 border-none bg-transparent cursor-pointer ${
                      isSelected ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Mover para direita"
                  >
                    <ChevronRight size={11} />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateDay(day);
                    }}
                    className={`p-0.5 rounded hover:bg-slate-200/50 border-none bg-transparent cursor-pointer ${
                      isSelected ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-400 hover:text-blue-500'
                    }`}
                    title="Duplicar treino"
                  >
                    <Copy size={11} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDay(day.id);
                    }}
                    className={`p-0.5 rounded hover:bg-slate-200/50 border-none bg-transparent cursor-pointer ${
                      isSelected ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-400 hover:text-rose-500'
                    }`}
                    title="Excluir treino"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Day Button */}
      <button
        type="button"
        onClick={onAddDay}
        className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border-none shadow-md shadow-blue-500/10"
      >
        <Plus size={12} strokeWidth={3} />
        + Novo treino
      </button>
    </div>
  );
};


