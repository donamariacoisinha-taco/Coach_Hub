/** Índices realmente concluídos. Estar na última série não conclui essa série. */
export function confirmedSetIndexes(completed: Iterable<number>, setCount: number): number[] {
  return [...new Set([...completed].filter((index) => Number.isInteger(index) && index >= 0 && index < setCount))]
    .sort((left, right) => left - right);
}

export function volumeKg(sets: Array<{ weight?: unknown; reps?: unknown; weight_achieved?: unknown; reps_achieved?: unknown }>): number {
  return sets.reduce((sum, set) => {
    const weight = Number(set.weight ?? set.weight_achieved);
    const reps = Number(set.reps ?? set.reps_achieved);
    if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) return sum;
    return sum + weight * reps;
  }, 0);
}

/** "Só os dados" grava as séries já feitas e não reescreve a ficha. */
export function saveChoiceWritesPlan(choice: 'data' | 'new' | 'update'): boolean {
  return choice !== 'data';
}
