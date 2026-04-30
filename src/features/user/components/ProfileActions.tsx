import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'motion/react';
import { LogOut, ChevronRight, Settings, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useNavigation } from '../../../App';

export function ProfileActions() {
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useNavigation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <div className="bg-white rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 overflow-hidden">
        <button 
          onClick={() => toggleTheme(theme === 'light' ? 'classic' : 'light')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-500 p-2 rounded-xl group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
              {theme === 'light' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </div>
            <span className="text-sm font-bold text-slate-700">Tema {theme === 'light' ? 'Claro' : 'Escuro'}</span>
          </div>
          <div className="w-10 h-6 bg-slate-100 rounded-full relative p-1 group-hover:bg-slate-200 transition-colors">
            <motion.div 
              animate={{ x: theme === 'light' ? 0 : 16 }}
              className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-500 p-2 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <Settings size={18} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-slate-700">Configurações da Conta</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-500 p-2 rounded-xl group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-slate-700">Privacidade e Dados</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
        </button>
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-50 text-red-600 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:bg-red-600 hover:text-white active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-red-100 hover:border-red-600"
      >
        <LogOut size={16} strokeWidth={3} />
        Sair da conta
      </button>

      <div className="text-center pt-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Coach Rubi • v2.5.0</p>
      </div>
    </motion.div>
  );
}
