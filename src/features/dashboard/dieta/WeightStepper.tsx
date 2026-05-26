import React from 'react';
import { motion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

interface WeightStepperProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const WeightStepper: React.FC<WeightStepperProps> = ({
  value,
  onChange,
  label,
  min = 30,
  max = 250,
  step = 0.5,
  unit = 'kg'
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Number((value - step).toFixed(1)));
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Number((value + step).toFixed(1)));
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  };

  return (
    <div className="flex flex-col space-y-2 select-none">
      <div className="flex justify-between items-center px-1">
        <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400">
          {label}
        </span>
        <span className="text-[10px] text-slate-400 font-medium font-mono">
          limites {min} - {max} {unit}
        </span>
      </div>

      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/40 rounded-2xl p-2 h-14 relative overflow-hidden">
        {/* Decrement Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={handleDecrement}
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 shadow-sm active:text-slate-800 transition-colors"
        >
          <Minus size={15} />
        </motion.button>

        {/* Dynamic Inner Number */}
        <div className="flex items-baseline space-x-1 justify-center flex-1">
          <motion.span
            key={value}
            initial={{ scale: 0.94, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            className="text-xl font-light tracking-tight text-slate-800 tabular-nums"
          >
            {value.toFixed(1)}
          </motion.span>
          <span className="text-xs font-medium text-slate-400 font-mono">
            {unit}
          </span>
        </div>

        {/* Increment Trigger */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={handleIncrement}
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 shadow-sm active:text-slate-800 transition-colors"
        >
          <Plus size={15} />
        </motion.button>
      </div>
    </div>
  );
};
