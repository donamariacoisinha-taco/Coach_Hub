
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  danger = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 space-y-6"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${danger ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
              <AlertCircle size={24} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">{title}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">{message}</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={onConfirm}
                disabled={loading}
                className={`w-full py-4 rounded-full font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${danger ? 'bg-red-500 shadow-red-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : confirmText}
              </button>
              <button 
                onClick={onClose}
                disabled={loading}
                className="w-full py-2 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] hover:text-slate-900 transition-colors"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
