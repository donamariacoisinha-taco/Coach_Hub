import { Exercise } from '../../types';

export const fallbackExercises: Exercise[] = [
  // PEITO
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896001",
    name: "Supino Reto com Barra",
    muscle_group: "Peito",
    muscle_group_id: "peito",
    type: "free_weight",
    description: "Excelente exercício composto para ganho de força e massa muscular no peitoral.",
    instructions: "Deite-se no banco reto, segure a barra com uma pegada ligeiramente mais larga que os ombros. Desça a barra de forma controlada até o peito e empurre-a de volta para a posição inicial.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896002",
    name: "Supino Inclinado com Halteres",
    muscle_group: "Peito",
    muscle_group_id: "peito",
    type: "free_weight",
    description: "Foca no peitoral superior para uma estética mais preenchida de clavícula.",
    instructions: "Ajuste o banco para 30 ou 45 graus. Segure os halteres na altura do peito e empurre-os verticalmente. Retorne devagar alongando o peito.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896003",
    name: "Crucifixo Reto com Halteres",
    muscle_group: "Peito",
    muscle_group_id: "peito",
    type: "free_weight",
    description: "Isolador clássico para peito que maximiza o alongamento horizontal.",
    instructions: "Deitado no banco reto, braços quase estendidos acima do peito. Abra os braços arqueando os cotovelos de forma controlada até sentir o peito alongar. Retorne comprimindo.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896004",
    name: "Crossover no Cabo",
    muscle_group: "Peito",
    muscle_group_id: "peito",
    type: "cable",
    description: "Tensão contínua em toda a amplitude de movimento para definir o peito.",
    instructions: "Posicione as polias na altura média ou alta. Puxe as alças para a frente e para baixo de forma semicircular, cruzando as mãos levemente no final do movimento.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896005",
    name: "Voador (Pec Deck)",
    muscle_group: "Peito",
    muscle_group_id: "peito",
    type: "machine",
    description: "Excelente máquina isoladora para contração máxima do músculo peitoral externo e interno.",
    instructions: "Sente-se bem apoiado, segure os puxadores. Traga-os à frente fechando os braços, contraindo o peito no centro por 1 segundo.",
    is_active: true,
    difficulty_level: "beginner"
  },

  // COSTAS
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896006",
    name: "Puxada Alta (Pulldown)",
    muscle_group: "Costas",
    muscle_group_id: "costas",
    type: "machine",
    description: "Exercício fundamental para o desenvolvimento da largura das costas (latíssimo do dorso).",
    instructions: "Ajuste o rolo de coxa, segure a barra de forma ampla, puxe em direção ao peitoral superior flexionando os cotovelos para baixo e para trás.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896007",
    name: "Remada Curvada com Barra",
    muscle_group: "Costas",
    muscle_group_id: "costas",
    type: "free_weight",
    description: "Exercício composto focado na densidade e espessura das costas médo-superior.",
    instructions: "Incline o tronco à frente mantendo a coluna ereta. Segure a barra and puxe em direção ao umbigo direcionando os cotovelos para trás.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896008",
    name: "Remada Baixa Sentada no Cabo",
    muscle_group: "Costas",
    muscle_group_id: "costas",
    type: "cable",
    description: "Ótimo para controle e contração com tensão constante nos romboides e trapézio médio.",
    instructions: "Sente-se no apoio, pernas semilevemente flexionadas, puxe o triângulo em direção ao abdômen mantendo o tronco estático e espremendo as escápulas.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896009",
    name: "Barra Fixa (Pull-up)",
    muscle_group: "Costas",
    muscle_group_id: "costas",
    type: "bodyweight",
    description: "O melhor teste de força relativa para o tronco e músculos dorsais profundos.",
    instructions: "Pendure-se na barra, puxe seu corpo para cima até o queixo ultrapassar a barra, sem dar impulsos mecânicos nas pernas.",
    is_active: true,
    difficulty_level: "advanced"
  },

  // OMBROS
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896010",
    name: "Desenvolvimento com Halteres",
    muscle_group: "Ombros",
    muscle_group_id: "ombros",
    type: "free_weight",
    description: "Exercício composto primordial para construir ombros largos e fortes.",
    instructions: "Sente-se no banco apoiado de 90 graus, eleve os halteres verticalmente acima da cabeça até estender quase totalmente os braços.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896011",
    name: "Elevação Lateral com Halteres",
    muscle_group: "Ombros",
    muscle_group_id: "ombros",
    type: "free_weight",
    description: "Focado no deltoide lateral para dar o aspecto de ombros arredondados em V.",
    instructions: "Fique de pé, eleve os halteres lateralmente até a altura dos ombros, mantendo uma leve flexão nos cotovelos e punhos.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896012",
    name: "Elevação Frontal com Halteres",
    muscle_group: "Ombros",
    muscle_group_id: "ombros",
    type: "free_weight",
    description: "Isolador para a porção anterior do deltoide.",
    instructions: "Fique ereto, segure os halteres à frente das coxas, levante alternadamente ou simultaneamente até o nível dos olhos.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896013",
    name: "Crucifixo Invertido com Halteres",
    muscle_group: "Ombros",
    muscle_group_id: "ombros",
    type: "free_weight",
    description: "Foco no deltoide posterior para equilíbrio e saúde articular do ombro.",
    instructions: "Incline-se à frente quase paralelo ao chão, levante os halteres abrindo os braços para os lados mantendo os cotovelos travados.",
    is_active: true,
    difficulty_level: "intermediate"
  },

  // PERNAS
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896014",
    name: "Agachamento Livre com Barra",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "free_weight",
    description: "O rei dos exercícios de perna, recruta quadríceps, glúteos e core de forma totalizadora.",
    instructions: "Barra apoiada no trapézio. Flexione os joelhos e desça jogando o quadril para trás até as coxa passarem da linha paralela com o solo.",
    is_active: true,
    difficulty_level: "advanced"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896015",
    name: "Leg Press 45 Graus",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "machine",
    description: "Concentra grande volume de sobrecarga nos quadríceps e glúteos com coluna estabilizada.",
    instructions: "Apoie os pés na plataforma, destrave a máquina de segurança, desça os joelhos até quase 90 graus de flexão de quadril e empurre.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896016",
    name: "Cadeira Extensora",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "machine",
    description: "Isola os quadríceps de forma primorosa com segurança ideal.",
    instructions: "Sentado, pernas sob o rolo. Estenda totalmente os joelhos para contrair os quadríceps por 1 segundo e desça com controle.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896017",
    name: "Mesa Flexora",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "machine",
    description: "Exercício primordial para musculatura posterior da coxa.",
    instructions: "Deitado no aparelho, dobre as pernas trazendo o apoio sob o calcanhar até contrair os posteriores de coxa e volte estendendo.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896018",
    name: "Stiff com Halteres",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "free_weight",
    description: "Excelente alongamento sob carga para glúteos de aço e isquiotibiais fortes.",
    instructions: "Pés na largura dos quadris, desça os halteres colados à perna empurrando o bumbum bem para trás e mantendo as costas neutras.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896019",
    name: "Elevação de Panturrilha em Pé",
    muscle_group: "Pernas",
    muscle_group_id: "pernas",
    type: "machine",
    description: "Fundamento estético e biológico para panturrilhas densas.",
    instructions: "Suba na ponta do pé até a contração máxima, alongue calcanhar totalmente para baixo retornando na amplitude total.",
    is_active: true,
    difficulty_level: "beginner"
  },

  // BRACOS
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896020",
    name: "Rosca Direta com Barra W",
    muscle_group: "Braços",
    muscle_group_id: "bracos",
    type: "free_weight",
    description: "Exercício fundamental de bíceps com pegada ergonomicamente otimizada pela barra em W.",
    instructions: "Com os cotovelos fixados ao lado do corpo, flexione os braços trazendo a barra em direção ao ombro comprimindo o bíceps.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896021",
    name: "Rosca Martelo com Halteres",
    muscle_group: "Braços",
    muscle_group_id: "bracos",
    type: "free_weight",
    description: "Foco no braquiorradial e braquial para dar volume lateral e espessura ao antebraço.",
    instructions: "Mãos na pegada neutra (palmas voltadas uma para outra). Eleve os halteres de forma alternada sem mexer nos cotovelos.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896022",
    name: "Tríceps Pulley (Corda)",
    muscle_group: "Braços",
    muscle_group_id: "bracos",
    type: "cable",
    description: "Exercício estético e articular primário para construir tríceps definidos.",
    instructions: "Segure cada ponta da corda, puxe para baixo estendendo totalmente os cotovelos e abrindo levemente as pontas da corda na parte final do movimento.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896023",
    name: "Tríceps Testa com Barra W",
    muscle_group: "Braços",
    muscle_group_id: "bracos",
    type: "free_weight",
    description: "Excelência biomecânica para recrutar a cabeça longa do tríceps.",
    instructions: "Deitado no banco, braços levantados. Flexione os cotovelos descendo a barra devagar em direção à testa e empurre estendendo de volta.",
    is_active: true,
    difficulty_level: "intermediate"
  },

  // ABDOMEN
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896024",
    name: "Abdominal Crunch Solo",
    muscle_group: "Abdômen",
    muscle_group_id: "abdomen",
    type: "bodyweight",
    description: "Exercício flexor de coluna seguro para fortalecimento do reto abdominal superior.",
    instructions: "Deitado de costas, pernas flexionadas. Suba flexionando o peito em direção ao quadril levantando apenas as escápulas do chão e retorne.",
    is_active: true,
    difficulty_level: "beginner"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896025",
    name: "Abdominal Infra na Paralela",
    muscle_group: "Abdômen",
    muscle_group_id: "abdomen",
    type: "bodyweight",
    description: "Músculo reto inferior e estabilizador profundo pélvico de alta intensidade.",
    instructions: "Apoie os antebraços nos suportes da paralela. Eleve os joelhos dobrados em direção ao peitoral, sentindo a retroversão de pelve.",
    is_active: true,
    difficulty_level: "intermediate"
  },
  {
    id: "f1b01c1c-99e6-4251-ba84-475253896026",
    name: "Prancha Abdominal Estática",
    muscle_group: "Abdômen",
    muscle_group_id: "abdomen",
    type: "bodyweight",
    description: "O melhor estabilizador estático geral do core profundo e do transverso abdominal.",
    instructions: "Apoie cotovelos e pontas dos pés no solo. Mantenha as costas e quadril eretos, contraindo o abdômen e glúteos vigorosamente.",
    is_active: true,
    difficulty_level: "beginner"
  }
];
