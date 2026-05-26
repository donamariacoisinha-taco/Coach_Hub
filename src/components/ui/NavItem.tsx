
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
          size={20}
          className={`transition-all duration-400 ${
            isActive ? 'text-[#7BA7FF] scale-110 drop-shadow-[0_2px_8px_rgba(123,167,255,0.3)]' : 'text-slate-400 group-hover:text-slate-600 group-active:scale-95'
          }`}
        />
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#818CF8] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {showLabel && label && (
        <span
          className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 transition-colors ${
            isActive ? 'text-[#7BA7FF]' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        >
          {label}
        </span>
      )}

      {isActive && (
        <motion.div
          layoutId="nav-dot"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7BA7FF] rounded-full"
        />
      )}
    </button>
  );
};
