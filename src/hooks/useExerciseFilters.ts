
import { useState, useMemo } from 'react';
import { Exercise } from '../types';

export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdominais'
];

export const ANATOMICAL_CUTS: Record<string, string[]> = {
  'Peito': ['Superior', 'Médio', 'Inferior'],
  'Costas': ['Largura', 'Espessura', 'Lombar'],
  'Ombros': ['Anterior', 'Lateral', 'Posterior'],
  'Pernas': ['Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha'],
  'Bíceps': ['Cabeça Longa', 'Cabeça Curta', 'Braquial'],
  'Tríceps': ['Cabeça Longa', 'Cabeça Lateral', 'Cabeça Medial'],
  'Abdominais': ['Abdominal Superior', 'Abdominal Inferior', 'Oblíquos']
};

export function useExerciseFilters(availableExercises: Exercise[], currentExercise?: any, favoriteIds: Set<string> = new Set()) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCut, setSelectedCut] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    const query = search.toLowerCase();
    
    return availableExercises
      .filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(query);
        const matchesMuscle = !selectedMuscle || 
          ex.muscle_group === selectedMuscle ||
          (selectedMuscle === 'Pernas' && (ex.muscle_group === 'Perna' || ex.muscle_group === 'Panturrilhas' || ex.muscle_group === 'Adutores' || ex.muscle_group === 'Glúteos' || ex.muscle_group === 'Quadríceps' || ex.muscle_group === 'Posterior' || ex.muscle_group === 'Posteriores')) ||
          (selectedMuscle === 'Abdominais' && (ex.muscle_group === 'Abdômen' || ex.muscle_group === 'Oblíquos')) ||
          (selectedMuscle === 'Ombros' && ex.muscle_group === 'Ombro');
        const matchesCut = !selectedCut || ex.anatomical_cut === selectedCut;
        // Apenas exercícios ativos devem ser visíveis na seleção pública
        return matchesSearch && matchesMuscle && matchesCut && (ex.is_active !== false);
      })
      .sort((a, b) => {
        // Prioridade 0: Favoritos sempre no topo
        const aFav = favoriteIds.has(a.id) ? 0 : 1;
        const bFav = favoriteIds.has(b.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;

        // 1. Mesmo grupo muscular do exercício atual (se houver)
        if (currentExercise) {
          const aMuscleMatch = a.muscle_group === currentExercise.muscle_group ? 0 : 1;
          const bMuscleMatch = b.muscle_group === currentExercise.muscle_group ? 0 : 1;
          if (aMuscleMatch !== bMuscleMatch) return aMuscleMatch - bMuscleMatch;
          
          // 2. Mesmo corte anatômico
          const aCutMatch = a.anatomical_cut === currentExercise.anatomical_cut ? 0 : 1;
          const bCutMatch = b.anatomical_cut === currentExercise.anatomical_cut ? 0 : 1;
          if (aCutMatch !== bCutMatch) return aCutMatch - bCutMatch;
        }

        // 3. Exercícios compostos primeiro
        const aComp = a.type?.toLowerCase().includes('composto') ? 0 : 1;
        const bComp = b.type?.toLowerCase().includes('composto') ? 0 : 1;
        if (aComp !== bComp) return aComp - bComp;

        return a.name.localeCompare(b.name);
      });
  }, [availableExercises, search, selectedMuscle, selectedCut, currentExercise]);

  const suggestions = useMemo(() => {
    if (!currentExercise) return [];
    return availableExercises
      .filter(ex => 
        ex.muscle_group === currentExercise.muscle_group && 
        ex.id !== currentExercise.exercise_id &&
        (ex.is_active !== false)
      )
      .slice(0, 6);
  }, [availableExercises, currentExercise]);

  const handleMuscleSelect = (muscle: string) => {
    if (selectedMuscle === muscle) {
      setSelectedMuscle(null);
      setSelectedCut(null);
    } else {
      setSelectedMuscle(muscle);
      setSelectedCut(null);
    }
  };

  return {
    search,
    setSearch,
    selectedMuscle,
    handleMuscleSelect,
    selectedCut,
    setSelectedCut,
    filteredExercises,
    suggestions,
    availableCuts: selectedMuscle ? ANATOMICAL_CUTS[selectedMuscle] || [] : []
  };
}
