import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Lock, 
  Check, 
  Zap, 
  Sparkles, 
  Brain, 
  Award, 
  Play, 
  Clock, 
  Layers, 
  Users, 
  TrendingUp, 
  Info, 
  Dumbbell, 
  SlidersHorizontal, 
  ChevronRight, 
  X, 
  CheckCircle,
  FolderPlus,
  Tv,
  Crown,
  LockKeyhole
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
        ? "Assinatura PREMIUM Simulada! Todos os protocolos estão desbloqueados para clonagem uniforme."
        : "Conta alterada para FREE. Alguns protocolos de elite agora exigem ativação."
    );
  };

  const handleSubscribeNow = () => {
    premiumProtocolsApi.setPremiumAthleteStatus(true);
    setIsPremium(true);
    setShowCheckoutModal(false);
    setToastMessage("Parabéns! Sua assinatura do Kyron Pass foi ativada. Todos os protocolos desbloqueados!");
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
        setToastMessage("Por favor, faça login para clonar protocolos.");
        return;
      }

      await premiumProtocolsApi.cloneToUser(u.id, p.id);
      
      setToastMessage(`Sucesso! "${p.name}" foi clonado privadamente em seus "Meus Protocolos".`);
      onRefreshDashboard();
      
      // Delay transition for great UX
      setTimeout(() => {
        onTabChange('protocols');
      }, 1500);

    } catch (e) {
      console.error(e);
      setToastMessage("Erro ao clonar o protocolo. Tente em instantes.");
    } finally {
      setLoadingAction(null);
      setSelectedProtocol(null);
    }
  };

  // horizontal scroll filter config pills
  const filters = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Hipertrofia', value: 'hypertrophy' },
    { label: 'Emagrecimento', value: 'weight_loss' },
    { label: 'Força', value: 'strength' },
    { label: 'Performance', value: 'performance' },
    { label: 'Glúteos', value: 'glutes' },
    { label: 'Iniciantes', value: 'beginner' },
    { label: 'Intermediários', value: 'intermediate' },
    { label: 'Avançados', value: 'advanced' },
  ];

  const filteredProtocols = protocols.filter(p => {
    if (activeFilter === 'Todos') return true;
    return p.goal === activeFilter || p.difficulty === activeFilter;
  });

  // Calculate high-fidelity Rubi Coach Personalized Recommendations
  const getRubiInsight = () => {
    const userGoal = (profile?.goal || 'Hipertrofia').toLowerCase();
    const userLevel = (profile?.experience_level || 'Iniciante').toLowerCase();
    
    if (userGoal.includes('hipertrofia') || userGoal.includes('hypertrophy')) {
      if (userLevel.includes('avançado') || userLevel.includes('advanced')) {
        return {
          rec: "Upper Lower 5x (Alta Frequência)",
          text: "Seu volume semanal e consistência indicam prontidão de adaptação de cargas para o protocolo modular Upper Lower 5x."
        };
      }
      return {
        rec: "Hipertrofia Estratégica",
        text: "Sua frequência muscular de hiperoestímulo sugere migração para o programa Hipertrofia Estratégica 12 semanas."
      };
    } else if (userGoal.includes('força') || userGoal.includes('strength')) {
      return {
        rec: "Powerbuilding Fusion",
        text: "Seu desempenho nos exercícios multiarticulares indica prontidão neuromuscular excelente para Powerbuilding Fusion."
      };
    } else {
      return {
        rec: "Academia Lotada OS",
        text: "Seu perfil de treino dinâmico convém com o fluxo adaptativo do protocolo Academia Lotada para eficiência de tempo."
      };
    }
  };

  const rubiInsight = getRubiInsight();

  // Color mapping by creator tag
  const getCreatorBadge = (creator: string) => {
    switch (creator) {
      case 'rubi_ai':
        return { label: 'Rubi Intelligence', color: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300' };
      case 'coach_kyron':
        return { label: 'Treinador Kyron', color: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' };
      case 'admin':
        return { label: 'Equipe Médica', color: 'bg-blue-500/15 border-blue-400/30 text-blue-300' };
      default:
        return { label: 'Personal Certificado', color: 'bg-amber-400/10 border-amber-300/20 text-amber-350' };
    }
  };

  return (
    <div className="space-y-8 font-sans text-white bg-slate-950 rounded-[2.5rem] p-5 sm:p-8 min-h-[80vh] relative overflow-hidden border border-slate-900 shadow-2xl">
      {/* Absolute master background mesh lights */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/[0.08] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/[0.05] rounded-full blur-[80px] pointer-events-none" />

      {/* Playground Simulation Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl py-3 px-5 flex flex-col sm:flex-row justify-between items-center gap-3.5 relative z-20">
        <div className="flex items-center gap-2.5">
          <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="text-left">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Sandbox Simulator</span>
            <p className="text-xs font-semibold text-slate-250">
              Plano de Testes Atual: <strong className={isPremium ? 'text-amber-400' : 'text-slate-400'}>{isPremium ? "PREMIUM MASTER" : "LITE (FREE)"}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={togglePremiumSimulation}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${isPremium ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-gradient-to-r from-amber-500 to-yellow-400 border-transparent text-slate-950 font-extrabold hover:opacity-90'}`}
        >
          {isPremium ? "Mudar para Conta Gratuita" : "Desbloquear Premium no Playground"}
        </button>
      </div>

      {/* HERO TITLE SECTION - Apple & Netflix Inspired Editorial Look */}
      <div className="text-left space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full">
          <Sparkles size={11} className="text-indigo-400" />
          <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">Flagship Experience</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-[1000] tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
          Biblioteca Premium
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-medium max-w-xl leading-relaxed">
          Metodologias de elite e protocolos adaptativos desenhados por cientistas esportivos e refinados biometricamente pela <span className="text-[#818CF8] font-bold">Rubi Intelligence</span>.
        </p>
      </div>

      {/* INTELLIGENT RECOMMENDATION CARD - WHOOP COACH INSPIRED */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/10 border border-indigo-500/10 rounded-[2rem] p-6 text-left shadow-xl shadow-indigo-950/5">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:14px_14px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start md:items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
            <Brain size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="text-[9px] font-black text-indigo-400 tracking-[0.25em] uppercase">Kyron Intelligence Advice</span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              "Treino recente, frequência semanal {profile?.days_per_week || 4}x e foco {profile?.goal || 'Hipertrofia'} analisados. {rubiInsight.text}"
            </p>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-indigo-300 uppercase tracking-widest pt-1">
              <span>RECOMENDAÇÃO: {rubiInsight.rec}</span>
              <span>•</span>
              <span className="text-slate-450">ALINHADO À BIOMETRIA</span>
            </div>
          </div>
          <button
            onClick={() => {
              const matching = protocols.find(p => p.name.toLowerCase() === rubiInsight.rec.toLowerCase() || p.id.includes('hipertrofia'));
              if (matching) setSelectedProtocol(matching);
            }}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/10 shrink-0"
          >
            Análise Rápida
          </button>
        </div>
      </div>

      {/* HORIZONTAL SWIPABLE PILLS - FILTERING */}
      <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar mask-grad-right">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4.5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-black shrink-0 transition-all border ${activeFilter === f.value ? 'bg-indigo-600 text-white border-indigo-400/30' : 'bg-slate-900 text-slate-400 border-white/[0.05] hover:border-white/[0.1] hover:text-white'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* EDITORIAL DESTAQUES DA SEMANA SECTION - BIG HERO ROTATOR */}
      {activeFilter === 'Todos' && protocols.length > 0 && (
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-indigo-400" />
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Destaques Recomendados</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {protocols.filter(p => p.featured).slice(0, 2).map((p, idx) => {
              const bgGradient = idx === 0 
                ? "from-slate-900/60 via-indigo-950/20 to-purple-950/20 hover:from-slate-900/70 hover:via-indigo-950/30 hover:to-purple-950/35"
                : "from-slate-900/60 via-slate-900/30 to-blue-950/15 hover:from-slate-900/70 hover:via-slate-900/40 hover:to-blue-950/25";
              
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedProtocol(p)}
                  className={`lg:col-span-6 bg-gradient-to-br ${bgGradient} border border-white/[0.06] rounded-[2.2rem] p-7 cursor-pointer transition text-left flex flex-col justify-between relative overflow-hidden group min-h-[220px]`}
                >
                  {/* Glowing micro lighting inside */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition duration-500 pointer-events-none" />

                  <div className="space-y-3.5">
                    {/* Badge and Creator row */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {p.premium && (
                          <span className="text-[7px] font-black uppercase text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full tracking-widest flex items-center gap-1">
                            <Crown size={8} /> Elite
                          </span>
                        )}
                        <span className="text-[7.5px] font-[1000] uppercase text-indigo-300 border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 rounded-full tracking-widest">
                          {p.duration_weeks} Semanas
                        </span>
                      </div>
                      <span className="text-[8px] font-black uppercase text-slate-405 tracking-widest">
                        ⭐ {p.rating}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-indigo-200 transition">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {p.athletes_count.toLocaleString()} atletas praticando
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-400 tracking-wider group-hover:translate-x-1 transition">
                      Descobrir <ChevronRight size={11} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATALOG GRID */}
      <div className="space-y-4 text-left pt-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-indigo-400" />
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Todos os Protocolos Disponíveis</h2>
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/20 border border-white/[0.04] rounded-2xl text-slate-450 font-bold text-xs uppercase tracking-wider">
            Nenhum programa localizado para o filtro selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProtocols.map((p) => {
              const creator = getCreatorBadge(p.created_by);
              
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedProtocol(p)}
                  className="bg-slate-900/40 hover:bg-slate-900/60 border border-white/[0.05] rounded-[2rem] p-5.5 cursor-pointer transition flex flex-col justify-between text-left relative overflow-hidden group min-h-[200px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {p.premium ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.07]">
                          <Crown size={9} className="text-amber-400" />
                          <span className="text-[7.5px] font-black uppercase text-amber-400 tracking-widest">Premium</span>
                        </div>
                      ) : (
                        <span className="text-[7.5px] font-[1000] uppercase text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded tracking-widest">Grátis</span>
                      )}

                      <span className={`text-[7.5px] font-black uppercase px-2 py-0.5 border rounded tracking-widest ${creator.color}`}>
                        {creator.label}
                      </span>
                    </div>

                    <h4 className="text-base font-black uppercase tracking-tight text-white line-clamp-1 group-hover:text-indigo-300 transition">
                      {p.name}
                    </h4>

                    {/* Meta stats block */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950/40 border border-white/[0.03] rounded-xl p-2 text-center">
                      <div className="flex flex-col justify-center">
                        <span className="text-[6.5px] font-bold text-slate-450 uppercase tracking-widest">Tempo</span>
                        <span className="text-xs font-black text-slate-200 mt-0.5">{p.duration_weeks}w</span>
                      </div>
                      <div className="flex flex-col justify-center border-x border-white/[0.04]">
                        <span className="text-[6.5px] font-bold text-slate-450 uppercase tracking-widest">Frequência</span>
                        <span className="text-xs font-black text-slate-200 mt-0.5">{p.frequency}x</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[6.5px] font-bold text-slate-450 uppercase tracking-widest">Nível</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase mt-0.5 truncate">{p.difficulty === 'beginner' ? 'Inic' : p.difficulty === 'intermediate' ? 'Inter' : 'Avanç'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.03] flex items-center justify-between text-slate-350">
                    <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                      <Star size={9} className="text-amber-500 fill-amber-500 shrink-0" /> {p.rating}
                    </span>
                    <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">
                      Visualizar
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* HIGH QUANTITY MODAL FOR DETAIL PREVIEW & COPY ENGINE CONTAINER */}
      <AnimatePresence>
        {selectedProtocol && (
          <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedProtocol(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />

            <motion.div 
              initial={{ y: "100%", scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: "100%", scale: 0.95 }} 
              className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-[3rem] sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 border border-white/[0.08] max-h-[88vh] overflow-y-auto text-left text-white"
            >
              {/* Header block with cover effect */}
              <div className="relative border-b border-white/[0.06] pb-5 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {selectedProtocol.premium ? (
                      <span className="inline-flex items-center gap-1 text-[7.5px] font-[1000] uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full tracking-widest">
                        <Crown size={9} /> Programa Elite
                      </span>
                    ) : (
                      <span className="text-[7.5px] font-[1000] uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full tracking-widest">Grátis</span>
                    )}

                    <span className="text-[7.5px] font-[1000] uppercase text-slate-300 border border-white/[0.08] px-2 py-0.5 rounded-full tracking-widest">
                      Versão v{selectedProtocol.version}
                    </span>
                  </div>

                  <h3 className="text-2xl font-[1000] text-white uppercase tracking-tight leading-tight">
                    {selectedProtocol.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-lg font-medium">
                    {selectedProtocol.description}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedProtocol(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scientific metrics banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border border-white/[0.03] rounded-2xl p-4.5 text-center">
                <div className="flex flex-col justify-center items-center">
                  <span className="text-[6px] sm:text-[7px] text-slate-450 font-black uppercase tracking-[0.15em]">Semanas</span>
                  <span className="text-sm font-black text-white mt-1.5 leading-none">{selectedProtocol.duration_weeks} Semanas</span>
                </div>
                <div className="flex flex-col justify-center items-center border-l sm:border-l border-white/[0.04]">
                  <span className="text-[6px] sm:text-[7px] text-slate-450 font-black uppercase tracking-[0.15em]">Frequência</span>
                  <span className="text-sm font-black text-white mt-1.5 leading-none">{selectedProtocol.frequency}x / Semana</span>
                </div>
                <div className="flex flex-col justify-center items-center border-l border-white/[0.04]">
                  <span className="text-[6px] sm:text-[7px] text-slate-450 font-black uppercase tracking-[0.15em]">Ganhos de Carga</span>
                  <span className="text-sm font-black text-emerald-450 mt-1.5 leading-none">+{selectedProtocol.strength_increase_pct}%</span>
                </div>
                <div className="flex flex-col justify-center items-center border-l border-white/[0.04]">
                  <span className="text-[6px] sm:text-[7px] text-slate-450 font-black uppercase tracking-[0.15em]">Adesão Média</span>
                  <span className="text-sm font-black text-indigo-350 mt-1.5 leading-none">{selectedProtocol.completion_rate}% Conclusão</span>
                </div>
              </div>

              {/* Workouts previews structural grid */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-indigo-400" />
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Visualização de Treinos & Exercícios</span>
                </div>

                <div className="space-y-3">
                  {selectedProtocol.workouts.length === 0 ? (
                    <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center text-xs text-slate-500 font-medium">
                      Este protocolo contém uma pasta vazia. Use o editor para complementar.
                    </div>
                  ) : (
                    selectedProtocol.workouts.map((w: PremiumTemplateWorkout) => (
                      <div 
                        key={w.id}
                        className="bg-white/[0.012] border border-white/[0.04] rounded-2xl p-4.5 space-y-3 Text-left"
                      >
                        <div className="flex justify-between items-center bg-white/[0.02] -mx-4.5 -mt-4.5 p-3.5 rounded-t-2xl border-b border-white/[0.03]">
                          <div>
                            <h5 className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">{w.name}</h5>
                            {w.description && <p className="text-[9px] text-slate-400 mt-1 font-semibold">{w.description}</p>}
                          </div>
                          <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-950 border border-white/[0.04] px-2 py-0.5 rounded">
                            {w.exercises.length} Exs
                          </span>
                        </div>

                        {/* Exercises listed */}
                        <div className="space-y-2">
                          {w.exercises.map((ex, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.02] last:border-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-500 bg-white/[0.02] w-5 h-5 rounded-full flex items-center justify-center border border-white/[0.04]">{idx + 1}</span>
                                <span className="font-extrabold text-[#F1F5F9] uppercase tracking-tight">{ex.exercise_name}</span>
                              </div>
                              <div className="flex items-center gap-3.5 text-[10px] font-bold text-slate-400">
                                <span>{ex.sets}s × {ex.reps} reps</span>
                                <span className="text-[9px] text-slate-500 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.03]">{ex.rest_time}s desc</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Version update notes section if history is present */}
              {selectedProtocol.version_history && selectedProtocol.version_history.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[8.5px] font-black text-slate-450 uppercase tracking-widest block">Changelog / Histórico de Melhorias Clínicas</span>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-white/[0.03] space-y-1.5">
                    {selectedProtocol.version_history.map((h, hIdx) => (
                      <div key={hIdx} className="text-[9.5px] text-slate-400 font-semibold leading-relaxed">
                        <strong className="text-slate-200">v{h.version} ({new Date(h.updated_at).toLocaleDateString()}) - {h.updated_by}:</strong>
                        <div className="pl-3 space-y-0.5 mt-0.5">
                          {h.changes.map((ch, cIdx) => (
                            <div key={cIdx} className="flex gap-1">
                              <span className="text-indigo-400 shrink-0">•</span>
                              <span>{ch}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary action footer */}
              <div className="flex flex-col gap-3.5 pt-4">
                {selectedProtocol.premium && !isPremium ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(true);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-[1000] text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                  >
                    <LockKeyhole size={14} className="text-slate-950" /> Assinar Premium para Desbloquear
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loadingAction === selectedProtocol.id}
                    onClick={() => handleCloneProtocol(selectedProtocol)}
                    className="w-full py-4 bg-indigo-600 hover:bg-slate-100 font-[1000] text-xs uppercase tracking-[0.2em] text-white hover:text-indigo-900 rounded-2xl shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {loadingAction === selectedProtocol.id ? (
                      <span className="text-slate-400 animate-pulse">Clonando Metodologia...</span>
                    ) : (
                      <>
                        <FolderPlus size={14} /> Adicionar aos Meus Protocolos
                      </>
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setSelectedProtocol(null)}
                  className="w-full py-2 text-slate-500 hover:text-slate-350 font-black text-[9.5px] uppercase tracking-widest text-center"
                >
                  Continuar Explorando
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM SIGNUP / CHECKOUT DIALOG MODAL */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 space-y-6 shadow-2xl relative z-10 border border-amber-500/20 text-center text-white"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-400/[0.04]">
                  <Crown size={32} className="animate-bounce" />
                </div>
                <span className="text-[9px] font-[1000] text-amber-400 uppercase tracking-[0.25em]">Acesso Ilimitado Kyron Pass</span>
                <h3 className="text-2xl font-[1050] text-white uppercase tracking-tight">Desbloquear Premium</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Desbloqueie todo o catálogo de metodologias científicas concebidas por cientistas e receba as sugestões adaptativas de biometria instantâneas.
                </p>
              </div>

              {/* Features benefits block */}
              <div className="bg-slate-950/60 p-4.5 rounded-2xl border border-white/[0.03] text-left space-y-3">
                <div className="flex gap-2 text-xs text-slate-300 font-semibold">
                  <CheckCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Todos os mais de 12 protocolos de elite abertos.</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-300 font-semibold">
                  <CheckCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Ajustes biomecânicos e Safe Merge liberado.</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-300 font-semibold">
                  <CheckCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Acompanhamento integrado de Kyron Intelligence.</span>
                </div>
              </div>

              {/* Sandbox info note */}
              <p className="text-[8.5px] text-slate-500 font-black uppercase tracking-wider">
                💡 NO PLAYGROUND: A ATIVAÇÃO É TOTALMENTE GRÁTIS!
              </p>

              <div className="flex flex-col gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={handleSubscribeNow}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-amber-500/15 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                >
                  Confirmar Assinatura (Simulado)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-2 text-slate-500 hover:text-slate-350 font-bold text-[9.5px] uppercase tracking-widest text-center"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST FEEDBACK FLOATER CONTAINER */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[1800]">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex gap-3.5 text-left text-white"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Feedback Kyron</span>
                <p className="text-xs font-bold leading-normal text-slate-200 mt-1">{toastMessage}</p>
                <button 
                  onClick={() => setToastMessage(null)}
                  className="text-[9.2px] font-black text-slate-400 hover:text-white uppercase mt-2.5 underline block"
                >
                  OK, FECHAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
