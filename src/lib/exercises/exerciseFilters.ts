import { Exercise } from '../../types';

export interface ExerciseFilterOption {
  name: string;
  count: number;
}

export interface ExerciseFilterGroup extends ExerciseFilterOption {
  subgroups: ExerciseFilterOption[];
}

const fold = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const normalizeExerciseFilterText = fold;

const GROUPS = [
  {
    name: 'Peito',
    aliases: ['peito', 'peitoral', 'chest'],
    subgroups: [
      ['Peitoral superior', 'superior', 'clavicular'],
      ['Peitoral médio', 'medio', 'reto', 'esternal', 'crossover', 'voador', 'pec deck'],
      ['Peitoral inferior', 'inferior', 'declinado'],
    ],
  },
  {
    name: 'Costas',
    aliases: ['costas', 'back'],
    subgroups: [
      ['Dorsais', 'latissimo do dorso', 'dorsal', 'largura', 'puxada', 'pulldown', 'pull up'],
      ['Costas geral', 'costas', 'espessura de costas', 'remada', 'row'],
      ['Trapézio', 'trapezio medio', 'trapezio superior', 'trapezio inferior'],
      ['Eretores da espinha', 'lombar', 'lombar eretores'],
    ],
  },
  {
    name: 'Ombros',
    aliases: ['ombro', 'ombros', 'deltoide', 'deltoides', 'shoulder', 'shoulders'],
    subgroups: [
      ['Deltoide anterior', 'anterior', 'frontal', 'desenvolvimento'],
      ['Deltoide lateral', 'lateral'],
      ['Deltoide posterior', 'posterior', 'invertido', 'inverso'],
    ],
  },
  {
    name: 'Braços',
    aliases: ['braco', 'bracos', 'arm', 'arms'],
    subgroups: [
      ['Bíceps', 'biceps braquial', 'rosca', 'martelo'],
      ['Tríceps', 'triceps braquial', 'triceps testa', 'triceps pulley', 'coice'],
      ['Antebraços', 'antebraco', 'braquial', 'braquiorradial'],
    ],
  },
  {
    name: 'Abdômen',
    aliases: ['abdomen', 'abdominal', 'abdominais', 'core', 'abs'],
    subgroups: [
      ['Reto abdominal', 'abdomen superior', 'abdomen inferior', 'superior', 'inferior', 'abdominal', 'crunch', 'prancha'],
      ['Oblíquos', 'obliquo', 'obliquos', 'lateral', 'russian twist'],
    ],
  },
  {
    name: 'Pernas',
    aliases: ['perna', 'pernas', 'leg', 'legs'],
    subgroups: [
      ['Quadríceps', 'quadriceps', 'agachamento', 'extensora', 'leg press', 'hack'],
      ['Posteriores de coxa', 'posterior', 'posterior de coxa', 'isquiotibiais', 'hamstrings', 'flexora', 'stiff'],
      ['Glúteos', 'gluteo', 'gluteos', 'elevacao pelvica', 'hip thrust'],
      ['Adutores', 'adutor', 'adutores'],
      ['Abdutores', 'abdutor', 'abdutores'],
      ['Panturrilhas', 'panturrilha', 'panturrilhas', 'gastrocnemio', 'soleo', 'gemeos'],
    ],
  },
  {
    name: 'Cardio',
    aliases: ['cardio', 'cardiorrespiratorio', 'aerobico', 'corrida', 'esteira', 'bicicleta', 'bike'],
    subgroups: [
      ['Cardiorrespiratório', 'cardio geral', 'resistencia cardiorrespiratoria'],
      ['Metabólico', 'metabolico'],
    ],
  },
  {
    name: 'Mobilidade',
    aliases: ['mobilidade', 'alongamento', 'flexibilidade', 'liberacao miofascial'],
    subgroups: [
      ['Alongamento', 'alongamento estatico'],
      ['Mobilidade articular', 'mobilidade de quadril', 'mobilidade de ombros'],
      ['Liberação miofascial', 'liberacao miofascial'],
    ],
  },
] as const;

const allTerms = (values: unknown[]): string[] => values
  .flatMap((value) => Array.isArray(value) ? value : [value])
  .map(fold)
  .filter(Boolean);

const matchesAlias = (value: string, aliases: readonly string[]): boolean => {
  const normalized = fold(value);
  return aliases.some((alias) => {
    const normalizedAlias = fold(alias);
    return normalized === normalizedAlias || normalized.includes(normalizedAlias);
  });
};

const findSubgroup = (value: string, expectedGroup?: string) => {
  const normalized = fold(value);
  const matches: Array<{ group: typeof GROUPS[number]; subgroup: typeof GROUPS[number]['subgroups'][number] }> = [];
  for (const group of GROUPS) {
    for (const subgroup of group.subgroups) {
      if (subgroup.some((alias) => matchesAlias(normalized, [alias]))) {
        matches.push({ group, subgroup });
      }
    }
  }
  if (matches.length === 0) return null;
  const exactCanonical = matches.find(({ subgroup }) => fold(subgroup[0]) === normalized);
  if (exactCanonical) return exactCanonical;
  return matches.find(({ group }) => group.name === expectedGroup) || matches[0];
};

const findGroup = (value: string) => GROUPS.find((group) => matchesAlias(value, group.aliases));

const findRequestedGroup = (value: string) => {
  const normalized = fold(value);
  return GROUPS.find((group) => group.aliases.some((alias) => fold(alias) === normalized));
};

const primaryExerciseTerms = (exercise: Exercise): string[] => allTerms([
  exercise.subgroup,
  exercise.anatomical_cut,
  exercise.biomechanics?.agonist_muscles,
  exercise.biomechanics?.primary_group,
  exercise.muscle_group,
]);

const fallbackExerciseTerms = (exercise: Exercise): string[] => allTerms([
  exercise.name,
  exercise.alt_name,
  exercise.commercial_alias,
  exercise.tags,
  exercise.description,
  exercise.instructions,
]);

export const buildExerciseSearchText = (exercise: Exercise): string => allTerms([
  exercise.name,
  exercise.alt_name,
  exercise.commercial_alias,
  exercise.description,
  exercise.instructions,
  exercise.equipment,
  exercise.muscle_group,
  exercise.subgroup,
  exercise.anatomical_cut,
  exercise.tags,
  exercise.secondary_muscles,
  exercise.biomechanics?.primary_group,
  exercise.biomechanics?.agonist_muscles,
  exercise.biomechanics?.synergist_muscles,
  exercise.biomechanics?.stabilizer_muscles,
  exercise.biomechanics?.antagonist_muscles,
  exercise.biomechanics?.movement_pattern,
  exercise.biomechanics?.equipment_needed,
  exercise.biomechanics?.primary_joint_actions,
  exercise.biomechanics?.tags,
]).join(' ');

export const getExerciseFilterGroup = (exercise: Exercise): string => {
  // The subgroup/FK taxonomy is canonical and wins over the denormalized
  // legacy muscle_group label when those fields disagree.
  const direct = findGroup(exercise.muscle_group || '')
    || findGroup(exercise.biomechanics?.primary_group || '');
  const subgroup = findSubgroup(exercise.subgroup || '', direct?.name);
  if (subgroup) return subgroup.group.name;

  if (direct) return direct.name;

  for (const term of primaryExerciseTerms(exercise)) {
    const matched = findSubgroup(term) || (findGroup(term) ? { group: findGroup(term)! } : null);
    if (matched) return matched.group.name;
  }
  for (const term of fallbackExerciseTerms(exercise)) {
    const matched = findSubgroup(term) || (findGroup(term) ? { group: findGroup(term)! } : null);
    if (matched) return matched.group.name;
  }
  return exercise.muscle_group || 'Outros';
};

const canonicalSubgroupName = (exercise: Exercise): string | null => {
  const parentGroup = getExerciseFilterGroup(exercise);
  const explicitTerms = allTerms([
    exercise.subgroup,
    exercise.anatomical_cut,
    exercise.biomechanics?.agonist_muscles,
  ]);
  for (const term of explicitTerms) {
    const matched = findSubgroup(term, parentGroup);
    if (matched) return matched.subgroup[0];
  }

  for (const term of fallbackExerciseTerms(exercise)) {
    const matched = findSubgroup(term, parentGroup);
    if (matched && matched.group.name === parentGroup) return matched.subgroup[0];
  }
  return exercise.subgroup || null;
};

export const getExerciseFilterSubgroup = (exercise: Exercise): string | null => (
  canonicalSubgroupName(exercise)
);

export const getExerciseFilterSide = (exercise: Exercise): 'front' | 'back' => {
  const subgroup = fold(canonicalSubgroupName(exercise));
  const backSubgroups = new Set([
    'dorsais',
    'costas geral',
    'trapezio',
    'eretores da espinha',
    'deltoide posterior',
    'triceps',
    'posteriores de coxa',
    'gluteos',
    'panturrilhas',
  ]);
  if (backSubgroups.has(subgroup)) return 'back';
  return getExerciseFilterGroup(exercise) === 'Costas' ? 'back' : 'front';
};

export const exerciseMatchesMuscleFilter = (exercise: Exercise, filter: string): boolean => {
  const normalizedFilter = fold(filter);
  if (!normalizedFilter || normalizedFilter === 'todos' || normalizedFilter === 'tudo') return true;

  // A category is selected only by an exact category alias. Substrings such
  // as "Peitoral superior" and "Deltoide posterior" are subcategories and
  // must never expand back to the whole Peito/Ombros category.
  const requestedGroup = findRequestedGroup(filter);
  if (requestedGroup) return getExerciseFilterGroup(exercise) === requestedGroup.name;

  const requestedSubgroup = findSubgroup(filter);
  if (requestedSubgroup) {
    const exerciseSubgroup = canonicalSubgroupName(exercise);
    // Once the canonical primary subgroup is known, it is authoritative. Do
    // not keep scanning names/descriptions, which can mention other muscles
    // and make one exercise leak into adjacent subcategories.
    if (exerciseSubgroup) {
      return fold(exerciseSubgroup) === fold(requestedSubgroup.subgroup[0]);
    }

    const hasStructuredSubgroup = Boolean(exercise.subgroup || exercise.anatomical_cut || exercise.biomechanics?.agonist_muscles?.length);
    const directGroup = findGroup(exercise.muscle_group || '');
    if (!hasStructuredSubgroup
      && directGroup?.name === requestedSubgroup.group.name
      && matchesAlias(exercise.muscle_group, requestedSubgroup.subgroup)) {
      return true;
    }

    // Legacy rows can lack subgroup/biomechanics. Only then use descriptive
    // fields, avoiding classification from secondary/synergist muscles.
    return !hasStructuredSubgroup && fallbackExerciseTerms(exercise)
      .some((term) => requestedSubgroup.subgroup.some((alias) => matchesAlias(term, [alias])));
  }

  return primaryExerciseTerms(exercise).some((term) => matchesAlias(term, [filter]));
};

export const buildExerciseFilterGroups = (
  exercises: Exercise[],
  options: { includeInactive?: boolean } = {},
): ExerciseFilterGroup[] => {
  const activeExercises = options.includeInactive
    ? exercises
    : exercises.filter((exercise) => exercise.is_active !== false);

  return GROUPS.map((group) => {
    const groupExercises = activeExercises.filter((exercise) => getExerciseFilterGroup(exercise) === group.name);
    const subgroups = group.subgroups
      .map((subgroup) => ({
        name: subgroup[0],
        count: groupExercises.filter((exercise) => exerciseMatchesMuscleFilter(exercise, subgroup[0])).length,
      }))
      .filter((subgroup) => subgroup.count > 0);

    return { name: group.name, count: groupExercises.length, subgroups };
  }).filter((group) => group.count > 0);
};
