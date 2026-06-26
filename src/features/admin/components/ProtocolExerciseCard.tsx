import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  Clock, 
  Flame, 
  Zap, 
  Layers,
  GripVertical
} from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';

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
  const [isDraggedOver, setIsDraggedOver] = React.useState(false);

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
      className={`bg-white rounded-3xl border shadow-sm p-5 hover:shadow-md transition-all flex flex-col gap-4 ${
        isDraggedOver 
          ? 'border-dashed border-blue-500 bg-blue-50/20 scale-[1.01]' 
          : isSelected 
          ? 'border-blue-400 bg-blue-50/10 shadow-sm' 
          : 'border-slate-200/60'
      }`}
    >
      {/* Exercise identity & Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
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
            className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 rounded flex items-center justify-center shrink-0"
            title="Arraste para mover o exercício"
          >
            <GripVertical size={16} />
          </div>

          {/* Mass Action Checkbox */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mr-1 shrink-0 cursor-pointer"
              title="Selecionar exercício para ações em massa"
            />
          )}

          <img
            src={details?.image_url || fallbackImg}
            alt={details?.name || "Exercício"}
            className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-100 ml-1"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 ml-1">
            <h5 className="font-bold text-xs text-slate-900 truncate">
              {details?.name || "Carregando Exercício..."}
            </h5>
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md mt-1 border border-slate-200/50">
              {details?.muscle_group || "Geral"}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30"
            title="Mover para cima"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={isLast}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30"
            title="Mover para baixo"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            title="Duplicar exercício"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            title="Remover exercício"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Grid: Form fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
        {/* Sets */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Séries</label>
          <input
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => onUpdateField('sets', Number(e.target.value) || 3)}
            className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Reps */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reps</label>
          <input
            type="text"
            placeholder="Ex: 8-12, 10, Falha"
            value={exercise.reps}
            onChange={(e) => onUpdateField('reps', e.target.value)}
            className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Rest seconds */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Descanso (s)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="60"
              value={exercise.rest_seconds || ''}
              onChange={(e) => onUpdateField('rest_seconds', Number(e.target.value) || 0)}
              className="h-9 w-full pl-2.5 pr-6 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <Clock size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Load type / Carga */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Carga / Tipo</label>
          <input
            type="text"
            placeholder="Ex: 30kg, RPE 8"
            value={exercise.load_type || ''}
            onChange={(e) => onUpdateField('load_type', e.target.value)}
            className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Methodologies Checkboxes (Drop-set, Rest-pause, Superset) */}
      <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!exercise.drop_set}
            onChange={(e) => onUpdateField('drop_set', e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-200"
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Flame size={10} className="text-amber-500" />
            Drop-Set
          </span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!exercise.rest_pause}
            onChange={(e) => onUpdateField('rest_pause', e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Zap size={10} className="text-indigo-500" />
            Rest-Pause
          </span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!exercise.superset}
            onChange={(e) => onUpdateField('superset', e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-200"
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Layers size={10} className="text-blue-500" />
            Super-Série
          </span>
        </label>
      </div>

      {/* RPE, Tempo, Cadence & Notes row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {/* RPE */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase text-slate-400">RPE</span>
            <input
              type="text"
              placeholder="9"
              value={exercise.rpe || ''}
              onChange={(e) => onUpdateField('rpe', e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-bold text-slate-700"
            />
          </div>

          {/* Cadence */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase text-slate-400">Cadência</span>
            <input
              type="text"
              placeholder="3010"
              value={exercise.cadence || ''}
              onChange={(e) => onUpdateField('cadence', e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-bold text-slate-700"
            />
          </div>

          {/* Tempo */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase text-slate-400">Tempo</span>
            <input
              type="text"
              placeholder="2s"
              value={exercise.tempo || ''}
              onChange={(e) => onUpdateField('tempo', e.target.value)}
              className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-bold text-slate-700"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase text-slate-400">Instruções / Notas</span>
          <input
            type="text"
            placeholder="Ex: Foco no pico de contração."
            value={exercise.notes || ''}
            onChange={(e) => onUpdateField('notes', e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] font-semibold text-slate-700 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
});

ProtocolExerciseCard.displayName = 'ProtocolExerciseCard';
