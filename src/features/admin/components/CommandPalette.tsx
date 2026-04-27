import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Command as CommandIcon, 
  Plus, 
  Settings as SettingsIcon,
  LayoutDashboard,
  BrainCircuit,
  Library,
  ListTodo,
  BarChart3,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';

const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveTab, openEditor } = useAdminStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    { id: 'create', label: 'Create New Exercise', icon: Plus, shortcuts: ['N'], category: 'Actions', action: () => openEditor() },
    { id: 'audit', label: 'Run AI Library Audit', icon: Sparkles, shortcuts: ['A'], category: 'Intelligence', action: () => setActiveTab('ai') },
    { id: 'view-lib', label: 'Go to Library OS', icon: Library, shortcuts: ['L'], category: 'Navigation', action: () => setActiveTab('library') },
    { id: 'view-review', label: 'Manage Review Center', icon: ListTodo, shortcuts: ['R'], category: 'Navigation', action: () => setActiveTab('review') },
    { id: 'view-admin', label: 'Analytics Dashboard', icon: BarChart3, shortcuts: ['D'], category: 'Navigation', action: () => setActiveTab('dashboard') },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, shortcuts: ['S'], category: 'Navigation', action: () => setActiveTab('settings') },
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  const handleAction = (act: typeof actions[0]) => {
    act.action();
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={() => setCommandPaletteOpen(false)}
         className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
       />
       
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: -20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: -20 }}
         className="relative w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto"
       >
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
             <CommandIcon size={20} className="text-blue-600" />
             <input 
               ref={inputRef}
               type="text" 
               placeholder="Type a command or search..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               className="flex-1 bg-transparent border-none font-black text-lg outline-none placeholder:text-slate-300 text-slate-900"
             />
             <button onClick={() => setCommandPaletteOpen(false)} className="p-2 text-slate-300 hover:text-slate-950">
               <X size={20} />
             </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto p-4 space-y-8 no-scrollbar">
             {filtered.length > 0 ? (
               <div className="space-y-6">
                  {/* Categories */}
                  {Array.from(new Set(filtered.map(a => a.category))).map(cat => (
                    <div key={cat} className="space-y-2">
                       <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat}</p>
                       <div className="space-y-1">
                          {filtered.filter(a => a.category === cat).map(act => {
                            const Icon = act.icon;
                            return (
                               <button 
                                 key={act.id}
                                 onClick={() => handleAction(act)}
                                 className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-slate-50 group transition-all"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Icon size={18} />
                                     </div>
                                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{act.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     {act.shortcuts.map(s => (
                                        <span key={s} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 group-hover:border-slate-300">{s}</span>
                                     ))}
                                  </div>
                               </button>
                            );
                          })}
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                     <Search size={32} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900">No results for "{query}"</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Try searching for simple terms like "create" or "ai"</p>
               </div>
             )}
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <HelperItem label="Enter" desc="Select" />
                <HelperItem label="↑↓" desc="Navigate" />
                <HelperItem label="Esc" desc="Close" />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Coach Rubi Admin OS</p>
          </div>
       </motion.div>
    </div>
  );
};

function HelperItem({ label, desc }: { label: string, desc: string }) {
  return (
    <div className="flex items-center gap-2">
       <span className="text-[10px] font-black text-slate-900">{label}</span>
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>
    </div>
  );
}

export default CommandPalette;
