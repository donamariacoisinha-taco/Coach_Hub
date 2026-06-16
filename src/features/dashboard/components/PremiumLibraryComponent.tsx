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
}

export const PremiumLibraryComponent: React.FC<PremiumLibraryProps> = ({
  profile,
  onRefreshDashboard,
  onTabChange
}) => {
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('todos');
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
    { id: 'todos', label: 'Todos', desc: 'Explore o catálogo completo' },
    { id: 'primeiro', label: 'Primeiro Programa', desc: 'Ideal para iniciantes e consistência' },
    { id: 'forca', label: 'Ganho de Força', desc: 'Progressão tensional de carga máxima' },
    { id: 'hipertrofia', label: 'Hipertrofia', desc: 'Volume e tensão mecânica otimizados' },
    { id: 'quatro_dias', label: '4 Dias por Semana', desc: 'Distribuição ideal de microciclo' },
    { id: 'curtos', label: 'Treinos Curtos', desc: 'Sessões dinâmicas de alta densidade' },
    { id: 'populares', label: 'Mais Populares', desc: 'Elite recomendada pela comunidade' }
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

  const getPrimaryGoalSentence = (p: PremiumProtocol) => {
    const id = p.id.toLowerCase();
    const name = p.name.toLowerCase();
    const goal = p.goal.toLowerCase();

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
    
    let objetivo = "";
    let indicadoPara = "";
    let resultadoEsperado = "";
    let premiumIntroDesc = "";

    if (nameLower.includes('hipertrofia') || goalLower.includes('hypertrophy')) {
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

    return { objetivo, indicadoPara, resultadoEsperado, premiumIntroDesc };
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
    if (selectedCollection === 'todos') return list;
    if (selectedCollection === 'primeiro') return list.filter(p => p.difficulty === 'beginner');
    if (selectedCollection === 'forca') return list.filter(p => p.goal === 'strength');
    if (selectedCollection === 'hipertrofia') return list.filter(p => p.goal === 'hypertrophy');
    if (selectedCollection === 'quatro_dias') return list.filter(p => p.frequency === 4);
    if (selectedCollection === 'curtos') {
      return list.filter(p => p.frequency <= 3 || p.duration_weeks <= 8);
    }
    if (selectedCollection === 'populares') {
      return [...list].sort((a, b) => b.athletes_count - a.athletes_count).slice(0, 3);
    }
    return list;
  };

  const filteredCollectionList = filterProtocols(protocols);

  const renderProtocolCard = (p: PremiumProtocol) => {
    const primaryGoal = getPrimaryGoalSentence(p);
    const cover = getCoverDetails(p.goal);
    return (
      <motion.div
        key={p.id}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedProtocol(p)}
        className="snap-start shrink-0 w-[285px] sm:w-[300px] bg-white rounded-3xl border border-slate-100 shadow-[0_4px_16px_rgba(15,23,42,0.02)] cursor-pointer flex flex-col overflow-hidden group hover:border-[#7BA7FF]/30 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all duration-300 text-left"
      >
        {/* Cover */}
        <div className={`relative w-full h-[145px] overflow-hidden bg-slate-950 flex-shrink-0 bg-gradient-to-br ${cover.gradient}`}>
          <div className="absolute top-[20%] right-[-10%] w-24 h-24 rounded-full blur-[45px] bg-[#7BA7FF]/40 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-16 h-16 rounded-full blur-[30px] bg-white/10 pointer-events-none" />
          
          <div className={`absolute bottom-3 left-4 text-3xl font-[1000] italic tracking-tighter text-white select-none pointer-events-none ${cover.textOpacity} uppercase`}>
            {cover.label}
          </div>

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

      {/* CURATED COLLECTIONS HORIZONTAL SELECTION HUB (WHOOP/Fitness+ Style) */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 mb-8 relative z-10 text-left">
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Coleções Curadas</h2>
        </div>
        <div className="flex gap-3.5 pb-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {COLLECTIONS.map((c) => {
            const isActive = selectedCollection === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`snap-start shrink-0 min-w-[150px] sm:min-w-[180px] p-4 rounded-3xl border text-left transition-all duration-350 cursor-pointer select-none relative overflow-hidden ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' 
                    : 'bg-white/60 border-slate-150 text-slate-500 hover:border-slate-350 hover:bg-white'
                }`}
              >
                <div className="space-y-1 relative z-10">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-[#7BA7FF]' : 'text-slate-800'}`}>
                    {c.label}
                  </h4>
                  <p className="text-[10px] leading-relaxed opacity-80 font-normal line-clamp-1">
                    {c.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN SHELVES OR FILTERED GRID */}
      <div className="w-full min-w-0 max-w-none px-5 sm:px-6 md:px-8 relative z-10 text-left">
        {selectedCollection !== 'todos' ? (
          /* Focused curated collection list view */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-widest">Coleção Ativa</span>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  {COLLECTIONS.find(c => c.id === selectedCollection)?.label}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedCollection('todos')}
                className="text-[9px] font-black text-[#7BA7FF] hover:text-[#818CF8] uppercase tracking-widest transition cursor-pointer"
              >
                Voltar ao Catálogo
              </button>
            </div>

            {filteredCollectionList.length === 0 ? (
              <div className="p-14 text-center bg-white/60 border border-slate-150 rounded-3xl text-slate-450 font-semibold text-xs uppercase tracking-wider">
                Nenhum programa disponível nesta coleção.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
                {filteredCollectionList.map((p) => renderProtocolCard(p))}
              </div>
            )}
          </div>
        ) : (
          /* Default Streaming Hub: Destaques, Novos, Mais Populares */
          <div className="space-y-12">
            
            {/* 1. Destaques */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">01 / DESTAQUES</h3>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Metodologias de Elite</h2>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => featuredRef.current?.scrollBy({ left: -310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => featuredRef.current?.scrollBy({ left: 310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-500 hover:text-slate-850 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={featuredRef}
                className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 w-full"
              >
                {protocols.filter(p => p.featured || p.rating >= 4.9).map(p => renderProtocolCard(p))}
              </div>
            </div>

            {/* 2. Novos Lançamentos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">02 / INTERVENÇÕES ADAPTATIVAS</h3>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Novos Protocolos</h2>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => newRef.current?.scrollBy({ left: -310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => newRef.current?.scrollBy({ left: 310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={newRef}
                className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 w-full"
              >
                {[...protocols].reverse().map(p => renderProtocolCard(p))}
              </div>
            </div>

            {/* 3. Mais Populares */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">03 / PERFORMANCE COORTES</h3>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Mais Populares</h2>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => popularRef.current?.scrollBy({ left: -310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    ←
                  </button>
                  <button 
                    type="button"
                    onClick={() => popularRef.current?.scrollBy({ left: 310, behavior: 'smooth' })}
                    className="w-8 h-8 rounded-full border border-slate-200/60 bg-white text-slate-550 hover:text-slate-855 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-xs font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
              <div 
                ref={popularRef}
                className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 w-full"
              >
                {[...protocols].sort((a, b) => b.athletes_count - a.athletes_count).map(p => renderProtocolCard(p))}
              </div>
            </div>

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

              {/* 7. PREMIUM INTRODUCTION SECTION */}
              <div className="space-y-4 pt-4 text-left">
                <span className="text-[9px] font-black tracking-[0.2em] text-[#7BA7FF] uppercase">Treino Personalizado</span>
                <h2 className="text-2xl sm:text-3xl font-[1000] text-slate-900 uppercase tracking-tight">
                  {selectedProtocol.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                  {getPremiumDetails(selectedProtocol).premiumIntroDesc}
                </p>
                <p className="text-xs sm:text-sm text-slate-700 font-medium bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider mb-1">Ideal Para</span>
                  {getPremiumDetails(selectedProtocol).indicadoPara}
                </p>
              </div>

              {/* 5. PREMIUM INFORMATION HIERARCHY (1. Name, 2. Objective, 3. Frequency, 4. Duration, 5. Expected Result) */}
              <div className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                {/* 2. Objetivo */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] block">Objetivo</span>
                  <p className="text-sm text-slate-800 font-extrabold">{getPremiumDetails(selectedProtocol).objetivo}</p>
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
                  <p className="text-sm text-slate-900 font-black">{getPremiumDetails(selectedProtocol).resultadoEsperado}</p>
                </div>
              </div>

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
