
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';
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
            relative overflow-hidden rounded-[2.5rem] border p-6 shadow-2xl backdrop-blur-xl
            ${error.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' 
              : error.type === 'network'
              ? 'bg-amber-50/90 border-amber-100 text-amber-900'
              : 'bg-white/90 border-slate-100 text-slate-900'}
          `}>
            {/* Progress bar para auto-close */}
            {!error.retryable && error.type !== 'success' && error.type !== 'network' && (
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-slate-100/50"
              />
            )}

            <div className="flex items-start gap-5">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                ${error.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : error.type === 'network'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-red-50 text-red-500'}
              `}>
                {error.type === 'success' ? (
                  <CheckCircle2 size={24} />
                ) : error.type === 'network' ? (
                  <WifiOff size={24} />
                ) : (
                  <AlertCircle size={24} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1.5">
                  {error.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {error.message}
                </p>

                {onRetry && (error.retryable || error.type === 'network') && (
                  <button
                    onClick={onRetry}
                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 border-b-2 border-slate-900 pb-0.5 active:opacity-50 transition-opacity"
                  >
                    <RefreshCw size={12} />
                    Tentar agora
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
