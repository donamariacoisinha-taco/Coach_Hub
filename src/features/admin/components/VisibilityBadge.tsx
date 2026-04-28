import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface VisibilityBadgeProps {
  isPublished: boolean;
  compact?: boolean;
}

export const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ isPublished, compact }) => {
  return (
    <div className={`
      flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500
      ${isPublished 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100/30' 
        : 'bg-slate-50 border-slate-200 text-slate-400'}
      ${compact ? 'scale-[0.85] origin-left' : ''}
    `}>
      <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
      <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
        {isPublished ? 'Published' : 'Hidden'}
      </span>
      {isPublished ? <Eye size={10} className="ml-0.5 opacity-40" /> : <EyeOff size={10} className="ml-0.5 opacity-40" />}
    </div>
  );
};

interface VisibilityToggleProps {
  isPublished: boolean;
  onToggle: (e: React.MouseEvent | React.TouchEvent) => void;
  variant?: 'button' | 'switch' | 'icon';
  isLoading?: boolean;
  label?: boolean;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ 
  isPublished, 
  onToggle, 
  variant = 'switch', 
  isLoading = false,
  label 
}) => {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    onToggle(e);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95
          ${isPublished ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isPublished ? (
          <EyeOff size={16} />
        ) : (
          <Eye size={16} />
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          group h-8 px-3 rounded-full flex items-center gap-2 transition-all active:scale-95
          ${isPublished 
            ? 'bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-700' 
            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-700'}
          ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 size={12} className="animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest pointer-events-none">
          {isLoading ? 'Wait...' : isPublished ? 'Hide' : 'Publish'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {label && (
        <span className={`text-[9px] font-black uppercase tracking-wider transition-colors duration-500 ${isPublished ? 'text-emerald-600' : 'text-slate-400'}`}>
          {isPublished ? 'Live' : 'Hidden'}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          w-9 h-5 rounded-full p-0.5 transition-all flex items-center relative shadow-inner
          ${isPublished ? 'bg-emerald-500' : 'bg-slate-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <motion.div 
          layout 
          className={`w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center ${isPublished ? 'ml-auto' : 'mr-auto'}`}
          transition={{ type: "spring", stiffness: 700, damping: 35 }}
        >
          {isLoading && <Loader2 size={8} className="animate-spin text-slate-400" />}
        </motion.div>
      </button>
    </div>
  );
};

