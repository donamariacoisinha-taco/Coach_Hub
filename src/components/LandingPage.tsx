import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Droplet, 
  Apple, 
  Dumbbell, 
  Target, 
  TrendingUp, 
  User, 
  Heart, 
  Clock, 
  ArrowUpRight, 
  Brain, 
  LayoutGrid, 
  Smartphone, 
  LineChart, 
  ChevronRight, 
  CheckCircle, 
  Calendar,
  MessageSquare,
  Lock,
  LockKeyhole,
  Compass,
  Trophy,
  Coffee,
  Check,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  Scale
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

type TabType = 'workout' | 'metabolism' | 'coach' | 'evolution';

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Quick live interactive mockup helper states
  // 1. Workout Player mockup state
  const [currentSet, setCurrentSet] = useState(2);
  const [customLoad, setCustomLoad] = useState(84);
  const [secsRemaining, setSecsRemaining] = useState(48);
  const [timerRunning, setTimerRunning] = useState(true);

  // 2. Nutrition mockup state
  const [liveWaterMl, setLiveWaterMl] = useState(750);
  const [bioState, setBioState] = useState(82);

  // Countdown simulation for rest timer
  useEffect(() => {
    let interval: any;
    if (timerRunning && secsRemaining > 0) {
      interval = setInterval(() => {
        setSecsRemaining(prev => (prev > 0 ? prev - 1 : 48));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secsRemaining]);

  // Track scroll position to show tiny sutil floating CTA bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(window.scrollY / totalHeight);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSetIncrement = () => {
    if (currentSet < 4) {
      setCurrentSet(prev => prev + 1);
      setSecsRemaining(90);
    } else {
      setCurrentSet(1);
    }
    if ('vibrate' in navigator) navigator.vibrate(8);
  };

  const handleWaterDrink = () => {
    setLiveWaterMl(prev => (prev < 3000 ? prev + 250 : 250));
    setBioState(prev => Math.min(100, prev + 1));
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const tabsInfo = [
    { id: 'workout' as TabType, label: 'Treinamento Player', icon: Dumbbell, desc: 'Interface de execução imersiva com autogestão de fadiga' },
    { id: 'metabolism' as TabType, label: 'Metabolismo OS', icon: Apple, desc: 'Algoritmo nutricional autocorretivo baseado em esforço real' },
    { id: 'coach' as TabType, label: 'Memória do Coach', icon: Brain, desc: 'Interação cognitiva adaptativa e bio-feedback contínuo' },
    { id: 'evolution' as TabType, label: 'Mapeamento Humano', icon: LineChart, desc: 'Evolução de tonelagem, 1RM estimada e mapas de fadiga' },
  ];

  const floatingInsights = [
    {
      id: 1,
      title: "Prontidão Biológica Elevada",
      metric: "94%",
      desc: "Excelente alinhamento de esforço e reposição de glicogênio. Recomendamos sobrecarga progressiva estruturada hoje.",
      icon: Activity,
      color: "text-[#7BA7FF]",
      bg: "bg-[#7BA7FF]/5 border-[#7BA7FF]/15"
    },
    {
      id: 2,
      title: "Janela Circadiana de Alta Força",
      metric: "18h - 20h",
      desc: "Análise histórica demonstra maior estabilidade biomecânica e recrutamento de unidades motoras nesta faixa de horário.",
      icon: Clock,
      color: "text-[#818CF8]",
      bg: "bg-[#818CF8]/5 border-[#818CF8]/15"
    },
    {
      id: 3,
      title: "Recuperação de Glicogênio Ativa",
      metric: "12% mais rápido",
      desc: "Ingestão hídrica sincronizada a (3.2L) otimizou o reparo sarcoplasmático e reduziu cansaço latente pós-treino.",
      icon: Droplet,
      color: "text-[#34D399]",
      bg: "bg-[#34D399]/5 border-[#34D399]/15"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden selection:bg-[#7BA7FF]/30 selection:text-slate-900 pb-20">
      
      {/* 🌌 DYNAMIC GLOW BACKGROUNDS */}
      <div className="absolute top-[-100px] left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none blur-[140px] opacity-[0.25] bg-gradient-to-tr from-[#7BA7FF] to-[#818CF8] living-blur-1" />
      <div className="absolute top-[800px] right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none blur-[160px] opacity-[0.15] bg-[#60A5FA] living-blur-2" />
      <div className="absolute bottom-[1200px] left-10 w-[700px] h-[700px] rounded-full pointer-events-none blur-[180px] opacity-[0.2] bg-[#A5C8FF]/40 living-blur-1" />

      {/* 1. SOPHISTICATED NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 border-b border-white/30 bg-white/60 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/20">
            <Sparkles size={16} className="text-[#7BA7FF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900 leading-none">Coach Rubi</span>
            <span className="text-[7px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">HUMAN PERFORMANCE SYSTEM</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onLogin} 
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Acessar Conta
          </button>
          
          <button 
            onClick={onStart}
            className="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] tracking-[0.18em] uppercase py-3 px-6 rounded-2xl border border-slate-950 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Experimentar
          </button>
        </div>
      </nav>

      {/* 2. PREMIUM CINEMATIC HERO SECTION */}
      <section className="relative pt-44 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center">
        <div className="max-w-4xl text-center space-y-7 relative z-10">
          
          {/* Breathing Intelligence Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 1 }}
            className="inline-flex items-center gap-2.5 px-4.5 py-2 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.015)]"
          >
            <span className="w-1.5 h-1.5 bg-[#7BA7FF] rounded-full animate-ping"></span>
            <span className="text-[9.5px] font-bold uppercase tracking-[0.25em] text-slate-500">
              SISTEMA DE DESEMPENHO HUMANO ADAPTATIVO
            </span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.1, duration: 1 }}
            className="text-4xl sm:text-6xl md:text-[5rem] font-light tracking-tight leading-[1.02] text-[#0F172A]"
          >
            Você já treina seu corpo.<br/>
            Treine com o <strong className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-[#7BA7FF]">sistema</strong> que o compreende.
          </motion.h1>
          
          {/* Subheadline Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.2, duration: 1.2 }}
            className="text-base sm:text-[1.25rem] text-slate-500 font-light max-w-3xl mx-auto leading-relaxed"
          >
            Acompanhamento de força, inteligência metabólica autocorretiva, recuperação baseada em marcadores latentes e suporte cognitivo integrados sob uma única linguagem biológica refinada.
          </motion.p>
          
          {/* Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.3, duration: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4.5 pt-6"
          >
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5.5 bg-slate-900 border border-slate-950 rounded-3xl font-bold text-white uppercase text-[11px] tracking-[0.22em] shadow-xl shadow-slate-950/10 hover:bg-slate-800 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Experimentar agora
              <ArrowRight size={14} className="text-[#7BA7FF]" />
            </button>
            
            <a 
              href="#experiencia"
              className="w-full sm:w-auto px-10 py-5.5 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-3xl font-bold text-slate-700 uppercase text-[11px] tracking-[0.22em] shadow-sm hover:bg-white hover:text-slate-950 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              Conhecer ecossistema
            </a>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.22em] pt-2"
          >
            Isento de publicidades • Focado em performance biológica pura
          </motion.p>
        </div>

        {/* 3. APP MOCKUPS SHOWCASE INTERACTION (THE PHYSICAL EVIDENCE) */}
        <div id="experiencia" className="mt-28 w-full max-w-6xl relative select-none">
          <div className="absolute inset-0 bg-[#7BA7FF]/5 blur-[120px] rounded-[5rem] pointer-events-none"></div>
          
          <div className="text-center mb-8 space-y-2">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF]">EXPLORE O SISTEMA INTUITIVO</span>
            <h3 className="text-2xl font-light text-slate-800 tracking-tight">Toque na interface de controle para simular</h3>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 pb-2 border-b border-slate-200/30">
            {tabsInfo.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if ('vibrate' in navigator) navigator.vibrate(4); }}
                  className={`px-5 py-3.5 rounded-full text-xs font-semibold tracking-tight transition-all relative flex items-center gap-2.5 outline-none cursor-pointer`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeLanderTab"
                      className="absolute inset-0 bg-[#7BA7FF]/10 border border-[#7BA7FF]/35 rounded-full shadow-sm"
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    />
                  )}
                  <Icon size={14} className={isActive ? 'text-[#7BA7FF]' : 'text-slate-400'} />
                  <span className={isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE CONTENT WITH MOCK CONTAINER */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-xl p-6 sm:p-10 min-h-[460px] flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
            
            <div className="md:w-5/12 text-left space-y-4">
              <span className="text-[10px] font-black tracking-[0.22em] uppercase text-[#7BA7FF]">
                TECNOLOGIA EMBUTIDA
              </span>
              <h4 className="text-3xl font-light text-slate-900 leading-snug tracking-tight">
                {tabsInfo.find(t => t.id === activeTab)?.label}
              </h4>
              <p className="text-base text-slate-500 font-light leading-relaxed">
                {tabsInfo.find(t => t.id === activeTab)?.desc}. Sinta a fluidez e a leveza de comandos minimalistas construídos para eliminar distrações mecânicas.
              </p>

              {/* Sub features listings */}
              <div className="space-y-3 pt-2">
                {activeTab === 'workout' && (
                  <>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
                      <span>Sugestão de carga automática inteligente</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
                      <span>Contador progressivo e tátil de RPE (Fadiga)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
                      <span>Cronômetro dinâmico para restauração de fosfocreatina</span>
                    </div>
                  </>
                )}
                {activeTab === 'metabolism' && (
                  <>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A5C8FF]" />
                      <span>Célula de bio-feedback por esforço desprendido</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A5C8FF]" />
                      <span>Tabela de macros adaptável em tempo de execução</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A5C8FF]" />
                      <span>Taxa de hidratação microfocal baseada no clima zonal</span>
                    </div>
                  </>
                )}
                {activeTab === 'coach' && (
                  <>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                      <span>Memória atômica que rastreia horários ideais de treino</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                      <span>Previsão de estafa neurológica precoce</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                      <span>Análise comportamental baseada em sequência ativa</span>
                    </div>
                  </>
                )}
                {activeTab === 'evolution' && (
                  <>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span>Mapeamento tridimensional de impacto de grupos de fibras</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span>Gráficos de 1RM estimulado de fáceis leituras</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-light">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span>Calendário biológico de aderência e consistência</span>
                    </div>
                  </>
                )}
              </div>

              {/* Instant Try out Button inside card */}
              <div className="pt-4">
                <button 
                  onClick={onStart}
                  className="inline-flex items-center gap-1.5 font-[#7BA7FF] hover:text-[#818CF8] text-[11px] uppercase tracking-wider font-extrabold transition-colors cursor-pointer"
                >
                  <span>Ver na prática</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* MOCKUP CORE CONTAINER VIEWPORT */}
            <div className="w-full md:w-7/12 flex items-center justify-center relative min-h-[380px]">
              
              <AnimatePresence mode="wait">
                {/* 1. WORKOUT TAB LAYOUT */}
                {activeTab === 'workout' && (
                  <motion.div
                    key="workout-mock"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="w-full max-w-[340px] bg-slate-950 text-white rounded-[2.5rem] p-5 shadow-2xl relative border border-slate-800"
                  >
                    {/* Speaker capsule notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                      <div className="w-8 h-1 bg-slate-850 rounded-full" />
                    </div>

                    <div className="space-y-4.5 pt-6 select-none">
                      {/* Active Player header */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono text-[#7BA7FF]/90 font-bold uppercase tracking-wider">▲ SESSÃO EM CURSO</span>
                        <span className="font-mono">RPE Estimado: 8.5</span>
                      </div>

                      {/* Exercise card info */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#7BA7FF] font-bold">Supino Reto com Halteres</span>
                        <h5 className="text-xl font-light text-white leading-tight">Série {currentSet} de 4</h5>
                      </div>

                      {/* Progress weight controls (Interactive!) */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-bold text-slate-500">Carga Estimada</span>
                          <span className="text-xl font-semibold text-white font-mono tabular-nums">{customLoad} kg <span className="text-xs font-normal text-slate-400">total</span></span>
                        </div>

                        {/* Tiny live stepper */}
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.max(10, prev - 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.min(200, prev + 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Interactive Countdown Timer */}
                      <div className="bg-[#7BA7FF]/5 border border-[#7BA7FF]/15 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-[#7BA7FF] block mb-0.5">DESCANSO ATIVO</span>
                          <span className="text-2xl font-light text-white font-mono leading-none tabular-nums">00:{secsRemaining < 10 ? '0' + secsRemaining : secsRemaining}</span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg hover:bg-white/15 flex items-center justify-center"
                          >
                            {timerRunning ? <span className="text-xs">||</span> : <Play size={10} className="fill-white" />}
                          </button>
                          <button 
                            onClick={() => setSecsRemaining(90)}
                            className="w-8 h-8 bg-[#7BA7FF] hover:bg-[#7BA7FF]/80 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center"
                          >
                            <RotateCcw size={11} className="text-slate-950" />
                          </button>
                        </div>
                      </div>

                      {/* Set controller CTA (progresses series live!) */}
                      <button
                        onClick={handleSetIncrement}
                        className="w-full bg-slate-100 hover:bg-white text-slate-900 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95"
                      >
                        <Check size={13} strokeWidth={3} />
                        <span>Confirmar Série • Próximo</span>
                      </button>

                    </div>
                  </motion.div>
                )}

                {/* 2. METABOLISM OS TAB LAYOUT */}
                {activeTab === 'metabolism' && (
                  <motion.div
                    key="metabolism-mock"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="w-full max-w-[340px] bg-white border border-slate-200/60 rounded-[2.5rem] p-5.5 shadow-2xl space-y-4 text-slate-800"
                  >
                    {/* Title indicator */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest font-black text-slate-400">NUTRI INTEGRADO</span>
                        <h6 className="text-sm font-semibold tracking-tight leading-none text-slate-900">Metabolic Status</h6>
                      </div>
                      
                      <div className="bg-[#7BA7FF]/10 text-[#7BA7FF] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase">
                        Bio Score: {bioState}
                      </div>
                    </div>

                    {/* Calories tracking visual bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400 font-medium">Balanço do dia</span>
                        <span className="text-slate-800 font-bold font-mono">1.250 / 2.340 kcal</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7BA7FF] rounded-full w-[53%]" />
                      </div>
                    </div>

                    {/* Proporcional macros mini cards */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Proteínas</span>
                        <span className="font-bold text-slate-800 font-mono">112g</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Carbos</span>
                        <span className="font-bold text-slate-800 font-mono">145g</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-400 block mb-0.5">Gorduras</span>
                        <span className="font-bold text-slate-800 font-mono">42g</span>
                      </div>
                    </div>

                    {/* Interactive Hydration simulator */}
                    <div className="bg-slate-50 border border-slate-200/40 p-3.5 rounded-[1.25rem] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Droplet size={11} className="text-[#60A5FA]" />
                          Hidratação Celular
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-800 font-mono">
                          {(liveWaterMl / 1000).toFixed(2)}L <span className="text-slate-400 font-normal">/ 3.2L</span>
                        </span>
                      </div>

                      {/* Interactive hydration adder bar */}
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden h-9 relative flex items-center justify-center border border-slate-200/10">
                          <span className="absolute text-[8px] tracking-widest text-[#7BA7FF] font-mono leading-none">PROGRESS</span>
                          <div 
                            className="bg-gradient-to-r from-[#60A5FA]/40 to-[#7BA7FF]/50 h-full absolute left-0 top-0 transition-all duration-300"
                            style={{ width: `${Math.min(100, (liveWaterMl / 3200) * 100)}%` }}
                          />
                        </div>

                        <button
                          onClick={handleWaterDrink}
                          className="bg-slate-900 text-white rounded-lg px-3.5 hover:bg-slate-800 text-[10.5px] font-bold active:scale-95 transition-all outline-none"
                        >
                          Beber +250ml
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. COACH MEMORY TAB LAYOUT */}
                {activeTab === 'coach' && (
                  <motion.div
                    key="coach-mock"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="w-full max-w-[340px] bg-slate-950 text-white rounded-[2.5rem] p-5.5 shadow-2xl flex flex-col justify-between min-h-[350px] border border-slate-800"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 px-1 border-b border-white/5 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center">
                        <Brain size={14} />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block leading-none">MEMÓRIA ATIVA</span>
                        <span className="text-xs font-semibold text-white tracking-tight">Coach Rubi Cognitiva</span>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="space-y-3.5 py-4 flex-1 overflow-y-auto no-scrollbar">
                      {/* User message */}
                      <div className="text-right">
                        <span className="inline-block bg-white/10 text-[10.5px] px-3.5 py-2 rounded-2xl rounded-tr-none text-left max-w-[85%] leading-relaxed font-light">
                          "Devo aumentar a carga hoje no Supino?"
                        </span>
                      </div>

                      {/* AI response */}
                      <div className="text-left flex gap-2">
                        <div className="w-5 h-5 bg-[#818CF8] text-slate-950 font-bold rounded-full flex items-center justify-center text-[8px] font-mono shrink-0 mt-0.5">R</div>
                        <div className="bg-[#818CF8]/10 border border-[#818CF8]/20 text-[10px] px-3.5 py-2.5 rounded-2xl rounded-tl-none font-light leading-relaxed max-w-[88%] text-slate-200">
                          "Sua aderência recente e RPE indicam ótima absorção de glicogênio. Podemos subir <strong className="text-white font-semibold">2,5kg de cada lado</strong> com segurança nesta primeira série estruturada!"
                        </div>
                      </div>
                    </div>

                    {/* Circadian/Sleep recovery alert banner */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 text-[9px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span>Circadian Status: Janela Hormonal Favorecida</span>
                    </div>
                  </motion.div>
                )}

                {/* 4. EVOLUTION TARGET GROUP */}
                {activeTab === 'evolution' && (
                  <motion.div
                    key="evolution-mock"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="w-full max-w-[340px] bg-white border border-slate-200/60 rounded-[2.5rem] p-5.5 shadow-2xl space-y-4.5 text-slate-800"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">MAPEAMENTO DE GRUPOS</span>
                        <h6 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">Anatomia Acumulada</h6>
                      </div>

                      <span className="text-[10px] text-slate-450 font-bold font-mono">Consistência: 100%</span>
                    </div>

                    {/* Miniature interactive muscle heatmap box */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/30 rounded-2xl flex items-center justify-between gap-4">
                      
                      {/* Left: Interactive outline heatmap representations */}
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-450 block">Estimulo de Hoje</span>
                        <div className="flex gap-2.5 flex-wrap">
                          <span className="text-[9.5px] font-bold tracking-tight bg-red-500/10 text-red-600 border border-red-200 px-2 py-0.5 rounded-md">Peitoral Maior</span>
                          <span className="text-[9.5px] font-bold tracking-tight bg-[#7BA7FF]/15 text-[#7BA7FF] px-2 py-0.5 rounded-md">Tríceps Cabeça Lateral</span>
                          <span className="text-[9.5px] font-bold tracking-tight bg-slate-100 text-slate-450 px-2 py-0.5 rounded-md">Deltóide anterior</span>
                        </div>
                      </div>

                      {/* Right: Dummy anatomical indicator indicator */}
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xl text-slate-400 relative">
                        🔥
                        <div className="absolute inset-0 border border-red-500/20 rounded-lg animate-ping" />
                      </div>

                    </div>

                    {/* Progress tracking line placeholder chart (Minimal SVG) */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block px-1">Tonelagem Total por Sessão (kg)</span>
                      
                      <div className="relative h-20 w-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-end p-1">
                        <svg className="w-full h-full text-[#7BA7FF]" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            fill="none" 
                          />
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2 L100,30 L0,30 Z" 
                            fill="url(#gradient)" 
                            opacity="0.1" 
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7BA7FF" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Dot indicator over chart */}
                        <div className="absolute right-4 top-1.5 w-2 h-2 rounded-full bg-[#7BA7FF] animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </section>

      {/* 4. "THE APP KNOWS YOU" INTERACTIVE INSIGHTS SECTION (CRITICAL VALUE) */}
      <section className="py-24 px-6 sm:px-12 bg-white/50 border-y border-slate-100 relative overflow-hidden">
        
        {/* Soft background glow */}
        <div className="absolute top-[20%] left-10 w-96 h-96 bg-[#818CF8]/5 rounded-full pointer-events-none blur-3xl opacity-30" />
        
        <div className="max-w-6xl mx-auto space-y-14 relative z-10 text-center">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="uppercase tracking-[0.25em] text-[10px] font-bold text-slate-400">
              CONEXÃO FISIOLÓGICA REAL
            </span>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-tight">
              Uma conversa inteligente com a sua própria fisiologia.
            </h2>
            <p className="text-slate-500 font-light text-base leading-relaxed">
              O Coach Rubi decodifica e cruza continuamente as suas informações de treino e dieta para apresentar reports de inteligência que evoluem conforme você evolui.
            </p>
          </div>

          {/* TRANSITIONAL DEEP INSIGHTS DISPLAY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5 text-left">
            {floatingInsights.map((ins, index) => {
              const Icon = ins.icon;
              return (
                <motion.div
                  key={ins.id}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`bg-white/80 backdrop-blur-xl p-7 rounded-[2rem] border shadow-[0_10px_35px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-6 relative overflow-hidden ${ins.bg}`}
                >
                  <div className="space-y-4">
                    {/* Header icon badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-white border border-slate-200/50 flex items-center justify-center ${ins.color}`}>
                        <Icon size={16} />
                      </div>
                      
                      <span className="text-lg font-bold font-mono tracking-tight text-slate-800">
                        {ins.metric}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold tracking-tight text-slate-900 uppercase">
                        {ins.title}
                      </h4>
                      <p className="text-xs font-light leading-relaxed text-slate-500 italic">
                        "{ins.desc}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>COACH RUBI LOG</span>
                    <span>AUTOMÁTICO</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. INDEPENDENT MODULE DETAILS (THE THREE PILLARS) */}
      <section className="py-28 px-6 sm:px-12 max-w-7xl mx-auto space-y-32">
        
        {/* PILLAR 1: WORKOUT PLAYER (ELITE MECHANICS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6 text-left">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF] block">
              MÓDULO DE EXPEDIÇÃO FÍSICA
            </span>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-tight">
              O treino deixa de ser manual.<br/>
              A Rubi guia o fluxo.
            </h2>
            
            <p className="text-slate-500 font-light text-base leading-relaxed">
              Diga adeus às complicadas tabelas repletas de anotações ou planilhas desidratadas na academia. Nosso Workout Player imersivo gerencia séries, sugere cargas baseando-se em sua fadiga acumulada e monitora o intervalo exato de recondicionamento das fibras.
            </p>

            <div className="space-y-4 pt-1">
              {[
                { title: 'Autogestão de Descanso', desc: 'Alertas adaptativos para recarregar o estoque de glicogênio e ATP.' },
                { title: 'Célula Cinética Ativa', desc: 'Rastreador de progressão em que o sistema identifica estagnação de força e recalibra as metas das séries.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4.5">
                  <div className="w-5 h-5 rounded-full bg-[#7BA7FF]/10 text-[#7BA7FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide leading-none mb-1.5">{item.title}</h5>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive visual layout mock representation */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-205 rounded-[2.5rem] p-6.5 sm:p-9 shadow-md relative group select-none">
            <div className="absolute top-4 right-4 text-[#7BA7FF]/15 pointer-events-none">
              <Dumbbell size={55} />
            </div>

            <h4 className="text-xs uppercase font-black tracking-[0.2em] text-slate-400 mb-6 font-mono">
              ★ PILAR AUTOMÁTICO DE FORÇA
            </h4>

            {/* List representative items mimicking layout */}
            <div className="space-y-3">
              {[
                { name: '1. Supino 45º Halteres', sets: '4 séries', load: '32kg x 32kg', RPE: 'RPE 8.5' },
                { name: '2. Desenvolvimento Militar', sets: '3 séries', load: '22kg x 22kg', RPE: 'RPE 9.0' },
                { name: '3. Elevação Lateral Unilateral', sets: '4 séries', load: '14kg x 14kg', RPE: 'Foco Pump' }
              ].map((ex, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200/20 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight block">{ex.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{ex.sets} • {ex.load}</span>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-[#7BA7FF] font-mono tracking-tight bg-white border border-slate-200/50 px-3 py-1 rounded-lg">
                    {ex.RPE}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PILLAR 2: METABOLIC OS (NUTRITIONAL BALANCE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Mock on left in destkop */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-205 rounded-[2.5rem] p-6.5 sm:p-9 shadow-md relative order-last lg:order-first select-none">
            <div className="absolute top-4 right-4 text-[#A5C8FF]/20 pointer-events-none">
              <Apple size={55} />
            </div>

            <h4 className="text-xs uppercase font-black tracking-[0.2em] text-slate-400 mb-6 font-mono">
              ★ PILAR NUTRICIONAL ADAPTATIVO
            </h4>

            <div className="space-y-4">
              {/* Daily recommendation preview */}
              <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-2">
                <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-400">Objetivo: Emagrecimento Ativo</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-light text-slate-850">1.840 <span className="text-xs text-slate-400">kcal target</span></span>
                  <span className="text-xs font-semibold text-[#818CF8]">Fator Atividade x1.55</span>
                </div>
              </div>

              {/* Protein focus breakdown card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/50 border border-slate-205 p-3.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-450 block uppercase font-bold">Proteína Calibrada</span>
                  <span className="text-lg font-bold text-slate-800">158g</span>
                </div>
                <div className="bg-slate-50/50 border border-slate-205 p-3.5 rounded-xl text-center">
                  <span className="text-[9px] text-slate-450 block uppercase font-bold">Ingestão Hídrica</span>
                  <span className="text-lg font-bold text-slate-800">3.4 Litros</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#818CF8] block">
              MÓDULO DE EXPEDIÇÃO METABÓLICA
            </span>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-tight">
              A nutrição se torna adaptável. Não mecânica.
            </h2>
            
            <p className="text-slate-500 font-light text-base leading-relaxed">
              Esqueça contagens estáticas e genéricas. O módulo **Minha Dieta** atua como uma central adaptativa metabólica. Ele sincroniza suas calorias, proteínas, carboidratos e de hidratação automaticamente de acordo com o ritmo esportivo real do seu estilo de vida.
            </p>

            <div className="space-y-4 pt-1">
              {[
                { title: 'Recalibração Metabólica em 1 Toque', desc: 'Mude de planos (Anabolismo, Lipólise ou Homeostase) instantaneamente e observe o motor biológico redefinir seus macros celulares correspondentes.' },
                { title: 'Sincronização Ativa de Hidratação', desc: 'Indicação em tempo real baseada nos seus dados de peso que assegura o tônus corporal perfeito.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4.5">
                  <div className="w-5 h-5 rounded-full bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-850 uppercase tracking-wide leading-none mb-1.5">{item.title}</h5>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* 6. ETHEREAL ANATOMICAL & CONSISTENCY DISPLAY */}
      <section className="py-24 px-6 sm:px-12 bg-slate-900 text-white relative overflow-hidden rounded-[4rem] max-w-6xl mx-auto my-12">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#7BA7FF]/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6 text-left">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF]/80">
              MAPA DE RESPOSTA MUSCULAR
            </span>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
              Seu corpo documentado sistematicamente.
            </h2>
            
            <p className="text-slate-400 font-light text-sm sm:text-base leading-relaxed">
              Utilizando cálculos acumulativos de volume de séries por exercícios e contrações miofibrilares estimadas, o sistema sinaliza dinamicamente as regiões musculares mais propensas à hipertrofia e previne fadiga latente no tecido conectivo.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4.5 rounded-[1.5rem] space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Consistência Mensal</span>
                <span className="text-2xl font-light text-white leading-none font-mono">100% ativa</span>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-4.5 rounded-[1.5rem] space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Tonelagem Diária</span>
                <span className="text-2xl font-light text-white leading-none font-mono">+12.450 kg</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center flex-col items-center space-y-4">
            
            {/* Visual calendar consistency grid representing Github/Oura box matrix */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] max-w-full overflow-x-auto w-full space-y-3 relative select-none">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold tracking-wider uppercase">Frequência Semanal</span>
                <span className="font-mono text-[#34D399]">Meta Cumprida</span>
              </div>

              {/* Block rows representational consistency */}
              <div className="grid grid-cols-7 gap-2.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const active = i % 4 !== 0;
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square w-full rounded-md transition-colors ${
                        active 
                          ? 'bg-[#7BA7FF]/90 shadow-sm shadow-[#7BA7FF]/10' 
                          : 'bg-white/10'
                      }`} 
                    />
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium pt-1.5 border-t border-white/5">
                <span>SEGUNDA</span>
                <span>ZONA ESTÁVEL DE SUPORTE</span>
                <span>DOMINGO</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. ATHLETE IDENTITY (COGNITIVE BIOGRAPHY) */}
      <section className="py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="uppercase tracking-[0.25em] text-[10px] font-black text-slate-400">ATLETISMO COGNITIVO</span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900 leading-tight">
            Você não está apenas treinando.<br/>
            Você está forjando uma identidade.
          </h2>
          <p className="text-slate-500 font-light text-base max-w-2xl mx-auto leading-relaxed">
            Consistência real não ocorre por impulsividade. O Coach Rubi registra seus comportamentos biomecânicos e atitudinais criando uma biologia única de atleta ao longo do tempo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          <div className="bg-white/80 border border-slate-200/50 p-7 rounded-[2rem] shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <User size={15} className="text-[#a5c8ff]" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800 pt-1">Identidade Unificada</h4>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Seu Coach centraliza absolutamente tudo: peso, estatura, histórico de lesões, volumes semanais e de carboidratos em um único profile biográfico sutil e integrado.
            </p>
          </div>

          <div className="bg-white/80 border border-slate-200/50 p-7 rounded-[2rem] shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Sliders size={15} className="text-[#818cf8]" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800 pt-1">Biometria de Resposta</h4>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              O sistema se sintoniza aos limites corporais sugerindo retrocessos defensivos inteligentes após dias de extrema exigência metabólica ou noites curtas de sono.
            </p>
          </div>

        </div>
      </section>

      {/* 8. TESTIMONIALS (EDITORIAL SOCIAL PROOF) */}
      <section className="py-24 px-6 sm:px-12 bg-white/70 border-t border-slate-100/80 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-2">
            <span className="uppercase tracking-[0.25em] text-[10.5px] font-bold text-slate-400">AVALIAÇÕES DE EXCELÊNCIA</span>
            <h3 className="text-3xl font-light tracking-tight text-slate-900 ms:text-4xl">Fidelidade e precisão constatada por atletas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                quote: "Pela primeira vez na vida sinto que um aplicativo realmente entende minha fisiologia. O Player adaptativo de RPE é genial.",
                author: "Dr. Matheus Albuquerque",
                role: "Nutricionista Clínico & Atleta de Endurance"
              },
              {
                quote: "Coach Rubi eliminou a papelada chata e as planilhas feias. Parece mais um WHOOP de bolso do que um monitor comum de musculação.",
                author: "Beatriz M. Castilho",
                role: "Atleta Profissional de Powerlifting"
              },
              {
                quote: "A sincronia constante entre o meu gasto calórico real e as frações hídricas otimizou consideravelmente meu rendimento à noite.",
                author: "Lucas K. Yoshida",
                role: "Engenheiro de Biotecnologia"
              }
            ].map((test, i) => (
              <div 
                key={i}
                className="bg-slate-50/70 border border-slate-200/30 p-7.5 rounded-[2rem] flex flex-col justify-between space-y-6 shadow-sm"
              >
                <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed italic">
                  "{test.quote}"
                </p>

                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 block">{test.author}</span>
                  <span className="text-[10px] text-slate-400 block font-light uppercase tracking-wider">{test.role}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. THE FINAL LUXURIOUS CTA BAR */}
      <section className="py-28 px-6 text-center select-none">
        <div className="max-w-3xl mx-auto bg-slate-950 text-white rounded-[3.5rem] p-12 sm:p-20 relative overflow-hidden shadow-2xl border border-slate-900">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="space-y-7 relative z-10">
            <span className="uppercase tracking-[0.25em] text-[9.5px] font-black text-[#7BA7FF]/90">COMPREENSÃO BIOLÓGICA</span>
            
            <h2 className="text-4.5xl sm:text-5.5xl font-light leading-none tracking-tight">
              Pronto para treinar como um verdadeiro <strong className="font-semibold text-[#7BA7FF]">atleta?</strong>
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed">
              Deixe que a biologia atue a seu favor. Instale o ecossistema Coach Rubi gratuitamente em segundos.
            </p>

            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-14 py-5.5 bg-slate-105 bg-white text-slate-950 rounded-3xl font-bold uppercase text-[11px] tracking-[0.22em] shadow-xl hover:scale-[1.03] hover:bg-slate-100 active:scale-[0.97] transition-all cursor-pointer"
            >
              Iniciar Jornada Grátis
            </button>
          </div>
        </div>
      </section>

      {/* 10. LIGHT LUXURY FOOTER */}
      <footer className="py-16 px-8 sm:px-12 border-t border-slate-150 bg-white relative z-15 select-none">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={13} className="text-[#7BA7FF]" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Coach Rubi OS © 2026</span>
          </div>

          <div className="flex gap-8 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            <a href="#" className="hover:text-slate-800 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Performance Lab</a>
          </div>

        </div>
      </footer>


      {/* ======================================================== */}
      {/* 11. SUTILE FLOATING ACTION CONVERSION HELPER (WHEN SCROLLING) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {scrollProgress > 0.15 && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="fixed bottom-6 inset-x-0 z-[120] flex justify-center px-4"
          >
            <div className="bg-slate-900/90 text-white backdrop-blur-md px-5 py-3 rounded-full border border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center gap-4.5">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 bg-[#34D399] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">BIO ENGINE ATIVO</span>
              </div>

              {/* Minimal line divider */}
              <div className="hidden sm:block w-[1px] h-4 bg-white/10" />

              <span className="text-xs font-light text-slate-100 hidden md:block">Consistência é poder. Comece a registrar.</span>

              <button 
                onClick={onStart}
                className="bg-[#7BA7FF] hover:bg-[#7BA7FF]/95 text-slate-950 font-bold px-4 py-2 text-[10px] tracking-[0.16em] uppercase rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Criar Treino
              </button>

              <button 
                onClick={onLogin} 
                className="text-white/70 hover:text-white px-2 text-[10px] font-bold uppercase tracking-wider"
              >
                Entrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
