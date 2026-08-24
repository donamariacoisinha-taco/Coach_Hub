import { Exercise } from '../../types';
import {
  buildExerciseSearchText,
  exerciseMatchesMuscleFilter,
  normalizeExerciseFilterText,
} from '../../lib/exercises/exerciseFilters';

type ExerciseCandidate = Record<string, any>;

export const buildExerciseSelectorSearchText = (exercise: ExerciseCandidate): string => (
  buildExerciseSearchText(exercise as unknown as Exercise)
);

const matchesSearch = (searchText: string, query: string): boolean => {
  const terms = normalizeExerciseFilterText(query).split(' ').filter(Boolean);
  return terms.length === 0 || terms.every(term => searchText.includes(term));
};

export const filterExerciseSelectorCandidates = <T extends ExerciseCandidate>(
  exercises: T[],
  searchQuery: string,
  selectedMuscleGroup: string,
): T[] => exercises.filter(exercise => {
  if (exercise.is_active === false) return false;
  const searchText = buildExerciseSelectorSearchText(exercise);
  return matchesSearch(searchText, searchQuery)
    && exerciseMatchesMuscleFilter(exercise as unknown as Exercise, selectedMuscleGroup);
});

export type ReplaceOrSwapResult<T> = {
  exercises: T[];
  swappedWithIndex: number | null;
};

export const remapIndexedExerciseState = <T>(
  state: Record<number, T>,
  replaceIndex: number,
  swappedWithIndex: number | null,
): Record<number, T> => {
  const next = { ...state };
  if (swappedWithIndex === null) {
    delete next[replaceIndex];
    return next;
  }

  const hasReplaceState = Object.prototype.hasOwnProperty.call(state, replaceIndex);
  const hasSwapState = Object.prototype.hasOwnProperty.call(state, swappedWithIndex);
  if (hasSwapState) next[replaceIndex] = state[swappedWithIndex];
  else delete next[replaceIndex];
  if (hasReplaceState) next[swappedWithIndex] = state[replaceIndex];
  else delete next[swappedWithIndex];
  return next;
};

export const replaceOrSwapExercise = <T extends ExerciseCandidate>(
  exercises: T[],
  replaceIndex: number,
  candidate: ExerciseCandidate,
): ReplaceOrSwapResult<T> => {
  if (!exercises[replaceIndex]) return { exercises, swappedWithIndex: null };

  const existingIndex = exercises.findIndex((exercise, index) => (
    index !== replaceIndex && exercise.exercise_id === candidate.id
  ));

  if (existingIndex >= 0) {
    const swapped = [...exercises];
    [swapped[replaceIndex], swapped[existingIndex]] = [swapped[existingIndex], swapped[replaceIndex]];
    return {
      exercises: swapped.map((exercise, order) => ({ ...exercise, order })),
      swappedWithIndex: existingIndex,
    };
  }

  return {
    exercises: exercises.map((exercise, index) => index === replaceIndex ? {
      ...exercise,
      exercise_id: candidate.id,
      exercise_name: candidate.name,
      muscle_group: candidate.muscle_group || exercise.muscle_group,
      exercise_image: candidate.image_url || exercise.exercise_image,
      exercise_name_snapshot: candidate.name,
    } : exercise),
    swappedWithIndex: null,
  };
};
