import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'motion/react';
import { LogOut, ChevronRight, Settings, ShieldCheck, Sun, Moon, RefreshCw } from 'lucide-react';
import { useNavigation } from '../../../App';

export function ProfileActions() {
  const { logout } = useAuthStore();
  const { theme, toggleTheme, navigate } = useNavigation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3 relative"
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

        <button 
          onClick={() => setShowConfirmModal(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-500 p-2 rounded-xl group-hover:bg-[#7BA7FF]/10 group-hover:text-blue-600 transition-colors">
              <RefreshCw size={18} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-slate-700">Refazer Onboarding</span>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
        </button>
      </div>

      {/* CONFIRMATION MODAL FOR REDOING ONBOARDING */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] font-sans">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Atualizar seu plano?</h3>
            <p className="text-xs text-slate-505 leading-relaxed font-semibold text-slate-500">
              Você poderá atualizar seus objetivos, disponibilidade, limitações e preferências físicas. Seu histórico de treinos será totalmente preservado.
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-slate-205 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer bg-white"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  navigate('onboarding');
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md shadow-blue-600/10 cursor-pointer border-none"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">KYRON OS • v2.5.0</p>
      </div>
    </motion.div>
  );
}
