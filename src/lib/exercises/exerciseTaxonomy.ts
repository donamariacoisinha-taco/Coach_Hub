import { Exercise, ExerciseBiomechanics } from '../../types';

// ==========================================
// 1. OFFICIAL KYRON OS BIOMECHANICAL TAXONOMY
// ==========================================

export const MAIN_GROUPS = [
  'Peitoral',
  'Costas',
  'Ombros',
  'Braços',
  'Core',
  'Pernas',
  'Glúteos',
  'Cardio',
  'Mobilidade'
] as const;

export type MainGroup = typeof MAIN_GROUPS[number];

export const SUB_GROUPS = {
  Peitoral: [
    'Peitoral superior',
    'Peitoral médio',
    'Peitoral inferior'
  ],
  Costas: [
    'Latíssimo do dorso',
    'Romboides',
    'Trapézio médio',
    'Trapézio inferior',
    'Eretores da espinha'
  ],
  Ombros: [
    'Deltoide anterior',
    'Deltoide lateral',
    'Deltoide posterior'
  ],
  Braços: [
    'Bíceps braquial',
    'Braquial',
    'Braquiorradial',
    'Tríceps braquial',
    'Antebraços'
  ],
  Core: [
    'Reto abdominal',
    'Abdômen superior',
    'Abdômen inferior',
    'Oblíquos',
    'Transverso abdominal',
    'Core profundo'
  ],
  Pernas: [
    'Quadríceps',
    'Isquiotibiais',
    'Posterior de coxa',
    'Adutores',
    'Abdutores',
    'Panturrilhas'
  ],
  Glúteos: [
    'Glúteo máximo',
    'Glúteo médio',
    'Glúteo mínimo'
  ],
  Cardio: [
    'Cardiorrespiratório',
    'Metabólico'
  ],
  Mobilidade: [
    'Alongamento estático',
    'Mobilidade articular',
    'Liberação miofascial'
  ]
} as const;

export const MOVEMENT_PATTERNS = [
  'push',
  'pull',
  'squat',
  'hinge',
  'lunge',
  'carry',
  'rotation',
  'anti_rotation',
  'flexion',
  'extension',
  'isolation',
  'cardio',
  'mobility'
] as const;

export type MovementPattern = typeof MOVEMENT_PATTERNS[number];

// ==========================================
// 2. ALIASES & NORMALIZATION ENGINE
// ==========================================

/**
 * Normalizes any muscle or category term into the official KYRON OS Main Group
 */
export function normalizeMuscleTerm(term: string): string {
  if (!term) return 'Mobilidade';
  const clean = term.toLowerCase().trim().replace(/\s+/g, ' ');

  // Peitoral variations
  if (['peito', 'peitoral', 'chest', 'peitoral inferior', 'peitoral superior', 'peitoral médio', 'peitoral medio'].includes(clean)) {
    return 'Peitoral';
  }
  // Costas variations
  if (['costas', 'back', 'dorsais', 'dorsal', 'lats', 'latíssimo', 'latissimo', 'trapézio', 'trapezio', 'lombar', 'eretores'].includes(clean)) {
    return 'Costas';
  }
  // Ombros variations
  if (['ombros', 'ombro', 'deltoides', 'shoulders', 'shoulder', 'deltoid', 'deltoide'].includes(clean)) {
    return 'Ombros';
  }
  // Braços variations
  if (['braço', 'braços', 'arms', 'arm', 'bíceps', 'tríceps', 'biceps', 'triceps', 'antebraço', 'antebraços', 'forearm', 'forearms'].includes(clean)) {
    return 'Braços';
  }
  // Core variations
  if (['core', 'abdômen', 'abdomen', 'abs', 'abdominais', 'abdominal', 'oblíquos', 'obliquos', 'oblique', 'obliques'].includes(clean)) {
    return 'Core';
  }
  // Pernas variations
  if (['perna', 'pernas', 'legs', 'leg', 'quadríceps', 'quadriceps', 'quad', 'quads', 'posterior', 'posterior de coxa', 'posterior coxa', 'posteriores', 'hamstrings', 'isquiotibiais', 'adutores', 'adutor', 'abdutores', 'abdutor', 'panturrilha', 'panturrilhas', 'calves', 'calf'].includes(clean)) {
    return 'Pernas';
  }
  // Glúteos variations
  if (['glúteo', 'glúteos', 'gluteo', 'gluteos', 'glutes', 'glute', 'glúteos/quadríceps'].includes(clean)) {
    return 'Glúteos';
  }
  // Cardio variations
  if (['cardio', 'aeróbico', 'aerobico', 'aeróbicos', 'corrida', 'esteira', 'bike', 'bicicleta', 'metabolico', 'metabólico'].includes(clean)) {
    return 'Cardio';
  }
  // Mobilidade variations
  if (['mobilidade', 'alongamento', 'flexibilidade'].includes(clean)) {
    return 'Mobilidade';
  }

  // Capitalize first letter of the unknown term as safe fallback
  return term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
}

// ==========================================
// 3. FALLBACK BIOMECHANICAL ESTIMATION ENGINE
// ==========================================

/**
 * Returns complete high-fidelity exercise biomechanics.
 * Resolves db field first, and falls back to complex biomechanical rules
 * parsed from name, tags, equipment, and description if empty.
 */
export function getExerciseBiomechanics(exercise: Exercise): ExerciseBiomechanics {
  if (exercise.biomechanics) {
    return exercise.biomechanics;
  }

  // Inferred properties
  const name = (exercise.name || '').toLowerCase().trim();
  const rawMg = (exercise.muscle_group || '').toLowerCase().trim();
  const rawSubgroup = (exercise.subgroup || '').toLowerCase().trim();
  const rawEq = (exercise.equipment || 'Solo').trim();
  const desc = ((exercise.description || '') + ' ' + (exercise.instructions || '')).toLowerCase();

  // Determine Equipment Needed
  let equipment_needed = [rawEq];
  if (name.includes('polia') || name.includes('cabo') || name.includes('crossover')) {
    equipment_needed = ['Cabo'];
  } else if (name.includes('halter')) {
    equipment_needed = ['Halteres'];
  } else if (name.includes('barra') || name.includes('smith')) {
    equipment_needed = ['Barra'];
  } else if (name.includes('máquina') || name.includes('maquina') || name.includes('articulado')) {
    equipment_needed = ['Máquina'];
  }

  // Override Solo/Não especificado if machine/cabo or specific name rules
  if (equipment_needed[0] === 'Não especificado' || equipment_needed[0] === 'Solo') {
    if (name.includes('flexora') || name.includes('extensora') || name.includes('leg press') || name.includes('hacker') || name.includes('gravitron')) {
      equipment_needed = ['Máquina'];
    }
  }

  // Determine Primary Group
  let primary_group = normalizeMuscleTerm(exercise.muscle_group);
  if (name.includes('apoio') && (rawSubgroup.includes('glúteo') || rawSubgroup.includes('abdutores') || rawMg.includes('braço') || rawMg.includes('peito'))) {
    primary_group = 'Peitoral';
  }

  // 1. AGONISTS & SUBGROUPS INFERENCE
  let agonist_muscles: string[] = [];
  let movement_pattern = exercise.movement_pattern || 'isolation';
  let synergist_muscles: string[] = [];
  let stabilizer_muscles: string[] = [];
  let antagonist_muscles: string[] = [];
  let primary_joint_actions: string[] = [];
  let custom_tags: string[] | null = null;

  // SPECIFIC FIXED OVERRIDES FIRST
  if (name.includes('apoio') || name.includes('flexão de braço') || name.includes('push up') || name.includes('push-up')) {
    primary_group = 'Peitoral';
    if (name.includes('declinado')) {
      agonist_muscles = ['Peitoral inferior'];
    } else if (name.includes('inclinado')) {
      agonist_muscles = ['Peitoral superior'];
    } else {
      agonist_muscles = ['Peitoral médio'];
    }

    if (name.includes('fechado') || name.includes('fechada')) {
      agonist_muscles.push('Tríceps braquial');
    }

    movement_pattern = 'push';
    equipment_needed = ['Peso corporal'];
    synergist_muscles = ['Deltoide anterior', 'Tríceps braquial'];
    stabilizer_muscles = ['Core profundo', 'Serrátil anterior', 'Manguito rotador'];
    antagonist_muscles = ['Latíssimo do dorso', 'Romboides', 'Bíceps braquial'];
    primary_joint_actions = ['Adução horizontal do ombro', 'Extensão de cotovelo', 'Flexão de ombro'];
    custom_tags = ['apoio', 'flexão', 'peitoral', 'tríceps', 'peso corporal', 'push'];
  } 
  // FLEXORAS (Mesa, Cadeira, Unilateral, Leg Curl)
  else if (name.includes('flexora') || name.includes('leg curl') || name.includes('mesa flexora') || name.includes('cadeira flexora')) {
    primary_group = 'Pernas';
    agonist_muscles = ['Isquiotibiais', 'Posterior de coxa'];
    movement_pattern = 'isolation';
    equipment_needed = ['Máquina'];
    synergist_muscles = ['Gastrocnêmio'];
    stabilizer_muscles = ['Core profundo'];
    antagonist_muscles = ['Quadríceps'];
    primary_joint_actions = ['Flexão de joelho'];
    custom_tags = ['posterior', 'isquiotibiais', 'flexora', 'máquina', 'isolamento'];
  } 
  // STIFF & RDL & ROMANIAN DEADLIFT
  else if (name.includes('stiff') || name.includes('romanian deadlift') || name.includes('rdl') || name.includes('terra romeno')) {
    primary_group = 'Pernas';
    agonist_muscles = ['Isquiotibiais', 'Posterior de coxa', 'Glúteo máximo'];
    movement_pattern = 'hinge';
    synergist_muscles = ['Adutor magno', 'Eretores da espinha'];
    stabilizer_muscles = ['Core profundo', 'Quadríceps'];
    antagonist_muscles = ['Quadríceps'];
    primary_joint_actions = ['Extensão de quadril'];
  } 
  // ELEVAÇÃO LATERAL
  else if (name.includes('elevação lateral') || name.includes('elevacao lateral')) {
    primary_group = 'Ombros';
    agonist_muscles = ['Deltoide lateral'];
    movement_pattern = 'isolation';
    
    // Detect equipment by name for elevação lateral
    if (name.includes('polia') || name.includes('cabo')) {
      equipment_needed = ['Cabo'];
    } else if (name.includes('máquina') || name.includes('maquina')) {
      equipment_needed = ['Máquina'];
    } else {
      equipment_needed = ['Halteres'];
    }

    synergist_muscles = ['Trapézio superior', 'Serrátil anterior'];
    stabilizer_muscles = ['Core profundo'];
    antagonist_muscles = ['Latíssimo do dorso', 'Peitoral maior (fibras inferiores)'];
    primary_joint_actions = ['Abdução do ombro'];
  } 
  // SUPINOS (Reto, Inclinado, Declinado)
  else if (name.includes('supino')) {
    primary_group = 'Peitoral';
    if (name.includes('inclinado')) {
      agonist_muscles = ['Peitoral superior'];
    } else if (name.includes('declinado')) {
      agonist_muscles = ['Peitoral inferior'];
    } else {
      agonist_muscles = ['Peitoral médio'];
    }
    movement_pattern = 'push';
    synergist_muscles = ['Deltoide anterior', 'Tríceps braquial'];
    stabilizer_muscles = ['Core profundo', 'Rotator cuff'];
    antagonist_muscles = ['Latíssimo do dorso', 'Romboides', 'Bíceps braquial'];
    primary_joint_actions = ['Adução horizontal do ombro', 'Flexão do ombro', 'Extensão de cotovelo'];
  } 
  // GENERAL FALLBACK RULESETS
  else {
    if (primary_group === 'Peitoral') {
      if (name.includes('inclinado') || name.includes('superior') || name.includes('inclined')) {
        agonist_muscles = ['Peitoral superior'];
      } else if (name.includes('declinado') || name.includes('inferior') || name.includes('declined') || name.includes('cross over alto')) {
        agonist_muscles = ['Peitoral inferior'];
      } else {
        agonist_muscles = ['Peitoral médio'];
      }
      movement_pattern = 'push';
      synergist_muscles = ['Deltoide anterior', 'Tríceps braquial'];
      stabilizer_muscles = ['Core profundo'];
      antagonist_muscles = ['Latíssimo do dorso', 'Romboides', 'Deltoide posterior'];
      primary_joint_actions = ['Adução horizontal do ombro', 'Flexão do ombro', 'Extensão de cotovelo'];
    } else if (primary_group === 'Costas') {
      if (name.includes('remada') || name.includes('row')) {
        agonist_muscles = ['Romboides', 'Trapézio médio'];
        movement_pattern = 'pull';
      } else if (name.includes('puxada') || name.includes('pulldown') || name.includes('barra fixa')) {
        agonist_muscles = ['Latíssimo do dorso'];
        movement_pattern = 'pull';
      } else if (name.includes('encolhimento') || name.includes('shrug')) {
        agonist_muscles = ['Trapézio médio', 'Trapézio inferior'];
        movement_pattern = 'isolation';
      } else if (name.includes('deadlift') || name.includes('terra') || name.includes('lombar') || name.includes('hiperextensão')) {
        agonist_muscles = ['Eretores da espinha'];
        movement_pattern = 'hinge';
      } else {
        agonist_muscles = ['Latíssimo do dorso'];
        movement_pattern = 'pull';
      }
      synergist_muscles = ['Bíceps braquial', 'Braquial', 'Deltoide posterior'];
      stabilizer_muscles = ['Eretores da espinha', 'Core profundo'];
      antagonist_muscles = ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'];
      primary_joint_actions = ['Extensão de ombro', 'Adunção de ombro', 'Flexão de cotovelo'];
    } else if (primary_group === 'Ombros') {
      if (name.includes('desenvolvimento') || name.includes('militar') || name.includes('anterior') || name.includes('front')) {
        agonist_muscles = ['Deltoide anterior'];
        movement_pattern = 'push';
      } else if (name.includes('reverso') || name.includes('inverso') || name.includes('posterior') || name.includes('crucifixo reverso')) {
        agonist_muscles = ['Deltoide posterior'];
        movement_pattern = 'isolation';
      } else {
        agonist_muscles = ['Deltoide lateral'];
        movement_pattern = 'isolation';
      }
      synergist_muscles = ['Tríceps braquial', 'Trapézio superior', 'Serrátil anterior'];
      stabilizer_muscles = ['Core profundo', 'Eretores da espinha'];
      antagonist_muscles = ['Latíssimo do dorso', 'Peitoral maior (fibras inferiores)'];
      primary_joint_actions = ['Abdução do ombro', 'Flexão de ombro', 'Extensão de cotovelo'];
    } else if (primary_group === 'Braços') {
      movement_pattern = 'isolation';
      if (name.includes('rosca') || name.includes('bíceps') || name.includes('biceps')) {
        if (name.includes('martelo') || name.includes('inversa')) {
          agonist_muscles = ['Braquial', 'Braquiorradial'];
        } else {
          agonist_muscles = ['Bíceps braquial'];
        }
        synergist_muscles = ['Braquial', 'Braquiorradial', 'Pronador redondo'];
        stabilizer_muscles = ['Core profundo', 'Deltoide posterior'];
        antagonist_muscles = ['Tríceps braquial'];
        primary_joint_actions = ['Flexão de cotovelo', 'Supinação do antebraço'];
      } else if (name.includes('tríceps') || name.includes('triceps') || name.includes('testa') || name.includes('pulley') || name.includes('coice')) {
        agonist_muscles = ['Tríceps braquial'];
        synergist_muscles = ['Ancôneo'];
        stabilizer_muscles = ['Core profundo', 'Deltoide anterior'];
        antagonist_muscles = ['Bíceps braquial', 'Braquial'];
        primary_joint_actions = ['Extensão de cotovelo'];
      } else {
        agonist_muscles = ['Bíceps braquial', 'Tríceps braquial'];
        synergist_muscles = [];
        stabilizer_muscles = ['Core profundo'];
        antagonist_muscles = [];
        primary_joint_actions = ['Flexão de cotovelo', 'Extensão de cotovelo'];
      }
    } else if (primary_group === 'Core') {
      if (name.includes('infra') || name.includes('perna') || name.includes('lower abs')) {
        agonist_muscles = ['Abdômen inferior', 'Reto abdominal'];
        movement_pattern = 'flexion';
      } else if (name.includes('oblíquo') || name.includes('obliquo') || name.includes('twist') || name.includes('lateral')) {
        agonist_muscles = ['Oblíquos'];
        movement_pattern = 'rotation';
      } else if (name.includes('prancha') || name.includes('plank') || name.includes('estabilização')) {
        agonist_muscles = ['Transverso abdominal', 'Core profundo'];
        movement_pattern = 'anti_rotation';
      } else {
        agonist_muscles = ['Abdômen superior', 'Reto abdominal'];
        movement_pattern = 'flexion';
      }
      synergist_muscles = ['Iliopssoas', 'Oblíquos'];
      stabilizer_muscles = ['Transverso abdominal', 'Eretores da espinha', 'Multifídeos'];
      antagonist_muscles = ['Eretores da espinha'];
      primary_joint_actions = ['Flexão de tronco', 'Estabilização lombo-pélvica'];
    } else if (primary_group === 'Pernas') {
      if (name.includes('agachamento') || name.includes('leg press') || name.includes('hacker') || name.includes('extensora') || name.includes('quadríceps') || name.includes('quadriceps')) {
        agonist_muscles = ['Quadríceps'];
        movement_pattern = name.includes('extensora') ? 'isolation' : 'squat';
        synergist_muscles = ['Glúteo máximo', 'Adutor magno', 'Panturrilhas'];
        stabilizer_muscles = ['Core profundo', 'Eretores da espinha', 'Isquiotibiais'];
        antagonist_muscles = ['Isquiotibiais', 'Glúteo máximo'];
        primary_joint_actions = ['Extensão de joelho', 'Extensão de quadril'];
      } else if (name.includes('adutor') || name.includes('adutora') || name.includes('copenhagen')) {
        agonist_muscles = ['Adutores'];
        movement_pattern = 'isolation';
        synergist_muscles = ['Pectíneo', 'Grácil'];
        stabilizer_muscles = ['Core profundo'];
        antagonist_muscles = ['Abdutores'];
        primary_joint_actions = ['Adução de quadril'];
      } else if (name.includes('abdutor') || name.includes('abdutora') || name.includes('cadeira abdutora')) {
        agonist_muscles = ['Abdutores'];
        movement_pattern = 'isolation';
        synergist_muscles = ['Tensor da fáscia lata', 'Glúteo médio'];
        stabilizer_muscles = ['Core profundo'];
        antagonist_muscles = ['Adutores'];
        primary_joint_actions = ['Abdução de quadril'];
      } else if (name.includes('panturrilha') || name.includes('gêmeos') || name.includes('calf')) {
        agonist_muscles = ['Panturrilhas'];
        movement_pattern = 'isolation';
        synergist_muscles = ['Sóleio', 'Gastrocnêmio'];
        stabilizer_muscles = ['Core profundo'];
        antagonist_muscles = ['Tibial anterior'];
        primary_joint_actions = ['Flexão plantar'];
      } else {
        agonist_muscles = ['Quadríceps'];
        movement_pattern = 'squat';
        synergist_muscles = ['Glúteo máximo', 'Adutor magno'];
        stabilizer_muscles = ['Core profundo'];
        antagonist_muscles = ['Isquiotibiais'];
        primary_joint_actions = ['Extensão de joelho', 'Extensão de quadril'];
      }
    } else if (primary_group === 'Glúteos') {
      if (name.includes('coice') || name.includes('abdução') || name.includes('glúteo médio')) {
        agonist_muscles = ['Glúteo médio', 'Glúteo mínimo'];
        movement_pattern = 'isolation';
      } else {
        agonist_muscles = ['Glúteo máximo'];
        movement_pattern = name.includes('elevação pélvica') || name.includes('hip thrust') ? 'hinge' : 'isolation';
      }
      synergist_muscles = ['Isquiotibiais', 'Adutor magno', 'Eretores da espinha'];
      stabilizer_muscles = ['Core profundo', 'Quadríceps'];
      antagonist_muscles = ['Iliopssoas', 'Reto femoral'];
      primary_joint_actions = ['Extensão de quadril', 'Rotação externa de quadril'];
    } else if (primary_group === 'Cardio') {
      agonist_muscles = ['Cardiorrespiratório'];
      movement_pattern = 'cardio';
      synergist_muscles = [];
      stabilizer_muscles = ['Core profundo'];
      antagonist_muscles = [];
      primary_joint_actions = ['Aumento do débito cardíaco'];
    } else {
      agonist_muscles = ['Mobilidade articular'];
      movement_pattern = 'mobility';
      synergist_muscles = [];
      stabilizer_muscles = ['Core profundo'];
      antagonist_muscles = [];
      primary_joint_actions = ['Mobilização articular'];
    }
  }

  // Refine agonist based on the raw DB subgroup if matches and is still empty
  if (rawSubgroup && agonist_muscles.length === 0) {
    if (rawSubgroup.includes('superior') || rawSubgroup.includes('clavicular')) agonist_muscles = ['Peitoral superior'];
    else if (rawSubgroup.includes('dorsal') || rawSubgroup.includes('lats')) agonist_muscles = ['Latíssimo do dorso'];
    else if (rawSubgroup.includes('deltoide lateral') || rawSubgroup.includes('lateral')) agonist_muscles = ['Deltoide lateral'];
    else if (rawSubgroup.includes('bíceps') || rawSubgroup.includes('biceps')) agonist_muscles = ['Bíceps braquial'];
    else if (rawSubgroup.includes('tríceps') || rawSubgroup.includes('triceps')) agonist_muscles = ['Tríceps braquial'];
    else if (rawSubgroup.includes('quadríceps') || rawSubgroup.includes('quadriceps')) agonist_muscles = ['Quadríceps'];
    else if (rawSubgroup.includes('posterior') || rawSubgroup.includes('coxa') || rawSubgroup.includes('hamstring')) agonist_muscles = ['Posterior de coxa'];
    else if (rawSubgroup.includes('glúteo') || rawSubgroup.includes('gluteo') || rawSubgroup.includes('glutes')) agonist_muscles = ['Glúteo máximo'];
  }

  // 4. EXTRACT EXTRA TAGS
  const tags_set = new Set<string>();

  // Extract from original exercise properties safely
  if (exercise.tags && Array.isArray(exercise.tags)) {
    exercise.tags.forEach(t => tags_set.add(t.toLowerCase().trim()));
  }

  // Add contextual tags
  if (name.includes('inclinado')) tags_set.add('inclinado');
  if (name.includes('declinado')) tags_set.add('declinado');
  if (name.includes('reto')) tags_set.add('reto');
  if (name.includes('máquina') || name.includes('articulado') || rawEq === 'Máquina') tags_set.add('maquina');
  if (name.includes('cabo') || name.includes('polia') || rawEq === 'Cabo') tags_set.add('cabo');
  if (name.includes('halter') || rawEq === 'Halteres') tags_set.add('halter');
  if (name.includes('barra') || rawEq === 'Barra') tags_set.add('barra');
  if (name.includes('fechado') || name.includes('fechada')) tags_set.add('pegada fechada');
  if (name.includes('aberto') || name.includes('aberta')) tags_set.add('pegada aberta');
  if (name.includes('unilateral')) tags_set.add('unilateral');

  // Movement pattern as tag
  tags_set.add(movement_pattern);

  const tags = custom_tags ? custom_tags : Array.from(tags_set);

  return {
    primary_group,
    agonist_muscles,
    synergist_muscles,
    stabilizer_muscles,
    antagonist_muscles,
    movement_pattern,
    equipment_needed,
    primary_joint_actions,
    tags
  };
}
