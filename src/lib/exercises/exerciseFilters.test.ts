import { describe, expect, it } from 'vitest';
import { fallbackExercises } from '../api/fallbackExercises';
import {
  buildExerciseFilterGroups,
  buildExerciseSearchText,
  exerciseMatchesMuscleFilter,
  getExerciseFilterGroup,
  getExerciseFilterSide,
} from './exerciseFilters';

describe('exercise muscle filter taxonomy', () => {
  it('maps every production taxonomy parent and subgroup to a non-empty result', () => {
    const exercises = [
      ['Peito', 'Peitoral superior'], ['Peito', 'Peitoral médio'], ['Peito', 'Peitoral inferior'],
      ['Costas', 'Dorsais'], ['Costas', 'Costas'], ['Costas', 'Trapézio'], ['Costas', 'Eretores da espinha'],
      ['Ombros', 'Deltoide anterior'], ['Ombros', 'Deltoide lateral'], ['Ombros', 'Deltoide posterior'],
      ['Braços', 'Bíceps'], ['Braços', 'Tríceps'], ['Braços', 'Antebraços'],
      ['Abdômen', 'Reto abdominal'], ['Abdômen', 'Oblíquos'],
      ['Pernas', 'Quadríceps'], ['Pernas', 'Posteriores de coxa'], ['Pernas', 'Glúteos'],
      ['Pernas', 'Adutores'], ['Pernas', 'Abdutores'], ['Pernas', 'Panturrilhas'],
    ].map(([muscle_group, subgroup], index) => ({
      id: String(index), name: `${subgroup} ${index}`, muscle_group, subgroup,
      muscle_group_id: String(index), type: 'machine', is_active: true, difficulty_level: 'beginner',
    })) as any;

    const taxonomy = buildExerciseFilterGroups(exercises);
    expect(taxonomy.map((group) => group.name)).toEqual(['Peito', 'Costas', 'Ombros', 'Braços', 'Abdômen', 'Pernas']);
    for (const group of taxonomy) {
      expect(group.count).toBeGreaterThan(0);
      for (const subgroup of group.subgroups) {
        expect(subgroup.count).toBeGreaterThan(0);
        expect(
          exercises.filter((exercise: any) => exerciseMatchesMuscleFilter(exercise, subgroup.name)),
          subgroup.name,
        ).toHaveLength(subgroup.count);
      }

      const structuredGroupExercises = exercises.filter((exercise: any) => exercise.muscle_group === group.name);
      for (const exercise of structuredGroupExercises) {
        const matchingSubgroups = group.subgroups.filter((subgroup) => (
          exerciseMatchesMuscleFilter(exercise as any, subgroup.name)
        ));
        expect(matchingSubgroups.map((subgroup) => subgroup.name), exercise.subgroup).toHaveLength(1);
      }
    }


    expect(taxonomy.find((group) => group.name === 'Peito')?.subgroups.map((item) => item.count)).toEqual([1, 1, 1]);
    expect(taxonomy.find((group) => group.name === 'Ombros')?.subgroups.map((item) => item.count)).toEqual([1, 1, 1]);
    expect(taxonomy.find((group) => group.name === 'Abdômen')?.subgroups.map((item) => item.count)).toEqual([1, 1]);
  });

  it('uses the canonical subgroup when a legacy parent label disagrees', () => {
    const exercise = {
      id: 'upright-row', name: 'Remada alta', muscle_group: 'Costas', subgroup: 'Deltoide posterior',
      muscle_group_id: 'deltoide-posterior', type: 'machine', is_active: true, difficulty_level: 'beginner',
    } as any;
    expect(getExerciseFilterGroup(exercise)).toBe('Ombros');
    expect(exerciseMatchesMuscleFilter(exercise, 'Deltoide posterior')).toBe(true);
    expect(exerciseMatchesMuscleFilter(exercise, 'Costas')).toBe(false);
  });

  it('does not leak a primary chest exercise into the triceps subgroup through synergists', () => {
    const exercise = {
      id: 'bench', name: 'Supino reto', muscle_group: 'Peito', subgroup: 'Peitoral médio',
      muscle_group_id: 'peito-medio', type: 'free_weight', is_active: true, difficulty_level: 'beginner',
      biomechanics: {
        primary_group: 'Peitoral', agonist_muscles: ['Peitoral médio'], synergist_muscles: ['Tríceps braquial'],
        stabilizer_muscles: [], antagonist_muscles: [], movement_pattern: 'push', equipment_needed: ['Barra'],
        primary_joint_actions: [], tags: ['supino'],
      },
    } as any;
    expect(exerciseMatchesMuscleFilter(exercise, 'Peito')).toBe(true);
    expect(exerciseMatchesMuscleFilter(exercise, 'Tríceps')).toBe(false);
  });

  it('keeps every visible fallback filter non-empty while hiding absent categories', () => {
    const taxonomy = buildExerciseFilterGroups(fallbackExercises);
    expect(taxonomy.every((group) => group.count > 0 && group.subgroups.every((subgroup) => subgroup.count > 0))).toBe(true);
    expect(taxonomy.some((group) => group.name === 'Cardio')).toBe(false);
    expect(taxonomy.some((group) => group.name === 'Mobilidade')).toBe(false);

    for (const exercise of fallbackExercises) {
      const group = taxonomy.find((item) => exerciseMatchesMuscleFilter(exercise, item.name));
      expect(group, exercise.name).toBeDefined();
      const subgroupMatches = group!.subgroups.filter((subgroup) => (
        exerciseMatchesMuscleFilter(exercise, subgroup.name)
      ));
      expect(subgroupMatches, exercise.name).toHaveLength(1);
    }
  });

  it('includes inactive exercises only when an admin surface requests them', () => {
    const inactiveGlute = {
      ...fallbackExercises[0],
      id: 'inactive-glute',
      name: 'Coice de glúteo no Crossover',
      muscle_group: 'Pernas',
      subgroup: 'Glúteos',
      is_active: false,
    } as any;
    const data = [...fallbackExercises, inactiveGlute];
    const publicGlutes = buildExerciseFilterGroups(data)
      .find((group) => group.name === 'Pernas')?.subgroups.find((subgroup) => subgroup.name === 'Glúteos')?.count;
    const adminGlutes = buildExerciseFilterGroups(data, { includeInactive: true })
      .find((group) => group.name === 'Pernas')?.subgroups.find((subgroup) => subgroup.name === 'Glúteos')?.count;

    expect(adminGlutes).toBe((publicGlutes || 0) + 1);
  });

  it('normalizes accents and legacy singular/plural labels', () => {
    const triceps = fallbackExercises.find((exercise) => exercise.name.includes('Tríceps'))!;
    const calf = fallbackExercises.find((exercise) => exercise.name.includes('Panturrilha'))!;
    expect(exerciseMatchesMuscleFilter(triceps, 'triceps')).toBe(true);
    expect(exerciseMatchesMuscleFilter(calf, 'Panturrilhas')).toBe(true);
    expect(buildExerciseSearchText(triceps)).toContain('triceps');
    expect(buildExerciseSearchText(calf)).toContain('panturrilha');
  });

  it('places mixed parent groups on the correct anatomical side by subgroup', () => {
    const anteriorShoulder = {
      id: 'front-shoulder', name: 'Elevação frontal', muscle_group: 'Ombros', subgroup: 'Deltoide anterior',
    } as any;
    const posteriorShoulder = {
      id: 'back-shoulder', name: 'Crucifixo inverso', muscle_group: 'Ombros', subgroup: 'Deltoide posterior',
    } as any;
    const triceps = {
      id: 'triceps', name: 'Tríceps pulley', muscle_group: 'Braços', subgroup: 'Tríceps',
    } as any;
    const hamstrings = {
      id: 'hamstrings', name: 'Mesa flexora', muscle_group: 'Pernas', subgroup: 'Posteriores de coxa',
    } as any;

    expect(getExerciseFilterSide(anteriorShoulder)).toBe('front');
    expect(getExerciseFilterSide(posteriorShoulder)).toBe('back');
    expect(getExerciseFilterSide(triceps)).toBe('back');
    expect(getExerciseFilterSide(hamstrings)).toBe('back');
  });
});
