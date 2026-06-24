import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  X, 
  CheckCircle,
  FolderPlus,
  Crown,
  LockKeyhole,
  Zap,
  Dumbbell,
  Flame,
  Shield,
  Edit
} from 'lucide-react';
import { premiumProtocolsApi, PremiumProtocol } from '../../../lib/api/premiumProtocolsApi';
import { authApi } from '../../../lib/api/authApi';
import { UserProfile } from '../../../types';
import { isAdmin } from '../../../lib/utils/auth';

interface PremiumLibraryProps {
  profile: UserProfile | null;
  onRefreshDashboard: () => void;
  onTabChange: (tab: 'protocols' | 'evolution' | 'premium') => void;
  history?: any[];
}

export const PremiumLibraryComponent: React.FC<PremiumLibraryProps> = ({
  profile,
  onRefreshDashboard,
  onTabChange,
  history = []
}) => {
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('premium');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [selectedProtocol, setSelectedProtocol] = useState<PremiumProtocol | null>(null);
  const [showWorkouts, setShowWorkouts] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  
  const featuredRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  // Editing Workout Names states & helpers
  const [isEditingWorkoutId, setIsEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutName, setEditingWorkoutName] = useState<string>('');

  const COLLECTIONS = [
    { id: 'premium', label: '💎 Premium', desc: 'Protocolos exclusivos de elite' },
    { id: 'publico', label: '🔓 Pública', desc: 'Protocolos livres para todos' }
  ];

  const handleSaveWorkoutName = async (workoutId: string) => {
    if (!selectedProtocol) return;
    if (!editingWorkoutName.trim()) return;

    const updatedWorkouts = selectedProtocol.workouts.map(w => 
      w.id === workoutId ? { ...w, name: editingWorkoutName } : w
    );

    const updatedProtocol = {
      ...selectedProtocol,
      workouts: updatedWorkouts
    };

    try {
      await premiumProtocolsApi.createOrUpdateProtocol(updatedProtocol);
      setSelectedProtocol(updatedProtocol);
      setProtocols(prev => prev.map(p => p.id === selectedProtocol.id ? updatedProtocol : p));
      setIsEditingWorkoutId(null);
      setToastMessage("Nome do treino atualizado com sucesso!");
      onRefreshDashboard();
    } catch (e) {
      console.error("Erro ao atualizar nome do treino:", e);
      setToastMessage("Ocorreu um erro ao atualizar.");
    }
  };

  // Load state on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reset showWorkouts on protocol change
  useEffect(() => {
    setShowWorkouts(false);
  }, [selectedProtocol]);

  const loadData = async () => {
    const list = await premiumProtocolsApi.getProtocols();
    setProtocols(list.filter(p => p.is_active !== false));
    setIsPremium(premiumProtocolsApi.isPremiumAthlete());
  };

  const togglePremiumSimulation = () => {
    const nextState = !isPremium;
    setIsPremium(nextState);
    premiumProtocolsApi.setPremiumAthleteStatus(nextState);
    setToastMessage(
      nextState 
        ? "Assinatura PREMIUM Simulada! Todos os protocolos de elite estão desbloqueados."
        : "Conta alterada para FREE. Alguns programas agora exigem assinatura."
    );
  };

  const handleSubscribeNow = () => {
    premiumProtocolsApi.setPremiumAthleteStatus(true);
    setIsPremium(true);
    setShowCheckoutModal(false);
    setToastMessage("Parabéns! Sua assinatura do Kyron Pass foi ativada. Desbloqueio total concedido!");
  };

  const handleCloneProtocol = async (p: PremiumProtocol) => {
    if (!isPremium && p.premium) {
      setShowCheckoutModal(true);
      return;
    }

    setLoadingAction(p.id);
    try {
      const u = await authApi.getUser();
      if (!u) {
        setToastMessage("Faça login para adicionar este protocolo.");
        return;
      }

      await premiumProtocolsApi.cloneToUser(u.id, p.id);
      
      setToastMessage(`Adicionado! "${p.name}" foi clonado com sucesso para os seus protocolos privados.`);
      onRefreshDashboard();
      
      // Luxurious transition
      setTimeout(() => {
        onTabChange('protocols');
      }, 1500);

    } catch (e) {
      console.error(e);
      setToastMessage("Erro ao clonar o protocolo. Tente novamente.");
    } finally {
      setLoadingAction(null);
      setSelectedProtocol(null);
    }
  };

  const getPrimaryGoalSentence = (p: PremiumProtocol) => {
    const id = p.id.toLowerCase();
    const name = p.name.toLowerCase();
    const goal = p.goal.toLowerCase();

    if (goal === 'peitoral' || name.includes('peitoral')) {
      return 'Aceleração hipertrófica focada na expansão do peitoral superior, médio e inferior.';
    }
    if (goal === 'costas' || name.includes('costas')) {
      return 'Otimização biomecânica para largura dorsal em V e remadas densas.';
    }
    if (goal === 'ombros' || name.includes('ombros')) {
      return 'Desenvolvimento tridimensional do deltoide lateral, posterior e anterior.';
    }
    if (goal === 'bracos' || name.includes('braço') || name.includes('braços')) {
      return 'Especialização em bíceps e tríceps com roscas, extensões e isolamento biomecânico.';
    }
    if (goal === 'pernas' || name.includes('pernas')) {
      return 'Construção tensional de membros inferiores (quadríceps, posteriores e glúteos).';
    }
    if (name.includes('força') || goal.includes('strength')) {
      return 'Desenvolvimento de força e sobrecarga progressiva.';
    }
    if (name.includes('hipertrofia') || goal.includes('hypertrophy')) {
      return 'Volume muscular estruturado e ganho estético de massa magra.';
    }
    if (name.includes('glúteos') || goal.includes('glutes') || name.includes('glute')) {
      return 'Modelação de glúteos e cadeia posterior isolada.';
    }
    if (name.includes('lotada') || id.includes('academia-lotada')) {
      return 'Treino ágil e eficiente para horários de alto fluxo.';
    }
    if (name.includes('emagrecimento') || goal.includes('weight_loss')) {
      return 'Densidade metabólica elevada e oxidação de gordura.';
    }
    return 'Otimização de performance tensional e metabólica.';
  };

  const getPremiumDetails = (p: PremiumProtocol) => {
    const goalLower = p.goal.toLowerCase();
    const nameLower = p.name.toLowerCase();
    const idLower = p.id.toLowerCase();
    
    let objetivo = "";
    let indicadoPara = "";
    let resultadoEsperado = "";
    let premiumIntroDesc = "";
    let isSpecialization = false;
    let priorityMuscleName = "";
    let priorityMusclePercentage = 0;
    let distributionData: { label: string; sets: string; percentage: number }[] = [];
    let evolutionList: string[] = [];
    let rulesList: string[] = [];
    let successMetrics: string[] = [];

    if (goalLower === 'peitoral' || nameLower.includes('peitoral') || idLower.includes('peitoral')) {
      isSpecialization = true;
      priorityMuscleName = "Peitoral";
      priorityMusclePercentage = 45;
      objetivo = "Prioridade máxima para desenvolvimento de peitoral.";
      indicadoPara = "Atletas buscando focar em peitoral superior e volume total do tórax através de otimizações biomecânicas de exercícios de empurrar.";
      resultadoEsperado = `Evolução tensional expressiva de reps e até ${p.strength_increase_pct || 25}% de ganho de força acumulado no supino inclinado.`;
      premiumIntroDesc = "Protocolo biomecanicamente calibrado no qual o estímulo peitoral superior é prioritário e as séries semanais chegam a 22.";
      distributionData = [
        { label: 'Peito', sets: '18-22 séries', percentage: 45 },
        { label: 'Costas', sets: '8 séries', percentage: 17 },
        { label: 'Ombros', sets: '6 séries', percentage: 12 },
        { label: 'Braços', sets: '6 séries', percentage: 12 },
        { label: 'Pernas', sets: '8 séries', percentage: 14 }
      ];
      evolutionList = [
        'Mais volume de peito',
        'Mais força no supino',
        'Maior frequência de estímulo de empurradores'
      ];
      rulesList = [
        'O treino sempre começa por peito para aproveitar o máximo estoque de glicogênio e energia neuromuscular',
        'O primeiro exercício do dia deve ser um movimento prioritário para peitoral (Ex: Supino Inclinado Máquina, Supino Inclinado Halteres, Chest Press)',
        'Volume planejado de alta intensidade: 18 a 22 séries semanais'
      ];
      successMetrics = [
        'Progredir carga/reps sob controle seguro no Supino Inclinado (Halteres ou Máquina)',
        'Progredir carga/reps focando no torque no Supino Reto (Barra ou Halteres)',
        'Melhorar amplitude e controle no pico de contração no Crucifixo (Cabo ou Halteres)'
      ];
    } else if (goalLower === 'costas' || nameLower.includes('costas') || idLower.includes('costas')) {
      isSpecialization = true;
      priorityMuscleName = "Costas";
      priorityMusclePercentage = 45;
      objetivo = "Prioridade máxima para desenvolvimento de costas (largura dorsal).";
      indicadoPara = "Focado na expansão e espessamento do latíssimo do dorso para o desenvolvimento da linha física em V e densidade escapular.";
      resultadoEsperado = `Evolução técnica consistente em trações, e ganho de até ${p.strength_increase_pct || 26}% de força nas puxadas altas.`;
      premiumIntroDesc = "Trabalho estratégico com volume concentrado em vetores verticais de tração para proporcionar largura dorsal acentuada.";
      distributionData = [
        { label: 'Costas', sets: '18-22 séries', percentage: 45 },
        { label: 'Peito', sets: '8 séries', percentage: 17 },
        { label: 'Braços', sets: '8 séries', percentage: 17 },
        { label: 'Pernas', sets: '8 séries', percentage: 17 },
        { label: 'Ombros', sets: '6 séries', percentage: 12 }
      ];
      evolutionList = [
        'Maior largura dorsal (formato em V-Shape)',
        'Consolidação de força na Puxada Frente e Pulldown',
        'Controle escapular preciso e melhora postural imediata'
      ];
      rulesList = [
        'Priorizar puxadas verticais de alto foco antes das remadas tradicionais',
        'Mais exercícios verticais integrados na rotina semanal',
        'Volume planejado: 18 a 22 séries exclusivas de costas'
      ];
      successMetrics = [
        'Aproveitamento de carga na Puxada Frente com estabilidade escapular',
        'Execução técnica e flexora do Pulldown com amplitude máxima',
        'Estabilidade sob controle de peso corporal na Barra Assistida / Barra Fixa'
      ];
    } else if (goalLower === 'ombros' || nameLower.includes('ombros') || nameLower.includes('deltoide') || idLower.includes('ombros')) {
      isSpecialization = true;
      priorityMuscleName = "Ombros";
      priorityMusclePercentage = 45;
      objetivo = "Prioridade máxima para desenvolvimento de deltoides (lateral e posterior).";
      indicadoPara = "Dedicado a lapidar a musculatura dos deltoide de forma tridimensional para expandir a largura visual superior.";
      resultadoEsperado = `Aumento expressivo da estabilidade articular e fibras de deltoides densos em todos os feixes anatômicos.`;
      premiumIntroDesc = "Aceleração hipertrófica de ombros 3D, priorizando o estresse tensional e metabólico seletivo nos deltoides lateral e posterior.";
      distributionData = [
        { label: 'Ombros', sets: '18-20 séries', percentage: 45 },
        { label: 'Peito', sets: '8 séries', percentage: 17 },
        { label: 'Costas', sets: '8 séries', percentage: 17 },
        { label: 'Pernas', sets: '8 séries', percentage: 17 },
        { label: 'Braços', sets: '6 séries', percentage: 12 }
      ];
      evolutionList = [
        'Ombros largos e preenchidos no plano anatômico (V-taper)',
        'Isolamento tensional sem compensação do trapézio nas elevações',
        'Preenchimento proporcional da linha clavicular anterior e posterior'
      ];
      rulesList = [
        'Todo treino superior inicia obrigatoriamente pelo estímulo e foco em deltoides',
        'Prioridade máxima de volume dada a elevação lateral e crucifixo inverso',
        'Volume planejado de alta densidade metabólica: 18 a 20 séries de deltoide'
      ];
      successMetrics = [
        'Maior peso e controle de descida na Elevação Lateral',
        'Isolamento e controle excêntrico refinado no Crucifixo Inverso',
        'Estabilidade de empurrar vertical e amplitude no Desenvolvimento de Ombros'
      ];
    } else if (goalLower === 'bracos' || nameLower.includes('braço') || nameLower.includes('braços') || idLower.includes('bracos')) {
      isSpecialization = true;
      priorityMuscleName = "Braços";
      priorityMusclePercentage = 45;
      objetivo = "Prioridade máxima para desenvolvimento de braços (bíceps e tríceps).";
      indicadoPara = "Indicado para aceleração da hipertrofia seletiva de bíceps e tríceps com trabalho de alto volume e pump celular.";
      resultadoEsperado = `Ganho de largura e volume muscular visível com melhora do contorno e força nas articulações.`;
      premiumIntroDesc = "Maximização de estímulo através de séries conjugadas de antagonistas, trabalhando bíceps e tríceps com pico de contração.";
      distributionData = [
        { label: 'Braços', sets: '18-22 séries', percentage: 45 },
        { label: 'Pernas', sets: '8 séries', percentage: 18 },
        { label: 'Peito', sets: '6 séries', percentage: 12 },
        { label: 'Costas', sets: '6 séries', percentage: 12 },
        { label: 'Ombros', sets: '6 séries', percentage: 12 }
      ];
      evolutionList = [
        'Hipertrofia seletiva e preenchimento de bíceps e tríceps',
        'Aperfeiçoamento de torque nas roscas e extensões sem roubos',
        'Ganho de vasodilatação periférica e volume sarcoplasmático'
      ];
      rulesList = [
        'Volume extremamente concentrado e elevado em flexores e extensores de cotovelo',
        'Inserir braços no início do treino para aproveitar o maior recurso energético',
        'Integração inteligente de super-séries para manter o bombeamento sanguíneo'
      ];
      successMetrics = [
        'Progressão confortável de carga com ótima postura na Rosca Direta',
        'Amplitude sob contração estrita e controle de tempo na Rosca Martelo',
        'Aumento saudável de peso no Tríceps Corda mantendo cotovelos estáticos'
      ];
    } else if (goalLower === 'pernas' || nameLower.includes('pernas') || idLower.includes('pernas')) {
      isSpecialization = true;
      priorityMuscleName = "Membros Inferiores";
      priorityMusclePercentage = 45;
      objetivo = "Prioridade máxima para desenvolvimento de pernas (quadríceps e glúteos).";
      indicadoPara = "Dedicado a criar coxas e glúteos fortes, densos e visualmente dominantes com excelente ativação.";
      resultadoEsperado = `Aprimoramento motor de torque nos joelhos e quadril, e aumento de até ${p.strength_increase_pct || 30}% no agachamento corporal.`;
      premiumIntroDesc = "Treinos potentes integrando agachamentos pesados, leg press e isoladores em divisões semanais precisas.";
      distributionData = [
        { label: 'Pernas', sets: '20-22 séries', percentage: 45 },
        { label: 'Peito', sets: '6 séries', percentage: 14 },
        { label: 'Costas', sets: '6 séries', percentage: 14 },
        { label: 'Ombros', sets: '6 séries', percentage: 14 },
        { label: 'Braços', sets: '6 séries', percentage: 14 }
      ];
      evolutionList = [
        'Densidade muscular profunda de quadríceps, isquiotibiais e glúteos',
        'Sobrecarga progressiva no Agachamento Livre e Leg Press de alta amplitude',
        'Resistência à fadiga e estabilização articular contra lesões'
      ];
      rulesList = [
        'Dois estímulos de média/alta intensidade semanais obrigatórios e bem planejados',
        'Ordenação tensional excelente de exercícios isoladores para multiarticulares',
        'Volume expressivo planejado: 20 a 22 séries semanais'
      ];
      successMetrics = [
        'Progressão constante de carga/repetições no Leg Press 45º',
        'Profundidade biomecânica ótima com estabilidade de core no Agachamento Livre',
        'Capacidade de vencer pontos de estagnação e isometria na Cadeira Extensora'
      ];
    } else if (nameLower.includes('hipertrofia') || goalLower.includes('hypertrophy')) {
      objetivo = "Desenvolvimento de massa muscular magra, densidade física e estímulo tensional.";
      indicadoPara = "Atletas buscando ganho de volume muscular tensional e melhora do tônus corporal global.";
      resultadoEsperado = `Hipertrofia miofibrilar progressiva e ganho de força de até ${p.strength_increase_pct || 18}%.`;
      premiumIntroDesc = "Maximize o estímulo de fibras de contração rápida com metodologia focada em tensão mecânica e sobrecarga progressiva estruturada.";
    } else if (nameLower.includes('força') || goalLower.includes('strength') || nameLower.includes('powerbuilding')) {
      objetivo = "Desenvolvimento de força máxima, potência neuromuscular e eficiência biomecânica.";
      indicadoPara = "Atletas focados em erguer cargas maiores, sair da estagnação e blindar articulações.";
      resultadoEsperado = `Incremento expressivo de força máxima de até ${p.strength_increase_pct || 25}% nos exercícios multiarticulares de base.`;
      premiumIntroDesc = "Desenvolva força de maneira consistente através de um sistema estruturado de progressão de carga, aprimoramento técnico e evolução gradual do desempenho.";
    } else if (nameLower.includes('emagrecimento') || goalLower.includes('weight_loss')) {
      objetivo = "Aceleração metabólica, queima de gordura sob preservação de massa magra.";
      indicadoPara = "Indivíduos com foco em perda de gordura corporal de alta qualidade e definição estética.";
      resultadoEsperado = "Redução do percentual de gordura corporal, manutenção biológica e melhora da performance condicional.";
      premiumIntroDesc = "Acelere a oxidação de lipídios de maneira eficiente combinando treinos de alta densidade metabólica e preservação seletiva de massa magra.";
    } else {
      objetivo = "Otimização de capacidades físicas, resistência muscular localizada e biomecânica avançada.";
      indicadoPara = "Atletas em busca de performance atlética máxima, simetria muscular e melhora no rendimento físico de alto nível.";
      resultadoEsperado = "Aumento do limiar de fadiga e eficiência postural em todos os planos anatômicos de movimento.";
      premiumIntroDesc = "Eleve sua capacidade operacional física a níveis superiores com ajustes biomecânicos finos que previnem desgastes e potencializam suas valências físicas.";
    }

    return { 
      objetivo, 
      indicadoPara, 
      resultadoEsperado, 
      premiumIntroDesc,
      isSpecialization,
      priorityMuscleName,
      priorityMusclePercentage,
      distributionData,
      evolutionList,
      rulesList,
      successMetrics
    };
  };

  const getCreatorLabel = (by: string) => {
    switch (by) {
      case 'rubi_ai':
        return 'KYRON OS Engine';
      case 'coach_kyron':
        return 'Kyron Elite';
      case 'admin':
        return 'Equipe Médica';
      default:
        return 'Personal Certificado';
    }
  };

  const getCoverDetails = (goal: string) => {
    switch (goal?.toLowerCase()) {
      case 'peitoral':
        return {
          gradient: 'from-[#31102F] via-[#4A154B] to-[#E01E5A]',
          label: 'CHEST // FOCUS',
          textOpacity: 'opacity-[0.08]'
        };
      case 'costas':
        return {
          gradient: 'from-[#112F30] via-[#1F4E4F] to-[#0D9488]',
          label: 'BACK // DENSITY',
          textOpacity: 'opacity-[0.08]'
        };
      case 'ombros':
        return {
          gradient: 'from-[#201A15] via-[#3E2723] to-[#D84315]',
          label: 'DELT // 3D',
          textOpacity: 'opacity-[0.08]'
        };
      case 'bracos':
        return {
          gradient: 'from-[#1A1C30] via-[#2F325A] to-[#6366F1]',
          label: 'ARMS // STEEL',
          textOpacity: 'opacity-[0.08]'
        };
      case 'pernas':
        return {
          gradient: 'from-[#1B311E] via-[#2D5A27] to-[#16A34A]',
          label: 'LEGS // POWER',
          textOpacity: 'opacity-[0.08]'
        };
      case 'strength':
      case 'força':
        return {
          gradient: 'from-[#0B1528] via-[#102A4E] to-[#1E3A8A]',
          label: 'STRENGTH // BASE',
          textOpacity: 'opacity-[0.08]'
        };
      case 'hypertrophy':
      case 'hipertrofia':
        return {
          gradient: 'from-[#17123A] via-[#1E1B4B] to-[#4F46E5]',
          label: 'HYPERTROPHY // VOLUME',
          textOpacity: 'opacity-[0.08]'
        };
      case 'weight_loss':
      case 'emagrecimento':
        return {
          gradient: 'from-[#022C22] via-[#064E3B] to-[#10B981]',
          label: 'METABOLIC // BURN',
          textOpacity: 'opacity-[0.08]'
        };
      case 'performance':
      default:
        return {
          gradient: 'from-[#220B3B] via-[#311055] to-[#7C3AED]',
          label: 'PERFORMANCE // CORE',
          textOpacity: 'opacity-[0.08]'
        };
    }
  };

  const filterProtocols = (list: PremiumProtocol[]) => {
    if (selectedCollection === 'premium') return list.filter(p => p.premium === true);
    if (selectedCollection === 'publico') return list.filter(p => p.premium === false);
    return list;
  };

  const filteredCollectionList = filterProtocols(protocols);

  const totalWorkouts = history ? history.length : 0;
  const userLevel = totalWorkouts < 10 ? 'beginner' : totalWorkouts < 40 ? 'intermediate' : 'advanced';

  const renderProtocolCard = (p: PremiumProtocol) => {
    const primaryGoal = getPrimaryGoalSentence(p);
    const cover = getCoverDetails(p.goal);
    const isSuggested = (p.id.includes('peitoral-respeito') || 
                         p.id.includes('costas-largas') || 
                         p.id.includes('ombros-3d') || 
                         p.id.includes('bracos-aco') || 
                         p.id.includes('pernas-imponentes')) && p.difficulty === userLevel;

    return (
      <motion.div
        key={p.id}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedProtocol(p)}
        className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgba(15,23,42,0.02)] cursor-pointer flex flex-col overflow-hidden group hover:border-[#7BA7FF]/30 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all duration-300 text-left"
      >
        {/* Cover */}
        <div className={`relative w-full h-[145px] overflow-hidden bg-slate-950 flex-shrink-0 bg-gradient-to-br ${cover.gradient}`}>
          <div className="absolute top-[20%] right-[-10%] w-24 h-24 rounded-full blur-[45px] bg-[#7BA7FF]/40 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-16 h-16 rounded-full blur-[30px] bg-white/10 pointer-events-none" />
          
          <div className={`absolute bottom-3 left-4 text-3xl font-[1000] italic tracking-tighter text-white select-none pointer-events-none ${cover.textOpacity} uppercase`}>
            {cover.label}
          </div>

          {/* Suggested Badge top left */}
          {isSuggested && (
            <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm border border-amber-400/30">
              ★ Sugerido Rubi OS
            </div>
          )}

          {p.premium && (
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full flex items-center justify-center">
              <Crown size={9} className="text-[#7BA7FF]" />
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-5 flex flex-col flex-grow justify-between min-h-[140px] bg-gradient-to-b from-white to-slate-50/20">
          <div className="space-y-2">
            <h3 className="text-base font-black uppercase text-slate-900 tracking-tight group-hover:text-[#7BA7FF] transition-colors leading-tight line-clamp-1">
              {p.name}
            </h3>
            
            <p className="text-xs font-black text-[#7BA7FF] tracking-wider uppercase leading-none">
              {p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'intermediate' ? 'Intermediário' : 'Iniciante'} • {p.duration_weeks} Semanas
            </p>
            
            <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2 mt-1">
              {primaryGoal}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      className="font-sans text-[#0F172A] bg-[#F8FAFC] min-h-screen relative overflow-hidden pb-20 w-full min-w-0 max-w-none"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' 
      }}
    >
      {/* Editorial Glowing Ambiance */}
      <div className="absolute -top-40 -left-40 w-full max-w-[600px] h-full max-h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40 bg-gradient-to-tr from-[#7BA7FF]/30 to-[#818CF8]/10" />
      <div className="absolute top-[40%] -right-40 w-full max-w-[500px] h-full max-h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30 bg-gradient-to-tr from-[#818CF8]/20 to-[#34D399]/10" />

      {/* HEADER SECTION (Simplified - No secondary counters/noise) */}
      <div className="w-full min-w-0 max-w-none pt-4 pb-4 px-5 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-slate-100/60 mb-6 bg-white/30 backdrop-blur-md">
        <div className="space-y-1 text-left w-full md:max-w-xl">
          <span className="text-[9px] font-black tracking-[0.25em] text-[#7BA7FF] uppercase">Kyron Elite Club</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-none">
            Biblioteca Premium
          </h1>
        </div>

        {/* Elegant Minimalist Sandbox Toggle */}
        <div className="flex items-center gap-3 bg-white/60 p-1.5 px-3 rounded-2xl border border-white/80 shadow-xs w-full md:w-auto self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-[#7BA7FF] animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF]">Acesso</span>
          </div>
          <button 
            type="button"
            onClick={togglePremiumSimulation}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
              isPremium 
                ? 'bg-[#7BA7FF]/10 border-[#7BA7FF]/20 text-[#7BA7FF] hover:bg-[#7BA7FF]/15' 
                : 'bg-slate-200/50 border-slate-300/40 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isPremium ? "Premium Ativo" : "Simular Premium"}
          </button>
        </div>
      </div>

      {/* TWO TABS SEGMENT SELECTOR */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 mb-8 relative z-10 text-left">
        <div className="flex gap-6 border-b border-slate-100 pb-px">
          {COLLECTIONS.map((c) => {
            const isActive = selectedCollection === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`pb-4 px-2 font-black text-xs sm:text-sm uppercase tracking-wider relative transition-all duration-300 cursor-pointer select-none ${
                  isActive 
                    ? 'text-slate-900' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{c.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7BA7FF]" 
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 font-normal mt-3">
          {COLLECTIONS.find(c => c.id === selectedCollection)?.desc}
        </p>
      </div>

      {/* PROTOCOL GRID */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 relative z-10 text-left">
        {filteredCollectionList.length === 0 ? (
          <div className="p-14 text-center bg-white/60 border border-slate-150 rounded-3xl text-slate-450 font-semibold text-xs uppercase tracking-wider">
            Nenhum programa disponível nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
            {filteredCollectionList.map((p) => renderProtocolCard(p))}
          </div>
        )}
      </div>

      {/* Program Details Modal / Drawer (Fulfill Rules 4, 5, 7) */}
      <AnimatePresence>
        {selectedProtocol && (
          <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedProtocol(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-lg" 
            />

            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "150%", opacity: 0 }} 
              transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
              className="w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-9 shadow-[0_24px_50px_rgba(15,23,42,0.15)] relative z-10 border border-slate-150 max-h-[85vh] overflow-y-auto text-left text-slate-800"
            >
              {/* Close target >= 44px */}
              <button 
                type="button"
                onClick={() => setSelectedProtocol(null)}
                className="absolute top-5 right-5 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-150/45 flex items-center justify-center text-slate-500 hover:text-slate-850 transition cursor-pointer z-20"
              >
                <X size={16} />
              </button>

              {(() => {
                const details = getPremiumDetails(selectedProtocol);
                return (
                  <>
                    {/* 7. PREMIUM INTRODUCTION SECTION */}
                    <div className="space-y-4 pt-4 text-left">
                      <span className="text-[9px] font-black tracking-[0.2em] text-[#7BA7FF] uppercase">Treino Personalizado</span>
                      <h2 className="text-2xl sm:text-3xl font-[1000] text-slate-900 uppercase tracking-tight">
                        {selectedProtocol.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                        {details.premiumIntroDesc}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 font-medium bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider mb-1">Ideal Para</span>
                        {details.indicadoPara}
                      </p>
                    </div>

                    {details.isSpecialization ? (
                      /* ESPECIALIZAÇÃO MUSCULAR 2.0 ADVANCED PORTAL CONTENT */
                      <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-slate-950 text-white text-left space-y-6 relative overflow-hidden border border-slate-800">
                        {/* Ambient gradient */}
                        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-[#7BA7FF]/10 blur-[45px] pointer-events-none" />

                        {/* Top indicator badge */}
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="bg-amber-500/15 text-amber-500 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border border-amber-500/25">
                            ★ ESPECIALIZAÇÃO MUSCULAR 2.0
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">KYRON OS ADAPTIVE</span>
                        </div>

                        {/* 1. Objetivo Section */}
                        <div className="space-y-1.5 relative z-10">
                          <span className="text-[9.5px] font-mono font-bold text-[#7BA7FF] uppercase tracking-[0.15em] block">Objetivo</span>
                          <p className="text-sm sm:text-base text-white font-[950] tracking-tight uppercase leading-snug">
                            {details.objetivo}
                          </p>
                        </div>

                        {/* 2. Músculo Prioritário Visual Progress Ring / Bars */}
                        <div className="space-y-4 pt-1 relative z-10">
                          <div className="flex justify-between items-end">
                            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-[0.15em]">MÚSCULO PRIORITÁRIO</span>
                            <span className="text-[10px] font-black text-[#7BA7FF] font-mono uppercase">{details.priorityMuscleName} (45%) vs Demais Grupos (55%)</span>
                          </div>

                          <div className="space-y-2.5">
                            {/* Bar Indicator */}
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-gradient-to-r from-[#7BA7FF] to-indigo-500 rounded-l-full" 
                                style={{ width: `${details.priorityMusclePercentage}%` }} 
                              />
                              <div 
                                className="h-full bg-slate-700" 
                                style={{ width: `${100 - (details.priorityMusclePercentage || 45)}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-350">
                              <span className="flex items-center gap-1.5 font-extrabold text-white">
                                <span className="w-2 h-2 rounded-full bg-[#7BA7FF]" />
                                {details.priorityMuscleName} ({details.priorityMusclePercentage}%)
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-slate-600" />
                                Outros Grupos (55%)
                              </span>
                            </div>
                          </div>

                          {/* Mini distribution panel */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1.5">
                            {details.distributionData?.map((item, idx) => (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-2xl text-center flex flex-col justify-between border ${
                                  idx === 0 
                                    ? 'bg-[#7BA7FF]/10 border-[#7BA7FF]/35 text-white' 
                                    : 'bg-slate-900/60 border-slate-800/80 text-slate-450'
                                }`}
                              >
                                <span className={`text-[8px] font-black uppercase tracking-wider ${
                                  idx === 0 ? 'text-[#7BA7FF]' : 'text-slate-500'
                                } truncate`}>{item.label}</span>
                                <span className="text-xs font-black mt-1 leading-none">{item.sets.split(' ')[0]}</span>
                                <span className={`text-[9px] font-black font-mono mt-0.5 ${
                                  idx === 0 ? 'text-[#7BA7FF]' : 'text-slate-500'
                                }`}>{item.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. Regras de Prioridade Muscular */}
                        <div className="space-y-3 bg-slate-900/40 border border-slate-800/80 p-4 sm:p-5 rounded-2xl relative z-10">
                          <span className="text-[9.5px] font-mono font-bold text-[#7BA7FF] uppercase tracking-[0.15em] block">Regras de Prioridade Muscular</span>
                          <ul className="space-y-3 list-none">
                            {details.rulesList?.map((rule, idx) => (
                              <li key={idx} className="flex gap-3 items-start text-xs text-slate-350 font-normal leading-relaxed">
                                <span className="bg-[#7BA7FF]/15 text-[#7BA7FF] text-[10px] w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-bold font-mono">
                                  0{idx + 1}
                                </span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 4. O Que Você Vai Evoluir checklist */}
                        <div className="space-y-3 relative z-10">
                          <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-[0.15em] block">O Que Você Vai Evoluir</span>
                          <div className="grid grid-cols-1 gap-2">
                            {details.evolutionList?.map((evo, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl text-xs font-bold text-emerald-400">
                                <span className="text-emerald-400 text-sm font-black shrink-0">✓</span>
                                <span>{evo}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 5. Métricas de Sucesso */}
                        <div className="space-y-3 bg-gradient-to-br from-amber-500/5 to-amber-600/5 border border-amber-500/20 p-4 sm:p-5 rounded-2xl relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-mono font-bold text-amber-400 uppercase tracking-[0.15em]">MÉTRICAS DE SUCESSO</span>
                            <span className="text-[8px] font-black text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md tracking-wider">PROGRESSÃO</span>
                          </div>
                          <ul className="space-y-2.5 list-none">
                            {details.successMetrics?.map((met, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start text-xs text-amber-250/95 font-bold leading-relaxed">
                                <span className="text-amber-500 text-sm shrink-0 mt-0.5">📈</span>
                                <span>{met}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      /* Standard premium details fallback block for normal protocols */
                      <div className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                        {/* 2. Objetivo */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] block">Objetivo</span>
                          <p className="text-sm text-slate-800 font-extrabold">{details.objetivo}</p>
                        </div>

                        {/* 3. Frequência Semanal */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] block">Frequência Semanal</span>
                          <p className="text-sm text-slate-800 font-bold">{selectedProtocol.frequency} treinos por semana</p>
                        </div>

                        {/* 4. Duração */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] block">Duração</span>
                          <p className="text-sm text-slate-800 font-bold">{selectedProtocol.duration_weeks} semanas</p>
                        </div>

                        {/* 5. Resultado Esperado */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-[0.15em] block">Resultado Esperado</span>
                          <p className="text-sm text-slate-900 font-black">{details.resultadoEsperado}</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* CURIOSITY DISCLOSURE BUTTON FOR WORKOUTS */}
              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkouts(!showWorkouts)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7BA7FF] hover:text-[#818CF8]"
                >
                  {showWorkouts ? 'Ocultar Estrutura de Treinos' : 'Ver Estruturação de Treinos'} 
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showWorkouts ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Workouts structure shown only when expanded */}
              <AnimatePresence>
                {showWorkouts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-4 space-y-4"
                  >
                    <div className="relative pl-5 space-y-6 border-l border-slate-100 ml-1.5 mt-2">
                      {selectedProtocol.workouts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">Nenhum treino cadastrado neste programa.</div>
                      ) : (
                        selectedProtocol.workouts.map((w) => (
                          <div key={w.id} className="relative space-y-3 text-left">
                            <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#7BA7FF]" />
                            <div>
                              {isEditingWorkoutId === w.id ? (
                                <div className="flex items-center gap-2 mb-1.5">
                                  <input
                                    type="text"
                                    value={editingWorkoutName}
                                    onChange={(e) => setEditingWorkoutName(e.target.value)}
                                    className="bg-white border border-[#7BA7FF] rounded-xl px-2 py-1 text-xs text-slate-800 font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-[#7BA7FF]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveWorkoutName(w.id);
                                      if (e.key === 'Escape') setIsEditingWorkoutId(null);
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveWorkoutName(w.id)}
                                    className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg shrink-0"
                                    title="Salvar"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setIsEditingWorkoutId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg shrink-0"
                                    title="Cancelar"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group/title">
                                  <h5 className="text-sm font-extrabold uppercase text-slate-800 tracking-tight leading-none">{w.name}</h5>
                                  {isAdmin(profile) && (
                                    <button
                                      onClick={() => {
                                        setIsEditingWorkoutId(w.id);
                                        setEditingWorkoutName(w.name);
                                      }}
                                      className="opacity-0 group-hover/title:opacity-100 p-0.5 text-[#7BA7FF] hover:text-[#7BA7FF]/85 transition-opacity hover:scale-105"
                                      title="Editar Nome do Treino"
                                    >
                                      <Edit size={10} />
                                    </button>
                                  )}
                                </div>
                              )}
                              {w.description && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{w.description}</p>}
                            </div>

                            <div className="bg-[#F8FAFC]/75 border border-slate-100 rounded-2xl p-4 space-y-2 mt-1">
                              {w.exercises?.map((ex, exIdx) => (
                                <div key={exIdx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-150 last:border-0 last:pb-0 gap-1.5">
                                  <span className="font-bold text-slate-700 uppercase tracking-tight truncate flex-1">{ex.exercise_name}</span>
                                  <span className="text-[10.5px] font-bold text-[#64748B] shrink-0">
                                    {ex.sets}s × {ex.reps} reps
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Premium Lock Experience & Custom Clone Action */}
              <div className="flex flex-col gap-3 pt-8 border-t border-slate-100 mt-8">
                {selectedProtocol.premium && !isPremium ? (
                  <div className="bg-[#F8FAFC] border border-slate-150 rounded-3xl p-6 text-center space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-[#7BA7FF]/10 border border-[#7BA7FF]/20 flex items-center justify-center text-[#7BA7FF]">
                        <LockKeyhole size={18} />
                      </div>
                      <h5 className="text-sm font-black uppercase text-slate-800 tracking-tight">Assinatura Exigida</h5>
                      <p className="text-xs text-slate-500 leading-normal max-w-sm">
                        Desbloqueie todos os protocolos de alta performance tornando-se membro do Kyron Club.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProtocol(null);
                        setShowCheckoutModal(true);
                      }}
                      className="btn-primary w-full shadow-md py-4 text-xs font-black uppercase tracking-[0.2em]"
                    >
                      Tornar-se Premium
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={loadingAction === selectedProtocol.id}
                    onClick={() => handleCloneProtocol(selectedProtocol)}
                    className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 font-bold"
                  >
                    {loadingAction === selectedProtocol.id ? (
                      <span className="text-white/60 animate-pulse">Sincronizando Metodologia...</span>
                    ) : (
                      <>
                        <FolderPlus size={14} className="shrink-0" /> <span className="truncate">Adicionar aos Meus Protocolos</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProtocol(null)}
                  className="btn-text w-full py-2 hover:opacity-100 text-[10px] font-bold text-slate-400 hover:text-slate-600 tracking-widest text-center"
                >
                  Fechar Visualização
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM SIGNUP MODAL */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => setShowCheckoutModal(false)}
               className="absolute inset-0 bg-slate-950/30 backdrop-blur-md" 
            />

            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.95, opacity: 0 }} 
               className="w-full max-w-full sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_24px_50px_rgba(15,23,42,0.18)] relative z-10 border border-slate-150 text-center text-slate-800 animate-in fade-in duration-200"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] flex items-center justify-center text-white shadow-md">
                  <Crown size={22} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-[0.25em]">Acesso Exclusivo</span>
                  <h3 className="text-2xl font-light text-slate-900 tracking-tight uppercase">Kyron Premium Club</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-normal">
                    Assine agora de forma livre simulada para desbloquear todo o repositório de elite monitorado pelo motor adaptativo do KYRON OS.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-100 text-left space-y-3">
                <div className="flex gap-2.5 text-xs text-slate-600 font-medium">
                  <CheckCircle size={14} className="text-[#34D399] shrink-0 mt-0.5" />
                  <span>Todos os mais de 12 protocolos de elite liberados.</span>
                </div>
                <div className="flex gap-2.5 text-xs text-slate-600 font-medium">
                  <CheckCircle size={14} className="text-[#34D399] shrink-0 mt-0.5" />
                  <span>Análises periódicas biográficas de fadiga central.</span>
                </div>
                <div className="flex gap-2.5 text-xs text-slate-600 font-medium">
                  <CheckCircle size={14} className="text-[#34D399] shrink-0 mt-0.5" />
                  <span>Sincronização instantânea na sua planilha principal.</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubscribeNow}
                  className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.25em] text-center font-bold"
                >
                  Confirmar Assinatura (Simulado)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn-text w-full py-2 hover:opacity-100 text-[10px] font-bold text-slate-400 hover:text-slate-600 tracking-widest text-center"
                >
                  Voltar para Biblioteca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating feedback toast */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[1800]">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xl flex gap-3.5 text-left text-slate-800"
            >
              <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Aviso Kyron Pass</span>
                <p className="text-xs font-semibold leading-normal text-slate-700 mt-1">{toastMessage}</p>
                <button 
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-[9.5px] font-black text-slate-400 hover:text-slate-600 uppercase mt-2.5 underline block cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
