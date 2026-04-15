
import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { AppErrorType } from '../../lib/errorHandling';

interface ErrorStateProps {
  type?: AppErrorType;
  title: string;
  description: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'unknown',
  title,
  description,
  onRetry,
  actionLabel = 'Tentar novamente'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="w-12 h-12 text-slate-200" />;
      default:
        return <AlertCircle className="w-12 h-12 text-slate-200" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="mb-6 p-6 bg-white rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-50">
        {getIcon()}
      </div>
      
      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-sm font-medium text-slate-400 max-w-[240px] leading-relaxed mb-8">
        {description}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
