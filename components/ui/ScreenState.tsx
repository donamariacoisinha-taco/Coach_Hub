
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { AppErrorType } from '../../lib/errorHandling';
import { RefreshCcw, WifiOff } from 'lucide-react';

export type UIState = 'loading' | 'empty' | 'error' | 'success';

interface ScreenStateProps {
  state: UIState;
  isRefreshing?: boolean;
  errorType?: AppErrorType;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
}

export const ScreenState: React.FC<ScreenStateProps> = ({
  state,
  isRefreshing = false,
  errorType,
  errorTitle = 'Tivemos um problema',
  errorDescription = 'Não foi possível carregar os dados no momento.',
  onRetry,
  
  emptyIcon,
  emptyTitle = 'Nada por aqui',
  emptyDescription = 'Ainda não há dados para exibir.',
  onEmptyAction,
  emptyActionLabel,
  
  loadingComponent,
  children
}) => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative">
      {/* Floating Badges */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[100] pointer-events-none"
          >
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <RefreshCcw size={10} className="text-blue-500 animate-spin" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Atualizando...</span>
            </div>
          </motion.div>
        )}

        {!isOnline && state === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -10, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[100] pointer-events-none"
          >
            <div className="bg-amber-50/90 backdrop-blur-md border border-amber-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <WifiOff size={10} className="text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">Mostrando dados salvos</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
      {state === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          {loadingComponent}
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="w-full"
        >
          <ErrorState 
            type={errorType}
            title={errorTitle}
            description={errorDescription}
            onRetry={onRetry}
          />
        </motion.div>
      )}

      {state === 'empty' && (
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="w-full"
        >
          <EmptyState 
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            onAction={onEmptyAction}
            actionLabel={emptyActionLabel}
          />
        </motion.div>
      )}

      {state === 'success' && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isRefreshing ? 0.6 : 1, 
            y: 0 
          }}
          transition={{ 
            duration: isRefreshing ? 0.2 : 0.4, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
