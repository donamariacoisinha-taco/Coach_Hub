import { Exercise } from '../../../types';
import { normalizeExerciseFilterText } from '../../../lib/exercises/exerciseFilters';

export function getLibraryReviewIssues(exercises: Exercise[]): Map<string, string[]> {
  const names = new Map<string, number>();
  for (const exercise of exercises) {
    const key = normalizeExerciseFilterText(exercise.name).trim();
    if (key) names.set(key, (names.get(key) || 0) + 1);
  }
  return new Map(exercises.map(exercise => {
    const issues: string[] = [];
    if (!exercise.image_url?.trim() && !exercise.static_frame_url?.trim()) issues.push('Sem imagem');
    if (!exercise.instructions?.trim()) issues.push('Sem instruções');
    if (!exercise.muscle_group?.trim()) issues.push('Sem grupo muscular');
    const key = normalizeExerciseFilterText(exercise.name).trim();
    if (key && (names.get(key) || 0) > 1) issues.push('Nome repetido — conferir');
    return [exercise.id, issues];
  }));
}

export async function archiveLibrarySelection(ids: string[], archive: (id: string) => Promise<void>) {
  const completed: string[] = [];
  const failed: string[] = [];
  // Each result is tracked independently: a failed item must not conceal successful updates.
  for (const id of ids) {
    try { await archive(id); completed.push(id); }
    catch { failed.push(id); }
  }
  return { completed, failed };
}
