export type ExerciseFilterCandidate = {
  name?: string | null;
  description?: string | null;
  muscle_group?: string | null;
};

export const normalizeExerciseFilterText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getExerciseSearchText = (exercise: ExerciseFilterCandidate): string =>
  normalizeExerciseFilterText([
    exercise.name,
    exercise.description,
    exercise.muscle_group,
  ].filter(Boolean).join(" "));

const hasAnyTerm = (text: string, terms: string[]): boolean =>
  terms.some((term) => text.includes(term));

export const matchesExerciseMuscleFilter = (
  exercise: ExerciseFilterCandidate,
  selectedMuscleGroup: string,
): boolean => {
  const selected = normalizeExerciseFilterText(selectedMuscleGroup);
  if (!selected || selected === "tudo") return true;

  const muscleGroup = normalizeExerciseFilterText(exercise.muscle_group);
  const searchText = getExerciseSearchText(exercise);

  if (selected === "cardio") {
    return muscleGroup.includes("cardio");
  }

  if (selected === "biceps") {
    const isTriceps = hasAnyTerm(searchText, ["triceps"]);
    return !isTriceps && hasAnyTerm(searchText, ["biceps", "rosca", "curl"]);
  }

  if (selected === "triceps") {
    return hasAnyTerm(searchText, ["triceps"]);
  }

  return muscleGroup === selected;
};
