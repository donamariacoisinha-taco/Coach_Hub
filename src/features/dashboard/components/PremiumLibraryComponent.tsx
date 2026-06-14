import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Lock, 
  Check, 
  Sparkles, 
  Brain, 
  Award, 
  Clock, 
  Layers, 
  TrendingUp, 
  SlidersHorizontal, 
  ChevronRight, 
  X, 
  CheckCircle,
  FolderPlus,
  Crown,
  LockKeyhole,
  ArrowRight,
  Compass,
  ArrowUpRight,
  Smile,
  Zap,
  Play,
  Dumbbell,
  Flame,
  Shield,
  Edit
} from 'lucide-react';
import { premiumProtocolsApi, PremiumProtocol, PremiumTemplateWorkout } from '../../../lib/api/premiumProtocolsApi';
import { authApi } from '../../../lib/api/authApi';
import { UserProfile } from '../../../types';
import { isAdmin } from '../../../lib/utils/auth';

interface PremiumLibraryProps {
  profile: UserProfile | null;
  onRefreshDashboard: () => void;
  onTabChange: (tab: 'protocols' | 'evolution' | 'premium') => void;
}

export const PremiumLibraryComponent: React.FC<PremiumLibraryProps> = ({
  profile,
  onRefreshDashboard,
  onTabChange
}) => {
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [selectedProtocol, setSelectedProtocol] = useState<PremiumProtocol | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  // Editing Workout Names states & helpers
  const [isEditingWorkoutId, setIsEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutName, setEditingWorkoutName] = useState<string>('');

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

  const loadData = async () => {
    const list = await premiumProtocolsApi.getProtocols();
    setProtocols(list);
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

  // Category List (Brazilian labels mapped to system values)
  const filters = [
    'Todos',
    'Hipertrofia',
    'Força',
    'Emagrecimento',
    'Performance',
    'Natural',
    'Casa',
    'Academia',
    'Iniciantes',
    'Intermediários',
    'Avançados'
  ];

  const filteredProtocols = protocols.filter(p => {
    if (activeFilter === 'Todos') return true;
    
    const valueMap: Record<string, string> = {
      'Hipertrofia': 'hypertrophy',
      'Força': 'strength',
      'Emagrecimento': 'weight_loss',
      'Performance': 'performance',
      'Natural': 'natural',
      'Casa': 'home',
      'Academia': 'gym',
      'Iniciantes': 'beginner',
      'Intermediários': 'intermediate',
      'Avançados': 'advanced'
    };
    
    const mappedValue = valueMap[activeFilter] || activeFilter;
    return p.goal === mappedValue || p.difficulty === mappedValue;
  });

  // Featured program inside "Recomendado para Você"
  const featuredProtocol = protocols.find(p => p.featured) || protocols[0];

  // Dynamic humanized biometrics suggestions from Rubi Intelligence
  const getRubiInsight = () => {
    const goal = (profile?.goal || 'Hipertrofia').toLowerCase();
    const fitnessLevel = (profile?.experience_level || 'Iniciante').toLowerCase();
    const days = profile?.days_per_week || 4;

    if (goal.includes('hipertrofia') || goal.includes('ganho')) {
      if (fitnessLevel.includes('avançado') || fitnessLevel.includes('advanced') || days > 4) {
        return {
          title: "Upper Lower 5x (Alta Frequência)",
          reason: "Seu volume de esforço semanal recente mapeado aponta consistência de alto nível para suportar microciclos estruturais.",
          highlight: "Recomendado iniciar a distribuição Upper-Lower de 5 dias para otimizar síntese proteica total."
        };
      }
      return {
        title: "Hipertrofia Estratégica",
        reason: "As métricas de descanso indicam alta regeneração miofibrilar, ideal para picos de tensão progressiva induzidos por sobrecarga linear.",
        highlight: "Foco integral no aumento de amplitude concêntrica e cadência sob restrição metabólica programada."
      };
    } else if (goal.includes('força') || goal.includes('shape')) {
      return {
        title: "Powerbuilding Fusion",
        reason: "Excelente estabilidade postural relatada nas métricas de execução diária, favorável para ganhos brutos de potência axial.",
        highlight: "Cargas focadas no recrutamento neuromuscular máximo com intervalos de transição assistidos."
      };
    } else {
      return {
        title: "Academia Lotada OS",
        reason: "Adaptação recomendada para manter tempos de intervalo sob tensão constantes sem paradas mecânicas.",
        highlight: "Mapeamento metabólico ágil para contornar gargalos estruturais e aparelhos concorridos de forma limpa."
      };
    }
  };

  const rubiInsight = getRubiInsight();

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

  const getCategoryIcon = (goal: string) => {
    const g = goal?.toLowerCase() || '';
    if (g.includes('hypertrophy') || g.includes('hipertrofia') || g.includes('ganho') || g.includes('força') || g.includes('strength')) {
      return <Dumbbell size={13} className="text-slate-450 group-hover:text-[#7BA7FF] transition-colors shrink-0" />;
    }
    if (g.includes('performance') || g.includes('zap') || g.includes('academia')) {
      return <Zap size={13} className="text-slate-450 group-hover:text-[#7BA7FF] transition-colors shrink-0" />;
    }
    if (g.includes('weight_loss') || g.includes('emagrecimento') || g.includes('flame') || g.includes('perda')) {
      return <Flame size={13} className="text-slate-450 group-hover:text-[#7BA7FF] transition-colors shrink-0" />;
    }
    return <Shield size={13} className="text-slate-450 group-hover:text-[#7BA7FF] transition-colors shrink-0" />;
  };

  const getCoverGradient = (goal: string) => {
    switch (goal?.toLowerCase()) {
      case 'hypertrophy':
      case 'hipertrofia':
        return 'from-indigo-650 via-[#818CF8] to-[#9333EA]';
      case 'strength':
      case 'força':
        return 'from-[#0F172A] via-slate-700 to-[#7BA7FF]';
      case 'weight_loss':
      case 'emagrecimento':
        return 'from-rose-500 via-amber-500 to-red-650';
      case 'performance':
        return 'from-emerald-500 via-teal-650 to-blue-500';
      default:
        return 'from-slate-700 to-slate-900';
    }
  };

  const renderProtocolCard = (p: PremiumProtocol) => {
    return (
      <motion.div
        key={p.id}
        whileHover={{ y: -4, scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        onClick={() => setSelectedProtocol(p)}
        className="snap-start shrink-0 w-[270px] sm:w-[280px] bg-white rounded-3xl border border-slate-100 shadow-xs cursor-pointer flex flex-col overflow-hidden relative group hover:border-[#7BA7FF]/35 hover:shadow-md transition-all duration-300 text-left"
      >
        {/* Compact Elegant Cover Image area */}
        <div className="relative w-full h-[105px] overflow-hidden bg-slate-950 flex-shrink-0">
          <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${getCoverGradient(p.goal)}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          
          <div className="absolute top-3 left-3 flex gap-1.5 items-center">
            <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/30 border border-white/10 px-2.5 py-0.5 rounded-full">
              {p.goal === 'hypertrophy' ? 'Hipertrofia' : p.goal === 'strength' ? 'Força' : p.goal === 'weight_loss' ? 'Emagrecimento' : 'Performance'}
            </span>
          </div>
        </div>

        {/* Info detail */}
        <div className="p-4 flex flex-col flex-grow justify-between min-h-[125px] gap-2">
          <div className="space-y-1.5">
            <h4 className="text-[13px] font-extrabold uppercase text-slate-900 group-hover:text-[#7BA7FF] transition-colors leading-[1.3] truncate" title={p.name}>
              {p.name}
            </h4>
            
            <p className="text-[9.5px] text-[#7BA7FF] font-black uppercase tracking-wider">
              {p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'intermediate' ? 'Intermediário' : 'Iniciante'} • {p.duration_weeks} semanas
            </p>
            
            <p className="text-[11.5px] text-slate-500 leading-relaxed font-normal line-clamp-2">
              {p.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 mt-1">
            <span className="text-[9px] font-black text-slate-400 group-hover:text-[#7BA7FF] transition-colors uppercase tracking-widest flex items-center gap-1.5">
              Ver Protocolo <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const rubiCollections = [
    { id: 'Hipertrofia', label: 'Hipertrofia Estratégica', desc: 'Volume progressivo com saturação mecânica ideal' },
    { id: 'Força', label: 'Força Máxima', desc: 'Progressão neuromuscular com foco em levantamentos axiais' },
    { id: 'Performance', label: 'Recomposição Corporal', desc: 'Estímulo híbrido de ganho estrutural e queima metabólica' },
    { id: 'Emagrecimento', label: 'Emagrecimento Inteligente', desc: 'Densidade metabólica e gasto energético otimizado' },
    { id: 'Academia', label: 'Academia Lotada OS', desc: 'Estratégia dinâmica para contornar grades e aparelhos concorridos' },
    { id: 'Casa', label: 'Treinos de 30 Minutos', desc: 'Metodologia híbrida compacta para máxima ativação temporal' }
  ];

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

      {/* SECTION 1: HEADER */}
      <div className="w-full min-w-0 max-w-none pt-4 pb-4 px-5 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-slate-100/60 mb-6 bg-white/30 backdrop-blur-md">
        <div className="space-y-1 text-left w-full md:max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-none">
            Biblioteca Premium
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-500 max-w-lg font-normal">
            Protocolos desenvolvidos por especialistas e refinados pela inteligência adaptativa do <span className="text-[#7BA7FF] font-semibold">KYRON OS</span>.
          </p>
          <div className="text-[10px] sm:text-xs text-[#7BA7FF] font-medium tracking-normal pt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF] animate-pulse" />
            48 protocolos disponíveis
          </div>
        </div>

        {/* Elegant Minimalist Sandbox Toggle */}
        <div className="flex items-center gap-3 bg-white/60 p-1.5 px-3 rounded-2xl border border-white/80 shadow-xs w-full md:w-auto self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-[#7BA7FF] animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF]">Status</span>
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

      {/* SECTION 2: PROTOCOLOS RECOMENDADOS (Single section above main curations) */}
      {activeFilter === 'Todos' && featuredProtocol && (
        <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 mb-8 relative z-10 text-left">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest">
              Recomendado para você
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Baseado no seu histórico recente
            </p>
          </div>
          
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedProtocol(featuredProtocol)}
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between text-left group hover:border-blue-200 hover:bg-white transition-all duration-300 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BA7FF]/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
            
            <div className="space-y-2 flex-grow max-w-2xl">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                {getCategoryIcon(featuredProtocol.goal)}
                <span>
                  {featuredProtocol.difficulty === 'advanced' ? 'Avançado' : featuredProtocol.difficulty === 'intermediate' ? 'Intermediário' : 'Iniciante'} • {featuredProtocol.duration_weeks} semanas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 uppercase tracking-tight group-hover:text-[#7BA7FF] transition-colors leading-tight">
                {featuredProtocol.name}
              </h3>
              <p className="text-xs sm:text-sm font-normal text-slate-500 line-clamp-2 leading-relaxed">
                {featuredProtocol.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-[#7BA7FF]/10 border border-[#7BA7FF]/20 text-[#7BA7FF] select-none">
                  Rubi
                </span>
                {featuredProtocol.premium ? (
                  <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-slate-900 border border-slate-900 text-white select-none">
                    Premium
                  </span>
                ) : (
                  <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 select-none">
                    Público
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-0 shrink-0 self-start md:self-center">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#7BA7FF] group-hover:translate-x-1 transition-transform duration-200">
                Abrir protocolo →
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* SECTION 3: NAVIGATION TIMELINE / FILTERS */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 mb-6 relative z-10">
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar mask-grad-right">
          {filters.map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`h-7 px-3.5 flex items-center justify-center rounded-lg text-[9px] uppercase tracking-wider font-extrabold shrink-0 transition-all duration-200 border cursor-pointer select-none ${
                  isActive 
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs' 
                    : 'bg-white/60 text-slate-500 border-slate-200/50 hover:border-slate-300 hover:text-slate-800 hover:bg-white/95'
                }`}
              >
                {isActive && <Check size={10} className="mr-1 inline-block text-white" />}
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: PROTOCOLS GRID & SWIPER CAROUSEL */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 relative z-10 text-left">
        {activeFilter !== 'Todos' ? (
          /* Filtered Category Grid View */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[8px] font-black text-[#7BA7FF] uppercase tracking-widest">Fila de Filtro</span>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                  {activeFilter}
                  <span className="text-[10px] font-medium text-slate-400">({filteredProtocols.length})</span>
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setActiveFilter('Todos')}
                className="text-[9px] font-black text-[#7BA7FF] hover:text-[#818CF8] uppercase tracking-widest transition cursor-pointer"
              >
                Ver Todos
              </button>
            </div>

            {filteredProtocols.length === 0 ? (
              <div className="p-12 text-center bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <span className="flex flex-col items-center gap-2.5 justify-center">
                  <Layers size={22} className="text-slate-300" />
                  Nenhum programa correspondente encontrado
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-2">
                {filteredProtocols.map((p) => renderProtocolCard(p))}
              </div>
            )}
          </div>
        ) : (
          /* MasterClass / Apple Fitness + Lightweight curate shelves */
          <div className="space-y-10">
            {/* 1. Featured Protocols (Destaques de Elite) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Destaques Recomendados</h3>
                  <p className="text-[10px] text-slate-400">Programas de alta performance com maior adesão adaptativa</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => featuredRef.current?.scrollBy({ left: -290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => featuredRef.current?.scrollBy({ left: 290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={featuredRef}
                className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 w-full"
              >
                {protocols.filter(p => p.featured || p.rating >= 4.9).map(p => renderProtocolCard(p))}
              </div>
            </div>

            {/* 2. New Releases (Novos Programas) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Novos Lançamentos</h3>
                  <p className="text-[10px] text-slate-400">Últimas metodologias geradas e adaptadas no repositório</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => newRef.current?.scrollBy({ left: -290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-505 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => newRef.current?.scrollBy({ left: 290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-505 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={newRef}
                className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 w-full"
              >
                {[...protocols]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map(p => renderProtocolCard(p))}
              </div>
            </div>

            {/* 3. Most Popular (Mais Populares) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Mais Populares</h3>
                  <p className="text-[10px] text-slate-400">Os protocolos mais clonados e seguidos pelos atletas de elite</p>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => popularRef.current?.scrollBy({ left: -290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => popularRef.current?.scrollBy({ left: 290, behavior: 'smooth' })}
                    className="w-7 h-7 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={popularRef}
                className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 w-full"
              >
                {[...protocols]
                  .sort((a, b) => b.athletes_count - a.athletes_count)
                  .map(p => renderProtocolCard(p))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Program Details Bottom Sheet/Modal */}
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
              className="w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-3xl p-5 sm:p-9 shadow-[0_24px_50px_rgba(15,23,42,0.15)] relative z-10 border border-slate-150 max-h-[85vh] overflow-y-auto text-left text-slate-800"
            >
              <button 
                type="button"
                onClick={() => setSelectedProtocol(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-205 border border-slate-150/40 flex items-center justify-center text-slate-400 hover:text-slate-750 transition shadow-xs cursor-pointer z-20"
              >
                <X size={15} />
              </button>

              {/* Large Cover Effect Header */}
              <div className="space-y-4 pt-1 pb-6 border-b border-slate-100 pr-8">
                <div className="flex flex-wrap gap-2">
                  {selectedProtocol.premium ? (
                    <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-slate-900 border border-slate-900 text-white select-none">
                      Premium
                    </span>
                  ) : (
                    <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 select-none">
                      Público
                    </span>
                  )}

                  <span className="rounded-full text-xs font-medium px-2.5 py-1 bg-[#7BA7FF]/10 border border-[#7BA7FF]/20 text-[#7BA7FF] select-none">
                    Rubi
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-4xl font-light tracking-tight text-slate-900 uppercase">
                    {selectedProtocol.name}
                  </h3>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-relaxed">
                    Criador: {getCreatorLabel(selectedProtocol.created_by)} • Versão v{selectedProtocol.version}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-150/60 rounded-3xl p-4 sm:p-5 text-center mt-5">
                <div className="flex flex-col items-center justify-center py-2 sm:py-0">
                  <span className="text-[7.5px] text-slate-450 font-black uppercase tracking-[0.2em]">Duração</span>
                  <span className="text-base font-light text-slate-800 mt-1 leading-none">{selectedProtocol.duration_weeks} semanas</span>
                </div>
                <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-150/60 py-2 sm:py-0">
                  <span className="text-[7.5px] text-slate-450 font-black uppercase tracking-[0.2em]">Frequência</span>
                  <span className="text-base font-light text-slate-800 mt-1 leading-none">{selectedProtocol.frequency} treinos / sem</span>
                </div>
                <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-150/60 py-2 sm:py-0">
                  <span className="text-[7.5px] text-slate-450 font-black uppercase tracking-[0.2em]">Adaptação</span>
                  <span className="text-base font-light text-emerald-500 mt-1 leading-none">+{selectedProtocol.strength_increase_pct}% Força</span>
                </div>
                <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-150/60 py-2 sm:py-0">
                  <span className="text-[7.5px] text-slate-450 font-black uppercase tracking-[0.2em]">Adesão</span>
                  <span className="text-base font-light text-indigo-500 mt-1 leading-none">{selectedProtocol.completion_rate}% Conclusão</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-6 text-left">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#7BA7FF]">Sobre este Protocolo</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-normal">
                  {selectedProtocol.description} Este protocolo de elite foi desenhado especificamente para consolidar novas frentes de força máxima e sobrecarga mecânica de forma otimizada.
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mt-4 relative overflow-hidden">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-3">Métricas de Execução</span>
                  
                  <div className="space-y-3 text-xs text-slate-605 font-medium">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
                      Atletas monitorados de forma ativa com esse perfil: +{selectedProtocol.athletes_count?.toLocaleString('pt-BR') || "2.100"}.
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      Taxa de adesão monitorada sob fadiga controlada: {selectedProtocol.completion_rate}%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessoes structure */}
              <div className="space-y-4 pt-6 text-left">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Estrutura de Sessões</h4>
                <div className="relative pl-5 space-y-6 before:absolute before:top-2 before:left-2 before:bottom-2 before:w-[1px] before:bg-slate-150">
                  {selectedProtocol.workouts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Nenhum treino cadastrado neste programa.</div>
                  ) : (
                    selectedProtocol.workouts.map((w) => (
                      <div key={w.id} className="relative space-y-3">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#7BA7FF]" />
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
                          {w.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-155 last:border-0 last:pb-0 gap-1.5">
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
              </div>

              {/* Premium Lock Experience & Custom Clone Action */}
              <div className="flex flex-col gap-3 pt-8 border-t border-slate-100 mt-8">
                {selectedProtocol.premium && !isPremium ? (
                  <div className="bg-[#F8FAFC] border border-slate-150 rounded-3xl p-6 text-center space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
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
                    className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
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
                  <p className="text-xs text-slate-505 leading-relaxed max-w-sm font-normal">
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
                  className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.25em] text-center"
                >
                  Confirmar Assinatura (Simulado)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn-text w-full py-2 hover:opacity-100 text-[10px] font-bold text-slate-400 hover:text-slate-650 tracking-widest text-center"
                >
                  Voltar para Biblioteca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating elegant feedback toast */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[1800]">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xl flex gap-3.5 text-left text-slate-755"
            >
              <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Aviso Kyron Pass</span>
                <p className="text-xs font-semibold leading-normal text-slate-700 mt-1">{toastMessage}</p>
                <button 
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-[9.5px] font-black text-slate-400 hover:text-slate-660 uppercase mt-2.5 underline block cursor-pointer"
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
