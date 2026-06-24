import { supabase } from './supabase';
import { workoutApi } from './workoutApi';
import { SetConfig, WorkoutFolder, Exercise } from '../../types';

export interface PremiumTemplateExercise {
  exercise_id: string; // fallback
  exercise_name: string;
  sets: number;
  reps: string;
  weight: number;
  rest_time: number;
  sets_json: SetConfig[];
  sort_order: number;
  notes?: string;
}

export interface PremiumTemplateWorkout {
  id: string;
  name: string;
  description?: string;
  exercises: PremiumTemplateExercise[];
}

export interface PremiumProtocol {
  id: string;
  name: string;
  description: string;
  version: number;
  premium: boolean; // Is it premium or free?
  is_active?: boolean; // Can be marked inactive by the admin
  goal: string; // hypertrophy, weight_loss, strength, performance, glutes, recovery
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  frequency: number; // days per week
  created_by: 'rubi_ai' | 'admin' | 'coach_kyron' | 'certified_personal';
  rating: number;
  featured?: boolean;
  athletes_count: number;
  completion_rate: number; // e.g. 87
  strength_increase_pct: number; // e.g. 18
  created_at: string;
  updated_at: string;
  updated_by: string;
  workouts: PremiumTemplateWorkout[];
  version_history: {
    version: number;
    updated_at: string;
    updated_by: string;
    changes: string[];
  }[];
}

// Initial seed premium protocols
export const INITIAL_PREMIUM_PROTOCOLS: PremiumProtocol[] = [
  {
    id: 'hipertrofia-estrategica',
    name: 'Hipertrofia Estratégica',
    description: 'Protocolo de alta intensidade focado no estímulo mecânico e metabólico ideal, maximizando hipertrofia miofibrilar com progressão de tensão planejada pela inteligência de comportamento da Rubi.',
    version: 2,
    premium: true,
    goal: 'hypertrophy',
    difficulty: 'intermediate',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'rubi_ai',
    rating: 4.9,
    featured: true,
    athletes_count: 2314,
    completion_rate: 87,
    strength_increase_pct: 18,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-02T15:30:00Z',
    updated_by: 'Rubi Intelligence',
    workouts: [
      {
        id: 'he_w_a',
        name: 'Treino A - Peito & Ombros',
        description: 'Tensão mecânica no plano transversal superior.',
        exercises: [
          {
            exercise_id: 'ex_he_1',
            exercise_name: 'Supino Reto com Barra',
            sets: 4,
            reps: '8-10',
            weight: 30,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '8', weight: 30, rest_time: 90 },
              { reps: '8', weight: 30, rest_time: 90 },
              { reps: '8', weight: 30, rest_time: 90 },
              { reps: '8', weight: 30, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_he_2',
            exercise_name: 'Desenvolvimento com Halteres',
            sets: 3,
            reps: '10',
            weight: 14,
            rest_time: 75,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 14, rest_time: 75 },
              { reps: '10', weight: 14, rest_time: 75 },
              { reps: '10', weight: 14, rest_time: 75 }
            ]
          },
          {
            exercise_id: 'ex_he_3',
            exercise_name: 'Elevação Lateral',
            sets: 4,
            reps: '12',
            weight: 8,
            rest_time: 60,
            sort_order: 3,
            sets_json: [
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 }
            ]
          }
        ]
      },
      {
        id: 'he_w_b',
        name: 'Treino B - Costas & Bíceps',
        description: 'Foco na amplitude do plano sagital/puxar.',
        exercises: [
          {
            exercise_id: 'ex_he_4',
            exercise_name: 'Remada Curvada com Barra',
            sets: 4,
            reps: '10',
            weight: 25,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 25, rest_time: 90 },
              { reps: '10', weight: 25, rest_time: 90 },
              { reps: '10', weight: 25, rest_time: 90 },
              { reps: '10', weight: 25, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_he_5',
            exercise_name: 'Puxada Triângulo',
            sets: 3,
            reps: '10',
            weight: 35,
            rest_time: 75,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 35, rest_time: 75 },
              { reps: '10', weight: 35, rest_time: 75 },
              { reps: '10', weight: 35, rest_time: 75 }
            ]
          },
          {
            exercise_id: 'ex_he_6',
            exercise_name: 'Rosca Direta com Barra W',
            sets: 3,
            reps: '12',
            weight: 10,
            rest_time: 60,
            sort_order: 3,
            sets_json: [
              { reps: '12', weight: 10, rest_time: 60 },
              { reps: '12', weight: 10, rest_time: 60 },
              { reps: '12', weight: 10, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-01T10:00:00Z',
        updated_by: 'Rubi Admin',
        changes: ['Versão inicial do protocolo adaptativo.']
      },
      {
        version: 2,
        updated_at: '2026-06-02T15:30:00Z',
        updated_by: 'Rubi Intelligence',
        changes: ['Substituída Remada Cavalinho por Remada Curvada livre para ampliação da ativação de estabilizadores lombar.', 'Reduzido intervalo de descanso nas laterais para 60s.']
      }
    ]
  },
  {
    id: 'upper-lower-5x',
    name: 'Upper Lower 5x (Alta Frequência)',
    description: 'Estratégia avançada de distribuição de volume em base de 5 sessões semanais alternando extremidades. Otimiza a frequência de estímulos por grupamento muscular para atletas consistentes.',
    version: 1,
    premium: true,
    goal: 'hypertrophy',
    difficulty: 'advanced',
    duration_weeks: 10,
    frequency: 5,
    created_by: 'admin',
    rating: 4.8,
    featured: false,
    athletes_count: 1450,
    completion_rate: 81,
    strength_increase_pct: 22,
    created_at: '2026-06-01T12:00:00Z',
    updated_at: '2026-06-01T12:00:00Z',
    updated_by: 'Equipe Médica',
    workouts: [
      {
        id: 'ul_w_a',
        name: 'Treino A - Upper Power',
        description: 'Tensão progressiva com exercícios básicos multiarticulares de empurrar e puxar.',
        exercises: [
          {
            exercise_id: 'ex_ul_1',
            exercise_name: 'Supino Inclinado com Halteres',
            sets: 4,
            reps: '6-8',
            weight: 22,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '6', weight: 22, rest_time: 90 },
              { reps: '6', weight: 22, rest_time: 90 },
              { reps: '6', weight: 22, rest_time: 90 },
              { reps: '6', weight: 22, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_ul_2',
            exercise_name: 'Puxador Frente Pronado',
            sets: 4,
            reps: '8',
            weight: 45,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '8', weight: 45, rest_time: 90 },
              { reps: '8', weight: 45, rest_time: 90 },
              { reps: '8', weight: 45, rest_time: 90 },
              { reps: '8', weight: 45, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-01T12:00:00Z',
        updated_by: 'Equipe Médica',
        changes: ['Publicação inicial do modelo de divisão científica de base 5 dias.']
      }
    ]
  },
  {
    id: 'powerbuilding-fusion',
    name: 'Powerbuilding Fusion',
    description: 'Protocolo de força máxima combinado com trabalho acessório estético. Desenvolva força bruta nos 3 levantamentos básicos ao passo que preserva a simetria e linhas de definição muscular.',
    version: 1,
    premium: true,
    goal: 'strength',
    difficulty: 'advanced',
    duration_weeks: 8,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.95,
    featured: true,
    athletes_count: 984,
    completion_rate: 91,
    strength_increase_pct: 29,
    created_at: '2026-06-02T11:00:00Z',
    updated_at: '2026-06-02T11:00:00Z',
    updated_by: 'Equipe KYRON',
    workouts: [
      {
        id: 'pb_w_a',
        name: 'Treino A - Agachamento de Força',
        description: 'Treino primário para a articulação do joelho e quadril, sobrecarga axial progressiva.',
        exercises: [
          {
            exercise_id: 'ex_pb_1',
            exercise_name: 'Agachamento Livre',
            sets: 5,
            reps: '5',
            weight: 60,
            rest_time: 120,
            sort_order: 1,
            sets_json: [
              { reps: '5', weight: 60, rest_time: 120 },
              { reps: '5', weight: 60, rest_time: 120 },
              { reps: '5', weight: 60, rest_time: 120 },
              { reps: '5', weight: 60, rest_time: 120 },
              { reps: '5', weight: 60, rest_time: 120 }
            ]
          },
          {
            exercise_id: 'ex_pb_2',
            exercise_name: 'Leg Press 45',
            sets: 3,
            reps: '10',
            weight: 120,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 120, rest_time: 90 },
              { reps: '10', weight: 120, rest_time: 90 },
              { reps: '10', weight: 120, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-02T11:00:00Z',
        updated_by: 'Equipe KYRON',
        changes: ['Blueprint inicial concebido por treinadores certificados Kyron com testes de esforço integrados.']
      }
    ]
  },
  {
    id: 'gluteos-premium-os',
    name: 'Glúteos Premium & Linhas',
    description: 'Protocolo estético especializado focado na fita muscular posterior superior, minimizando sobrecarga desnecessária na musculatura do quadríceps frontal.',
    version: 1,
    premium: true,
    goal: 'glutes',
    difficulty: 'intermediate',
    duration_weeks: 8,
    frequency: 4,
    created_by: 'certified_personal',
    rating: 4.88,
    featured: false,
    athletes_count: 1823,
    completion_rate: 89,
    strength_increase_pct: 16,
    created_at: '2026-06-02T13:00:00Z',
    updated_at: '2026-06-02T13:00:00Z',
    updated_by: 'Personal Trainer Certificado',
    workouts: [
      {
        id: 'gp_w_a',
        name: 'Treino A - Ênfase Glúteos & Isquiotibiais',
        description: 'Isolação seletiva para a fita posterior.',
        exercises: [
          {
            exercise_id: 'ex_gp_1',
            exercise_name: 'Elevação Pélvica na Máquina',
            sets: 4,
            reps: '12',
            weight: 40,
            rest_time: 75,
            sort_order: 1,
            sets_json: [
              { reps: '12', weight: 40, rest_time: 75 },
              { reps: '12', weight: 40, rest_time: 75 },
              { reps: '12', weight: 40, rest_time: 75 },
              { reps: '12', weight: 40, rest_time: 75 }
            ]
          },
          {
            exercise_id: 'ex_gp_2',
            exercise_name: 'Stiff Unilateral com Halteres',
            sets: 3,
            reps: '10',
            weight: 12,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 12, rest_time: 60 },
              { reps: '10', weight: 12, rest_time: 60 },
              { reps: '10', weight: 12, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-02T13:00:00Z',
        updated_by: 'Personal Trainer Certificado',
        changes: ['Modelo inicial focado em biomecânica seletiva de glúteos e isquios.']
      }
    ]
  },
  {
    id: 'academia-lotada',
    name: 'Academia Lotada OS',
    description: 'Manual de adaptação inteligente para treinar no pico do horário de pico. Protocolo inteligente baseado em aparelhos intercambiáveis, halteres e bi-sets que não prendem máquinas concorridas.',
    version: 1,
    premium: true,
    goal: 'performance',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'rubi_ai',
    rating: 4.79,
    featured: false,
    athletes_count: 3200,
    completion_rate: 93,
    strength_increase_pct: 12,
    created_at: '2026-06-03T08:00:00Z',
    updated_at: '2026-06-03T08:00:00Z',
    updated_by: 'Rubi Intelligence',
    workouts: [
      {
        id: 'al_w_a',
        name: 'Ficha A - Haltéres & Polias Unilaterais',
        description: 'Sem bloquear aparelhos populares.',
        exercises: [
          {
            exercise_id: 'ex_al_1',
            exercise_name: 'Taça Squat com Halter',
            sets: 4,
            reps: '12',
            weight: 20,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-03T08:00:00Z',
        updated_by: 'Rubi Intelligence',
        changes: ['Versão gerada pela Rubi AI para resolver problemas de filas em academias comerciais.']
      }
    ]
  },
  {
    id: 'peitoral-respeito-iniciante',
    name: 'Peitoral de Respeito • Iniciante',
    description: 'Protocolo de especialização peitoral focado em técnica básica de empurrar, ativação seletiva e menor volume para promover consistência.',
    version: 1,
    premium: true,
    goal: 'peitoral',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'coach_kyron',
    rating: 4.8,
    featured: false,
    athletes_count: 520,
    completion_rate: 94,
    strength_increase_pct: 12,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'peit_ini_w_a',
        name: 'Treino A • Ativação Clavicular & Base',
        description: 'Técnica e conexões sinápticas primárias.',
        exercises: [
          {
            exercise_id: 'ex_peit_ini_1',
            exercise_name: 'Supino Plano com Halteres',
            sets: 3,
            reps: '10',
            weight: 16,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 16, rest_time: 90 },
              { reps: '10', weight: 16, rest_time: 90 },
              { reps: '10', weight: 16, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_peit_ini_2',
            exercise_name: 'Crucifixo Inclinado com Halteres',
            sets: 3,
            reps: '12',
            weight: 12,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 12, rest_time: 90 },
              { reps: '12', weight: 12, rest_time: 90 },
              { reps: '12', weight: 12, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão inicial de Especialização Clavicular de peito.']
      }
    ]
  },
  {
    id: 'peitoral-respeito-intermediario',
    name: 'Peitoral de Respeito • Intermediário',
    description: 'Foco em maior volume e duas sessões semanais com ativação de diferentes porções do peitoral (superior e médio) para desenvolvimento moderado.',
    version: 1,
    premium: true,
    goal: 'peitoral',
    difficulty: 'intermediate',
    duration_weeks: 10,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.88,
    featured: false,
    athletes_count: 1240,
    completion_rate: 89,
    strength_increase_pct: 20,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'peit_int_w_a',
        name: 'Treino A • Ênfase Clavicular y Superior',
        description: 'Tensão mecânica sob inclinação.',
        exercises: [
          {
            exercise_id: 'ex_peit_int_1',
            exercise_name: 'Supino Inclinado com Halteres',
            sets: 4,
            reps: '10',
            weight: 22,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 22, rest_time: 90 },
              { reps: '10', weight: 22, rest_time: 90 },
              { reps: '10', weight: 22, rest_time: 90 },
              { reps: '10', weight: 22, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_peit_int_2',
            exercise_name: 'Crossover na Polia Alta',
            sets: 3,
            reps: '12',
            weight: 15,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão inicial.']
      }
    ]
  },
  {
    id: 'peitoral-respeito-avancado',
    name: 'Peitoral de Respeito • Avançado',
    description: 'Especialização completa de alta intensidade e volume elevado. 3 estímulos semanais focados em peitoral superior, médio e inferior com técnicas de alta densidade.',
    version: 1,
    premium: true,
    goal: 'peitoral',
    difficulty: 'advanced',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'coach_kyron',
    rating: 4.95,
    featured: true,
    athletes_count: 890,
    completion_rate: 86,
    strength_increase_pct: 28,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'peit_av_w_a',
        name: 'Treino A • Choque Esternocostal & Força',
        description: 'Tensão limite e repetições pesadas.',
        exercises: [
          {
            exercise_id: 'ex_peit_av_1',
            exercise_name: 'Supino Reto com Barra',
            sets: 4,
            reps: '8',
            weight: 80,
            rest_time: 120,
            sort_order: 1,
            sets_json: [
              { reps: '8', weight: 80, rest_time: 120 },
              { reps: '8', weight: 80, rest_time: 120 },
              { reps: '8', weight: 80, rest_time: 120 },
              { reps: '8', weight: 80, rest_time: 120 }
            ]
          },
          {
            exercise_id: 'ex_peit_av_2',
            exercise_name: 'Crucifixo Inclinado na Polia',
            sets: 4,
            reps: '12',
            weight: 20,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão biomecânica avançada para quebra de platôs.']
      }
    ]
  },
  {
    id: 'costas-largas-iniciante',
    name: 'Costas Largas • Iniciante',
    description: 'Melhore sua largura dorsal (formato em V) com ênfase em controle escapular e puxadas básicas. Volume reduzido para adaptar tendões e pegada.',
    version: 1,
    premium: true,
    goal: 'costas',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'coach_kyron',
    rating: 4.75,
    featured: false,
    athletes_count: 480,
    completion_rate: 93,
    strength_increase_pct: 11,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'cost_ini_w_a',
        name: 'Treino A • Ativação de Puxada & Core',
        description: 'Construindo o controle escapular inicial.',
        exercises: [
          {
            exercise_id: 'ex_cost_ini_1',
            exercise_name: 'Puxada Alta Pronada',
            sets: 3,
            reps: '10',
            weight: 35,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 35, rest_time: 90 },
              { reps: '10', weight: 35, rest_time: 90 },
              { reps: '10', weight: 35, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_cost_ini_2',
            exercise_name: 'Remada Sentada na Polia Alta',
            sets: 3,
            reps: '12',
            weight: 30,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 30, rest_time: 90 },
              { reps: '12', weight: 30, rest_time: 90 },
              { reps: '12', weight: 30, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Modelo adaptativo de tração dorsal.']
      }
    ]
  },
  {
    id: 'costas-largas-intermediario',
    name: 'Costas Largas • Intermediário',
    description: 'Foco em largura e densidade dorsal com maior variedade de empunhaduras e remadas livres para densidade de miolo de costas.',
    version: 1,
    premium: true,
    goal: 'costas',
    difficulty: 'intermediate',
    duration_weeks: 10,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.85,
    featured: false,
    athletes_count: 980,
    completion_rate: 90,
    strength_increase_pct: 18,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'cost_int_w_a',
        name: 'Treino A • Miolo de Costas & Tração',
        description: 'Remadas livres de alta ativação espinhal.',
        exercises: [
          {
            exercise_id: 'ex_cost_int_1',
            exercise_name: 'Remada Curvada com Barra',
            sets: 4,
            reps: '10',
            weight: 40,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 40, rest_time: 90 },
              { reps: '10', weight: 40, rest_time: 90 },
              { reps: '10', weight: 40, rest_time: 90 },
              { reps: '10', weight: 40, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_cost_int_2',
            exercise_name: 'Puxador Articulado Aberto',
            sets: 3,
            reps: '12',
            weight: 45,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 45, rest_time: 90 },
              { reps: '12', weight: 45, rest_time: 90 },
              { reps: '12', weight: 45, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão intermediária.']
      }
    ]
  },
  {
    id: 'costas-largas-avancado',
    name: 'Costas Largas • Avançado',
    description: 'Especialização de alta frequência e volume elevado de tração. Técnicas de pico de contração para isolar latíssimo do dorso de forma madura.',
    version: 1,
    premium: true,
    goal: 'costas',
    difficulty: 'advanced',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'coach_kyron',
    rating: 4.92,
    featured: true,
    athletes_count: 730,
    completion_rate: 85,
    strength_increase_pct: 26,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'cost_av_w_a',
        name: 'Treino A • Largura Absoluta & V-Shape',
        description: 'Progressão tensional máxima de latíssimo.',
        exercises: [
          {
            exercise_id: 'ex_cost_av_1',
            exercise_name: 'Barra Fixa com Peso Adicional',
            sets: 4,
            reps: '6-8',
            weight: 10,
            rest_time: 120,
            sort_order: 1,
            sets_json: [
              { reps: '8', weight: 10, rest_time: 120 },
              { reps: '8', weight: 10, rest_time: 120 },
              { reps: '6', weight: 10, rest_time: 120 },
              { reps: '6', weight: 10, rest_time: 120 }
            ]
          },
          {
            exercise_id: 'ex_cost_av_2',
            exercise_name: 'Remada Unilateral com Halter (Serrote)',
            sets: 4,
            reps: '10',
            weight: 36,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 36, rest_time: 90 },
              { reps: '10', weight: 36, rest_time: 90 },
              { reps: '10', weight: 36, rest_time: 90 },
              { reps: '10', weight: 36, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão avançada para expansão extrema de latíssimos.']
      }
    ]
  },
  {
    id: 'ombros-3d-iniciante',
    name: 'Ombros 3D • Iniciante',
    description: 'Correção de postura e aumento de largura clavicular com exercícios controlados focando na técnica das elevações laterais.',
    version: 1,
    premium: true,
    goal: 'ombros',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'coach_kyron',
    rating: 4.82,
    featured: false,
    athletes_count: 610,
    completion_rate: 95,
    strength_increase_pct: 10,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'omb_ini_w_a',
        name: 'Treino A • Ativação Deltoide Global',
        description: 'Técnica primária de elevação sem ativação de trapézio.',
        exercises: [
          {
            exercise_id: 'ex_omb_ini_1',
            exercise_name: 'Desenvolvimento Sentado com Halteres',
            sets: 3,
            reps: '10',
            weight: 12,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 12, rest_time: 90 },
              { reps: '10', weight: 12, rest_time: 90 },
              { reps: '10', weight: 12, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_omb_ini_2',
            exercise_name: 'Elevação Lateral com Halteres em Pé',
            sets: 3,
            reps: '12',
            weight: 6,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 6, rest_time: 60 },
              { reps: '12', weight: 6, rest_time: 60 },
              { reps: '12', weight: 6, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão inicial de base clavicular.']
      }
    ]
  },
  {
    id: 'ombros-3d-intermediario',
    name: 'Ombros 3D • Intermediário',
    description: 'Desenvolvimento tridimensional do ombro. Distribuição de estímulos nos três feixes (lateral, anterior e posterior) com polias.',
    version: 1,
    premium: true,
    goal: 'ombros',
    difficulty: 'intermediate',
    duration_weeks: 10,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.88,
    featured: false,
    athletes_count: 1130,
    completion_rate: 91,
    strength_increase_pct: 16,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'omb_int_w_a',
        name: 'Treino A • Deltoide Tridimensional Polia',
        description: 'Tensão sob polias e ângulos variados.',
        exercises: [
          {
            exercise_id: 'ex_omb_int_1',
            exercise_name: 'Elevação Lateral na Polia Unilateral',
            sets: 4,
            reps: '12',
            weight: 8,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 },
              { reps: '12', weight: 8, rest_time: 60 }
            ]
          },
          {
            exercise_id: 'ex_omb_int_2',
            exercise_name: 'Crucifixo Invertido na Polia Alta',
            sets: 3,
            reps: '12',
            weight: 12,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 12, rest_time: 60 },
              { reps: '12', weight: 12, rest_time: 60 },
              { reps: '12', weight: 12, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão intermediária.']
      }
    ]
  },
  {
    id: 'ombros-3d-avancado',
    name: 'Ombros 3D • Avançado',
    description: 'Especialização completa de alta intensidade de deltoide. Foco visual clássico em V-taper com estímulo tensional e metabólico elevado.',
    version: 1,
    premium: true,
    goal: 'ombros',
    difficulty: 'advanced',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'coach_kyron',
    rating: 4.96,
    featured: true,
    athletes_count: 670,
    completion_rate: 87,
    strength_increase_pct: 22,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'omb_av_w_a',
        name: 'Treino A • Elevação Gigante & Volume Extra',
        description: 'Estresse sarcoplasmático induzido.',
        exercises: [
          {
            exercise_id: 'ex_omb_av_1',
            exercise_name: 'Desenvolvimento Militar Barra em Pé',
            sets: 4,
            reps: '6-8',
            weight: 40,
            rest_time: 120,
            sort_order: 1,
            sets_json: [
              { reps: '8', weight: 40, rest_time: 120 },
              { reps: '8', weight: 40, rest_time: 120 },
              { reps: '6', weight: 40, rest_time: 120 },
              { reps: '6', weight: 40, rest_time: 120 }
            ]
          },
          {
            exercise_id: 'ex_omb_av_2',
            exercise_name: 'Elevação Lateral Multipressão (Série Gigante)',
            sets: 4,
            reps: '15',
            weight: 14,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '15', weight: 14, rest_time: 60 },
              { reps: '15', weight: 12, rest_time: 60 },
              { reps: '15', weight: 10, rest_time: 60 },
              { reps: '15', weight: 8, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão avançada 3D.']
      }
    ]
  },
  {
    id: 'bracos-aco-iniciante',
    name: 'Braços de Aço • Iniciante',
    description: 'Fortalecimento e hipertrofia de bíceps e tríceps com roscas fundamentais de cotovelo, maximizando o controle de movimento.',
    version: 1,
    premium: true,
    goal: 'bracos',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'coach_kyron',
    rating: 4.78,
    featured: false,
    athletes_count: 450,
    completion_rate: 92,
    strength_increase_pct: 13,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'brac_ini_w_a',
        name: 'Treino A • Isolação Básica de Braços',
        description: 'Progressão mecânica isolada de flexores/extensores.',
        exercises: [
          {
            exercise_id: 'ex_brac_ini_1',
            exercise_name: 'Rosca Direta com Barra W',
            sets: 3,
            reps: '10',
            weight: 14,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 14, rest_time: 90 },
              { reps: '10', weight: 14, rest_time: 90 },
              { reps: '10', weight: 14, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_brac_ini_2',
            exercise_name: 'Tríceps na Polia com Corda',
            sets: 3,
            reps: '12',
            weight: 15,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão inicial básica de braços.']
      }
    ]
  },
  {
    id: 'bracos-aco-intermediario',
    name: 'Braços de Aço • Intermediário',
    description: 'Treino otimizado para bíceps e tríceps utilizando super-séries para manter o fluxo de sangue e acelerar o desenvolvimento.',
    version: 1,
    premium: true,
    goal: 'bracos',
    difficulty: 'intermediate',
    duration_weeks: 10,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.87,
    featured: false,
    athletes_count: 1020,
    completion_rate: 89,
    strength_increase_pct: 19,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'brac_int_w_a',
        name: 'Treino A • Supersets de Antagonistas',
        description: 'Isolamento contínuo alternado.',
        exercises: [
          {
            exercise_id: 'ex_brac_int_1',
            exercise_name: 'Rosca Alternada com Halteres',
            sets: 4,
            reps: '10',
            weight: 12,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 12, rest_time: 60 },
              { reps: '10', weight: 12, rest_time: 60 },
              { reps: '10', weight: 12, rest_time: 60 },
              { reps: '10', weight: 12, rest_time: 60 }
            ]
          },
          {
            exercise_id: 'ex_brac_int_2',
            exercise_name: 'Tríceps Testa com Barra W',
            sets: 4,
            reps: '10',
            weight: 16,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 16, rest_time: 60 },
              { reps: '10', weight: 16, rest_time: 60 },
              { reps: '10', weight: 16, rest_time: 60 },
              { reps: '10', weight: 16, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão intermediária.']
      }
    ]
  },
  {
    id: 'bracos-aco-avancado',
    name: 'Braços de Aço • Avançado',
    description: 'Especialização avançada combinada. Estímulo metabólico extremo de bíceps e tríceps com oclusão simulada e pirâmide crescente.',
    version: 1,
    premium: true,
    goal: 'bracos',
    difficulty: 'advanced',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'coach_kyron',
    rating: 4.94,
    featured: true,
    athletes_count: 790,
    completion_rate: 86,
    strength_increase_pct: 25,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'brac_av_w_a',
        name: 'Treino A • Bomba Total Sarcoplasmática',
        description: 'Intensidade limite de bombeamento celular.',
        exercises: [
          {
            exercise_id: 'ex_brac_av_1',
            exercise_name: 'Rosca Martelo Alternada Ampla',
            sets: 4,
            reps: '10',
            weight: 18,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 18, rest_time: 60 },
              { reps: '10', weight: 18, rest_time: 60 },
              { reps: '10', weight: 18, rest_time: 60 },
              { reps: '10', weight: 18, rest_time: 60 }
            ]
          },
          {
            exercise_id: 'ex_brac_av_2',
            exercise_name: 'Tríceps Coice na Polia Baixa',
            sets: 4,
            reps: '12',
            weight: 12,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 12, rest_time: 60 },
              { reps: '12', weight: 12, rest_time: 60 },
              { reps: '12', weight: 12, rest_time: 60 },
              { reps: '12', weight: 12, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão avançada para hipertrofia total miofibrilar e bombamento muscular.']
      }
    ]
  },
  {
    id: 'pernas-imponentes-iniciante',
    name: 'Pernas Imponentes • Iniciante',
    description: 'Construa membros inferiores consistentes (quadríceps e posteriores) focando no padrão técnico do agachamento e cadeira extensora.',
    version: 1,
    premium: true,
    goal: 'pernas',
    difficulty: 'beginner',
    duration_weeks: 8,
    frequency: 3,
    created_by: 'coach_kyron',
    rating: 4.8,
    featured: false,
    athletes_count: 510,
    completion_rate: 93,
    strength_increase_pct: 14,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'pern_ini_w_a',
        name: 'Treino A • Base de Padrão Motor Inferior',
        description: 'Excelência técnica de agachamentos.',
        exercises: [
          {
            exercise_id: 'ex_pern_ini_1',
            exercise_name: 'Agachamento Goblet com Halter',
            sets: 3,
            reps: '10',
            weight: 16,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 16, rest_time: 90 },
              { reps: '10', weight: 16, rest_time: 90 },
              { reps: '10', weight: 16, rest_time: 90 }
            ]
          },
          {
            exercise_id: 'ex_pern_ini_2',
            exercise_name: 'Cadeira Extensora Unilateral',
            sets: 3,
            reps: '12',
            weight: 20,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão inicial básica.']
      }
    ]
  },
  {
    id: 'pernas-imponentes-intermediario',
    name: 'Pernas Imponentes • Intermediário',
    description: 'Volume tensional superior e foco em separar treinos com ênfase em cadeia anterior (quadríceps) e cadeia posterior (isquios e glúteos).',
    version: 1,
    premium: true,
    goal: 'pernas',
    difficulty: 'intermediate',
    duration_weeks: 10,
    frequency: 4,
    created_by: 'coach_kyron',
    rating: 4.86,
    featured: false,
    athletes_count: 940,
    completion_rate: 88,
    strength_increase_pct: 21,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'pern_int_w_a',
        name: 'Treino A • Ênfase Quadríceps y Adutores',
        description: 'Tensão sob cadeia anterior profunda.',
        exercises: [
          {
            exercise_id: 'ex_pern_int_1',
            exercise_name: 'Agachamento Livre com Barra',
            sets: 4,
            reps: '8-10',
            weight: 50,
            rest_time: 120,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 50, rest_time: 120 },
              { reps: '10', weight: 50, rest_time: 120 },
              { reps: '8', weight: 50, rest_time: 120 },
              { reps: '8', weight: 50, rest_time: 120 }
            ]
          },
          {
            exercise_id: 'ex_pern_int_2',
            exercise_name: 'Cadeira Extensora com Isometria',
            sets: 3,
            reps: '12',
            weight: 35,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 35, rest_time: 60 },
              { reps: '12', weight: 35, rest_time: 60 },
              { reps: '12', weight: 35, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão intermediária.']
      }
    ]
  },
  {
    id: 'pernas-imponentes-avancado',
    name: 'Pernas Imponentes • Avançado',
    description: 'Especialização máxima e volume avassalador de pernas. Dividido em 3 estímulos com técnicas avançadas para quebrar qualquer limite genético.',
    version: 1,
    premium: true,
    goal: 'pernas',
    difficulty: 'advanced',
    duration_weeks: 12,
    frequency: 5,
    created_by: 'coach_kyron',
    rating: 4.93,
    featured: true,
    athletes_count: 620,
    completion_rate: 84,
    strength_increase_pct: 30,
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    updated_by: 'Coach Kyron',
    workouts: [
      {
        id: 'pern_av_w_a',
        name: 'Treino A • Agachamento Pesado & Isquios',
        description: 'Tensão tensional absoluta.',
        exercises: [
          {
            exercise_id: 'ex_pern_av_1',
            exercise_name: 'Agachamento Livre Barra Pesada',
            sets: 4,
            reps: '6-8',
            weight: 80,
            rest_time: 150,
            sort_order: 1,
            sets_json: [
              { reps: '8', weight: 80, rest_time: 150 },
              { reps: '8', weight: 80, rest_time: 150 },
              { reps: '6', weight: 80, rest_time: 150 },
              { reps: '6', weight: 80, rest_time: 150 }
            ]
          },
          {
            exercise_id: 'ex_pern_av_2',
            exercise_name: 'Stiff com Barra e Carga Progressiva',
            sets: 4,
            reps: '8',
            weight: 40,
            rest_time: 90,
            sort_order: 2,
            sets_json: [
              { reps: '8', weight: 40, rest_time: 90 },
              { reps: '8', weight: 40, rest_time: 90 },
              { reps: '8', weight: 40, rest_time: 90 },
              { reps: '8', weight: 40, rest_time: 90 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-15T09:00:00Z',
        updated_by: 'Coach Kyron',
        changes: ['Versão avançada para quebra de limiares genéticos.']
      }
    ]
  }
];

class PremiumProtocolsApi {
  private getLocalProtocols(): PremiumProtocol[] {
    const raw = localStorage.getItem('rubi_premium_protocols');
    const deletedRaw = localStorage.getItem('kyron_deleted_protocol_ids');
    const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    if (!raw) {
      const activeDefaults = INITIAL_PREMIUM_PROTOCOLS.filter(p => !deletedIds.has(p.id));
      localStorage.setItem('rubi_premium_protocols', JSON.stringify(activeDefaults));
      return activeDefaults;
    }
    try {
      const parsed = JSON.parse(raw) as PremiumProtocol[];
      // Sync check - guarantee that any new items in our hardcoded array are written to local storage, excluding deleted ones
      const parsedIds = new Set(parsed.map(p => p.id));
      const missing = INITIAL_PREMIUM_PROTOCOLS.filter(p => !parsedIds.has(p.id) && !deletedIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        const filteredMerged = merged.filter(p => !deletedIds.has(p.id));
        localStorage.setItem('rubi_premium_protocols', JSON.stringify(filteredMerged));
        return filteredMerged;
      }
      const filteredParsed = parsed.filter(p => !deletedIds.has(p.id));
      return filteredParsed;
    } catch {
      return INITIAL_PREMIUM_PROTOCOLS.filter(p => !deletedIds.has(p.id));
    }
  }

  private saveLocalProtocols(protocols: PremiumProtocol[]) {
    localStorage.setItem('rubi_premium_protocols', JSON.stringify(protocols));
  }

  async getProtocols(): Promise<PremiumProtocol[]> {
    const localList = this.getLocalProtocols();
    const deletedRaw = localStorage.getItem('kyron_deleted_protocol_ids');
    const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    try {
      const { data, error } = await supabase.from('premium_protocols').select('*');
      if (!error && data) {
        // If the database has 0 protocols, it means it is completely unseeded/empty.
        // Let's seed it with our INITIAL_PREMIUM_PROTOCOLS!
        if (data.length === 0) {
          console.log('[PremiumProtocolsApi] Seeding empty premium_protocols table...');
          for (const p of INITIAL_PREMIUM_PROTOCOLS) {
            await supabase.from('premium_protocols').upsert(p);
          }
          const { data: reFetched } = await supabase.from('premium_protocols').select('*');
          if (reFetched && reFetched.length > 0) {
            return (reFetched as PremiumProtocol[]).filter(p => !deletedIds.has(p.id));
          }
        } else {
          // Database has entries, so the Database is the SINGLE source of truth!
          // We return the database entries directly, without merging with local defaults.
          // This guarantees that any deleted protocol is permanently gone and never reappears!
          return (data as PremiumProtocol[]).filter(p => !deletedIds.has(p.id));
        }
      }
    } catch (e) {
      console.warn('[PremiumProtocolsApi] DB query failed or table not available. Using local space.', e);
    }
    return localList.filter(p => !deletedIds.has(p.id));
  }

  async getProtocolById(id: string): Promise<PremiumProtocol | null> {
    const list = await this.getProtocols();
    return list.find(p => p.id === id) || null;
  }

  async createOrUpdateProtocol(protocol: PremiumProtocol): Promise<PremiumProtocol> {
    // If we're updating/creating, ensure we remove it from deleted IDs tracking
    const deletedRaw = localStorage.getItem('kyron_deleted_protocol_ids');
    if (deletedRaw) {
      const deletedIds = JSON.parse(deletedRaw) as string[];
      if (deletedIds.includes(protocol.id)) {
        const filtered = deletedIds.filter(id => id !== protocol.id);
        localStorage.setItem('kyron_deleted_protocol_ids', JSON.stringify(filtered));
      }
    }

    try {
      const { data, error } = await supabase.from('premium_protocols').upsert(protocol).select().single();
      if (!error && data) {
        const local = this.getLocalProtocols();
        const index = local.findIndex(p => p.id === protocol.id);
        if (index > -1) local[index] = data as PremiumProtocol;
        else local.push(data as PremiumProtocol);
        this.saveLocalProtocols(local);
        return data as PremiumProtocol;
      }
    } catch {}

    const local = this.getLocalProtocols();
    const index = local.findIndex(p => p.id === protocol.id);
    if (index > -1) {
      local[index] = protocol;
    } else {
      local.push(protocol);
    }
    this.saveLocalProtocols(local);
    return protocol;
  }

  async archiveProtocol(id: string): Promise<boolean> {
    // Track deleted IDs in localStorage to prevent sync check from restoring them
    const deletedRaw = localStorage.getItem('kyron_deleted_protocol_ids');
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) as string[] : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('kyron_deleted_protocol_ids', JSON.stringify(deletedIds));
    }

    try {
      const { error } = await supabase.from('premium_protocols').delete().eq('id', id);
      if (error) {
        console.error('[PremiumProtocolsApi] Error deleting from database:', error);
      } else {
        console.log('[PremiumProtocolsApi] Successfully deleted protocol from database:', id);
      }
    } catch (e) {
      console.error('[PremiumProtocolsApi] Exception deleting from database:', e);
    }
    const local = this.getLocalProtocols();
    const filtered = local.filter(p => p.id !== id);
    this.saveLocalProtocols(filtered);
    return true;
  }

  // Check Subscription State
  isPremiumAthlete(): boolean {
    const premiumStatus = localStorage.getItem('kyron_premium_subscription_active');
    return premiumStatus === 'true';
  }

  setPremiumAthleteStatus(active: boolean) {
    localStorage.setItem('kyron_premium_subscription_active', active ? 'true' : 'false');
  }

  // Clone Premium Protocol into Athlete Private Folder ("Meus Protocolos")
  async cloneToUser(userId: string, protocolId: string): Promise<WorkoutFolder> {
    const protocol = await this.getProtocolById(protocolId);
    if (!protocol) throw new Error('Protocolo Premium não encontrado.');

    // 1. Fetch available exercises to map names to actual UUIDs
    let exerciseMap = new Map<string, string>();
    try {
      const { data } = await supabase.from('exercises').select('id, name');
      if (data) {
        data.forEach(ex => exerciseMap.set(ex.name.toLowerCase().trim(), ex.id));
      }
    } catch {}

    // 2. Create standard folder of user
    const folderName = `${protocol.name}`;
    const newFolder = await workoutApi.createFolder(userId, folderName);

    // 3. For each workout template, create a category and inject exercises
    for (const tw of protocol.workouts) {
      const categoryPayload = {
        user_id: userId,
        folder_id: newFolder.id,
        name: tw.name,
        description: tw.description || ''
      };

      const newCategory = await workoutApi.createCategory(categoryPayload);

      const workoutExercisesPayload = tw.exercises.map((te, idx) => {
        let matchedUuid = exerciseMap.get(te.exercise_name.toLowerCase().trim()) || te.exercise_id;
        
        // Ensure matchedUuid is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(matchedUuid)) {
          const firstDbId = Array.from(exerciseMap.values())[0];
          matchedUuid = firstDbId || '5ce43864-44ac-4822-ba91-30efc477431e';
        }
        
        return {
          category_id: newCategory.id,
          exercise_id: matchedUuid,
          exercise_name_snapshot: te.exercise_name,
          sets: te.sets,
          reps: te.reps,
          weight: te.weight,
          rest_time: te.rest_time,
          sort_order: te.sort_order || (idx + 1),
          sets_json: te.sets_json || []
        };
      });

      if (workoutExercisesPayload.length > 0) {
        await workoutApi.insertWorkoutExercises(workoutExercisesPayload);
      }
    }

    // 4. Record version tracking so updates from template origin also work for cloned premium protocols!
    const systemTemplatesTrackingStoredStr = localStorage.getItem(`rubi_user_template_tracking_${userId}`) || '{}';
    try {
      const tracking = JSON.parse(systemTemplatesTrackingStoredStr);
      tracking[newFolder.id] = { templateId: protocol.id, version: protocol.version };
      localStorage.setItem(`rubi_user_template_tracking_${userId}`, JSON.stringify(tracking));
    } catch {}

    return newFolder;
  }
}

export const premiumProtocolsApi = new PremiumProtocolsApi();
