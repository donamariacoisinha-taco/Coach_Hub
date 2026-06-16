import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Command as CommandIcon, 
  Plus, 
  Settings as SettingsIcon,
  LayoutDashboard,
  Library,
  ListTodo,
  Award,
  Users,
  X,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { premiumProtocolsApi, PremiumProtocol } from '../../../lib/api/premiumProtocolsApi';
import { profileApi } from '../../../lib/api/profileApi';
import { Exercise } from '../../../types';

const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setCommandPaletteOpen, 
    setActiveTab, 
    openEditor,
    setSearchQuery,
    exercises
  } = useAdminStore();
  
  const [query, setQuery] = useState('');
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      loadSearchData();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCommandPaletteOpen]);

  const loadSearchData = async () => {
    setLoading(true);
    try {
      const [prtcols, prfs] = await Promise.all([
        premiumProtocolsApi.getProtocols(),
        profileApi.getAllProfiles()
      ]);
      setProtocols(prtcols);
      setProfiles(prfs);
    } catch (e) {
      console.error('Error fetching search data for command palette:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  // 1. Static Command/Navigation action list
  const baseCommands = [
    { 
      id: 'create-ex', 
      label: 'Criar Novo Exercício (Add)', 
      category: 'Ações de Controle', 
      icon: Plus, 
      action: () => openEditor() 
    },
    { 
      id: 'go-dash', 
      label: 'Navegar para Dashboard Principal', 
      category: 'Navegação do Sistema', 
      icon: LayoutDashboard, 
      action: () => setActiveTab('dashboard') 
    },
    { 
      id: 'go-protocols', 
      label: 'Navegar para Biblioteca de Protocolos', 
      category: 'Navegação do Sistema', 
      icon: Award, 
      action: () => setActiveTab('protocols') 
    },
    { 
      id: 'go-exercises', 
      label: 'Navegar para Gestão de Exercícios', 
      category: 'Navegação do Sistema', 
      icon: Library, 
      action: () => setActiveTab('library') 
    },
    { 
      id: 'go-users', 
      label: 'Navegar para Painel de Usuários', 
      category: 'Navegação do Sistema', 
      icon: Users, 
      action: () => setActiveTab('users') 
    },
    { 
      id: 'go-settings', 
      label: 'Navegar para Configurações do Sistema', 
      category: 'Navegação do Sistema', 
      icon: SettingsIcon, 
      action: () => setActiveTab('settings') 
    }
  ];

  // 2. Filter data matching query
  const q = query.toLowerCase().trim();

  const filteredCommands = baseCommands.filter(c => 
    c.label.toLowerCase().includes(q)
  );

  const filteredExercises = q === '' ? [] : exercises.filter(ex => 
    ex.name.toLowerCase().includes(q) || 
    (ex.muscle_group && ex.muscle_group.toLowerCase().includes(q))
  ).slice(0, 5);

  const filteredProtocols = q === '' ? [] : protocols.filter(pr => 
    pr.name.toLowerCase().includes(q) || 
    (pr.description && pr.description.toLowerCase().includes(q))
  ).slice(0, 5);

  const filteredProfiles = q === '' ? [] : profiles.filter(pf => 
    (pf.name && pf.name.toLowerCase().includes(q)) || 
    (pf.email && pf.email.toLowerCase().includes(q))
  ).slice(0, 5);

  const handleCommandTrigger = (actionFn: () => void) => {
    actionFn();
    setCommandPaletteOpen(false);
  };

  const handleExerciseClick = (ex: Exercise) => {
    // Navigate to exercise library and open editor
    setActiveTab('library');
    setTimeout(() => {
      openEditor(ex);
    }, 150);
    setCommandPaletteOpen(false);
  };

  const handleProtocolClick = (pr: PremiumProtocol) => {
    setActiveTab('protocols');
    setCommandPaletteOpen(false);
  };

  const handleProfileClick = (pf: any) => {
    setActiveTab('users');
    // Seed query in user management
    setSearchQuery(pf.name || pf.email);
    setCommandPaletteOpen(false);
  };

  const hasAnyResults = 
    filteredCommands.length > 0 || 
    filteredExercises.length > 0 || 
    filteredProtocols.length > 0 || 
    filteredProfiles.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={() => setCommandPaletteOpen(false)}
         className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
       />
       
       <motion.div 
         initial={{ opacity: 0, scale: 0.96, y: -10 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.96, y: -10 }}
         className="relative w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto"
       >
          {/* Search Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
             <Search size={22} className="text-blue-600 shrink-0" />
             <input 
               ref={inputRef}
               type="text" 
               placeholder="Busque por exercícios, protocolos, atletas ou comandos..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               className="flex-1 bg-transparent border-none font-black text-base outline-none placeholder:text-slate-300 text-slate-900"
             />
             <div className="flex items-center gap-2">
               <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-widest text-slate-300 border border-slate-200 px-2 py-1 rounded-md">Atalhos Prioritários</span>
               <button onClick={() => setCommandPaletteOpen(false)} className="p-2 text-slate-300 hover:text-slate-950 cursor-pointer border-none bg-transparent">
                 <X size={20} />
               </button>
             </div>
          </div>

          {/* Search Context Body */}
          <div className="max-h-[480px] overflow-y-auto p-6 space-y-6 no-scrollbar text-left">
            {!hasAnyResults ? (
               <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4 animate-pulse">
                     <Search size={24} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">Nenhum resultado para "{query}"</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Experimente buscar por nomes comuns do treino (como "supino", "agachamento" ou nomes de atletas)</p>
               </div>
            ) : (
               <div className="space-y-6">
                 
                 {/* Commando Results */}
                 {filteredCommands.length > 0 && (
                   <div className="space-y-2">
                     <p className="px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Comandos & Navegação</p>
                     <div className="space-y-1">
                       {filteredCommands.map(cmd => {
                         const IconObj = cmd.icon;
                         return (
                           <button
                             key={cmd.id}
                             onClick={() => handleCommandTrigger(cmd.action)}
                             className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 group transition-all text-left border-none cursor-pointer bg-transparent"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="p-1.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <IconObj size={15} />
                                 </div>
                                 <span className="text-xs font-bold text-slate-800 group-hover:text-slate-955">{cmd.label}</span>
                              </div>
                              <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Exercises Match */}
                 {filteredExercises.length > 0 && (
                   <div className="space-y-2 pt-2">
                     <p className="px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-600">Exercícios Encontrados</p>
                     <div className="space-y-1">
                       {filteredExercises.map(ex => (
                         <button
                           key={ex.id}
                           onClick={() => handleExerciseClick(ex)}
                           className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-cyan-50/50 group transition-all text-left border-none cursor-pointer bg-transparent"
                         >
                            <div className="flex items-center gap-3">
                               <div className="p-1.5 rounded-xl bg-cyan-50 text-cyan-600 shadow-sm font-black text-[9px]">
                                 EX
                               </div>
                               <div>
                                 <p className="text-xs font-extrabold text-slate-800">{ex.name}</p>
                                 <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{ex.muscle_group}</p>
                               </div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF] bg-white border border-slate-150 px-2 py-0.5 rounded-md group-hover:bg-[#7BA7FF] group-hover:text-white transition-all">Editar Mídia ⚡</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Protocols Match */}
                 {filteredProtocols.length > 0 && (
                   <div className="space-y-2 pt-2">
                     <p className="px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Protocolos Prontos</p>
                     <div className="space-y-1">
                       {filteredProtocols.map(pr => (
                         <button
                           key={pr.id}
                           onClick={() => handleProtocolClick(pr)}
                           className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-emerald-50/40 group transition-all text-left border-none cursor-pointer bg-transparent"
                         >
                            <div className="flex items-center gap-3">
                               <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 shadow-sm font-black text-[9px]">
                                 PR
                               </div>
                               <div>
                                 <p className="text-xs font-extrabold text-slate-800">{pr.name}</p>
                                 <p className="text-[9px] text-slate-400 mt-0.5 font-semibold leading-none">{pr.premium ? '⭐ Premium Lock' : '🌍 Público Livre'}</p>
                               </div>
                            </div>
                            <ChevronRight size={12} className="text-slate-350" />
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Athletes Match */}
                 {filteredProfiles.length > 0 && (
                   <div className="space-y-2 pt-2">
                     <p className="px-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">Atletas Registrados</p>
                     <div className="space-y-1">
                       {filteredProfiles.map(pf => (
                         <button
                           key={pf.id}
                           onClick={() => handleProfileClick(pf)}
                           className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-indigo-50/40 group transition-all text-left border-none cursor-pointer bg-transparent"
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                 {pf.name ? pf.name.charAt(0) : 'A'}
                               </div>
                               <div>
                                 <p className="text-xs font-extrabold text-slate-800">{pf.name || 'Atleta Regular'}</p>
                                 <p className="text-[10px] text-slate-400 leading-none mt-0.5">{pf.email}</p>
                               </div>
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${pf.is_premium ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {pf.is_premium ? 'Premium' : 'Free'}
                            </span>
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

               </div>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <HelperItem label="Enter" desc="Ir" />
                <HelperItem label="Esc" desc="Fechar" />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF]">KYRON OS Global Search v3.0</p>
          </div>
       </motion.div>
    </div>
  );
};

function HelperItem({ label, desc }: { label: string, desc: string }) {
  return (
    <div className="flex items-center gap-2">
       <span className="text-[10px] font-black text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">{label}</span>
       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>
    </div>
  );
}

export default CommandPalette;
