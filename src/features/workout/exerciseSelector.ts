type ExerciseCandidate = Record<string, any>;

const foldText = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const collectText = (value: unknown, output: string[], seen: Set<object>): void => {
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = foldText(value);
    if (normalized) output.push(normalized);
    return;
  }

  if (!value || typeof value !== 'object' || seen.has(value as object)) return;
  seen.add(value as object);

  if (Array.isArray(value)) {
    value.forEach(item => collectText(item, output, seen));
    return;
  }

  Object.values(value as Record<string, unknown>).forEach(item => collectText(item, output, seen));
};

const SELECTOR_SYNONYMS: Record<string, string[]> = {
  peito: ['peito', 'peitoral', 'chest'],
  costas: ['costas', 'dorsal', 'dorsais', 'latissimo', 'lats', 'lombar', 'romboide', 'trapezio'],
  quadriceps: ['quadriceps', 'vasto medial', 'vasto lateral', 'reto femoral'],
  gluteo: ['gluteo', 'gluteos', 'glute'],
  ombro: ['ombro', 'ombros', 'deltoide', 'manguito rotador'],
  biceps: ['biceps', 'biceps braquial', 'braquial', 'braquiorradial'],
  triceps: ['triceps', 'triceps braquial', 'extensao de cotovelo', 'pushdown'],
  cardio: ['cardio', 'cardiorrespiratorio', 'aerobico', 'corrida', 'esteira', 'bicicleta', 'bike'],
};

export const buildExerciseSelectorSearchText = (exercise: ExerciseCandidate): string => {
  const values = [
    exercise.name,
    exercise.alt_name,
    exercise.commercial_alias,
    exercise.description,
    exercise.instructions,
    exercise.equipment,
    exercise.muscle_group,
    exercise.muscle_groups,
    exercise.secondary_muscles,
    exercise.subgroup,
    exercise.tags,
    exercise.biomechanics,
    exercise.primary_group,
    exercise.agonist_muscles,
    exercise.synergist_muscles,
    exercise.stabilizer_muscles,
    exercise.movement_pattern,
  ];
  const output: string[] = [];
  const seen = new Set<object>();
  values.forEach(value => collectText(value, output, seen));
  return output.join(' ');
};

const matchesSearch = (searchText: string, query: string): boolean => {
  const terms = foldText(query).split(' ').filter(Boolean);
  return terms.length === 0 || terms.every(term => searchText.includes(term));
};

const matchesMuscle = (searchText: string, selectedMuscleGroup: string): boolean => {
  const selected = foldText(selectedMuscleGroup);
  if (!selected || selected === 'tudo') return true;
  const synonyms = SELECTOR_SYNONYMS[selected] || [selected];
  return synonyms.some(term => searchText.includes(foldText(term)));
};

export const filterExerciseSelectorCandidates = <T extends ExerciseCandidate>(
  exercises: T[],
  searchQuery: string,
  selectedMuscleGroup: string,
): T[] => exercises.filter(exercise => {
  if (exercise.is_active === false) return false;
  const searchText = buildExerciseSelectorSearchText(exercise);
  return matchesSearch(searchText, searchQuery) && matchesMuscle(searchText, selectedMuscleGroup);
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
