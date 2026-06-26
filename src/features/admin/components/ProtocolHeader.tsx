import React from 'react';
import { Award, RefreshCw, Wifi, Save, Trash2, ArrowLeft, Send } from 'lucide-react';
import { PremiumProtocol } from '../../../types/protocol_4_0';

interface ProtocolHeaderProps {
  selectedProtocol: PremiumProtocol | null;
  isCreating: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  hasChanges: boolean;
}

export const ProtocolHeader: React.FC<ProtocolHeaderProps> = ({
  selectedProtocol,
  isCreating,
  isSaving,
  onCancel,
  onSave,
  onDelete,
  hasChanges
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-700/50 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
          title="Voltar para a Lista"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              KYRON Protocol Builder <span className="text-blue-400 text-[10px] font-black px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20 uppercase tracking-wider">v4.0</span>
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Realtime Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isCreating 
              ? 'Criando um novo protocolo altamente otimizado.' 
              : `Editando: ${selectedProtocol?.name || 'Protocolo'} (Versão: ${selectedProtocol?.version || 1})`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {selectedProtocol && onDelete && (
          <button
            onClick={onDelete}
            type="button"
            className="h-11 px-4 bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-900/50 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            title="Excluir protocolo permanentemente"
          >
            <Trash2 size={15} />
          </button>
        )}

        <button
          onClick={onCancel}
          className="h-11 px-5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700/50 cursor-pointer"
        >
          Cancelar
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className={`h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 border-none cursor-pointer shadow-lg shadow-blue-500/10 ${
            hasChanges 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {isSaving ? 'Salvando...' : 'Salvar Tudo'}
        </button>
      </div>
    </div>
  );
};
