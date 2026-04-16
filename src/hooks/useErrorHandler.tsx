
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppError, mapError, logError } from '../lib/errorHandling';
import { ErrorToast } from '../components/ui/ErrorToast';

interface ErrorContextType {
  showError: (error: any, retryAction?: () => Promise<any>) => Promise<void>;
  showSuccess: (title: string, message: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeError, setActiveError] = useState<AppError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<any>) | null>(null);

  const showError = useCallback(async (error: any, retryAction?: () => Promise<any>) => {
    const appError = mapError(error);
    logError(appError);
    
    // Auto-retry logic para erros de rede ou servidor
    if (appError.retryable && retryAction && retryCount < 3) {
      const delay = retryCount === 0 ? 0 : retryCount === 1 ? 2000 : 5000;
      
      setRetryCount(prev => prev + 1);
      setLastFailedAction(() => retryAction);

      if (delay > 0) {
        // Mostra um toast discreto de "tentando novamente"
        setActiveError({
          ...appError,
          title: 'Conexão instável',
          message: `Tentando novamente em ${delay/1000}s...`
        });
      }

      setTimeout(async () => {
        try {
          await retryAction();
          setActiveError(null);
          setRetryCount(0);
          setLastFailedAction(null);
        } catch (nextErr) {
          showError(nextErr, retryAction);
        }
      }, delay);
      
      return;
    }

    // Haptic feedback para erros críticos
    if (appError.type === 'server' || appError.type === 'auth') {
      if ('vibrate' in navigator) navigator.vibrate([30, 50]);
    } else {
      if ('vibrate' in navigator) navigator.vibrate(10);
    }

    setActiveError(appError);
  }, [retryCount]);

  const showSuccess = useCallback((title: string, message: string) => {
    setActiveError({
      type: 'success',
      title,
      message
    });
    setRetryCount(0);
    setLastFailedAction(null);
  }, []);

  const clearError = useCallback(() => {
    setActiveError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, clearError }}>
      {children}
      <ErrorToast 
        error={activeError} 
        onClose={clearError} 
        onRetry={activeError?.retryable ? () => {
          // Aqui poderíamos disparar um evento global de retry ou apenas fechar e deixar o componente tentar de novo
          clearError();
        } : undefined}
      />
    </ErrorContext.Provider>
  );
};

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};
