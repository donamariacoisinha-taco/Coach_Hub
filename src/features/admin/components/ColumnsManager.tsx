import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';

interface ColumnsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_COLUMNS = [
  { id: 'thumb', label: 'Media Thumb' },
  { id: 'name', label: 'Exercise Name' },
  { id: 'muscle_group', label: 'Muscle Group' },
  { id: 'difficulty_level', label: 'Difficulty' },
  { id: 'quality_score', label: 'Quality Score' },
  { id: 'usage_count', label: 'Usage Frequency' },
  { id: 'ranking_status', label: 'Performance Status' },
  { id: 'actions', label: 'Quick Actions' }
];

const ColumnsManager: React.FC<ColumnsManagerProps> = ({ isOpen, onClose }) => {
  const { visibleColumns, setVisibleColumns } = useLibraryStore();

  const toggleColumn = (id: string) => {
    if (visibleColumns.includes(id)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter(c => c !== id));
      }
    } else {
      setVisibleColumns([...visibleColumns, id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={onClose}
         className="absolute inset-0 bg-slate-950/20 backdrop-blur-md"
       />

       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: 20 }}
         className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 space-y-10"
       >
          <div className="flex items-center justify-between">
             <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Smart Columns</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure o layout da sua grade</p>
             </div>
             <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-950 transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="space-y-3">
             {ALL_COLUMNS.map((col) => {
               const isVisible = visibleColumns.includes(col.id);
               return (
                 <div 
                   key={col.id}
                   className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                     isVisible ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-white border-slate-50 text-slate-300'
                   }`}
                 >
                    <div className="flex items-center gap-4">
                       <GripVertical size={16} className="text-slate-200" />
                       <span className="text-[11px] font-black uppercase tracking-widest">{col.label}</span>
                    </div>
                    <button 
                      onClick={() => toggleColumn(col.id)}
                      className={`p-2 rounded-lg transition-all ${isVisible ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-200 hover:text-slate-400'}`}
                    >
                       {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                 </div>
               );
             })}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
             Salvar Configuração
          </button>
       </motion.div>
    </div>
  );
};

export default ColumnsManager;
