
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Library, 
  ListTodo, 
  ShieldCheck, 
  Settings, 
  Plus, 
  Search,
  Bell,
  User,
  ArrowLeft
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import AdminDashboard from './components/AdminDashboard';
import ExerciseLibrary from './components/ExerciseLibrary';
import ReviewBoard from './components/ReviewBoard';
import GovernanceHub from './components/GovernanceHub';
import ExerciseEditorSheet from './components/ExerciseEditorSheet';

interface AdminPanelProProps {
  onBack: () => void;
}

const AdminPanelPro: React.FC<AdminPanelProProps> = ({ onBack }) => {
  const { 
    activeTab, 
    setActiveTab, 
    fetchData, 
    loading, 
    openEditor,
    searchQuery,
    setSearchQuery
  } = useAdminStore();

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'review', label: 'Review', icon: ListTodo },
    { id: 'governance', label: 'IA & Governança', icon: ShieldCheck },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none">COACH <span className="text-blue-600">RUBI</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-400' : 'group-hover:text-blue-600 transition-colors'} />
                  <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-50">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-bold">Voltar ao App</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#F7F8FA]/80 backdrop-blur-xl border-b border-slate-200/50 px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={onBack} className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
               <ArrowLeft size={18} />
            </button>
            <h1 className="font-black text-lg tracking-tighter">COACH <span className="text-blue-600">RUBI</span></h1>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-md bg-white rounded-2xl border border-slate-200 px-5 group focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-sm">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Buscar exercícios, grupos ou comandos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none py-4 px-3 text-sm font-medium outline-none placeholder:text-slate-400"
            />
            <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-400">⌘ K</div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 p-1.5 pr-5 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-200 transition-all">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                <User size={20} />
              </div>
              <div className="hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Admin</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Rubi Intelligence</p>
              </div>
            </div>
            <button 
              onClick={() => openEditor()}
              className="px-6 h-12 bg-slate-950 text-white rounded-full font-bold text-sm tracking-tight flex items-center gap-2 shadow-xl shadow-slate-950/20 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Novo Exercício</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 lg:p-12">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminDashboard />
                </motion.div>
              )}
              {activeTab === 'library' && (
                <motion.div 
                  key="library"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ExerciseLibrary />
                </motion.div>
              )}
              {activeTab === 'review' && (
                <motion.div 
                  key="review"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReviewBoard />
                </motion.div>
              )}
              {activeTab === 'governance' && (
                <motion.div 
                  key="governance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <GovernanceHub />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-12">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter italic">Configurações <span className="text-blue-600">Gerais</span></h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Preferências do sistema e integridade</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h3 className="font-black text-lg uppercase tracking-tight">IA & Regras</h3>
                          <div className="space-y-4">
                             <SettingItem label="Score Mínimo para Publicação" value="70%" />
                             <SettingItem label="Auditoria Automática" value="Ativada" />
                             <SettingItem label="Modelo Rubi v3.5-Turbo" value="Ativo" />
                          </div>
                       </section>

                       <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h3 className="font-black text-lg uppercase tracking-tight">Banco de Dados</h3>
                          <div className="space-y-4">
                             <SettingButton label="Importar CSV (Airtable)" />
                             <SettingButton label="Exportar JSON Backup" />
                             <SettingButton label="Limpar Cache de Mídia" variant="danger" />
                          </div>
                       </section>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sticky Nav */}

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 lg:hidden flex items-center justify-around px-2 z-50">
         {tabs.filter(t => t.id !== 'settings').map((tab) => {
           const Icon = tab.icon;
           const isActive = activeTab === tab.id;
           return (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 min-w-[72px] transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
             >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-300'} />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label.split(' ')[0]}</span>
             </button>
           );
         })}
      </nav>

      {/* Overlays */}
      <ExerciseEditorSheet />
    </div>
  );
};

function SettingItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
       <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
       <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{value}</span>
    </div>
  );
}

function SettingButton({ label, variant = 'default' }: { label: string, variant?: 'default' | 'danger' }) {
  return (
    <button className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      variant === 'danger' 
        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
        : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-100'
    }`}>
      {label}
    </button>
  );
}

export default AdminPanelPro;
