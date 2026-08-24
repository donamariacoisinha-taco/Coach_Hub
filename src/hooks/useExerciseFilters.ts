
import { useState, useMemo } from 'react';
import { Exercise } from '../types';
import {
  buildExerciseFilterGroups,
  buildExerciseSearchText,
  exerciseMatchesMuscleFilter,
  normalizeExerciseFilterText,
} from '../lib/exercises/exerciseFilters';

export const useExerciseFilters = (availableExercises: Exercise[], currentExercise?: any, favoriteIds: Set<string> = new Set()) => {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCut, setSelectedCut] = useState<string | null>(null);

  const filterGroups = useMemo(() => buildExerciseFilterGroups(availableExercises), [availableExercises]);

  const filteredExercises = useMemo(() => {
    const queryTerms = normalizeExerciseFilterText(search).split(' ').filter(Boolean);
    
    return availableExercises
      .filter(ex => {
        const searchText = buildExerciseSearchText(ex);
        const matchesSearch = queryTerms.every((term) => searchText.includes(term));
        
        const matchesMuscle = !selectedMuscle || exerciseMatchesMuscleFilter(ex, selectedMuscle);
        const matchesCut = !selectedCut || exerciseMatchesMuscleFilter(ex, selectedCut);
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
        exerciseMatchesMuscleFilter(ex, currentExercise.muscle_group) &&
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
    availableMuscles: filterGroups.map((group) => group.name),
    availableCuts: selectedMuscle
      ? filterGroups.find((group) => group.name === selectedMuscle)?.subgroups.map((subgroup) => subgroup.name) || []
      : []
  };
}
