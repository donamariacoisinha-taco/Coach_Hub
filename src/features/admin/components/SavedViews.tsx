import React from 'react';
import { motion } from 'motion/react';
import { 
  Bookmark, 
  ChevronDown, 
  Star, 
  Zap, 
  History,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useLibraryStore, SavedView } from '../store/libraryStore';

const SavedViews: React.FC = () => {
  const { savedViews, activeViewId, setActiveView } = useLibraryStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const activeView = savedViews.find(v => v.id === activeViewId) || savedViews[0];

  return (
    <div className="relative">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center gap-4 px-6 h-14 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-400 transition-all"
       >
          <Bookmark size={18} className="text-indigo-600" />
          <div className="text-left">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">View Salva</p>
             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{activeView?.name}</p>
          </div>
          <ChevronDown size={16} className={`text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
       </button>

       {isOpen && (
         <div className="absolute top-16 left-0 w-80 bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] z-50 p-6 space-y-6">
            <div className="space-y-2">
               {savedViews.map((view) => (
                 <button
                   key={view.id}
                   onClick={() => {
                     setActiveView(view.id);
                     setIsOpen(false);
                   }}
                   className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                     activeViewId === view.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-950'
                   }`}
                 >
                    <span className="text-[11px] font-black uppercase tracking-widest">{view.name}</span>
                    {activeViewId === view.id && <Star size={12} fill="currentColor" />}
                 </button>
               ))}
            </div>

            <button className="w-full h-14 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-200 hover:text-indigo-600 transition-all">
               <Plus size={16} />
               Criar Nova View
            </button>
         </div>
       )}
    </div>
  );
};

export default SavedViews;
