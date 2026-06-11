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
  Play
} from 'lucide-react';
import { premiumProtocolsApi, PremiumProtocol, PremiumTemplateWorkout } from '../../../lib/api/premiumProtocolsApi';
import { authApi } from '../../../lib/api/authApi';
import { UserProfile } from '../../../types';

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
        return 'Rubi Intelligence';
      case 'coach_kyron':
        return 'Kyron Elite';
      case 'admin':
        return 'Equipe Médica';
      default:
        return 'Personal Certificado';
    }
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

      {/* SECTION 1: PREMIUM HERO */}
      <div className="w-full min-w-0 max-w-none pt-6 pb-6 px-5 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-slate-100/60 mb-6 bg-white/30 backdrop-blur-md">
        <div className="space-y-2 text-left w-full md:max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-none">
            Biblioteca Premium
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 max-w-lg font-normal">
            Protocolos desenvolvidos por especialistas e refinados pela <span className="text-[#7BA7FF] font-medium">Rubi Intelligence</span>.
          </p>

          {/* Clean Horizontal Indicators - Simple and Elegant, No Box Clutter */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] font-black uppercase tracking-widest text-[#7BA7FF] pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF] animate-pulse" />
              48 Protocolos
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
              4 Categorias
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              Atualização Contínua
            </span>
          </div>
        </div>

        {/* Elegant Minimalist Sandbox Toggle */}
        <div className="flex items-center gap-3 bg-white/60 p-2 px-3 rounded-2xl border border-white/80 shadow-xs w-full md:w-auto self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-[#7BA7FF] animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</span>
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
            {isPremium ? "Premium Active" : "Simulate Premium"}
          </button>
        </div>
      </div>

      {/* Navigation Filter Pills - Compact Chips */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 mb-8 relative z-10">
        <div className="flex gap-2.5 pb-2 overflow-x-auto no-scrollbar mask-grad-right">
          {filters.map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`h-7 px-3.5 flex items-center justify-center rounded-lg text-[9px] uppercase tracking-wider font-extrabold shrink-0 transition-all duration-200 border cursor-pointer select-none ${
                  isActive 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : 'bg-white/60 text-slate-500 border-slate-200/50 hover:border-slate-300 hover:text-slate-800 hover:bg-white/90'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {activeFilter === 'Todos' ? (
        <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 space-y-12 relative z-10">
          
          {/* SECTION 2: FEATURED TRANSFORMATION - Curadoria Estilo Linear/Oura */}
          {featuredProtocol && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              onClick={() => setSelectedProtocol(featuredProtocol)}
              className="group relative w-full aspect-[16/10] md:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 cursor-pointer text-left bg-[#0A0D14] flex flex-col justify-end transition-shadow duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/40 opacity-95 transition duration-700 group-hover:scale-[1.005]" />
              <div 
                className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-20" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop')" }} 
              />

              {/* Cinematic Ambient Glow */}
              <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Premium content stack */}
              <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full text-white">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="bg-[#7BA7FF] text-white font-black text-[8px] sm:text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-sm shrink-0">
                      Elite Premium
                    </span>
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shrink-0">
                      {featuredProtocol.duration_weeks} semanas
                    </span>
                  </div>
                  <span className="text-[8px] sm:text-[9.5px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full shrink-0">
                    ★ {featuredProtocol.rating}
                  </span>
                </div>

                <div className="space-y-3.5 pr-12 md:pr-16 relative">
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] font-bold text-[#7BA7FF] uppercase tracking-[0.2em] block">
                      Recomendado para seu momento atual
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white uppercase leading-tight line-clamp-1">
                      {featuredProtocol.name}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm max-w-xl line-clamp-2 leading-relaxed font-normal mt-1 opacity-90">
                      {featuredProtocol.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 text-[8.5px] sm:text-[10px] uppercase font-bold tracking-wider">
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                      <span>Freq: <strong className="text-white font-bold">{featuredProtocol.frequency}x / s</strong></span>
                      <span>Nível: <strong className="text-white font-bold">Interm.</strong></span>
                      <span>By: <strong className="text-[#7BA7FF] font-bold">Rubi AI</strong></span>
                    </div>
                  </div>

                  {/* Circular Floating CTA bottom-right */}
                  <div className="absolute right-0 bottom-1 w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#7BA7FF] border border-white/10 shadow-sm text-white flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all duration-300 shrink-0">
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 3: RUBI INTELLIGENCE RECOMMENDATION */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-5 sm:p-6 text-left shadow-[0_5px_20px_rgba(0,0,0,0.01)] relative overflow-hidden flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
            <div className="flex gap-4 items-center w-full md:max-w-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-505 shrink-0">
                <Brain size={18} className="text-[#7BA7FF]" strokeWidth={2} />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7BA7FF] bg-[#7BA7FF]/5 px-2 py-0.5 rounded">
                    Recomendação Rubi AI
                  </span>
                  <span className="text-[9px] font-medium text-slate-400">Baseado no seu perfil de recuperação</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  "{rubiInsight.reason} {rubiInsight.highlight}"
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const matched = protocols.find(p => p.name.toLowerCase() === rubiInsight.title.toLowerCase()) || featuredProtocol;
                if (matched) setSelectedProtocol(matched);
               }}
              className="w-full md:w-auto px-4 py-2.5 h-10 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-98 cursor-pointer shrink-0"
            >
              Iniciar Jornada
            </button>
          </div>

          {/* SECTION 4: HORIZONTAL CAROUSEL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 text-left font-sans">Mais Populares</h2>
              <div className="flex gap-1.5">
                <button 
                  type="button"
                  onClick={() => carouselRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className="w-7 h-7 rounded-lg border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs"
                >
                  ←
                </button>
                <button 
                  type="button"
                  onClick={() => carouselRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className="w-7 h-7 rounded-lg border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs"
                >
                  →
                </button>
              </div>
            </div>

            <div 
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
            >
              {protocols.map((p) => {
                const totalExercises = p.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) || 18;
                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedProtocol(p)}
                    className="snap-start shrink-0 w-[85vw] sm:w-[320px] max-w-[400px] bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 cursor-pointer flex flex-col justify-between h-[240px] relative overflow-hidden group hover:border-[#7BA7FF]/30 hover:bg-white transition-all duration-300 text-left"
                  >
                    <div className="space-y-3">
                      <div className="text-[9px] font-semibold text-slate-400 text-left uppercase tracking-widest">
                        {p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'intermediate' ? 'Intermediário' : 'Iniciante'} • {p.duration_weeks} semanas
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-slate-900 uppercase tracking-tight group-hover:text-[#7BA7FF] transition-colors leading-tight line-clamp-1">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 pr-8">
                        <span className="inline-flex items-center text-[8px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-150">
                          {totalExercises} Exercícios
                        </span>
                        {p.premium ? (
                          <span className="inline-flex items-center text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full bg-[#FFEBF0] text-[#FF4975] border border-[#FFD2DF]">
                            PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-[#E0F2FE]">
                            LIVRE
                          </span>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between">
                        <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-widest flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                          Ver protocolo <ArrowRight size={11} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: RUBI COLLECTIONS */}
          <div className="space-y-4 pt-4">
            <div className="text-left">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Coleções Especiais</h2>
              <p className="text-xs text-slate-400">Curadoria temática para metas específicas de recomposição física.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {rubiCollections.map((col) => (
                <div
                  key={col.id}
                  onClick={() => setActiveFilter(col.id)}
                  className="bg-white/40 p-6 rounded-3xl border border-slate-100 hover:border-[#7BA7FF]/20 hover:bg-white/90 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[145px] group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#7BA7FF]/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition duration-500" />
                  
                  <div className="space-y-1">
                    <span className="text-[8px] font-black tracking-widest text-[#7BA7FF] uppercase">Coleção</span>
                    <h4 className="text-base font-semibold text-slate-800 uppercase tracking-tight">{col.label}</h4>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">{col.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] font-black text-[#7BA7FF] uppercase tracking-wider group-hover:translate-x-1 transition duration-200 mt-2">
                    Visualizar Coleção <ChevronRight size={12} className="text-[#7BA7FF]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: PREMIUM ACCESS AREA */}
          <div className="relative bg-[#0E1119] text-white rounded-[2rem] p-6 sm:p-10 md:p-12 overflow-hidden text-left shadow-xs border border-white/5">
            {/* Ambient glows inside */}
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[80px] bg-indigo-600/10 pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-[100px] bg-emerald-500/10 pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-5">
              <span className="text-[10px] font-extrabold text-[#7BA7FF] uppercase tracking-[0.25em] block">
                KYRON PREMIUM
              </span>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight leading-tight uppercase">
                Desbloqueie os protocolos exclusivos desenvolvidos por especialistas de elite.
              </h2>
              
              <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isPremium) {
                      setToastMessage("Sua simulação premium já está ativa!");
                    } else {
                      setShowCheckoutModal(true);
                    }
                  }}
                  className="px-5 py-3 bg-[#7BA7FF] hover:bg-[#818CF8] text-white font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition duration-300 shadow-md active:scale-95 cursor-pointer text-center"
                >
                  {isPremium ? "Assinatura Ativa" : "Tornar-se Premium"}
                </button>
                <span className="text-slate-400 text-xs font-normal sm:pl-3 flex items-center justify-center sm:justify-start gap-1.5 shrink-0">
                  <Check size={14} className="text-emerald-400" /> Cancelamento simples a qualquer momento
                </span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Category Specific Listing with 1-col mobile, 2-col tablet, 3-col desktop layout */
        <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 space-y-8 relative z-10 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-widest">Categoria Selecionada</span>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 mt-0.5">
                {activeFilter}
                <span className="text-xs font-bold text-slate-400 tracking-normal">({filteredProtocols.length} programas)</span>
              </h2>
            </div>
            
            <button 
              type="button"
              onClick={() => setActiveFilter('Todos')}
              className="text-xs font-bold text-[#7BA7FF] hover:text-[#818CF8] uppercase transition font-black tracking-wider shrink-0"
            >
              Voltar para Visão Geral
            </button>
          </div>

          {filteredProtocols.length === 0 ? (
            <div className="p-16 text-center bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] text-slate-300 font-bold text-xs uppercase tracking-wider relative overflow-hidden">
              <span className="relative z-10 flex flex-col items-center gap-3 justify-center">
                <Layers size={28} className="text-slate-300" />
                Nenhum programa correspondente encontrado nesta categoria.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProtocols.map((p) => {
                const totalExercises = p.workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) || 18;
                const difficultyLabel = p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'intermediate' ? 'Intermediário' : 'Iniciante';
                
                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedProtocol(p)}
                    className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden group hover:border-[#7BA7FF]/30 hover:bg-white transition-all duration-300 text-left h-full min-h-[260px]"
                  >
                    <div className="space-y-4">
                      {/* Subtítulo / Dificuldade • semanas */}
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                        {difficultyLabel} • {p.duration_weeks} semanas
                      </div>

                      {/* Título */}
                      <h4 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight uppercase group-hover:text-[#7BA7FF] transition-colors duration-200">
                        {p.name}
                      </h4>

                      {/* Descrição Curta (Max 2 linhas) */}
                      <p className="text-sm font-normal text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <span className="inline-flex items-center text-[9px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-150">
                          {totalExercises} Exercícios
                        </span>
                        {p.premium ? (
                          <span className="inline-flex items-center text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-[#FFEBF0] text-[#FF4975] border border-[#FFD2DF]">
                            PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            LIVRE
                          </span>
                        )}
                        <span className="inline-flex items-center text-[9px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-indigo-600 border border-blue-100">
                          Rubi Intelligence
                        </span>
                      </div>
                    </div>

                    {/* CTA limpo */}
                    <div className="pt-6 mt-4 border-t border-slate-100/60 flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#7BA7FF] uppercase tracking-widest flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform duration-200">
                        Ver protocolo <ArrowRight size={12} strokeWidth={2.5} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                    <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase text-white bg-[#0F172A] px-3.5 py-1 rounded-full shadow-sm shrink-0">
                      <Crown size={9} /> Premium
                    </span>
                  ) : (
                    <span className="text-[8px] font-[1000] uppercase text-[#0F172A] bg-slate-100 border border-slate-200 px-3 py-1 rounded-full shrink-0">
                      Livre
                    </span>
                  )}

                  <span className="text-[8px] font-black uppercase text-[#7BA7FF] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full shrink-0">
                    ✓ Validado por Rubi AI
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
                          <h5 className="text-sm font-extrabold uppercase text-slate-800 tracking-tight leading-none">{w.name}</h5>
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
                      className="w-full py-4 bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-md cursor-pointer max-w-full truncate flex-shrink-0"
                    >
                      Tornar-se Premium
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={loadingAction === selectedProtocol.id}
                    onClick={() => handleCloneProtocol(selectedProtocol)}
                    className="w-full py-4 bg-[#7BA7FF] hover:bg-[#828df9] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-[#7BA7FF]/15 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 max-w-full truncate flex-shrink-0"
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
                  className="w-full py-2 text-slate-400 hover:text-slate-650 font-bold text-[9px] uppercase tracking-widest text-center cursor-pointer max-w-full truncate flex-shrink-0"
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
                    Assine agora de forma livre simulada para desbloquear todo o repositório de elite monitorado pela Rubi Intelligence.
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
                  className="w-full py-4 bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer text-center max-w-full truncate flex-shrink-0"
                >
                  Confirmar Assinatura (Simulado)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-2 text-slate-400 hover:text-slate-650 font-bold text-[9px] uppercase tracking-widest text-center cursor-pointer max-w-full truncate flex-shrink-0"
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
