
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { AppErrorType } from '../../lib/errorHandling';

export type UIState = 'loading' | 'empty' | 'error' | 'success';

interface ScreenStateProps {
  state: UIState;
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
  return (
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
