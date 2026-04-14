
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SubFilterChipsProps {
  cuts: string[];
  selectedCut: string | null;
  onSelect: (cut: string | null) => void;
}

export const SubFilterChips: React.FC<SubFilterChipsProps> = ({ cuts, selectedCut, onSelect }) => {
  return (
    <AnimatePresence mode="wait">
      {cuts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-2 overflow-x-auto no-scrollbar px-6 py-1"
        >
          {cuts.map((cut) => (
            <button
              key={cut}
              onClick={() => onSelect(selectedCut === cut ? null : cut)}
              className={`shrink-0 px-4 h-8 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${
                selectedCut === cut
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-500 border-transparent active:bg-slate-200'
              }`}
            >
              {cut}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
