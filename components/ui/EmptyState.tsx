
import React from 'react';
import { motion } from 'motion/react';
import { Plus, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-12 h-12 text-slate-200" />,
  title,
  description,
  onAction,
  actionLabel
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="mb-8 p-8 bg-white rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50">
        {icon}
      </div>
      
      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">
        {title}
      </h3>
      
      <p className="text-sm font-medium text-slate-400 max-w-[260px] leading-relaxed mb-10">
        {description}
      </p>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-3 px-10 py-5 bg-blue-600 rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
