import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Library, 
  ListTodo, 
  BrainCircuit, 
  BarChart3, 
  Settings, 
  Plus, 
  Search,
  Bell,
  User,
  ArrowLeft,
  ChevronRight,
  Command as CommandIcon,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import LibraryOS from './components/LibraryOS';
import ReviewCenter from './components/ReviewCenter';
import AIOperator from './components/AIOperator';
import AnalyticsGrowth from './components/AnalyticsGrowth';
import SettingsLogs from './components/SettingsLogs';
import ExerciseEditorV2 from './components/ExerciseEditorV2';
import CommandPalette from './components/CommandPalette';
import AutoFixDashboard from './components/AutoFixDashboard';
import AutoFixQueue from './components/AutoFixQueue';

interface AdminPanelV2Props {
  onBack: () => void;
}

const AdminPanelV2: React.FC<AdminPanelV2Props> = ({ onBack }) => {
  const { 
    activeTab, 
    setActiveTab, 
    fetchData, 
    loading, 
    openEditor,
    searchQuery,
    setSearchQuery,
    isCommandPaletteOpen,
    setCommandPaletteOpen
  } = useAdminStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const tabs = [
    { id: 'dashboard', label: 'Executive', icon: LayoutDashboard, desc: 'Overview & KPIs' },
    { id: 'library', label: 'Library OS', icon: Library, desc: 'Asset Management' },
    { id: 'autofix', label: 'Auto Fix', icon: Zap, desc: 'Self-Healing Engine' },
    { id: 'review', label: 'Review Hub', icon: ListTodo, desc: 'Quality Control' },
    { id: 'ai', label: 'AI Operator', icon: BrainCircuit, desc: 'Intelligence Engine' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Growth Data' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Core Config' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Pro Design */}
      <aside className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col z-40">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-slate-950 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-slate-950/20">
              <Sparkles size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter leading-none">RUBI <span className="text-blue-600">OS</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Admin v2.0
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-white/10' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-blue-600 shadow-sm border border-slate-100'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black uppercase tracking-widest">{tab.label}</p>
                    <p className={`text-[10px] font-medium leading-none mt-1 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {tab.desc}
                    </p>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-blue-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-50 space-y-4">
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 transition-all group"
          >
            <div className="flex items-center gap-3">
              <CommandIcon size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Atalhos</span>
            </div>
            <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black group-hover:border-slate-300 transition-all">⌘K</div>
          </button>
          
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-80 min-h-screen flex flex-col relative">
        {/* Global Header */}
        <header className="sticky top-0 z-30 bg-[#F7F8FA]/80 backdrop-blur-2xl border-b border-slate-200/50 px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={onBack} className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 active:scale-95 transition-all">
               <ArrowLeft size={18} />
            </button>
            <h1 className="font-black text-xl tracking-tighter">RUBI <span className="text-blue-600">OS</span></h1>
          </div>

          {/* Context Title - Desktop */}
          <div className="hidden lg:block">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                Painel Admin <ChevronRight size={10} /> {tabs.find(t => t.id === activeTab)?.label}
             </h2>
             <p className="text-lg font-black tracking-tight mt-0.5 text-slate-950">
                {tabs.find(t => t.id === activeTab)?.desc}
             </p>
          </div>

          <div className="flex items-center gap-3 lg:gap-8">
            {/* Action Bar */}
            <div className="flex items-center gap-2">
               <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 hover:border-blue-200 transition-all group relative">
                 <Bell size={20} />
                 <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
               </button>
               <button className="hidden sm:flex items-center gap-3 p-1.5 pr-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-sm">
                  <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-lg shadow-slate-950/20">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Rubi Admin</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Enterprise Access</p>
                  </div>
               </button>
            </div>

            <button 
              onClick={() => openEditor()}
              className="px-8 h-14 bg-slate-950 text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-slate-950/40 active:scale-95 transition-all group"
            >
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                 <Plus size={16} />
              </div>
              <span className="hidden sm:inline">Add Exercise</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                  {activeTab === 'dashboard' && <ExecutiveDashboard />}
                  {activeTab === 'library' && <LibraryOS />}
                  {activeTab === 'autofix' && (
                    <div className="space-y-12">
                       <AutoFixDashboard />
                       <AutoFixQueue />
                    </div>
                  )}
                  {activeTab === 'review' && <ReviewCenter />}
                  {activeTab === 'ai' && <AIOperator />}
                  {activeTab === 'analytics' && <AnalyticsGrowth />}
                  {activeTab === 'settings' && <SettingsLogs />}
              </motion.div>
            </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white border-t border-slate-200 lg:hidden flex items-center justify-around px-4 z-50 pb-6 pointer-events-auto">
         {tabs.filter(t => t.id !== 'settings' && t.id !== 'analytics').map((tab) => {
           const Icon = tab.icon;
           const isActive = activeTab === tab.id;
           return (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 min-w-[72px] transition-all relative ${isActive ? 'text-blue-600' : 'text-slate-300'}`}
             >
                {isActive && (
                   <motion.div 
                     layoutId="mobileNavActive"
                     className="absolute -top-3 w-1.5 h-1.5 bg-blue-600 rounded-full"
                   />
                )}
                <div className={`p-2.5 rounded-2xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                   <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label.split(' ')[0]}</span>
             </button>
           );
         })}
         <button className="flex flex-col items-center gap-1.5 min-w-[72px] text-slate-300">
            <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-300">
               <Settings size={22} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">More</span>
         </button>
      </nav>

      {/* Global Overlays */}
      <ExerciseEditorV2 />
      <CommandPalette />
      
      {/* Scroll to Top button for mobile? Or FAB? */}
      <button 
        onClick={() => openEditor()}
        className="fixed bottom-28 right-6 w-16 h-16 bg-slate-950 text-white rounded-full flex lg:hidden items-center justify-center shadow-2xl shadow-slate-950/40 active:scale-90 transition-all z-40 border border-white/10"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default AdminPanelV2;
