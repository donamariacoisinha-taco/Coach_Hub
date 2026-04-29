
import React from 'react';
import { Exercise } from '../types';
import { motion } from 'motion/react';
import { Replace, Info } from 'lucide-react';

interface ExerciseListItemProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
  isReplacing: boolean;
}

export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({ exercise, onSelect, isReplacing }) => {
  return (
    <motion.div
      whileTap={{ backgroundColor: 'rgba(241, 245, 249, 1)' }}
      onClick={() => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onSelect(exercise);
      }}
      className="flex items-center gap-4 py-4 px-6 border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors group"
    >
      <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 shrink-0 group-active:scale-95 transition-transform">
        <img 
          src={exercise.static_frame_url || exercise.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} 
          className="w-full h-full object-contain mix-blend-multiply" 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-2">
          {exercise.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
            {exercise.muscle_group}
          </span>
          {exercise.anatomical_cut && (
            <>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {exercise.anatomical_cut}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-active:bg-slate-900 group-active:text-white transition-all">
        {isReplacing ? <Replace size={16} /> : <Info size={16} />}
      </div>
    </motion.div>
  );
};
