
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppError } from '../../lib/errorHandling';

interface ErrorToastProps {
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose, onRetry }) => {
  useEffect(() => {
    if (error && !error.retryable && error.type !== 'server') {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 z-[2000] max-w-md mx-auto"
        >
          <div className={`
            relative overflow-hidden rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl
            ${error.type === 'success' 
              ? 'bg-green-50/90 border-green-100 text-green-900' 
              : 'bg-white/90 border-slate-100 text-slate-900'}
          `}>
            {/* Progress bar para auto-close */}
            {!error.retryable && error.type !== 'success' && (
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-slate-100"
              />
            )}

            <div className="flex items-start gap-4">
              <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
                ${error.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}
              `}>
                {error.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black uppercase tracking-tight">
                  {error.title}
                </h4>
                <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">
                  {error.message}
                </p>

                {onRetry && error.retryable && (
                  <button
                    onClick={onRetry}
                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5 active:opacity-50 transition-opacity"
                  >
                    <RefreshCw size={12} />
                    Tentar agora
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
