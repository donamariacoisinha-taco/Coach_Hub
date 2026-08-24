import { describe, expect, it } from 'vitest';
import {
  filterExerciseSelectorCandidates,
  remapIndexedExerciseState,
  replaceOrSwapExercise,
} from './exerciseSelector';

describe('filterExerciseSelectorCandidates', () => {
  const candidates = [
    {
      id: 'cable-triceps',
      name: 'Extensão unilateral no cabo',
      commercial_alias: 'Tríceps unilateral no cabo',
      muscle_group: 'Braços',
      is_active: true,
    },
    {
      id: 'technical-triceps',
      name: 'Pressão na polia',
      muscle_group: 'Braços',
      muscle_groups: ['Braços'],
      secondary_muscles: ['Tríceps braquial'],
      tags: ['polia'],
      biomechanics: { agonist_muscles: ['Tríceps braquial'], primary_joint_actions: ['Extensão de cotovelo'] },
      is_active: true,
    },
    {
      id: 'inactive-triceps',
      name: 'Tríceps inativo',
      muscle_group: 'Tríceps',
      is_active: false,
    },
  ];

  it('encontra tríceps por alias, músculos secundários e biomecânica', () => {
    expect(filterExerciseSelectorCandidates(candidates, '', 'Tríceps').map(item => item.id))
      .toEqual(['cable-triceps', 'technical-triceps']);
  });

  it('normaliza acentos e pesquisa aliases comerciais', () => {
    expect(filterExerciseSelectorCandidates(candidates, 'triceps unilateral', 'Tudo').map(item => item.id))
      .toEqual(['cable-triceps']);
  });
});

describe('replaceOrSwapExercise', () => {
  it('troca com o exercício adjacente sem duplicar e preserva os conjuntos', () => {
    const exercises = [
      { id: 'row-a', exercise_id: 'a', exercise_name: 'A', order: 0, sets_json: [{ weight: 10 }] },
      { id: 'row-b', exercise_id: 'b', exercise_name: 'B', order: 1, sets_json: [{ weight: 20 }] },
    ];

    const result = replaceOrSwapExercise(exercises, 0, { id: 'b', name: 'B' });

    expect(result.swappedWithIndex).toBe(1);
    expect(result.exercises.map(item => item.exercise_id)).toEqual(['b', 'a']);
    expect(result.exercises[0].sets_json[0].weight).toBe(20);
    expect(result.exercises[1].sets_json[0].weight).toBe(10);
    expect(result.exercises.map(item => item.order)).toEqual([0, 1]);
  });
});

describe('remapIndexedExerciseState', () => {
  it('limpa o progresso da posição em uma substituição por exercício novo', () => {
    expect(remapIndexedExerciseState({ 0: 'feito-a', 1: 'feito-b' }, 1, null))
      .toEqual({ 0: 'feito-a' });
  });

  it('move o progresso com os exercícios durante um swap', () => {
    expect(remapIndexedExerciseState({ 0: 'progresso-a', 1: 'progresso-b' }, 0, 1))
      .toEqual({ 0: 'progresso-b', 1: 'progresso-a' });
  });
});
