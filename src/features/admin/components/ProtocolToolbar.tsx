import React from 'react';
import { Clock, Calendar, Dumbbell, Award, Activity, Undo2, Redo2, RefreshCw, Layers } from 'lucide-react';

interface ProtocolToolbarProps {
  daysCount: number;
  exercisesCount: number;
  setsCount: number;
  volumeIndex: number;
  estimatedDuration: number;
  difficulty: string;
  category: string;
  durationWeeks: number;

  // Autosave & Undo/Redo Props
  autosaveStatus?: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const ProtocolToolbar: React.FC<ProtocolToolbarProps> = ({
  daysCount,
  exercisesCount,
  setsCount,
  volumeIndex,
  estimatedDuration,
  difficulty,
  category,
  durationWeeks,
  autosaveStatus = 'idle',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}) => {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Stat 1: Total Days */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Sessões / Semana</p>
            <p className="text-xs font-black text-slate-800">{daysCount} dias</p>
          </div>
        </div>

        {/* Stat 2: Exercises count */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Dumbbell size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Total Exercícios</p>
            <p className="text-xs font-black text-slate-800">{exercisesCount} itens</p>
          </div>
        </div>

        {/* Stat 3: Sets count */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Layers size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Total de Séries</p>
            <p className="text-xs font-black text-slate-800">{setsCount} séries</p>
          </div>
        </div>

        {/* Stat 4: Volume Index */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Activity size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Índice de Volume</p>
            <p className="text-xs font-black text-slate-800">{volumeIndex} u.v.</p>
          </div>
        </div>

        {/* Stat 5: Duration Weeks */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Clock size={14} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Est. Duração / Ciclo</p>
            <p className="text-xs font-black text-slate-800">{estimatedDuration} min / {durationWeeks} sem</p>
          </div>
        </div>
      </div>

      {/* Undo/Redo & Autosave indicators */}
      <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
        {/* Undo/Redo buttons */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg border-none bg-transparent transition-all shrink-0 ${
              canUndo 
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer active:scale-95' 
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Desfazer alteração (Ctrl + Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg border-none bg-transparent transition-all shrink-0 ${
              canRedo 
                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer active:scale-95' 
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Refazer alteração (Ctrl + Shift + Z)"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Autosave status pill */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-xl border border-slate-200/40 shrink-0">
          {autosaveStatus === 'saving' && (
            <div className="flex items-center gap-1.5">
              <RefreshCw size={11} className="text-blue-500 animate-spin" />
              <span className="text-blue-600 font-extrabold">Salvando...</span>
            </div>
          )}
          {autosaveStatus === 'saved' && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-emerald-600 font-extrabold">Salvo na Nuvem</span>
            </div>
          )}
          {autosaveStatus === 'dirty' && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-amber-600 font-extrabold">Editando...</span>
            </div>
          )}
          {autosaveStatus === 'error' && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-bounce" />
              <span className="text-rose-600 font-extrabold">Erro de Conexão</span>
            </div>
          )}
          {autosaveStatus === 'idle' && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-400 font-extrabold">Sincronizado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
