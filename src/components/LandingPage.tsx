import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
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
  LineChart, 
  Check, 
  Play, 
  RotateCcw, 
  Sliders, 
  ShieldCheck,
  ChevronRight,
  Sparkle
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

type TabType = 'workout' | 'metabolism' | 'coach' | 'evolution';

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Core motion spring configuration
  const springConfig = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 0.8
  };

  // Mock states for interactive Section 03
  const [currentSet, setCurrentSet] = useState(2);
  const [customLoad, setCustomLoad] = useState(84);
  const [secsRemaining, setSecsRemaining] = useState(48);
  const [timerRunning, setTimerRunning] = useState(true);

  const [liveWaterMl, setLiveWaterMl] = useState(750);
  const [bioState, setBioState] = useState(82);

  // Rest timer countdown simulation
  useEffect(() => {
    let interval: any;
    if (timerRunning && secsRemaining > 0) {
      interval = setInterval(() => {
        setSecsRemaining(prev => (prev > 0 ? prev - 1 : 48));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secsRemaining]);

  // Track scroll progress for fine actions
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

  const bentoCards = [
    {
      title: "Protocol Intelligence",
      description: "Adaptive training systems."
    },
    {
      title: "Nutrition OS",
      description: "Dynamic nutrition engine."
    },
    {
      title: "Rubi Intelligence",
      description: "Personalized coaching insights."
    },
    {
      title: "Performance Analytics",
      description: "Progressive overload tracking."
    },
    {
      title: "Athlete Identity",
      description: "Your biological profile."
    },
    {
      title: "Premium Library",
      description: "Expert-designed protocols."
    }
  ];

  const protocolsList = [
    {
      title: "Strength Foundations",
      badge: "Beginner",
      duration: "8 Weeks",
      objective: "Massa & Força de Base",
      bgGradient: "from-slate-900 via-slate-800 to-slate-950",
      accentColor: "border-[#7BA7FF]/35"
    },
    {
      title: "Intelligent Hypertrophy",
      badge: "Intermediate",
      duration: "12 Weeks",
      objective: "Hipertrofia & Volume Estético",
      bgGradient: "from-slate-900 via-indigo-950 to-slate-950",
      accentColor: "border-[#818CF8]/35"
    },
    {
      title: "Metabolic Cut",
      badge: "Fat Loss",
      duration: "8 Weeks",
      objective: "Definição Máxima e Lipólise",
      bgGradient: "from-slate-900 via-cyan-950 to-slate-950",
      accentColor: "border-[#60A5FA]/35"
    },
    {
      title: "Athletic Performance",
      badge: "Advanced",
      duration: "10 Weeks",
      objective: "Velocidade, Potência & GPP",
      bgGradient: "from-slate-900 via-violet-950 to-slate-950",
      accentColor: "border-[#34D399]/35"
    }
  ];

  const realLifeScenarios = [
    {
      title: "Gym is crowded?",
      description: "Replace exercises instantly."
    },
    {
      title: "Need adjustments?",
      description: "Reorganize your workout in real time."
    },
    {
      title: "Changed your goal?",
      description: "Nutrition recalibrates automatically."
    },
    {
      title: "Life got busy?",
      description: "Your progress remains organized."
    }
  ];

  const differencesList = [
    "Adaptive Training",
    "Nutrition Intelligence",
    "Recovery Tracking",
    "Performance Analytics",
    "Progressive Overload",
    "Premium Protocol Library",
    "AI Guidance",
    "Athlete Memory"
  ];

  const rubiInsightsList = [
    { id: 1, text: "Your recovery improved this week." },
    { id: 2, text: "You usually perform better in the evening." },
    { id: 3, text: "Training load remains sustainable." },
    { id: 4, text: "Consistency is trending upward." }
  ];

  const athleteTestimonials = [
    {
      category: "Strength Athlete",
      name: "Marcus Aurelius V.",
      goal: "Força Absoluta",
      quote: "The adaptive fatigue tracker changed how I view recovery. Progression is systematic and incredibly precise."
    },
    {
      category: "Fat Loss Journey",
      name: "Juliana Castilho",
      goal: "Recomposição Corporal",
      quote: "Nutrition recalculates cleanly as my workout volume varies. It makes maintaining deficits simple and natural."
    },
    {
      category: "Busy Professional",
      name: "Roderick Santos",
      goal: "Performance Geral",
      quote: "Short, ultra-focused workflows that remove the clutter. No spreadsheets, just clean action when time is scarce."
    },
    {
      category: "Longevity & Health",
      name: "Dra. Sônia Alencar",
      goal: "Envelhecimento Saudável",
      quote: "A beautiful application tracking biomarkers and muscular balances carefully. Premium execution with solid science."
    },
    {
      category: "Hybrid Athlete",
      name: "Thomas K. Fischer",
      goal: "Resistência & Força",
      quote: "Seamless shifts between intensive lifting blocks and active restoration. KYRON OS is the ideal biological command center."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-light tracking-tight overflow-x-hidden selection:bg-[#7BA7FF]/30 selection:text-slate-950 pb-20">
      
      {/* 🌌 SOFT AMBIENT DIGITAL GLOW BACKGROUNDS */}
      <div className="absolute top-[-150px] left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none blur-[140px] opacity-[0.18] bg-gradient-to-tr from-[#7BA7FF] to-[#818CF8]" />
      <div className="absolute top-[900px] right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none blur-[160px] opacity-[0.12] bg-[#60A5FA]" />
      <div className="absolute bottom-[1000px] left-10 w-[800px] h-[800px] rounded-full pointer-events-none blur-[180px] opacity-[0.14] bg-[#A5C8FF]/40" />

      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 border-b border-white/30 bg-white/60 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/20">
            <Sparkles size={16} className="text-[#7BA7FF]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900 leading-none">KYRON OS</span>
            <span className="text-[7px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Powered by Rubi Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onLogin} 
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Acessar Conta
          </button>
          
          <button 
            onClick={onStart}
            className="hidden sm:inline-flex bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-[10.5px] tracking-[0.18em] uppercase py-3.5 px-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Acessar Sistema
          </button>
        </div>
      </nav>

      {/* SECTION 01 — HERO REFINEMENT */}
      <section className="relative pt-40 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center">
        <div className="max-w-4xl text-center space-y-8 relative z-10">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
            className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.015)]"
          >
            <span className="w-1.5 h-1.5 bg-[#7BA7FF] rounded-full animate-pulse"></span>
            <span className="text-[9.5px] font-black uppercase tracking-[0.25em] text-[#64748B]">
              Adaptive Human Performance OS <span className="text-slate-300 mx-1">•</span> Powered by Rubi Intelligence
            </span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-[4.75rem] font-light tracking-tight leading-[1.05] text-[#0F172A]"
          >
            Built Around Your Biology.<br/>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-[#7BA7FF]">Human Performance,</span><br/>Intelligently Adaptive.
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: 0.2 }}
            className="text-base sm:text-[1.2rem] text-[#334155] font-light max-w-2xl mx-auto leading-relaxed"
          >
            Training. Nutrition. Recovery. Intelligence.<br/>
            <span className="font-semibold text-[#0F172A]">Unified into a single adaptive operating system.</span>
          </motion.p>
          
          {/* Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4.5 pt-6"
          >
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 hover:bg-slate-850 text-white rounded-3xl font-bold uppercase text-[11px] tracking-[0.22em] shadow-xl shadow-slate-950/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Create Free Account
              <ArrowRight size={14} className="text-[#7BA7FF]" />
            </button>
            
            <a 
              href="#experiencia"
              className="w-full sm:w-auto px-10 py-5 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-3xl font-bold text-slate-700 uppercase text-[11px] tracking-[0.22em] shadow-sm hover:bg-white hover:text-slate-950 transition-all hover:scale-[1.02] flex items-center justify-center gap-1 cursor-pointer"
            >
              Explore Ecosystem
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[11px] text-[#64748B] tracking-wide pt-4 max-w-lg mx-auto"
          >
            Trusted by athletes focused on consistency, performance and long-term evolution.
          </motion.p>
        </div>
      </section>

      {/* SECTION 02 — EVERYTHING IN ONE SYSTEM (Bento Grid) */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF]">EXCELLENCE BY DEFAULT</span>
          <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight leading-tight">
            Everything You Need.<br/>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-[#818CF8]">Nothing You Don't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5">
          {bentoCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ ...springConfig, delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white/70 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(15,23,42,0.03)] flex flex-col justify-between group transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-[#64748B] font-mono">Card 0{idx + 1}</h4>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF]/60 group-hover:bg-[#7BA7FF] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] tracking-tight pt-1">
                  {card.title}
                </h3>
                <p className="text-sm text-[#334155] font-light leading-relaxed max-w-xs">
                  {card.description}
                </p>
              </div>
              <div className="pt-6 flex justify-end text-[#7BA7FF] opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 03 — INTERACTIVE PRODUCT EXPERIENCE */}
      <section id="experiencia" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto relative select-none">
        
        <div className="text-center mb-10 space-y-2">
          <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF]">EXPERIENCE THE PLATFORM</span>
          <h2 className="text-3xl font-light text-[#0F172A] tracking-tight">Interactive Biometric Simulator</h2>
        </div>

        {/* Tab Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 pb-2 border-b border-slate-200/30">
          {[
            { id: 'workout' as TabType, label: 'Workout Player', icon: Dumbbell },
            { id: 'metabolism' as TabType, label: 'Nutrition OS', icon: Apple },
            { id: 'coach' as TabType, label: 'Rubi Intelligence', icon: Brain },
            { id: 'evolution' as TabType, label: 'Performance Intelligence', icon: LineChart }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if ('vibrate' in navigator) navigator.vibrate(4); }}
                className="px-5 py-3.5 rounded-full text-xs font-semibold tracking-tight transition-all relative flex items-center gap-2.5 outline-none cursor-pointer"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeLanderTab"
                    className="absolute inset-0 bg-[#7BA7FF]/10 border border-[#7BA7FF]/35 rounded-full shadow-sm"
                    transition={springConfig}
                  />
                )}
                <Icon size={14} className={isActive ? 'text-[#7BA7FF]' : 'text-slate-400'} />
                <span className={isActive ? 'text-[#0F172A] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Simulator Container */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.06)] rounded-[2.5rem] p-6 sm:p-12 min-h-[460px] flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
          
          <div className="lg:w-5/12 text-left space-y-5">
            <span className="text-[10px] font-black tracking-[0.22em] uppercase text-[#7BA7FF]">
              REAL-TIME SIMULATION
            </span>
            <h3 className="text-3xl font-light text-[#0F172A] leading-snug tracking-tight">
              {activeTab === 'workout' && "Expedição de Força Proativa"}
              {activeTab === 'metabolism' && "Autogestão de Metabolismo"}
              {activeTab === 'coach' && "Assistência Rubídica Direta"}
              {activeTab === 'evolution' && "Mapeamento Biométrico"}
            </h3>
            
            <p className="text-sm sm:text-base text-[#334155] font-light leading-relaxed">
              {activeTab === 'workout' && "O Workout Player guia você na academia sem atrito: conta repetições secundárias, acompanha séries atuais, gerencia o descanso e o peso necessário baseado em fadiga anterior."}
              {activeTab === 'metabolism' && "Ajusta suas cotas alimentares em tempo real. Sempre que um treinamento apresenta queima excessiva ou repouso atenuado, sua hidratação e metas proteicas mudam."}
              {activeTab === 'coach' && "Insights e alertas constantes baseados em seu histórico de esforço. Rubi compreende quando aplicar sobrecarga progressiva estruturada de maneira adaptativa."}
              {activeTab === 'evolution' && "Exibe curvas evolutivas de tonelagem e estimativas de 1RM de maneira limpa. Identifica e documenta inconsistências ou conquistas do seu corpo."}
            </p>

            <div className="pt-4 flex gap-4.5">
              <button 
                onClick={onStart}
                className="px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-[0.15em] font-bold transition-all shadow-md cursor-pointer"
              >
                Acessar Plataforma Real
              </button>
            </div>
          </div>

          {/* Interactive display viewport */}
          <div className="w-full lg:w-7/12 flex items-center justify-center relative min-h-[380px]">
            <AnimatePresence mode="wait">
              
              {/* Workout player simulator */}
              {activeTab === 'workout' && (
                <motion.div
                  key="workout-mock"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={springConfig}
                  className="w-full max-w-[340px] bg-slate-950 text-white rounded-[2.5rem] p-6 shadow-2xl relative border border-slate-800"
                >
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-800 rounded-full" />
                  </div>

                  <div className="space-y-5 pt-6">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-[#7BA7FF]/90 font-bold uppercase tracking-wider">▲ SESSÃO EM CURSO</span>
                      <span className="font-mono">RPE Estimado: 8.5</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#7BA7FF] font-bold">Supino Reto com Halteres</span>
                      <h5 className="text-xl font-light text-white leading-tight">Série {currentSet} de 4</h5>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-500">Carga Estimada</span>
                        <span className="text-xl font-semibold text-white font-mono tabular-nums">{customLoad} kg <span className="text-xs font-normal text-slate-400">total</span></span>
                      </div>

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

                    <div className="bg-[#7BA7FF]/5 border border-[#7BA7FF]/15 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#7BA7FF] block mb-0.5 font-mono">DESCANSO ATIVO</span>
                        <span className="text-2xl font-light text-white font-mono leading-none tabular-nums">00:{secsRemaining < 10 ? '0' + secsRemaining : secsRemaining}</span>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setTimerRunning(!timerRunning)}
                          className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg hover:bg-white/15 flex items-center justify-center text-xs"
                        >
                          {timerRunning ? "||" : "▶"}
                        </button>
                        <button 
                          onClick={() => setSecsRemaining(90)}
                          className="w-8 h-8 bg-[#7BA7FF] hover:bg-[#7BA7FF]/80 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center"
                        >
                          <RotateCcw size={11} className="text-slate-950" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSetIncrement}
                      className="w-full bg-slate-100 hover:bg-white text-slate-900 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Check size={13} strokeWidth={3} />
                      <span>Confirmar Série • Próximo</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Nutrition OS simulator */}
              {activeTab === 'metabolism' && (
                <motion.div
                  key="metabolism-mock"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={springConfig}
                  className="w-full max-w-[340px] bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-2xl space-y-4 text-slate-800"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-widest font-black text-[#64748B]">METABÓLICO ATIVO</span>
                      <h6 className="text-sm font-semibold tracking-tight leading-none text-[#0F172A]">Nutrition Targets</h6>
                    </div>
                    
                    <div className="bg-[#7BA7FF]/10 text-[#7BA7FF] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-mono">
                      Bio Score: {bioState}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Balanço Calórico</span>
                      <span className="text-[#0F172A] font-bold font-mono">1.250 / 2.340 kcal</span>
                    </div>
                    <div className="h-2 w-full bg-slate-150 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7BA7FF] rounded-full w-[53%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">Proteínas</span>
                      <span className="font-bold text-[#0F172A] font-mono">112g</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">Carbos</span>
                      <span className="font-bold text-[#0F172A] font-mono">145g</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">Gorduras</span>
                      <span className="font-bold text-[#0F172A] font-mono">42g</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Droplet size={11} className="text-[#60A5FA]" />
                        Hidratação Celular
                      </span>
                      <span className="text-[10.5px] font-bold text-[#0F172A] font-mono">
                        {(liveWaterMl / 1000).toFixed(2)}L <span className="text-slate-400 font-normal">/ 3.2L</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-150 rounded-lg overflow-hidden h-9 relative flex items-center justify-center">
                        <span className="absolute text-[8px] tracking-widest text-[#7BA7FF] font-mono leading-none font-bold z-10">PROGRESSO</span>
                        <div 
                          className="bg-gradient-to-r from-[#60A5FA]/40 to-[#7BA7FF]/50 h-full absolute left-0 top-0 transition-all duration-300"
                          style={{ width: `${Math.min(100, (liveWaterMl / 3200) * 100)}%` }}
                        />
                      </div>

                      <button
                        onClick={handleWaterDrink}
                        className="bg-slate-900 border border-slate-950 text-white rounded-lg px-3.5 hover:bg-slate-800 text-[10px] uppercase tracking-wide font-bold active:scale-95 transition-all outline-none"
                      >
                        Hidratar +250ml
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Rubi Intelligence simulator */}
              {activeTab === 'coach' && (
                <motion.div
                  key="coach-mock"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={springConfig}
                  className="w-full max-w-[340px] bg-slate-950 text-white rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between min-h-[350px] border border-slate-800"
                >
                  <div className="flex items-center gap-2 px-1 border-b border-white/5 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center">
                      <Brain size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block leading-none font-mono">RUBI ACTIVE MEMORY</span>
                      <span className="text-xs font-semibold text-white tracking-tight">Rubi Intelligence</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 py-4 flex-1">
                    <div className="text-right">
                      <span className="inline-block bg-white/10 text-[10.5px] px-3.5 py-2 rounded-2xl rounded-tr-none text-left max-w-[85%] leading-relaxed font-light">
                        "Estou com fadiga de quadríceps, posso substituir o Agachamento de hoje?"
                      </span>
                    </div>

                    <div className="text-left flex gap-2">
                      <div className="w-5 h-5 bg-[#818CF8] text-slate-950 font-bold rounded-full flex items-center justify-center text-[8px] font-mono shrink-0 mt-0.5">R</div>
                      <div className="bg-[#818CF8]/10 border border-[#818CF8]/20 text-[10px] px-3.5 py-2.5 rounded-2xl rounded-tl-none font-light leading-relaxed max-w-[88%] text-slate-200">
                        "Detectei volume de carga em agachamento 15% maior nesta semana. Substitua por <strong className="text-white font-semibold">Leg Press 45º articulado</strong> para preservar articulação fêmoro-patelar. Carga indicada: 140kg."
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 text-[9px] text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                    <span>Hormonal Support: Sustainable Overlay Recommended</span>
                  </div>
                </motion.div>
              )}

              {/* Performance Intelligence simulator */}
              {activeTab === 'evolution' && (
                <motion.div
                  key="evolution-mock"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={springConfig}
                  className="w-full max-w-[340px] bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-2xl space-y-4 text-slate-800"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#64748B]">ANALYSIS ENGINE</span>
                      <h6 className="text-sm font-semibold text-[#0F172A] tracking-tight leading-none">Progression Map</h6>
                    </div>
                    <span className="text-[10px] text-[#7BA7FF] font-bold font-mono">Volume: +18,450 kg</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/20 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Last Exercise</span>
                      <span className="text-xs font-bold tracking-tight text-slate-800 block">Supino Inclinado com Halteres</span>
                    </div>
                    <div className="w-10 h-10 bg-[#7BA7FF]/10 text-[#7BA7FF] rounded-lg flex items-center justify-center font-bold text-sm">
                      1RM
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-[#64748B] block px-1">Progression Slope</span>
                    
                    <div className="relative h-20 w-full bg-slate-50 border border-slate-150 rounded-xl overflow-hidden flex items-end p-1">
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
                      <div className="absolute right-4 top-1.5 w-2 h-2 rounded-full bg-[#7BA7FF] animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* SECTION 04 — PROTOCOLS THAT EVOLVE */}
      <section className="py-24 px-6 sm:px-12 bg-white/40 border-y border-slate-150">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#818CF8]">CONTINUOUS IMPROVEMENTS</span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
              Protocols That Improve Over Time
            </h2>
            <p className="text-[#334155] font-light text-base max-w-2xl mx-auto leading-relaxed">
              Your training system evolves continuously. You decide when improvements become part of your journey.
            </p>
          </div>

          {/* Visual Concept: v1 -> v2 -> v3 -> v4 */}
          <div className="relative py-12 flex flex-col md:flex-row items-center justify-between gap-8 max-w-2xl mx-auto">
            {/* Progression animated connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 md:top-12 md:bottom-auto md:left-4 md:right-4 h-full md:h-[2px] bg-slate-200 -z-10 w-[2px] md:w-[94%]">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            {['v1', 'v2', 'v3', 'v4'].map((version, idx) => (
              <motion.div 
                key={version}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...springConfig, delay: idx * 0.15 }}
                className="w-24 h-24 rounded-full bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.02)] flex flex-col items-center justify-center relative bg-white/90 backdrop-blur"
              >
                <span className="text-xl font-bold text-[#0F172A] font-mono">{version}</span>
                <span className="text-[8px] font-black uppercase text-[#64748B] tracking-widest mt-1">Version</span>
                
                {idx === 3 && (
                  <span className="absolute -top-2 -right-2 bg-[#7BA7FF]/15 border border-[#7BA7FF]/30 text-[#7BA7FF] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            {["New Exercises", "Improved Structure", "Updated Recommendations"].map((chip, i) => (
              <motion.span 
                key={chip}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springConfig, delay: i * 0.1 }}
                className="px-4.5 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-[#334155] shadow-sm tracking-wide"
              >
                {chip}
              </motion.span>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 05 — PREMIUM PROTOCOL LIBRARY */}
      <section className="py-24 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-16 gap-4">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF]">EXPERT PROTOCOLS</span>
              <h2 className="text-3xl sm:text-[2.75rem] font-light tracking-tight text-white leading-tight">
                Premium Protocol Library
              </h2>
            </div>
            <p className="text-[#64748B] text-xs font-mono uppercase tracking-widest leading-none hidden md:block">
              Luxury Sports Experience
            </p>
          </div>

          {/* Horizontal Scrolling Rows */}
          <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none snap-x snap-mandatory">
            {protocolsList.map((prot, idx) => (
              <motion.div 
                key={idx}
                className="flex-shrink-0 w-80 md:w-96 bg-gradient-to-br border border-white/5 p-8 rounded-[2.5rem] snap-start relative overflow-hidden flex flex-col justify-between h-[360px] cursor-pointer group"
                style={{ backgroundImage: `linear-gradient(to bottom right, #1E293B, #0F172A)` }}
                whileHover={{ y: -6, borderColor: 'rgba(123, 167, 255, 0.25)' }}
                transition={springConfig}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold bg-white/10 text-[#7BA7FF] border border-white/10 px-3.5 py-1.5 rounded-full">
                      {prot.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-bold">{prot.duration}</span>
                  </div>

                  <h3 className="text-2xl font-light text-white leading-tight pt-2 group-hover:text-[#7BA7FF] transition-colors">
                    {prot.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 font-light tracking-wide italic">
                    {prot.objective}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9.5px] uppercase font-bold text-[#7BA7FF] tracking-widest flex items-center gap-1.5 leading-none">
                    <Sparkle size={10} className="fill-[#7BA7FF]" />
                    PREMIUM PROTOCOL
                  </span>
                  
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-[#7BA7FF]/20 group-hover:border-[#7BA7FF]/60 transition-all">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 06 — PERFORMANCE INTELLIGENCE */}
      <section className="py-24 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-16">
        
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF]">TELEMETRY SUMMARY</span>
          <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
            Progress You Can Actually See
          </h2>
        </div>

        {/* Hero Metric */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[3rem] p-12 max-w-2xl mx-auto shadow-[0_10px_40px_rgba(15,23,42,0.03)] space-y-2 relative overflow-hidden select-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7BA7FF] to-[#818CF8]" />
          <span className="text-6xl sm:text-8xl font-thin tracking-tighter text-[#0F172A] font-mono">
            18,450 kg
          </span>
          <p className="text-xs uppercase font-black text-[#64748B] tracking-[0.3em] font-mono">
            Total Load Moved
          </p>
        </div>

        {/* Editorial Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { label: "Consistency", value: "100%" },
            { label: "Recovery", value: "Optimum" },
            { label: "Progression", value: "Linear" },
            { label: "Training Load", value: "Sustainable" }
          ].map((tel, i) => (
            <div 
              key={i}
              className="bg-white border border-slate-200/70 p-6 rounded-2xl shadow-sm text-left space-y-1.5"
            >
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-bold block">{tel.label}</span>
              <span className="text-xl font-light text-[#0F172A] font-mono">{tel.value}</span>
            </div>
          ))}
        </div>

      </section>

      {/* SECTION 07 — NUTRITION OS */}
      <section className="py-24 px-6 sm:px-12 bg-white/60 border-y border-slate-200/65 relative overflow-hidden text-center">
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#60A5FA]">BIO RECALIBRATION</span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
              Metabolism That Adapts With You
            </h2>
            <p className="text-[#334155] font-light text-base max-w-2xl mx-auto leading-relaxed">
              Every change automatically recalculates your biological targets.
            </p>
          </div>

          {/* Central visual: Large adaptive metabolic ring */}
          <div className="w-56 h-56 mx-auto rounded-full border-[10px] border-[#7BA7FF]/10 border-t-[#7BA7FF] border-r-[#818CF8] flex flex-col items-center justify-center shadow-lg relative select-none">
            <div className="absolute inset-0 rounded-full border-1 border-[#7BA7FF]/5 bg-white/70 backdrop-blur -z-10" />
            <span className="text-4xl font-thin tracking-tight font-mono text-[#0F172A] leading-none mb-1">
              98%
            </span>
            <span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">Efficiency</span>

            {/* Inner dynamic items */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 border border-slate-200 rounded-full text-[8.5px] font-bold text-[#64748B] uppercase tracking-widest shadow-sm">
              Calories
            </div>
            <div className="absolute top-1/2 -right-5 -translate-y-1/2 bg-white px-2.5 py-1 border border-slate-200 rounded-full text-[8.5px] font-bold text-[#64748B] uppercase tracking-widest shadow-sm">
              Protein
            </div>
            <div className="absolute top-1/2 -left-5 -translate-y-1/2 bg-white px-2.5 py-1 border border-slate-200 rounded-full text-[8.5px] font-bold text-[#64748B] uppercase tracking-widest shadow-sm">
              Hydration
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2.5 py-1 border border-slate-200 rounded-full text-[8.5px] font-bold text-[#64748B] uppercase tracking-widest shadow-sm">
              Energy
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 08 — BUILT FOR REAL LIFE */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        
        <div className="text-center mb-16 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF]">ADAPTABILITY ALWAYS</span>
          <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
            Built For Real Life
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6.5">
          {realLifeScenarios.map((scen, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ ...springConfig, delay: index * 0.08 }}
              className="bg-white border border-slate-200/80 p-8 rounded-[2rem] shadow-[0_6px_25px_rgba(15,23,42,0.015)] relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7BA7FF]/40" />
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wide block">Scenario 0{index + 1}</span>
                <h4 className="text-xl font-bold tracking-tight text-[#0F172A] pt-1">
                  {scen.title}
                </h4>
                <p className="text-sm text-[#334155] font-light leading-relaxed pt-1.5">
                  {scen.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 09 — THE KYRON DIFFERENCE */}
      <section className="py-24 px-6 sm:px-12 bg-white/40 border-y border-slate-150">
        <div className="max-w-4xl mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#818CF8]">CAPABILITY LIST</span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
              Why KYRON Feels Different
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {differencesList.map((diff, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...springConfig, delay: i * 0.07 }}
                className="flex items-center gap-4.5 bg-white border border-slate-200/60 p-5.5 rounded-2xl"
              >
                <div className="w-5 h-5 rounded-full bg-[#34D399]/15 text-[#34D399] flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-sm font-semibold text-[#334155] tracking-wide">
                  {diff}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 10 — RUBI INTELLIGENCE */}
      <section className="py-24 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF]">ARTIFICIAL INTELLECT</span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#0F172A] tracking-tight">
              Powered by Rubi Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {rubiInsightsList.map((insight, idx) => (
              <motion.div
                key={insight.id}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.7 }}
                className="bg-white border border-slate-205 p-6 rounded-[1.75rem] shadow-sm flex items-center gap-4 relative overflow-hidden"
              >
                <div className="w-1.5 h-full absolute left-0 top-0 bg-[#818CF8]" />
                <div className="w-8 h-8 rounded-full bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center text-xs shrink-0 font-mono font-bold">
                  R
                </div>
                <p className="text-sm text-[#0F172A] font-light leading-relaxed">
                  {insight.text}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 11 — SOCIAL PROOF REFINEMENT */}
      <section className="py-24 px-6 sm:px-12 bg-white/70 border-t border-slate-150 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="text-center space-y-2">
            <span className="uppercase tracking-[0.25em] text-[10px] font-bold text-[#64748B]">AUTHENTIC BIOMETRIES</span>
            <h2 className="text-3xl sm:text-4.5xl font-light tracking-tight text-[#0F172A]">Real Athlete Biographies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {athleteTestimonials.map((test, i) => (
              <div 
                key={i}
                className="bg-white border border-slate-200 p-7.5 rounded-[2.25rem] flex flex-col justify-between space-y-6 shadow-[0_6px_25px_rgba(15,23,42,0.01)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-widest font-black text-[#7BA7FF] bg-[#7BA7FF]/5 px-2.5 py-1 rounded-md border border-[#7BA7FF]/10">
                      {test.category}
                    </span>
                    <span className="text-[9px] text-[#64748B] font-mono leading-none">{test.goal}</span>
                  </div>
                  
                  <p className="text-sm text-[#334155] font-light leading-relaxed italic pt-1">
                    "{test.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-950 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                    {test.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0F172A] tracking-wide block">{test.name}</span>
                    <span className="text-[9px] text-[#64748B] block">KYRON OS Profile Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 12 — FINAL CONVERSION BLOCK */}
      <section className="py-24 px-6 text-center select-none">
        <div className="max-w-4xl mx-auto bg-slate-950 text-white rounded-[3.5rem] p-12 sm:p-24 relative overflow-hidden shadow-2xl border border-slate-900">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-[#7BA7FF]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF]">BIOLOGICAL ALIGNMENT</span>
            
            <h2 className="text-3xl sm:text-5xl font-light leading-tight tracking-tight">
              Start Your First Protocol<br/>
              <span className="font-semibold text-[#7BA7FF]">In Less Than 3 Minutes</span>
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-base font-light max-w-md mx-auto leading-relaxed">
              No spreadsheets. No complexity. Just intelligent human performance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 rounded-3xl font-bold uppercase text-[11px] tracking-[0.22em] shadow-xl hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
              >
                Create Free Account
              </button>

              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-12 py-5 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-3xl font-bold uppercase text-[11px] tracking-[0.22em] transition-colors cursor-pointer"
              >
                Access Platform
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY FOOTER */}
      <footer className="py-16 px-8 sm:px-12 border-t border-slate-150 bg-white relative z-15 select-none">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={13} className="text-[#7BA7FF]" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#64748B]">KYRON OS © 2026</span>
          </div>

          <div className="flex gap-8 text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
            <a href="#" className="hover:text-slate-800 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Performance Lab</a>
          </div>

        </div>
      </footer>

      {/* SUTILE FLOATING ACTION CONVERSION HELPER */}
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
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">BIO ENGINE ACTIVE</span>
              </div>

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
