
import React from 'react';

interface FilterChipsProps {
  muscles: string[];
  selectedMuscle: string | null;
  onSelect: (muscle: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ muscles, selectedMuscle, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 py-2">
      {muscles.map((muscle) => (
        <button
          key={muscle}
          onClick={() => onSelect(muscle)}
          className={`shrink-0 px-5 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
            selectedMuscle === muscle
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
              : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'
          }`}
        >
          {muscle}
        </button>
      ))}
    </div>
  );
};
