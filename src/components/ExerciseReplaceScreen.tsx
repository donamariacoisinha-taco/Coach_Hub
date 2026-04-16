
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles } from 'lucide-react';
import { Exercise } from '../types';
import { useExerciseFilters } from '../hooks/useExerciseFilters';
import { FilterChips } from './FilterChips';
import { SubFilterChips } from './SubFilterChips';
import { ExerciseListItem } from './ExerciseListItem';

interface ExerciseReplaceScreenProps {
  isOpen: boolean;
  onClose: () => void;
  availableExercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  replacingIndex: number | null;
  currentExercise?: any;
}

export const ExerciseReplaceScreen: React.FC<ExerciseReplaceScreenProps> = ({
  isOpen,
  onClose,
  availableExercises,
  onSelect,
  replacingIndex,
  currentExercise
}) => {
  const {
    search,
    setSearch,
    selectedMuscle,
    handleMuscleSelect,
    selectedCut,
    setSelectedCut,
    filteredExercises,
    suggestions,
    availableCuts
  } = useExerciseFilters(availableExercises, currentExercise);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full h-[94vh] bg-[#F7F8FA] rounded-t-[3rem] flex flex-col relative z-10 overflow-hidden shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
            
            <header className="px-8 pt-4 pb-4 flex justify-between items-center bg-[#F7F8FA]">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                  {replacingIndex !== null ? 'Substituir' : 'Biblioteca'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {filteredExercises.length} opções disponíveis
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 active:text-slate-900 shadow-sm transition-all"
              >
                <X size={24} />
              </button>
            </header>

            {/* SEARCH & FILTERS STICKY AREA */}
            <div className="bg-[#F7F8FA] z-20 space-y-4 pb-4">
              <div className="px-8">
                <div className="relative">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="BUSCAR EXERCÍCIO..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-14 pr-6 h-14 bg-white border border-slate-100 rounded-full text-slate-900 font-bold text-sm outline-none focus:border-slate-900 transition-all uppercase tracking-widest placeholder:text-slate-200 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FilterChips 
                  selectedMuscle={selectedMuscle} 
                  onSelect={handleMuscleSelect} 
                />
                <SubFilterChips 
                  cuts={availableCuts} 
                  selectedCut={selectedCut} 
                  onSelect={setSelectedCut} 
                />
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[2.5rem] shadow-inner">
              
              {/* SUGGESTIONS SECTION */}
              {suggestions.length > 0 && !search && !selectedMuscle && (
                <div className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sugeridos para você</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {suggestions.map((ex) => (
                      <button 
                        key={ex.id}
                        onClick={() => onSelect(ex)}
                        className="shrink-0 w-44 bg-slate-50 rounded-3xl p-5 text-left space-y-4 active:scale-95 transition-all border border-transparent hover:border-blue-100 shadow-sm"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm">
                          <img src={ex.image_url} className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h5 className="text-[12px] font-bold text-slate-900 leading-tight line-clamp-2">{ex.name}</h5>
                          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN LIST */}
              <div className="pt-4">
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((ex) => (
                    <ExerciseListItem 
                      key={ex.id} 
                      exercise={ex} 
                      onSelect={onSelect} 
                      isReplacing={replacingIndex !== null}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Search size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Nenhum exercício encontrado para esses filtros.</p>
                  </div>
                )}
              </div>
              
              <div className="h-20" /> {/* Bottom spacing */}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
