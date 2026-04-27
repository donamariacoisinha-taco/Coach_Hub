import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  Trash2, 
  Brain, 
  FileDown, 
  Layers,
  Sparkles,
  Command,
  X
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedIds, onClear }) => {
  const { archiveExercises, deleteExercises } = useAdminStore();

  const handleBulkAI = () => {
    alert(`Iniciando IA para ${selectedIds.length} itens. Gerando descrições premium e categorizando muscularmente.`);
  };

  return (
    <AnimatePresence>
       {selectedIds.length > 0 && (
          <motion.div 
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6"
          >
             <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-5 flex items-center justify-between text-white backdrop-blur-3xl">
                <div className="flex items-center gap-8 pl-6 border-r border-white/10 pr-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/20">
                         {selectedIds.length}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecionados</p>
                         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">Bulk Mode Ativo</p>
                      </div>
                   </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-2 px-6">
                   <BulkAction icon={Sparkles} label="Inteligência IA" color="indigo" onClick={handleBulkAI} />
                   <BulkAction icon={Archive} label="Arquivar" onClick={() => archiveExercises(selectedIds)} />
                   <BulkAction icon={FileDown} label="Exportar CSV" />
                   <BulkAction icon={Trash2} label="Deletar" color="red" onClick={() => deleteExercises(selectedIds)} />
                </div>

                <div className="flex items-center gap-4 pr-4">
                   <button 
                      onClick={onClear}
                      className="w-14 h-14 flex flex-col items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all group"
                   >
                      <X size={20} />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-widest group-hover:text-red-400">ESC</span>
                   </button>
                </div>
             </div>
          </motion.div>
       )}
    </AnimatePresence>
  );
};

function BulkAction({ icon: Icon, label, color = 'default', onClick }: { icon: any, label: string, color?: string, onClick?: () => void }) {
  const colors: any = {
    default: 'text-slate-400 hover:text-white hover:bg-white/5',
    indigo: 'text-indigo-400 hover:text-white hover:bg-indigo-600',
    red: 'text-red-400 hover:text-white hover:bg-red-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all group ${colors[color]}`}
    >
       <Icon size={18} className="group-hover:scale-110 transition-transform" />
       <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">{label}</span>
    </button>
  );
}

export default BulkActionBar;
