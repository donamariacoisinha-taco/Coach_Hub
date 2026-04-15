
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle, Check, X, RotateCcw } from 'lucide-react';
import { AppError } from '../../lib/errorHandling';

interface ErrorToastProps {
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose, onRetry }) => {
  useEffect(() => {
    if (error && error.type !== 'network') {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'network': return <WifiOff className="w-5 h-5 text-amber-500" />;
      case 'success': return <Check className="w-5 h-5 text-emerald-500" />;
      default: return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 left-6 right-6 z-[2000] max-w-md mx-auto"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl shadow-slate-200/50 flex items-center gap-4">
          <div className="shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">
              {error.title}
            </p>
            <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
              {error.message}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {error.retryable && onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-blue-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
