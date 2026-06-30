import React, { useState, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash2, 
  Flame, 
  Zap, 
  Layers,
  GripVertical,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search
} from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { Exercise } from '../../../types';
import { getExerciseBiomechanics } from '../../../lib/exercises/exerciseTaxonomy';
import { motion, AnimatePresence } from 'motion/react';

const REPLACE_MAIN_GROUPS = [
  'Sugestões',
  'Todos',
  'Peitoral',
  'Costas',
  'Ombros',
  'Braços',
  'Core',
  'Pernas',
  'Glúteos',
  'Cardio',
  'Mobilidade'
];

const REPLACE_SUB_GROUPS_MAP: Record<string, string[]> = {
  'Peitoral': [
    'Peitoral Superior',
    'Peitoral Médio',
    'Peitoral Inferior'
  ],
  'Costas': [
    'Latíssimo do dorso',
    'Romboides',
    'Trapézio médio',
    'Trapézio superior',
    'Eretores da espinha',
    'Dorsais',
    'Espessura de Costas',
    'Trapézio',
    'Lombar / Eretores'
  ],
  'Ombros': [
    'Deltoide Anterior',
    'Deltoide Lateral',
    'Deltoide Posterior'
  ],
  'Braços': [
    'Bíceps braquial',
    'Braquial',
    'Braquiorradial',
    'Tríceps braquial',
    'Antebraços',
    'Bíceps',
    'Tríceps',
    'Antebraço'
  ],
  'Core': [
    'Reto abdominal',
    'Abdômen Superior',
    'Abdômen Inferior',
    'Oblíquos',
    'Transverso abdominal',
    'Core Profundo'
  ],
  'Pernas': [
    'Quadríceps',
    'Isquiotibiais',
    'Posterior de Coxa',
    'Panturrilhas',
    'Gastrocnêmio',
    'Sóleo',
    'Adutores',
    'Abdutores'
  ],
  'Glúteos': [
    'Glúteo máximo',
    'Glúteo médio',
    'Glúteo mínimo',
    'Glúteos'
  ],
  'Cardio': [
    'Cardio Geral',
    'Resistência Cardiorrespiratória'
  ],
  'Mobilidade': [
    'Alongamento',
    'Mobilidade de Quadril',
    'Mobilidade de Ombros'
  ]
};

// Helper for parent main group lookup
const getParentMainGroup = (tag: string): string => {
  if (REPLACE_MAIN_GROUPS.includes(tag)) return tag;
  for (const [main, subs] of Object.entries(REPLACE_SUB_GROUPS_MAP)) {
    if (subs.some(s => s.toLowerCase() === tag.toLowerCase())) {
      return main;
    }
  }
  return 'Todos';
};

// Helper for Match Score (equivalent to ProtocolExerciseList)
const getMatchScore = (exercise: Exercise, filter: string): number => {
  if (!exercise) return 0;
  const f = filter.toLowerCase().trim();
  if (f === 'todos' || f === 'sugestões') return 1;

  const biomechanics = exercise.biomechanics || getExerciseBiomechanics(exercise);
  const primaryGroup = (biomechanics.primary_group || '').toLowerCase().trim();
  const agonistMuscles = (biomechanics.agonist_muscles || []).map(m => m.toLowerCase().trim());
  const synergistMuscles = (biomechanics.synergist_muscles || []).map(m => m.toLowerCase().trim());
  const antagonistMuscles = (biomechanics.antagonist_muscles || []).map(m => m.toLowerCase().trim());
  const tags = (biomechanics.tags || []).map(t => t.toLowerCase().trim());

  const mg = (exercise.muscle_group || '').toLowerCase().trim();
  const sub = (exercise.subgroup || '').toLowerCase().trim();
  const name = (exercise.name || '').toLowerCase().trim();
  const desc = ((exercise.description || '') + ' ' + (exercise.instructions || '')).toLowerCase();

  const hasWord = (term: string) => name.includes(term) || desc.includes(term) || tags.includes(term);

  // Antagonist exclusion check
  let isAntagonist = false;
  if (f === 'costas' && (antagonistMuscles.includes('latíssimo do dorso') || antagonistMuscles.includes('romboides') || antagonistMuscles.includes('trapézio'))) {
    isAntagonist = true;
  }
  if (f === 'peitoral' && (antagonistMuscles.includes('peitoral superior') || antagonistMuscles.includes('peitoral médio') || antagonistMuscles.includes('peitoral inferior'))) {
    isAntagonist = true;
  }
  if (f === 'tríceps' && antagonistMuscles.includes('tríceps braquial')) {
    isAntagonist = true;
  }
  if (f === 'bíceps' && antagonistMuscles.includes('bíceps braquial')) {
    isAntagonist = true;
  }
  if (f === 'quadríceps' && antagonistMuscles.includes('quadríceps')) {
    isAntagonist = true;
  }
  if (f === 'isquiotibiais' && (antagonistMuscles.includes('isquiotibiais') || antagonistMuscles.includes('posterior de coxa'))) {
    isAntagonist = true;
  }
  if (f === 'glúteos' && antagonistMuscles.some(m => m.includes('glúteo'))) {
    isAntagonist = true;
  }

  if (isAntagonist && !agonistMuscles.includes(f) && !synergistMuscles.includes(f) && mg !== f) {
    return 0; // Exclude if matched ONLY as antagonist
  }

  // MAIN GROUPS
  if (f === 'peitoral') {
    if (primaryGroup === 'peitoral') return 10;
    if (mg === 'peito' || mg === 'chest' || mg === 'peitoral') return 5;
    if (hasWord('supino') || hasWord('crucifixo') || hasWord('peitoral') || hasWord('peito')) return 2;
    return 0;
  }
  if (f === 'costas') {
    if (primaryGroup === 'costas') return 10;
    if (mg === 'costas' || mg === 'back' || mg === 'dorsais') return 5;
    if (hasWord('remada') || hasWord('puxada') || hasWord('pulldown') || hasWord('pullover') || hasWord('dorsal')) return 2;
    return 0;
  }
  if (f === 'ombros') {
    if (primaryGroup === 'ombros' || primaryGroup === 'ombro') return 10;
    if (mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders') return 5;
    if (hasWord('deltoide') || hasWord('ombro') || hasWord('elevação lateral') || hasWord('desenvolvimento')) return 2;
    return 0;
  }
  if (f === 'braços') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço') return 10;
    if (mg === 'braço' || mg === 'braços' || mg === 'arms' || mg === 'bíceps' || mg === 'tríceps' || mg === 'antebraço') return 5;
    if (hasWord('bíceps') || hasWord('tríceps') || hasWord('antebraço') || hasWord('rosca') || hasWord('triceps') || hasWord('biceps') || hasWord('braço')) return 2;
    return 0;
  }
  if (f === 'core') {
    if (primaryGroup === 'core') return 10;
    if (mg === 'core' || mg === 'abdômen' || mg === 'abs' || mg === 'obliquos') return 5;
    if (hasWord('core') || hasWord('prancha') || hasWord('lombar') || hasWord('transverso') || hasWord('abdominal')) return 2;
    return 0;
  }
  if (f === 'pernas') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna') return 10;
    if (mg === 'perna' || mg === 'pernas' || mg === 'legs' || mg === 'quadríceps' || mg === 'posterior' || mg === 'glúteos' || mg === 'panturrilhas' || mg === 'adutores' || mg === 'abdutores') return 5;
    if (hasWord('agachamento') || hasWord('leg press') || hasWord('extensora') || hasWord('flexora') || hasWord('stiff') || hasWord('glúteo') || hasWord('panturrilha')) return 2;
    return 0;
  }
  if (f === 'glúteos') {
    if (primaryGroup === 'glúteos' || primaryGroup === 'glúteo') return 10;
    if (mg === 'gluteo' || mg === 'glúteo' || mg === 'glutes' || mg === 'glúteos') return 5;
    if (hasWord('glúteo') || hasWord('gluteo') || hasWord('pélvica')) return 2;
    return 0;
  }
  if (f === 'cardio') {
    if (primaryGroup === 'cardio' || primaryGroup === 'cardiorrespiratório') return 10;
    if (mg === 'cardio' || mg === 'aerobico' || mg === 'aeróbico') return 5;
    if (hasWord('corrida') || hasWord('esteira') || hasWord('bike') || hasWord('elíptico') || hasWord('cardio')) return 2;
    return 0;
  }
  if (f === 'mobilidade') {
    if (primaryGroup === 'mobilidade') return 10;
    if (mg === 'mobilidade' || mg === 'alongamento' || mg === 'flexibilidade') return 5;
    if (hasWord('mobilidade') || hasWord('alongamento') || hasWord('flexibilidade')) return 2;
    return 0;
  }

  // SUBGROUPS
  if (f === 'peitoral superior') {
    if (primaryGroup === 'peitoral') {
      if (agonistMuscles.includes('peitoral superior')) return 10;
      if (synergistMuscles.includes('peitoral superior')) return 5;
    }
    const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo');
    if (isPeito && (hasWord('inclinado') || hasWord('superior') || hasWord('inclined') || hasWord('clavicular'))) return 2;
    return 0;
  }
  if (f === 'peitoral médio') {
    if (primaryGroup === 'peitoral') {
      if (agonistMuscles.includes('peitoral médio')) return 10;
      if (synergistMuscles.includes('peitoral médio')) return 5;
    }
    const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo');
    if (isPeito && (hasWord('reto') || hasWord('médio') || hasWord('medio') || hasWord('flat') || (!hasWord('inclinado') && !hasWord('superior') && !hasWord('declinado') && !hasWord('inferior')))) return 2;
    return 0;
  }
  if (f === 'peitoral inferior') {
    if (primaryGroup === 'peitoral') {
      if (agonistMuscles.includes('peitoral inferior')) return 10;
      if (synergistMuscles.includes('peitoral inferior')) return 5;
    }
    const isPeito = mg === 'peito' || mg === 'chest' || mg === 'peitoral' || hasWord('supino') || hasWord('crucifixo');
    if (isPeito && (hasWord('declinado') || hasWord('inferior') || hasWord('declined') || hasWord('infra') || hasWord('cross over alto') || hasWord('crossover alto') || hasWord('cross over baixo'))) return 2;
    return 0;
  }
  if (f === 'dorsais' || f === 'latíssimo do dorso' || f === 'latissimo do dorso') {
    if (primaryGroup === 'costas') {
      if (agonistMuscles.includes('latíssimo do dorso')) return 10;
      if (synergistMuscles.includes('latíssimo do dorso')) return 5;
    }
    if (mg === 'dorsais' || mg === 'dorsal' || mg === 'lats' || hasWord('dorsal') || hasWord('puxada') || hasWord('pulldown') || hasWord('puxador') || hasWord('latissimo')) return 2;
    return 0;
  }
  if (f === 'espessura de costas') {
    if (primaryGroup === 'costas') {
      if (agonistMuscles.includes('romboides') || agonistMuscles.includes('trapézio médio') || agonistMuscles.includes('trapézio inferior')) return 10;
      if (synergistMuscles.includes('romboides') || synergistMuscles.includes('trapézio médio')) return 5;
    }
    const isCostas = mg === 'costas' || mg === 'back' || mg === 'dorsais' || mg === 'eretores' || hasWord('remada') || hasWord('puxada') || hasWord('pulldown');
    if (isCostas && (hasWord('remada') || hasWord('row') || hasWord('meio de costas') || hasWord('espessura'))) return 2;
    return 0;
  }
  if (f === 'trapézio' || f === 'trapézio médio' || f === 'trapézio superior' || f === 'trapezio' || f === 'trapezio medio' || f === 'trapezio superior') {
    if (primaryGroup === 'costas' || primaryGroup === 'ombros') {
      if (agonistMuscles.some(m => m.includes('trapézio') || m.includes('trapezio'))) return 10;
      if (synergistMuscles.some(m => m.includes('trapézio') || m.includes('trapezio'))) return 5;
    }
    if (mg === 'trapezio' || mg === 'trapézio' || mg === 'trapezius' || hasWord('trapézio') || hasWord('trapezio') || hasWord('encolhimento') || hasWord('remada alta')) return 2;
    return 0;
  }
  if (f === 'lombar / eretores' || f === 'eretores da espinha' || f === 'eretores da espinha') {
    if (primaryGroup === 'core' || primaryGroup === 'costas') {
      if (agonistMuscles.some(m => m.includes('eretores') || m.includes('lombar') || m.includes('eretores da espinha'))) return 10;
      if (synergistMuscles.some(m => m.includes('eretores') || m.includes('lombar') || m.includes('eretores da espinha'))) return 5;
    }
    if (mg === 'eretores' || mg === 'erectors' || mg === 'lombar' || hasWord('eretor') || hasWord('lombar') || hasWord('extensão de tronco') || hasWord('hiperextensão') || hasWord('terra')) return 2;
    return 0;
  }
  if (f === 'deltoide anterior') {
    if (primaryGroup === 'ombros' || primaryGroup === 'ombro') {
      if (agonistMuscles.includes('deltoide anterior')) return 10;
      if (synergistMuscles.includes('deltoide anterior')) return 5;
    }
    const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
    if (isOmbro && (hasWord('anterior') || hasWord('desenvolvimento') || hasWord('front'))) return 2;
    return 0;
  }
  if (f === 'deltoide lateral') {
    if (primaryGroup === 'ombros' || primaryGroup === 'ombro') {
      if (agonistMuscles.includes('deltoide lateral')) return 10;
      if (synergistMuscles.includes('deltoide lateral')) return 5;
    }
    const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
    if (isOmbro && (hasWord('lateral') || hasWord('elevação lateral') || hasWord('side deltoid'))) return 2;
    return 0;
  }
  if (f === 'deltoide posterior') {
    if (primaryGroup === 'ombros' || primaryGroup === 'ombro' || primaryGroup === 'costas') {
      if (agonistMuscles.includes('deltoide posterior')) return 10;
      if (synergistMuscles.includes('deltoide posterior')) return 5;
    }
    const isOmbro = mg === 'ombros' || mg === 'ombro' || mg === 'deltoides' || mg === 'shoulders' || hasWord('deltoide') || hasWord('ombro');
    if (isOmbro && (hasWord('posterior') || hasWord('reverso') || hasWord('crucifixo inverso') || hasWord('rear deltoid'))) return 2;
    return 0;
  }
  if (f === 'bíceps' || f === 'bíceps braquial' || f === 'biceps' || f === 'biceps braquial') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço') {
      if (agonistMuscles.includes('bíceps braquial') || agonistMuscles.includes('biceps braquial')) return 10;
      if (synergistMuscles.includes('bíceps braquial')) return 5;
    }
    if (mg === 'biceps' || mg === 'bíceps' || hasWord('bíceps') || hasWord('biceps') || hasWord('rosca')) return 2;
    return 0;
  }
  if (f === 'tríceps' || f === 'tríceps braquial' || f === 'triceps' || f === 'triceps braquial') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço' || primaryGroup === 'peitoral' || primaryGroup === 'ombros') {
      if (agonistMuscles.includes('tríceps braquial') || agonistMuscles.includes('triceps braquial')) return 10;
      if (synergistMuscles.includes('tríceps braquial')) return 5;
    }
    if (mg === 'triceps' || mg === 'tríceps' || hasWord('tríceps') || hasWord('triceps') || hasWord('testa') || hasWord('corda') || hasWord('pulley') || hasWord('paralelas')) return 2;
    return 0;
  }
  if (f === 'antebraço' || f === 'antebraços') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço') {
      if (agonistMuscles.includes('antebraços') || agonistMuscles.includes('braquiorradial')) return 10;
      if (synergistMuscles.includes('antebraços') || synergistMuscles.includes('braquiorradial')) return 5;
    }
    if (mg === 'antebraço' || mg === 'antebraços' || mg === 'forearm' || hasWord('antebraço') || hasWord('forearm') || hasWord('punho')) return 2;
    return 0;
  }
  if (f === 'abdômen' || f === 'reto abdominal') {
    if (primaryGroup === 'core') {
      if (agonistMuscles.includes('reto abdominal') || agonistMuscles.includes('abdômen superior') || agonistMuscles.includes('abdômen inferior')) return 10;
      if (synergistMuscles.includes('reto abdominal')) return 5;
    }
    if (mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen')) return 2;
    return 0;
  }
  if (f === 'abdômen superior') {
    if (primaryGroup === 'core') {
      if (agonistMuscles.includes('abdômen superior') || agonistMuscles.includes('reto abdominal')) return 10;
      if (synergistMuscles.includes('abdômen superior')) return 5;
    }
    const isAbs = mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen');
    if (isAbs && (hasWord('superior') || hasWord('supra') || hasWord('crunch'))) return 2;
    return 0;
  }
  if (f === 'abdômen inferior') {
    if (primaryGroup === 'core') {
      if (agonistMuscles.includes('abdômen inferior')) return 10;
      if (synergistMuscles.includes('abdômen inferior') || (agonistMuscles.includes('reto abdominal') && hasWord('infra'))) return 5;
    }
    const isAbs = mg === 'abdômen' || mg === 'abdomen' || mg === 'abs' || mg === 'abdominais' || mg === 'abdominal' || hasWord('abdominal') || hasWord('abdômen');
    if (isAbs && (hasWord('inferior') || hasWord('infra') || hasWord('leg raise') || hasWord('elevação de perna'))) return 2;
    return 0;
  }
  if (f === 'oblíquos') {
    if (primaryGroup === 'core') {
      if (agonistMuscles.includes('oblíquos')) return 10;
      if (synergistMuscles.includes('oblíquos')) return 5;
    }
    if (mg === 'oblíquos' || mg === 'obliquos' || mg === 'oblique' || hasWord('oblíquo') || hasWord('obliquo') || hasWord('obliques') || hasWord('russian twist')) return 2;
    return 0;
  }
  if (f === 'core profundo' || f === 'transverso abdominal') {
    if (primaryGroup === 'core') {
      if (agonistMuscles.includes('core profundo') || agonistMuscles.includes('transverso abdominal')) return 10;
      if (synergistMuscles.includes('core profundo') || synergistMuscles.includes('transverso abdominal')) return 5;
    }
    const isCore = mg === 'core' || mg === 'abdômen' || mg === 'obliquos' || mg === 'eretores' || mg === 'lombar' || hasWord('core');
    if (isCore && (hasWord('prancha') || hasWord('plank') || hasWord('transverso') || hasWord('profundo') || hasWord('perdigueiro') || hasWord('vacuum'))) return 2;
    return 0;
  }
  if (f === 'quadríceps') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna') {
      if (agonistMuscles.includes('quadríceps')) return 10;
      if (synergistMuscles.includes('quadríceps')) return 5;
    }
    if (mg === 'quadriceps' || mg === 'quad' || mg === 'quadríceps' || mg === 'quads' || hasWord('quadríceps') || hasWord('quadriceps') || hasWord('extensora') || hasWord('leg press') || hasWord('hack') || hasWord('agachamento')) return 2;
    return 0;
  }
  if (f === 'posterior de coxa' || f === 'isquiotibiais') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna') {
      if (agonistMuscles.includes('isquiotibiais') || agonistMuscles.includes('posterior de coxa')) return 10;
      if (synergistMuscles.includes('isquiotibiais') || synergistMuscles.includes('posterior de coxa')) return 5;
    }
    if (mg === 'posterior' || mg === 'posterior de coxa' || mg === 'isquiotibiais' || mg === 'hamstrings' || hasWord('posterior de coxa') || hasWord('isquiotibiais') || hasWord('flexora') || hasWord('stiff') || hasWord('mesa flexora')) return 2;
    return 0;
  }
  if (f === 'panturrilhas' || f === 'gastrocnêmio' || f === 'sóleo' || f === 'gastrocnemio' || f === 'soleo') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna') {
      if (agonistMuscles.includes('panturrilhas') || agonistMuscles.includes('gastrocnêmio') || agonistMuscles.includes('sóleo')) return 10;
      if (synergistMuscles.includes('panturrilhas') || synergistMuscles.includes('gastrocnêmio') || synergistMuscles.includes('sóleo')) return 5;
    }
    if (mg === 'panturrilha' || mg === 'panturrilhas' || mg === 'calves' || hasWord('panturrilha') || hasWord('gêmeos') || hasWord('gemeos') || hasWord('sóleo') || hasWord('soleo')) return 2;
    return 0;
  }
  if (f === 'adutores') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna') {
      if (agonistMuscles.includes('adutores')) return 10;
      if (synergistMuscles.includes('adutores')) return 5;
    }
    if (mg === 'adutores' || mg === 'adutor' || hasWord('adutor')) return 2;
    return 0;
  }
  if (f === 'abdutores') {
    if (primaryGroup === 'pernas' || primaryGroup === 'perna' || primaryGroup === 'glúteos') {
      if (agonistMuscles.includes('abdutores') || agonistMuscles.includes('glúteo médio') || agonistMuscles.includes('glúteo mínimo')) return 10;
      if (synergistMuscles.includes('abdutores')) return 5;
    }
    if (mg === 'abdutores' || mg === 'abdutor' || hasWord('abdutor')) return 2;
    return 0;
  }
  if (f === 'romboides' || f === 'romboide') {
    if (primaryGroup === 'costas') {
      if (agonistMuscles.includes('romboides') || agonistMuscles.includes('romboide')) return 10;
      if (synergistMuscles.includes('romboides')) return 5;
    }
    if (hasWord('remada') || hasWord('romboide') || hasWord('romboides') || hasWord('row')) return 2;
    return 0;
  }
  if (f === 'braquial') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço') {
      if (agonistMuscles.includes('braquial')) return 10;
      if (synergistMuscles.includes('braquial')) return 5;
    }
    if (hasWord('martelo') || hasWord('braquial') || hasWord('rosca')) return 2;
    return 0;
  }
  if (f === 'braquiorradial') {
    if (primaryGroup === 'braços' || primaryGroup === 'braço') {
      if (agonistMuscles.includes('braquiorradial')) return 10;
      if (synergistMuscles.includes('braquiorradial')) return 5;
    }
    if (hasWord('inversa') || hasWord('braquiorradial') || hasWord('martelo')) return 2;
    return 0;
  }

  // Fallback exact/substring matching on muscle_group
  if (mg.includes(f) || f.includes(mg) || sub.includes(f)) return 1;
  return 0;
};

interface ExerciseDetails {
  name: string;
  muscle_group: string;
  image_url?: string;
}

interface ProtocolExerciseCardProps {
  exercise: PremiumProtocolExercise;
  details: ExerciseDetails | undefined;
  index: number;
  onUpdateField: (field: keyof PremiumProtocolExercise, value: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onMoveToDay?: (fromDayId: string, fromIndex: number, toDayId: string) => void;
  exerciseLibrary?: Exercise[];
  onReplaceExercise?: (newExerciseId: string) => void;
}

export const ProtocolExerciseCard: React.FC<ProtocolExerciseCardProps> = React.memo(({
  exercise,
  details,
  index,
  onUpdateField,
  onDelete,
  onDuplicate,
  onMove,
  isFirst,
  isLast,
  isSelected = false,
  onToggleSelect,
  onReorder,
  onMoveToDay,
  exerciseLibrary,
  onReplaceExercise
}) => {
  const fallbackImg = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop";
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');
  const [replaceActiveTag, setReplaceActiveTag] = useState('Sugestões');

  const replaceActiveMainGroup = useMemo(() => getParentMainGroup(replaceActiveTag), [replaceActiveTag]);

  const replaceSubGroups = useMemo(() => {
    if (replaceActiveMainGroup === 'Sugestões' || replaceActiveMainGroup === 'Todos') {
      return [];
    }
    return REPLACE_SUB_GROUPS_MAP[replaceActiveMainGroup] || [];
  }, [replaceActiveMainGroup]);

  const filteredReplaceLibrary = useMemo(() => {
    if (!exerciseLibrary) return [];
    
    const currentEx = exerciseLibrary.find(ex => ex.id === exercise.exercise_id);
    const getBiomechanics = (ex: Exercise) => ex.biomechanics || getExerciseBiomechanics(ex);
    
    // Calculate match score for replacement candidates
    const getReplacementScore = (candidate: Exercise) => {
      if (!currentEx) {
        // Fallback to legacy muscle_group match
        const sameMuscle = (candidate.muscle_group || '').toLowerCase() === (details?.muscle_group || '').toLowerCase();
        return sameMuscle ? 10 : 0;
      }
      
      const curBio = getBiomechanics(currentEx);
      const candBio = getBiomechanics(candidate);
      
      let score = 0;
      
      // Pattern match: Isolation vs Compound
      if (curBio.movement_pattern && candBio.movement_pattern && curBio.movement_pattern === candBio.movement_pattern) {
        score += 5;
      }
      
      // Primary group match
      if (curBio.primary_group && candBio.primary_group && curBio.primary_group === candBio.primary_group) {
        score += 10;
      }
      
      // Agonist muscle overlap
      const curAgonists = curBio.agonist_muscles || [];
      const candAgonists = candBio.agonist_muscles || [];
      curAgonists.forEach(am => {
        if (candAgonists.includes(am)) {
          score += 6;
        }
      });

      // Synergist overlap
      const curSynergists = curBio.synergist_muscles || [];
      const candSynergists = candBio.synergist_muscles || [];
      curSynergists.forEach(sm => {
        if (candSynergists.includes(sm)) {
          score += 2;
        }
      });
      
      // Equipment overlap
      const curEquip = curBio.equipment_needed || [];
      const candEquip = candBio.equipment_needed || [];
      curEquip.forEach(eq => {
        if (candEquip.includes(eq)) {
          score += 1;
        }
      });
      
      return score;
    };

    // Filter library candidates excluding the current exercise itself
    let candidates = exerciseLibrary.filter(ex => ex.id !== exercise.exercise_id);

    // Apply active filter tag
    if (replaceActiveTag === 'Sugestões') {
      // Show suggestions ranked by biomechanics score
    } else if (replaceActiveTag !== 'Todos') {
      candidates = candidates.filter(ex => getMatchScore(ex, replaceActiveTag) > 0);
    }

    // Apply text query filtering if present
    if (replaceSearchQuery.trim()) {
      const q = replaceSearchQuery.toLowerCase().trim();
      candidates = candidates.filter(ex => {
        const bio = getBiomechanics(ex);
        const nameMatch = ex.name.toLowerCase().includes(q);
        const legacyMgMatch = (ex.muscle_group || '').toLowerCase().includes(q);
        const legacyEquipMatch = (ex.equipment || '').toLowerCase().includes(q);
        
        const bioGroupMatch = (bio.primary_group || '').toLowerCase().includes(q);
        const bioAgonistsMatch = (bio.agonist_muscles || []).some(m => m.toLowerCase().includes(q));
        const bioSynergistsMatch = (bio.synergist_muscles || []).some(m => m.toLowerCase().trim().includes(q));
        const bioEquipMatch = (bio.equipment_needed || []).some(e => e.toLowerCase().includes(q));
        const bioTagsMatch = (bio.tags || []).some(t => t.toLowerCase().includes(q));

        return nameMatch || legacyMgMatch || legacyEquipMatch || bioGroupMatch || bioAgonistsMatch || bioSynergistsMatch || bioEquipMatch || bioTagsMatch;
      });
    }

    // Sort candidates
    if (replaceActiveTag === 'Sugestões') {
      return candidates.sort((a, b) => {
        const scoreA = getReplacementScore(a);
        const scoreB = getReplacementScore(b);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return a.name.localeCompare(b.name);
      }).slice(0, 8);
    } else {
      if (replaceActiveTag !== 'Todos') {
        candidates = candidates.sort((a, b) => {
          const scoreA = getMatchScore(a, replaceActiveTag);
          const scoreB = getMatchScore(b, replaceActiveTag);
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return a.name.localeCompare(b.name);
        });
      } else {
        candidates = candidates.sort((a, b) => a.name.localeCompare(b.name));
      }
      return candidates.slice(0, 40);
    }
  }, [replaceSearchQuery, replaceActiveTag, exerciseLibrary, exercise.exercise_id, details?.muscle_group]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDraggedOver) {
      setIsDraggedOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    try {
      const rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data.type === 'exercise') {
        const fromIndex = data.index;
        const fromDayId = data.dayId;
        if (fromIndex !== undefined) {
          if (fromDayId === exercise.day_id) {
            if (onReorder) onReorder(fromIndex, index);
          } else {
            if (onMoveToDay) onMoveToDay(fromDayId, fromIndex, exercise.day_id);
          }
        }
      }
    } catch (err) {
      console.error('[ProtocolExerciseCard] Drop failed:', err);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-xl border transition-all flex flex-col ${
        isDraggedOver 
          ? 'border-dashed border-blue-500 bg-blue-50/10 scale-[1.002] shadow-sm' 
          : isSelected 
          ? 'border-blue-300 bg-blue-50/5 shadow-sm' 
          : 'border-slate-100 hover:border-slate-200/80'
      }`}
    >
      {/* 1. STUNNING HIGH-DENSITY COMPACT STATE (Exactly one horizontal line on Desktop) */}
      <div className="p-2 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 select-none text-[11px]">
        {/* Left Section: Drag, Checkbox, Image & Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 lg:max-w-[40%]">
          {/* Grab Handle */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'exercise',
                index,
                dayId: exercise.day_id,
                exerciseId: exercise.id
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 rounded shrink-0 flex items-center justify-center"
            title="Arraste para reordenar"
          >
            <GripVertical size={13} />
          </div>

          {/* Selector Checkbox */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0 cursor-pointer"
              title="Selecionar"
            />
          )}

          {/* Exercise Image */}
          <img
            src={details?.image_url || fallbackImg}
            alt={details?.name || "Exercício"}
            className="w-7 h-7 rounded-md object-cover shrink-0 border border-slate-100/80"
            referrerPolicy="no-referrer"
          />

          {/* Exercise Meta (Name & Muscle) */}
          <div className="min-w-0 flex-1">
            <h5 className="font-extrabold text-slate-800 truncate leading-none">
              {details?.name || "Carregando Exercício..."}
            </h5>
            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
              {details?.muscle_group || "Geral"}
            </span>
          </div>
        </div>

        {/* Middle Section: Quick Inline Fields (Sets, Reps, Rest, RPE) aligned horizontally */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 py-1 px-2 rounded-lg bg-slate-50/50 border border-slate-100/80">
          {/* Sets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Séries</span>
            <input
              type="number"
              min={1}
              value={exercise.sets}
              onChange={(e) => onUpdateField('sets', Number(e.target.value) || 3)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* Reps */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reps</span>
            <input
              type="text"
              placeholder="10"
              value={exercise.reps}
              onChange={(e) => onUpdateField('reps', e.target.value)}
              className="h-6 w-12 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* Rest */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rest</span>
            <input
              type="number"
              placeholder="60"
              value={exercise.rest_seconds || ''}
              onChange={(e) => onUpdateField('rest_seconds', Number(e.target.value) || 0)}
              className="h-6 w-11 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
            <span className="text-[9px] text-slate-400 font-bold">s</span>
          </div>

          <div className="w-px h-3 bg-slate-200 hidden lg:block" />

          {/* RPE */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RPE</span>
            <input
              type="text"
              placeholder="9"
              value={exercise.rpe || ''}
              onChange={(e) => onUpdateField('rpe', e.target.value)}
              className="h-6 w-9 rounded bg-white border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-blue-500 text-center"
            />
          </div>
        </div>

        {/* Right Section: Compact toolbar actions */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto lg:ml-0">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 bg-transparent border-none cursor-pointer"
            title="Mover para cima"
          >
            <ArrowUp size={11} />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={isLast}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-20 bg-transparent border-none cursor-pointer"
            title="Mover para baixo"
          >
            <ArrowDown size={11} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-transparent border-none cursor-pointer"
            title="Duplicar"
          >
            <Copy size={11} />
          </button>
          <button
            type="button"
            onClick={() => setIsReplacing(!isReplacing)}
            className={`p-1 rounded cursor-pointer border-none transition-colors flex items-center justify-center ${
              isReplacing ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title="Substituir exercício"
          >
            <RefreshCw size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-transparent border-none cursor-pointer"
            title="Remover"
          >
            <Trash2 size={11} />
          </button>
          
          <div className="w-px h-3.5 bg-slate-200 mx-1 hidden lg:block" />

          {/* Expand/Collapse Toggle Arrow */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded cursor-pointer border-none transition-colors flex items-center justify-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 ${
              isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
            title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            Detalhes
            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>

      {/* 2. EXPANDED STATE PANEL (Smooth dropdown) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-slate-50 bg-slate-50/20"
          >
            <div className="p-4 flex flex-col gap-3.5 text-[11px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Carga */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Carga / Tipo</span>
                  <input
                    type="text"
                    placeholder="Ex: 40kg, Halteres"
                    value={exercise.load_type || ''}
                    onChange={(e) => onUpdateField('load_type', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Cadência */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Cadência</span>
                  <input
                    type="text"
                    placeholder="Ex: 3010, Controlada"
                    value={exercise.cadence || ''}
                    onChange={(e) => onUpdateField('cadence', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tempo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Tempo sob Tensão</span>
                  <input
                    type="text"
                    placeholder="Ex: 45s, Sem pausa"
                    value={exercise.tempo || ''}
                    onChange={(e) => onUpdateField('tempo', e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Advanced Methodology Toggle Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Drop-set */}
                <button
                  type="button"
                  onClick={() => onUpdateField('drop_set', !exercise.drop_set)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.drop_set
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Flame size={11} />
                  Drop-Set
                </button>

                {/* Rest-pause */}
                <button
                  type="button"
                  onClick={() => onUpdateField('rest_pause', !exercise.rest_pause)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.rest_pause
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Zap size={11} />
                  Rest-Pause
                </button>

                {/* Super-série */}
                <button
                  type="button"
                  onClick={() => onUpdateField('superset', !exercise.superset)}
                  className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                    exercise.superset
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={11} />
                  Super-Série
                </button>
              </div>

              {/* Instructions / Notes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-450">Instruções Técnicas / Observações / Notas</span>
                <textarea
                  placeholder="Instruções específicas para o atleta..."
                  rows={2}
                  value={exercise.notes || ''}
                  onChange={(e) => onUpdateField('notes', e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INLINE REPLACEMENT UI */}
      <AnimatePresence>
        {isReplacing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <RefreshCw size={10} className="text-blue-500 animate-spin-slow" />
                Substituir por... {replaceActiveTag !== 'Sugestões' && replaceActiveTag !== 'Todos' ? `(${replaceActiveTag})` : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsReplacing(false);
                  setReplaceSearchQuery('');
                  setReplaceActiveTag('Sugestões');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Replacement Main Group Filter Row */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-2 mb-1.5 shrink-0 select-none border-b border-slate-100/60">
              {REPLACE_MAIN_GROUPS.map((tag) => {
                const isSelected = replaceActiveTag === tag || replaceActiveMainGroup === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setReplaceActiveTag(tag);
                    }}
                    className={`h-6 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {tag === 'Sugestões' ? '⭐ Sugestões' : tag}
                  </button>
                );
              })}
            </div>

            {/* Replacement Sub Group Filter Row */}
            {replaceSubGroups.length > 0 && (
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1.5 mb-2 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setReplaceActiveTag(replaceActiveMainGroup)}
                  className={`h-5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                    replaceActiveTag === replaceActiveMainGroup
                      ? 'bg-slate-850 border-slate-850 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  Todos {replaceActiveMainGroup}
                </button>
                {replaceSubGroups.map((sub) => {
                  const isSelected = replaceActiveTag.toLowerCase() === sub.toLowerCase();
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setReplaceActiveTag(sub)}
                      className={`h-5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-850 border-slate-850 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
            
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Pesquisar em ${replaceActiveTag === 'Sugestões' ? 'Sugestões inteligentes' : replaceActiveTag}...`}
                value={replaceSearchQuery}
                onChange={(e) => setReplaceSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-slate-200 text-xs placeholder:text-slate-400 font-semibold focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {filteredReplaceLibrary.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[10px] font-semibold">
                  Nenhum exercício encontrado.
                </div>
              ) : (
                filteredReplaceLibrary.map(({ item: ex, score }) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      if (onReplaceExercise) {
                        onReplaceExercise(ex.id);
                      } else {
                        onUpdateField('exercise_id', ex.id);
                      }
                      setIsReplacing(false);
                      setReplaceSearchQuery('');
                      setReplaceActiveTag('Sugestões');
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg transition-colors hover:bg-white border-none text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img
                        src={ex.image_url || fallbackImg}
                        alt={ex.name}
                        className="w-6 h-6 rounded object-cover border border-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold text-slate-800 truncate">{ex.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{ex.muscle_group || 'Geral'}</p>
                      </div>
                    </div>

                    {/* Biomechanical match score or standard badge */}
                    {score !== undefined ? (
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                        score >= 18 
                          ? 'bg-green-500/10 text-green-600'
                          : score >= 10 
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {score >= 18 ? '🔥 Perfeito' : score >= 10 ? '✨ Similar' : 'Compatível'}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ProtocolExerciseCard.displayName = 'ProtocolExerciseCard';
