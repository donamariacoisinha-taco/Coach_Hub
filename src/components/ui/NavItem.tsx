
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItemProps {
  id: string;
  icon: LucideIcon;
  label?: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  badge?: string;
  className?: string;
  showLabel?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  id,
  icon: Icon,
  label,
  isActive,
  onClick,
  onMouseEnter,
  badge,
  className = '',
  showLabel = false
}) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={label || id}
      className={`relative flex flex-col items-center justify-center transition-all p-3 group ${className}`}
    >
      <div className="relative">
        <Icon
          size={24}
          className={`transition-all duration-300 ${
            isActive ? 'text-slate-900 scale-110' : 'text-slate-300 group-hover:text-slate-500 group-active:scale-90'
          }`}
        />
        {badge && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {showLabel && label && (
        <span
          className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 transition-colors ${
            isActive ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-500'
          }`}
        >
          {label}
        </span>
      )}

      {isActive && (
        <motion.div
          layoutId="nav-dot"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-900 rounded-full"
        />
      )}
    </button>
  );
};
