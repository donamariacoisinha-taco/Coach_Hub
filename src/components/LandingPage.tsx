import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import kyronLogo from '../assets/images/kyron_official_logo_1781087891387.png';
import kyronCoreLogo from '../assets/images/kyron_core_logo_1781042739395.png';
import kyronCoreV2 from '../assets/images/kyron_core_v2_1781043247216.png';
import { 
  Sparkles, 
  ArrowRight, 
  Droplet, 
  Apple, 
  Dumbbell, 
  ArrowUpRight, 
  Brain, 
  LineChart, 
  Check, 
  RotateCcw, 
  Sparkle,
  Target,
  Activity,
  Flame,
  TrendingUp,
  User,
  ShieldCheck,
  Download,
  Copy,
  X,
  ExternalLink,
  Smartphone,
  Monitor,
  Play,
  Layout,
  Eye,
  CheckCircle2,
  CheckSquare,
  Tablet
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

type TabType = 'workout' | 'metabolism' | 'coach' | 'evolution';

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [lang, setLang] = useState<'PT' | 'EN'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kyron_lang') : null;
    return saved === 'EN' ? 'EN' : 'PT';
  });

  const toggleLang = (selected: 'PT' | 'EN') => {
    setLang(selected);
    localStorage.setItem('kyron_lang', selected);
  };

  const t = (key: keyof typeof translations['PT']) => {
    return translations[lang][key] || translations['PT'][key];
  };

  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [brandKitTab, setBrandKitTab] = useState<'appicons' | 'logos' | 'favicons' | 'splash' | 'usage' | 'validation'>('appicons');
  const [splashAnimationTrigger, setSplashAnimationTrigger] = useState(0);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // Core motion spring configuration
  const springConfig = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 0.8
  };

  // Mock states for interactive simulator
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

  // Track scroll progress
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

  // Bento grids representing premium architecture features
  const bentoCards = [
    {
      titleKey: "bentoCard1Title" as const,
      descKey: "bentoCard1Desc" as const,
      categoryKey: "bentoCard1Cat" as const
    },
    {
      titleKey: "bentoCard2Title" as const,
      descKey: "bentoCard2Desc" as const,
      categoryKey: "bentoCard2Cat" as const
    },
    {
      titleKey: "bentoCard3Title" as const,
      descKey: "bentoCard3Desc" as const,
      categoryKey: "bentoCard3Cat" as const
    },
    {
      titleKey: "bentoCard4Title" as const,
      descKey: "bentoCard4Desc" as const,
      categoryKey: "bentoCard4Cat" as const
    },
    {
      titleKey: "bentoCard5Title" as const,
      descKey: "bentoCard5Desc" as const,
      categoryKey: "bentoCard5Cat" as const
    },
    {
      titleKey: "bentoCard6Title" as const,
      descKey: "bentoCard6Desc" as const,
      categoryKey: "bentoCard6Cat" as const
    }
  ];

  // Exclusive curriculum protocols mapped to create curiosity
  const protocolsList = [
    {
      titlePT: "Força Progressiva",
      titleEN: "Progressive Strength",
      difficultyPT: "Iniciante • Avançado",
      difficultyEN: "Beginner • Advanced",
      objectivePT: "Foco em sobrecarga progressiva",
      objectiveEN: "Focus on progressive overload",
      durationPT: "8 sem",
      durationEN: "8 wks"
    },
    {
      titlePT: "Hipertrofia Essencial",
      titleEN: "Essential Hypertrophy",
      difficultyPT: "Intermediário",
      difficultyEN: "Intermediate",
      objectivePT: "Ganho de massa muscular sólida",
      objectiveEN: "Solid muscle mass gain",
      durationPT: "12 sem",
      durationEN: "12 wks"
    },
    {
      titlePT: "Primeiro Programa",
      titleEN: "First Program",
      difficultyPT: "Iniciante",
      difficultyEN: "Beginner",
      objectivePT: "Fundamentos e adaptação neuro",
      objectiveEN: "Fundamentals and neuro adaptation",
      durationPT: "6 sem",
      durationEN: "6 wks"
    },
    {
      titlePT: "4 Dias por Semana",
      titleEN: "4 Days per Week",
      difficultyPT: "Geral",
      difficultyEN: "General",
      objectivePT: "Divisão híbrida de alta eficiência",
      objectiveEN: "High-efficiency hybrid split",
      durationPT: "10 sem",
      durationEN: "10 wks"
    }
  ];

  const rubiInsightsList = [
    { id: 1, text: "You recover better with slightly longer rest intervals." },
    { id: 2, text: "Your performance is strongest in the evening." },
    { id: 3, text: "You are progressing faster than last month." }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-light tracking-tight overflow-x-hidden selection:bg-[#7BA7FF]/30 selection:text-slate-950 pb-20">
      
      {/* 🌌 SOFT AMBIENT DIGITAL GLOW BACKGROUNDS */}
      <div className="absolute top-[-150px] left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none blur-[140px] opacity-[0.18] bg-gradient-to-tr from-[#7BA7FF] to-[#818CF8]" />
      <div className="absolute top-[900px] right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none blur-[160px] opacity-[0.12] bg-[#60A5FA]" />
      <div className="absolute bottom-[1000px] left-10 w-[800px] h-[800px] rounded-full pointer-events-none blur-[180px] opacity-[0.14] bg-[#A5C8FF]/40" />

      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 border-b border-white/20 bg-white/60 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="border border-white/40 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-xl" style={{ width: '48px', height: '47px', paddingLeft: '2px', paddingTop: '5px', paddingRight: '2px', paddingBottom: '2px', marginLeft: '1px', marginRight: '1px', marginTop: '1px', marginBottom: '1px' }}>
            <img 
              src={kyronLogo} 
              alt="KYRON OS" 
              className="w-full h-full object-contain scale-[1.75] transform transition-transform hover:scale-[1.9] duration-500" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900 leading-none">KYRON OS</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Discrete Language Switcher */}
          <div className="bg-slate-100/80 backdrop-blur-md rounded-full border border-slate-200/60 p-0.5 sm:p-1 flex items-center gap-0.5 shadow-sm">
            <button
              onClick={() => toggleLang('PT')}
              className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-full transition-all cursor-pointer ${lang === 'PT' ? 'bg-[#7BA7FF]/20 text-slate-900 border border-[#7BA7FF]/30' : 'text-slate-400 hover:text-slate-700 border border-transparent'}`}
            >
              PT
            </button>
            <button
              onClick={() => toggleLang('EN')}
              className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-full transition-all cursor-pointer ${lang === 'EN' ? 'bg-[#7BA7FF]/20 text-slate-900 border border-[#7BA7FF]/30' : 'text-slate-400 hover:text-slate-700 border border-transparent'}`}
            >
              EN
            </button>
          </div>

          <button 
            id="nav-login"
            onClick={onLogin} 
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            {t('login')}
          </button>
          
          <button 
            id="nav-start"
            onClick={onStart}
            className="hidden sm:inline-flex bg-[#7BA7FF] hover:bg-[#8FBCFF] text-[#0F172A] hover:shadow-[0_4px_15px_rgba(123,167,255,0.45)] font-bold text-[10.5px] tracking-[0.18em] uppercase py-3.5 px-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {t('start')}
          </button>
        </div>
      </nav>

      {/* SECTION 01 — HERO & PREMIUM PRODUCT PREVIEW (VISUALLY DOMINATING THE FIRST SCREEN) */}
      <section className="relative pt-24 sm:pt-28 pb-10 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Premium Transformative Hook */}
          <div className="lg:col-span-5 text-left space-y-6 relative z-10">
            
            {/* Elegant Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#7BA7FF]/10 border border-[#7BA7FF]/20 rounded-full"
            >
              <span className="w-1.5 h-1.5 bg-[#7BA7FF] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 font-mono">
                KYRON OS
              </span>
            </motion.div>
            
            {/* Headline focus: "Treinos inteligentes. Evolução real." */}
            <div className="space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-[3.2rem] font-light tracking-tight leading-[1.1] text-[#0F172A]"
              >
                {lang === 'PT' ? (
                  <>
                    Treinos inteligentes.<br />
                    <span className="font-semibold text-slate-900">Evolução real.</span>
                  </>
                ) : (
                  <>
                    Smart workouts.<br />
                    <span className="font-semibold text-slate-900">Real evolution.</span>
                  </>
                )}
              </motion.h1>
              
              {/* Subheadline focus: Unified Intelligent Ecosystem */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.2 }}
                className="text-sm sm:text-base text-[#334155] font-light leading-relaxed max-w-xl"
              >
                {lang === 'PT' 
                  ? "Monte seu plano e acompanhe sua progressão de força em um único lugar."
                  : "Build your plan and track your strength progression in one single place."
                }
              </motion.p>
            </div>
            
            {/* Immediate Action Conversion Area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springConfig, delay: 0.3 }}
              className="pt-2"
            >
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <motion.button 
                  id="hero-cta-start"
                  onClick={onStart}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="w-full sm:w-auto h-13 px-8 bg-[#7BA7FF] hover:bg-[#8FBCFF] text-[#0F172A] hover:shadow-[0_8px_25px_rgba(123,167,255,0.45)] border-none rounded-full font-bold uppercase text-[10.5px] tracking-[0.18em] flex items-center justify-center gap-2 cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <span>{lang === 'PT' ? 'Começar Agora' : 'Get Started Now'}</span>
                  <ArrowRight size={13} className="text-[#0F172A]" />
                </motion.button>
                
                <motion.button 
                  onClick={() => {
                    const el = document.getElementById('protocols-preview');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      onStart();
                    }
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="w-full sm:w-auto h-13 px-8 bg-[#EAF2FF] text-[#0F172A] hover:bg-[#D5E6FF] rounded-full font-bold uppercase text-[10.5px] tracking-[0.18em] flex items-center justify-center gap-1 cursor-pointer border border-blue-150"
                >
                  {lang === 'PT' ? 'Ver Protocolos' : 'View Protocols'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive Simulator DOMINATING first screen */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7BA7FF]/5 via-white/0 to-[#818CF8]/5 rounded-[3rem] blur-2xl -z-10" />
            
            {/* Sleek Tabs Selection bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 p-1 bg-slate-200/40 rounded-2xl w-full max-w-[540px]">
              {[
                { id: 'workout' as TabType, labelKey: 'tabWorkout' as const, icon: Dumbbell },
                { id: 'metabolism' as TabType, labelKey: 'tabNutrition' as const, icon: Apple },
                { id: 'coach' as TabType, labelKey: 'tabRubi' as const, icon: Brain },
                { id: 'evolution' as TabType, labelKey: 'tabProgression' as const, icon: LineChart }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`sim-tab-${tab.id}`}
                    onClick={() => { setActiveTab(tab.id); if ('vibrate' in navigator) navigator.vibrate(4); }}
                    className="px-4 py-2 rounded-xl text-[10.5px] font-semibold tracking-tight transition-all relative flex items-center gap-2 outline-none cursor-pointer flex-1 justify-center"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeHeroTab"
                        className="absolute inset-0 bg-white border border-slate-200 rounded-xl shadow-sm"
                        transition={springConfig}
                      />
                    )}
                    <Icon size={12} className={isActive ? 'text-[#7BA7FF] relative z-10' : 'text-slate-500 relative z-10'} />
                    <span className={isActive ? 'text-[#0F172A] font-bold relative z-10' : 'text-[#64748B] hover:text-[#0F172A] relative z-10'}>
                      {t(tab.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* High fidelity simulation preview */}
            <div className="w-full max-w-[480px] bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_15px_40px_rgba(15,23,42,0.06)] rounded-[2.5rem] p-5 min-h-[360px] flex items-center justify-center overflow-hidden relative">
              <AnimatePresence mode="wait">
                      {/* Workout system */}
                {activeTab === 'workout' && (
                  <motion.div
                    key="workout-mock"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={springConfig}
                    className="w-full max-w-[340px] bg-white/90 text-[#0F172A] rounded-[2.25rem] p-6 shadow-xl relative border border-slate-200/80 backdrop-blur-md"
                  >
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-100 rounded-full flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-slate-200 rounded-full" />
                    </div>

                    <div className="space-y-5 pt-4">
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="font-mono text-[#7BA7FF] font-bold uppercase tracking-wider">{t('activeProtocol')}</span>
                        <span className="font-mono text-slate-400">{t('rpeTarget')}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#7BA7FF] font-bold block">{t('inclinePress')}</span>
                        <h5 className="text-lg font-light text-[#0F172A] leading-tight">{t('setCount').replace('{currentSet}', currentSet.toString())}</h5>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 block">{t('activeLoad')}</span>
                          <span className="text-lg font-semibold text-[#0F172A] font-mono tabular-nums">{customLoad} kg <span className="text-xs font-normal text-slate-450">{t('total')}</span></span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.max(10, prev - 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200/80 text-[#0F172A] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                          >
                            -
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.min(200, prev + 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200/80 text-[#0F172A] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#7BA7FF]/8 border border-[#7BA7FF]/20 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-[#7BA7FF] block mb-0.5 font-mono">{t('restDecay')}</span>
                          <span className="text-xl font-light text-[#0F172A] font-mono leading-none tabular-nums">00:{secsRemaining < 10 ? '0' + secsRemaining : secsRemaining}</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center justify-center text-xs cursor-pointer"
                          >
                            {timerRunning ? "||" : "▶"}
                          </button>
                          <button 
                            onClick={() => setSecsRemaining(90)}
                            className="w-7 h-7 bg-[#7BA7FF] hover:bg-[#7BA7FF]/90 text-slate-950 font-bold text-xs rounded-md flex items-center justify-center cursor-pointer"
                          >
                            <RotateCcw size={10} className="text-slate-950" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSetIncrement}
                        className="w-full bg-[#0F172A] hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Check size={12} strokeWidth={3} />
                        <span>{t('confirmSet')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Metabolism system */}
                {activeTab === 'metabolism' && (
                  <motion.div
                    key="metabolism-mock"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={springConfig}
                    className="w-full max-w-[340px] bg-white border border-slate-200/70 rounded-[2.25rem] p-6 shadow-2xl space-y-4 text-slate-800"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest font-black text-[#64748B] block">{t('metabolicCore')}</span>
                        <h6 className="text-sm font-semibold tracking-tight text-[#0F172A]">{t('nutritionIntel')}</h6>
                      </div>
                      
                      <div className="bg-[#7BA7FF]/10 text-[#7BA7FF] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-mono">
                        {t('bioScore')}: {bioState}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-[#64748B] font-medium font-mono text-[9.5px]">{t('caloricBalance')}</span>
                        <span className="text-[#0F172A] font-bold font-mono">1,420 / 2,580 kcal</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7BA7FF] rounded-full w-[55%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">{t('protein')}</span>
                        <span className="font-bold text-[#0F172A] font-mono leading-none">148g</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">{t('carbs')}</span>
                        <span className="font-bold text-[#0F172A] font-mono leading-none">184g</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[#64748B] block mb-0.5 text-[8px] uppercase font-bold">{t('fats')}</span>
                        <span className="font-bold text-[#0F172A] font-mono leading-none">58g</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-150 p-3 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Droplet size={10} className="text-[#60A5FA]" />
                          {t('waterEquilibrium')}
                        </span>
                        <span className="text-[10px] font-bold text-[#0F172A] font-mono">
                          {(liveWaterMl / 1000).toFixed(2)}L <span className="text-slate-400 font-normal">/ 3.5L</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-200/50 rounded-lg overflow-hidden h-8.5 relative flex items-center justify-center">
                          <span className="absolute text-[8px] tracking-wider text-[#7BA7FF] font-mono font-bold z-10 leading-none">{t('activeBioRatio')}</span>
                          <div 
                            className="bg-gradient-to-r from-[#60A5FA]/40 to-[#7BA7FF]/50 h-full absolute left-0 top-0 transition-all duration-300"
                            style={{ width: `${Math.min(100, (liveWaterMl / 3500) * 100)}%` }}
                          />
                        </div>

                        <button
                          onClick={handleWaterDrink}
                          className="bg-slate-900 text-white rounded-lg px-3 hover:bg-slate-800 text-[9.5px] uppercase tracking-wide font-bold active:scale-95 transition-all outline-none cursor-pointer"
                        >
                          {t('drink')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rubi Intelligence Memory outcome system */}
                {activeTab === 'coach' && (
                  <motion.div
                    key="coach-mock"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={springConfig}
                    className="w-full max-w-[340px] bg-white/90 text-[#0F172A] rounded-[2.25rem] p-6 shadow-xl flex flex-col justify-between min-h-[300px] border border-slate-200/80 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center">
                        <Brain size={12} />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold block leading-none font-mono">{t('rubiLog')}</span>
                        <span className="text-[10.5px] font-semibold text-[#0F172A] tracking-tight">{t('systemicCalibration')}</span>
                      </div>
                    </div>

                    <div className="space-y-3 py-3.5 flex-1">
                      <div className="text-right">
                        <span className="inline-block bg-slate-100 text-[#0F172A] text-[10px] px-3.5 py-2 rounded-2xl rounded-tr-none text-left max-w-[85%] font-light border border-slate-200/40 shadow-sm">
                          {t('interactiveQuestion')}
                        </span>
                      </div>

                      <div className="text-left flex gap-2">
                        <div className="w-5.5 h-5.5 bg-[#818CF8] text-white font-bold rounded-full flex items-center justify-center text-[8.5px] font-mono shrink-0 pt-0.5" id="rubi-response-pill">R</div>
                        <div className="bg-[#818CF8]/8 border border-[#818CF8]/15 text-[9.5px] px-3 py-2 rounded-xl rounded-tl-none font-light leading-relaxed max-w-[88%] text-slate-700">
                          {t('interactiveAnswer')}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex items-center gap-2 text-[8px] text-slate-500 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span>{t('rubiStateActive')}</span>
                    </div>
                  </motion.div>
                )}

                {/* Progression Intelligence analytics graph */}
                {activeTab === 'evolution' && (
                  <motion.div
                    key="evolution-mock"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={springConfig}
                    className="w-full max-w-[340px] bg-white border border-slate-200/70 rounded-[2.25rem] p-6 shadow-2xl space-y-4 text-slate-800"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#64748B] block">{t('biometricSlope')}</span>
                        <h6 className="text-[12px] font-semibold text-[#0F172A] tracking-tight">{t('activeOverloadStream')}</h6>
                      </div>
                      <span className="text-[9.5px] text-[#7BA7FF] font-bold font-mono">{t('efficiency')}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5 flex-1">
                        <span className="text-[8px] uppercase font-bold text-[#64748B] block">{t('tonnageFactor')}</span>
                        <span className="text-[10.5px] font-bold tracking-tight text-slate-800 block">{t('weeklyVolume')}</span>
                      </div>
                      <div className="w-9 h-9 bg-[#7BA7FF]/10 text-[#7BA7FF] rounded-lg flex items-center justify-center font-bold text-xs">
                        1RM
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[8px] uppercase font-bold text-[#64748B] block px-1">{t('continuousEvolution')}</span>
                      
                      <div className="relative h-20 w-full bg-slate-50 border border-slate-150 rounded-lg overflow-hidden flex items-end p-1">
                        <svg className="w-full h-full text-[#7BA7FF]" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            fill="none" 
                          />
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2 L100,30 L0,30 Z" 
                            fill="url(#progressGradient)" 
                            opacity="0.1" 
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
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

        </div>
      </section>

      {/* SECTION 02 — BENEFITS & HOW IT WORKS */}
      <section className="py-8 px-6 sm:px-12 max-w-7xl mx-auto border-t border-slate-200/40 space-y-8 select-none">
        
        {/* BENEFITS: Compact Horizontal Layout */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
          {[
            { label: lang === 'PT' ? 'Protocolos prontos' : 'Ready protocols' },
            { label: lang === 'PT' ? 'Progressão de cargas' : 'Load progression' },
            { label: lang === 'PT' ? 'Histórico completo' : 'Full history' },
            { label: lang === 'PT' ? 'Evolução de força' : 'Strength evolution' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#7BA7FF]/10 text-[#7BA7FF] flex items-center justify-center font-bold text-xs shrink-0 select-none">✓</span>
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800 font-mono">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-24 h-[1px] bg-slate-200/60 mx-auto" />

        {/* HOW IT WORKS: Compact 3-Step Row with No Large Cards / Illustrations */}
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF] font-mono block">
              {lang === 'PT' ? 'PASSO A PASSO' : 'STEP BY STEP'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { num: '1', title: lang === 'PT' ? 'Crie sua conta' : 'Create your account' },
              { num: '2', title: lang === 'PT' ? 'Escolha um protocolo' : 'Choose a protocol' },
              { num: '3', title: lang === 'PT' ? 'Comece a treinar' : 'Start training' }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-start md:justify-center gap-4 bg-white border border-slate-200/40 p-3.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
              >
                <div className="w-8 h-8 rounded-full bg-[#7BA7FF] text-[#0F172A] font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                  {step.num}
                </div>
                <span className="text-sm font-semibold text-slate-900 tracking-tight">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03 — BIBLIOTECA PREMIUM (Compact Horizontal Netflix/Apple TV Carousel) */}
      <section id="protocols-preview" className="py-12 bg-white border-y border-slate-200/40 text-[#0F172A]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex items-end justify-between mb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF] font-mono block">
                {lang === 'PT' ? 'SISTEMA DE PLANILHAS' : 'SYSTEM SPREADSHEETS'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#0F172A]">
                {lang === 'PT' ? 'Biblioteca de Protocolos' : 'Protocol Library'}
              </h2>
              <p className="text-slate-505 font-mono text-[9px] uppercase tracking-wider block">
                {lang === 'PT' ? 'PROGRAMAS VALIDADOS' : 'VALIDATED PROGRAMS'}
              </p>
            </div>
            <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest hidden sm:block">
              {lang === 'PT' ? 'Arraste para o lado →' : 'Swipe to explore →'}
            </span>
          </div>

          {/* Elegant Horizontal Carousel with Premium Design */}
          <div className="flex overflow-x-auto gap-4 pb-4 px-1 -mx-4 sm:-mx-12 sm:px-12 scrollbar-none snap-x snap-mandatory pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {protocolsList.map((prot, idx) => {
              const title = lang === 'PT' ? prot.titlePT : prot.titleEN;
              const difficulty = lang === 'PT' ? prot.difficultyPT : prot.difficultyEN;
              const objective = lang === 'PT' ? prot.objectivePT : prot.objectiveEN;
              const duration = lang === 'PT' ? prot.durationPT : prot.durationEN;

              return (
                <motion.div 
                  key={idx}
                  onClick={onStart}
                  className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-3xl shrink-0 w-[260px] sm:w-[290px] h-[130px] snap-align-start flex flex-col justify-between cursor-pointer hover:border-[#7BA7FF]/50 transition-all shadow-xs"
                  whileHover={{ y: -3 }}
                  transition={springConfig}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-wider font-bold bg-[#7BA7FF]/10 text-[#7BA7FF] px-2 py-0.5 rounded-full">
                        {difficulty}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400 font-medium">{duration}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-[#0F172A] tracking-tight leading-snug font-sans">
                      {title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium truncate">
                      {objective}
                    </span>
                    <span className="text-[8.5px] font-bold text-[#7BA7FF] uppercase tracking-wide shrink-0">
                      → {lang === 'PT' ? 'Acessar' : 'Access'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 04 — STRENGTH EVOLUTION */}
      <section className="py-12 px-6 sm:px-12 bg-slate-50 border-b border-slate-200/40 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#7BA7FF]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10 text-center">
          
          <div className="space-y-1 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF] font-mono block">
              {lang === 'PT' ? 'EVOLUÇÃO DO ATLETA' : 'ATHLETE EVOLUTION'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-[#0F172A] tracking-tight">
              {lang === 'PT' ? 'Evolução de Força' : 'Strength Evolution'}
            </h2>
            <p className="text-xs text-slate-500 font-light">
              {lang === 'PT' ? 'O único sistema que calcula e otimiza sua progressão real de carga.' : 'The only system that calculates and optimizes your actual load progression.'}
            </p>
          </div>

          {/* Compact visual progression card */}
          <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7BA7FF] bg-[#7BA7FF]/10 px-3 py-1 rounded-full font-mono">
                {lang === 'PT' ? 'Seu melhor resultado' : 'Your best result'}
              </span>
              <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full">
                +20kg
              </span>
            </div>

            <div className="flex flex-col items-start gap-1 py-1">
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 font-mono">
                {lang === 'PT' ? 'Supino' : 'Bench Press'}
              </h3>
              <p className="text-xs text-slate-400 font-light">
                {lang === 'PT' ? 'Protocolo Força Progressiva — Semana 6' : 'Progressive Strength Protocol — Week 6'}
              </p>
            </div>

            {/* Visual Arrow representation */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/50 p-4 rounded-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  {lang === 'PT' ? 'Carga Inicial' : 'Initial Load'}
                </span>
                <span className="text-xl font-bold text-slate-700 font-mono mt-1">60kg × 8</span>
              </div>

              {/* Glowing arrow */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7BA7FF]/10">
                <ArrowRight size={18} className="text-[#7BA7FF]" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-[#10B981] font-mono tracking-wider">
                  {lang === 'PT' ? 'Carga Atual' : 'Current Load'}
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-1">80kg × 8</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 05 — ELEGANT CHIC FINAL CTA (Light background to avoid visual heaviness) */}
      <section className="py-12 px-6 text-center select-none bg-white">
        <div className="max-w-4xl mx-auto bg-[#EAF2FF]/30 border border-[#7BA7FF]/25 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-xs">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#7BA7FF]/8 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-[#7BA7FF] font-mono block">KYRON OS</span>
            
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#0F172A] leading-tight">
              {lang === 'PT' ? 'Pronto para começar?' : 'Ready to start?'}
            </h2>

            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-slate-600 text-sm font-light italic">
                {lang === 'PT' 
                  ? 'Plano personalizado e evolução de força real em um só lugar.'
                  : 'Personalized plan and real strength evolution in one place.'
                }
              </p>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button 
                id="footer-cta-start"
                onClick={onStart}
                className="w-full sm:w-auto px-12 h-13 bg-[#7BA7FF] hover:bg-[#8FBCFF] text-[#0F172A] hover:shadow-[0_8px_30px_rgba(123,167,255,0.4)] transition-all font-bold uppercase text-[10.5px] tracking-[0.2em] border-none rounded-full cursor-pointer shadow-xs"
              >
                {lang === 'PT' ? 'Criar Conta' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY FOOTER */}
      <footer className="py-8 px-8 sm:px-12 border-t border-slate-200/50 bg-white relative z-15 select-none text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md border border-white/40 rounded-xl flex items-center justify-center overflow-hidden shadow-xs p-0 shrink-0">
                <img src={kyronLogo} alt="KYRON OS" className="w-full h-full object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">KYRON OS © 2026</span>
            </div>
            <span className="text-[8.5px] font-bold text-slate-400 tracking-wider uppercase mt-1 pl-1">
              {t('poweredBy')}
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider text-[#64748B] justify-center sm:justify-start">
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerTerms')}</a>
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerPerformanceLab')}</a>
            <button 
              onClick={() => setShowBrandKit(true)} 
              className="hover:text-[#7BA7FF] transition-colors cursor-pointer bg-transparent border-none p-0 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 text-[#64748B]"
            >
              <Download size={11} className="stroke-[2.5]" />
              {t('footerBrandKit')}
            </button>
          </div>

        </div>
      </footer>

      {/* FLOATING ACTION PILL (Elegant frosted white glass pill) */}
      <AnimatePresence>
        {scrollProgress > 0.15 && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="fixed bottom-6 inset-x-0 z-[120] flex justify-center px-4"
          >
            <div className="bg-white/80 text-slate-800 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200/60 shadow-[0_12px_44px_rgba(0,0,0,0.08)] flex items-center gap-4.5">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D399] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748B]">{t('floatBadge')}</span>
              </div>

              <div className="hidden sm:block w-[1px] h-4 bg-slate-200" />

              <span className="text-[11px] font-light text-slate-600 hidden md:block">{t('floatSubtitle')}</span>

              <button 
                id="floating-cta-start"
                onClick={onStart}
                className="bg-[#7BA7FF] hover:bg-[#8FBCFF] text-[#0F172A] hover:shadow-[0_6px_20px_rgba(123,167,255,0.35)] font-bold px-4 py-2 text-[9.5px] tracking-[0.16em] uppercase rounded-full transition-all cursor-pointer"
              >
                {t('floatBtnStart')}
              </button>

              <button 
                id="floating-cta-login"
                onClick={onLogin} 
                className="text-slate-500 hover:text-slate-800 px-2 text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
              >
                {t('floatBtnLogin')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📥 OFFICIAL BRAND KIT & LOGOS DOWNLOAD MODAL */}
      <AnimatePresence>
        {showBrandKit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setShowBrandKit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="relative sticky top-0 bg-white/90 backdrop-blur-md px-6 sm:px-8 py-5 border-b border-slate-200/50 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-[#7BA7FF]" size={18} />
                    {lang === 'PT' ? 'Kit Oficial de Marca' : 'Official Brand Kit'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {lang === 'PT' 
                      ? 'Faça o download das versões oficiais de alta resolução do logotipo do KYRON OS.' 
                      : 'Download high-resolution official versions of Kyron OS logos.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBrandKit(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="px-6 sm:px-8 border-b border-slate-200/50 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50/50 py-3 sticky top-[84px] z-20">
                {[
                  { id: 'appicons', label: lang === 'PT' ? 'App Icon' : 'App Icon', icon: Sparkle },
                  { id: 'logos', label: lang === 'PT' ? 'Logotipos' : 'Logos', icon: Layout },
                  { id: 'favicons', label: lang === 'PT' ? 'Favicons' : 'Favicons', icon: Eye },
                  { id: 'splash', label: lang === 'PT' ? 'Splash Screen' : 'Splash Screen', icon: Smartphone },
                  { id: 'usage', label: lang === 'PT' ? 'Uso do Sistema' : 'Usage System', icon: CheckSquare },
                  { id: 'validation', label: lang === 'PT' ? 'Validação' : 'Validation', icon: CheckCircle2 }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const active = brandKitTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBrandKitTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                        active 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200/80 hover:text-slate-800'
                      }`}
                    >
                      <IconComponent size={12} className={active ? 'stroke-[3]' : 'stroke-[2.5]'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {brandKitTab === 'logos' && (
                  <motion.div
                    key="logos-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* LOGO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* LOGO 1: OFFICIAL LIGHT PREVIEW */}
                      <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-white flex items-center justify-center p-0 border border-slate-200/60 overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:12px_12px]" />
                            <img 
                              src={kyronLogo} 
                              alt="Kyron OS Official Logo - Light Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.7] transform drop-shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Claro' : 'Official Logo — Light Backdrop'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial conforme renderizado na barra superior do KYRON OS. Versão balanceada para mídias claras e impressões.'
                              : 'The official brand symbol as displayed in the top navigation bar. Formatted for light mode compositions and clean interfaces.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_official_logo_light.png"
                            className="flex-1 h-9 bg-[#7BA7FF] hover:bg-[#8FBCFF] text-slate-950 font-bold hover:shadow-[0_4px_12px_rgba(123,167,255,0.3)] text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                          <a 
                            href={kyronLogo} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-9 h-9 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title={lang === 'PT' ? 'Abrir em nova aba' : 'Open in new tab'}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {/* LOGO 2: OFFICIAL DARK PREVIEW */}
                      <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-slate-950 flex items-center justify-center p-0 border border-slate-800 overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                            <img 
                              src={kyronLogo} 
                              alt="Kyron OS Official Logo - Dark Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.7] transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Escuro' : 'Official Logo — Dark Backdrop'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial em contraste com fundo preto profundo. Ideal para plataformas de alta fidelidade e interfaces noturnas.'
                              : 'The official logo rendered in stark contrast against a deep dark canvas. Tailored for high-fidelity devices and midnight screens.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_official_logo_dark.png"
                            className="flex-1 h-9 bg-[#7BA7FF] hover:bg-[#8FBCFF] text-slate-950 font-bold hover:shadow-[0_4px_12px_rgba(123,167,255,0.3)] text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                          <a 
                            href={kyronLogo} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-9 h-9 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title={lang === 'PT' ? 'Abrir em nova aba' : 'Open in new tab'}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {/* LOGO 3: COGNITIVE DIGITAL GRADIENT */}
                      <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#7BA7FF]/20 flex items-center justify-center p-0 border border-slate-200/60 overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.2] bg-[radial-gradient(#7ba7ff_1px,transparent_1px)] [background-size:16px_16px]" />
                            <img 
                              src={kyronLogo} 
                              alt="Kyron OS Official Logo - Digital Ambient" 
                              className="max-h-full max-w-full object-contain scale-[1.7] transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            {lang === 'PT' ? 'Logo Oficial — Atmosfera Digital' : 'Official Logo — Digital Ambient'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial imerso em nosso gradiente de assinaturas. Utilizado para posts sociais, capas, badges e banners promocionais.'
                              : 'The official emblem set during our active digital atmosphere gradient. Used for promotional cards, covers, active keys, and badge slots.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_official_logo_ambient.png"
                            className="flex-1 h-9 bg-[#7BA7FF] hover:bg-[#8FBCFF] text-slate-950 font-bold hover:shadow-[0_4px_12px_rgba(123,167,255,0.3)] text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                          <a 
                            href={kyronLogo} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-9 h-9 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title={lang === 'PT' ? 'Abrir em nova aba' : 'Open in new tab'}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* BRAND COLORS PALETTE */}
                    <div className="border border-slate-100 bg-slate-50/40 rounded-2xl p-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-1.5">
                        <div className="w-1.5 h-3 bg-[#7BA7FF] rounded-full" />
                        {lang === 'PT' ? 'Paleta de Cores do Ecossistema' : 'Ecosystem Color Palette'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-4 leading-relaxed max-w-xl">
                        {lang === 'PT'
                          ? 'Nossos códigos hexadecimais primários que compõem o design estético do KYRON OS. Clique em qualquer um deles para copiar instantaneamente para a sua área de transferência.'
                          : 'Our core identifier hexadecimal color values that shape the KYRON OS aesthetic. Click on any color swatch to copy the code instantly.'}
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { name: lang === 'PT' ? 'Azul Digital' : 'Digital Blue', value: '#7BA7FF', hoverBg: 'bg-[#7BA7FF]' },
                          { name: lang === 'PT' ? 'Charcoal Cósmico' : 'Cosmic Charcoal', value: '#0F172A', hoverBg: 'bg-[#0F172A]' },
                          { name: lang === 'PT' ? 'Cinza Slate' : 'Slate Gray', value: '#64748B', hoverBg: 'bg-[#64748B]' },
                          { name: lang === 'PT' ? 'Branco Ambiente' : 'Ambient White', value: '#F8FAFC', hoverBg: 'bg-[#F8FAFC]', border: true }
                        ].map((color) => (
                          <button
                            key={color.value}
                            onClick={() => copyToClipboard(color.value)}
                            className={`p-3 rounded-xl border ${color.border ? 'border-slate-300' : 'border-slate-200'} bg-white text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative group`}
                          >
                            <div className={`w-full h-12 rounded-lg mb-2 relative overflow-hidden flex items-center justify-center ${color.hoverBg} border border-slate-200/50 shadow-xs`} />
                            <span className="text-[9px] font-bold text-slate-800 block uppercase tracking-wider">{color.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{color.value}</span>
                            
                            <div className="absolute right-3 bottom-3 text-[9px] font-black uppercase tracking-widest text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <Copy size={9} />
                              {lang === 'PT' ? 'Copiar' : 'Copy'}
                            </div>

                            {copiedColor === color.value && (
                              <div className="absolute inset-x-3 bottom-3 bg-[#EAF2FF] text-indigo-900 text-[8.5px] font-black uppercase tracking-widest py-1 px-1.5 rounded text-center">
                                {lang === 'PT' ? 'Copiado!' : 'Copied!'}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'favicons' && (
                  <motion.div
                    key="favicons-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {lang === 'PT' ? 'Otimizado para browsers' : 'Browser Compatibility'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-2 flex items-center gap-2">
                          <Eye className="text-emerald-500" size={16} />
                          {lang === 'PT' ? 'Família Oficial de Favicons' : 'Official Favicon Family'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {lang === 'PT'
                            ? 'Ícone de navegador limpo focado exclusivamente no símbolo oficial do KYRON OS. Livre de textos para garantir o melhor contraste e nitidez em formatos minúsculos de barra de abas.'
                            : 'Browser icons optimized for ultra-high readability down to 16x16px. Content-cropped and focused solely on the signature symbol.'}
                        </p>
                      </div>
                      <a 
                        href={kyronLogo}
                        download="favicon_family_pack.zip"
                        className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold hover:shadow-[0_4px_14px_rgba(16,185,129,0.3)] text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
                      >
                        <Download size={13} className="stroke-[2.5]" />
                        {lang === 'PT' ? 'Baixar Favicon Pack (ICO)' : 'Download Favicon Pack'}
                      </a>
                    </div>

                    {/* MOCK BROWSER TAB TESTER */}
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg text-[10px] text-slate-350 select-none">
                        <div className="flex gap-1.5 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="h-4 w-[1px] bg-slate-700/80 mx-1 shrink-0" />
                        <div className="bg-slate-900/95 border border-slate-700/50 rounded-md px-3 py-1 flex items-center gap-2 flex-1 max-w-xs text-white shadow-xs">
                          <div className="w-3.5 h-3.5 bg-gradient-to-tr from-[#7BA7FF]/10 via-white/90 to-[#818CF8]/10 rounded-xs flex items-center justify-center overflow-hidden shrink-0">
                            <img src={kyronLogo} alt="Favicon preview" className="w-[14px] h-[14px] object-contain scale-[1.7] transform" referrerPolicy="no-referrer" />
                          </div>
                          <span className="font-semibold truncate">KYRON OS | Coach Digital</span>
                        </div>
                        <span className="ml-auto text-[9px] text-slate-500 uppercase tracking-widest hidden sm:inline-block">Simulação de Aba do Navegador</span>
                      </div>
                    </div>

                    {/* GRID OF SIZES */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { size: '16x16 px', id: 'favicon-16.png', scale: 'scale-[1.5]', p: 'p-4' },
                        { size: '32x32 px', id: 'favicon-32.png', scale: 'scale-[1.6]', p: 'p-3' },
                        { size: '48x48 px', id: 'favicon-48.png', scale: 'scale-[1.7]', p: 'p-3' },
                        { size: '64x64 px', id: 'favicon-64.png', scale: 'scale-[1.75]', p: 'p-2' },
                        { size: 'Favicon.ico', id: 'favicon.ico', scale: 'scale-[1.8]', p: 'p-2', badge: true }
                      ].map((item) => (
                        <div key={item.id} className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                          <div>
                            <div className="aspect-square bg-slate-50/50 rounded-xl flex flex-col items-center justify-center border border-slate-100 mb-3 relative group">
                              <div className="absolute inset-x-0 top-1 text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest">{item.size}</div>
                              <div className={`w-12 h-12 bg-white border border-slate-200/50 rounded-lg flex items-center justify-center overflow-hidden shadow-xs relative ${item.p}`}>
                                <img src={kyronLogo} alt={item.id} className={`w-full h-full object-contain ${item.scale} transform`} referrerPolicy="no-referrer" />
                              </div>
                            </div>
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-800 truncate">{item.id}</h5>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              {item.badge ? (lang === 'PT' ? 'Multi-resolução' : 'Dynamic Icon') : (lang === 'PT' ? 'Formato PNG livre' : 'Clear PNG asset')}
                            </p>
                          </div>
                          <a 
                            href={kyronLogo}
                            download={item.id}
                            className="h-8 bg-slate-100 hover:bg-[#7BA7FF]/20 hover:text-slate-900 border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-widest rounded-lg mt-3 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Download size={10} />
                            {lang === 'PT' ? 'Exportar' : 'Export'}
                          </a>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'appicons' && (
                  <motion.div
                    key="appicons-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          {lang === 'PT' ? 'Design de Alta Performance' : 'High Performance Design'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-2 flex items-center gap-2">
                          <Sparkle className="text-indigo-500" size={16} />
                          {lang === 'PT' ? 'Ícones de Aplicativo Premium — Mobilidade Extrema' : 'Premium App Icons — Universal Formats'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {lang === 'PT'
                            ? 'Arquivos prontos para publicação na App Store de iOS, Google Play Store de Android e aplicações de desktop. Com o contêiner arredondado premium livre de fundos escuros pesados.'
                            : 'Assets tailored for iOS App Store, Google Play, and desktop frameworks. Premium contoured edges with sleek, clean aesthetic bounds.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* OFFICIAL APP ICON */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="aspect-square rounded-2xl bg-slate-50/50 flex items-center justify-center relative border border-slate-200/50 mb-4 p-6">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-[#7BA7FF]/15 via-white to-[#818CF8]/15 backdrop-blur-xl border border-white/60 shadow-lg flex items-center justify-center overflow-hidden">
                              <img src={kyronLogo} alt="Official App Icon" className="w-[140%] h-[140%] object-contain scale-[1.1] transform" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#7BA7FF]/10 text-[#5B7FFF] border border-[#7BA7FF]/20 inline-block">OFFICIAL</span>
                          <h5 className="text-xs font-black uppercase tracking-wider text-[#0F172A] mt-2">
                            {lang === 'PT' ? 'Ícone Principal Oficial' : 'Official Main Icon'}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {lang === 'PT' 
                              ? 'O ícone principal do KYRON OS, utilizado de forma universal no ecossistema, telas iniciais de PWA e lojas.' 
                              : 'The core icon for KYRON OS, used universally across the active ecosystem, mobile launchers, and app stores.'}
                          </p>
                        </div>
                        <a href={kyronLogo} download="kyron_appicon_official.png" className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl mt-4 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                          <Download size={12} className="stroke-[2.5]" /> 1024px PNG
                        </a>
                      </div>

                      {/* DARK MODE APP ICON */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="aspect-square rounded-2xl bg-slate-950 flex items-center justify-center relative border border-slate-800/80 mb-4 p-6">
                            <div className="w-32 h-32 rounded-3xl bg-[#0F172A] border border-[#7BA7FF]/30 shadow-lg flex items-center justify-center overflow-hidden">
                              <img src={kyronLogo} alt="Dark Mode App Icon" className="w-[140%] h-[140%] object-contain scale-[1.1] transform" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700 inline-block">DARK MODE</span>
                          <h5 className="text-xs font-black uppercase tracking-wider text-[#0F172A] mt-2">
                            {lang === 'PT' ? 'Ícone de Modo Noturnidade' : 'Dark Mode Exclusive'}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {lang === 'PT' 
                              ? 'Versão de alto contraste noturno criada exclusivamente para superfícies escuras, displays OLED e dispositivos de foco extremo.' 
                              : 'High-contrast exclusive design built for black UI workspaces, OLED displays, and ultra-high dark performance.'}
                          </p>
                        </div>
                        <a href={kyronLogo} download="kyron_appicon_dark.png" className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl mt-4 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                          <Download size={12} className="stroke-[2.5]" /> 1024px PNG
                        </a>
                      </div>
                    </div>

                    {/* PLATFORM SPECIFICATIONS MATRIX */}
                    <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5">
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-950 mb-3 block">
                        {lang === 'PT' ? 'Matriz de Tamanhos de Exportação' : 'Target Dimensions Specifications'}
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { name: 'App Store High Resolution', size: '1024x1024 px', use: 'iOS Master App Store' },
                          { name: 'Google Play Master', size: '512x512 px', use: 'Android Play Store' },
                          { name: 'Large PWA Scale', size: '256x256 px', use: 'PWA Web Stand-alone' },
                          { name: 'Android Launcher Asset', size: '192x192 px', use: 'Mobile Drawer Icon' },
                          { name: 'iPhone Home Screen', size: '180x185 px', use: 'Apple Retina iOS 17' }
                        ].map((spec, i) => (
                          <div key={i} className="bg-white border border-slate-200/70 p-3 rounded-xl flex flex-col justify-between">
                            <div>
                              <span className="font-bold text-[10px] text-slate-800 block truncate">{spec.size}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#7BA7FF] block mt-0.5">{spec.use}</span>
                            </div>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = kyronLogo;
                                link.download = `kyron_app_icon_${spec.size.replace(' ', '_')}.png`;
                                link.click();
                              }}
                              className="w-full text-center h-6 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 font-bold text-[8px] uppercase tracking-widest text-slate-500 rounded mt-3 select-none"
                            >
                              {lang === 'PT' ? 'Exportar' : 'Export'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'splash' && (
                  <motion.div
                    key="splash-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-[#7BA7FF]/10 text-[#5B7FFF] border border-[#7BA7FF]/20">
                          {lang === 'PT' ? 'Simulação de Inicialização' : 'Animated Startups'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-2 flex items-center gap-2">
                          <Smartphone className="text-[#7BA7FF]" size={16} />
                          {lang === 'PT' ? 'Lançamento & Splash Screen Oficial' : 'Official Launch & Splash Screen'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {lang === 'PT'
                            ? 'Tela de boas-vindas otimizada com grande espaço negativo, logotipo perfeitamente centralizado e rodapé minimalista da Rubi Inteligência.'
                            : 'Immersive landing launch frame formatted for modern mobile devices and screens. Supports elegant startup fade animations.'}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSplashAnimationTrigger(prev => prev + 1)}
                        className="h-10 px-5 bg-[#7BA7FF] hover:bg-[#6094FF] text-slate-950 font-black hover:shadow-[0_4px_14px_rgba(123,167,255,0.3)] text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
                      >
                        <Play size={13} className="fill-slate-950" />
                        {lang === 'PT' ? 'Testar Animação Oficial' : 'Simulate Splash Animation'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* VIEWPORT 1: MOBILE PORTRAIT */}
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                              <Smartphone size={10} /> {lang === 'PT' ? 'Smartphone (Retrato)' : 'Mobile Portrait'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">1080x1920 px</span>
                          </div>
                          
                          {/* Animated Simulator frame */}
                          <div className="aspect-[9/16] max-h-96 rounded-2xl bg-gradient-to-tr from-[#7BA7FF]/5 via-white to-[#818CF8]/5 border border-slate-300 shadow-lg flex flex-col items-center justify-between p-6 relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-4 bg-slate-900/10 flex items-center justify-between px-3 text-[7px] text-slate-400 font-bold shrink-0">
                              <span>9:41</span>
                              <div className="w-12 h-3 rounded-full bg-slate-950/80 mx-auto" />
                              <span>LTE</span>
                            </div>
                            
                            <div /> {/* Spacer */}
                            
                            <motion.div 
                              key={`portrait-${splashAnimationTrigger}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="text-center flex flex-col items-center"
                            >
                              <div className="w-16 h-16 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden border border-white/50 shadow-md p-0 mb-4">
                                <img src={kyronLogo} alt="Kyron Logo" className="w-full h-full object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
                              </div>
                              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-955 leading-none">KYRON OS</h5>
                            </motion.div>

                            <motion.div 
                              key={`portrait-footer-${splashAnimationTrigger}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.6 }}
                              transition={{ delay: 0.6, duration: 0.8 }}
                              className="text-center"
                            >
                              <p className="text-[7.5px] font-mono tracking-widest text-[#64748B] uppercase">Desenvolvido por Rubi Inteligência</p>
                            </motion.div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = kyronLogo;
                            link.download = 'kyron_splash_mobile_portrait.png';
                            link.click();
                          }}
                          className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-widest rounded-lg mt-4 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download size={11} /> {lang === 'PT' ? 'Exportar Retrato' : 'Export Portrait'}
                        </button>
                      </div>

                      {/* VIEWPORT 2: TABLET SQUIRCLE */}
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                              <Tablet size={10} /> {lang === 'PT' ? 'Tablet (Escala)' : 'Tablet Screen'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">1536x2048 px</span>
                          </div>
                          
                          {/* Animated Simulator frame */}
                          <div className="aspect-[3/4] max-h-96 rounded-2xl bg-gradient-to-tr from-[#7BA7FF]/5 via-white to-[#818CF8]/5 border border-slate-350/65 shadow-lg flex flex-col items-center justify-between p-8 relative overflow-hidden">
                            <div /> {/* Spacer */}
                            
                            <motion.div 
                              key={`tablet-${splashAnimationTrigger}`}
                              initial={{ opacity: 0, scale: 0.82 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="text-center flex flex-col items-center"
                            >
                              <div className="w-18 h-18 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden border border-white/50 shadow-md p-0 mb-4">
                                <img src={kyronLogo} alt="Kyron Logo" className="w-full h-full object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
                              </div>
                              <h5 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-955 leading-none">KYRON OS</h5>
                            </motion.div>

                            <motion.div 
                              key={`tablet-footer-${splashAnimationTrigger}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.6 }}
                              transition={{ delay: 0.6, duration: 0.8 }}
                              className="text-center"
                            >
                              <p className="text-[8px] font-mono tracking-widest text-[#64748B] uppercase">Desenvolvido por Rubi Inteligência</p>
                            </motion.div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = kyronLogo;
                            link.download = 'kyron_splash_tablet.png';
                            link.click();
                          }}
                          className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-widest rounded-lg mt-4 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download size={11} /> {lang === 'PT' ? 'Exportar Tablet' : 'Export Tablet'}
                        </button>
                      </div>

                      {/* VIEWPORT 3: DESKTOP CINEMATIC */}
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                              <Monitor size={10} /> {lang === 'PT' ? 'Desktop / PWA Banner' : 'Desktop Standard'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">1920x1080 px</span>
                          </div>
                          
                          {/* Animated Simulator frame */}
                          <div className="aspect-[16/9] max-h-96 rounded-2xl bg-gradient-to-tr from-[#7BA7FF]/5 via-white to-[#818CF8]/5 border border-slate-350/65 shadow-lg flex flex-col items-center justify-between p-6 relative overflow-hidden">
                            <div /> {/* Spacer */}
                            
                            <motion.div 
                              key={`desktop-${splashAnimationTrigger}`}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="text-center flex flex-col items-center"
                            >
                              <div className="w-14 h-14 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md rounded-xl flex items-center justify-center overflow-hidden border border-white/50 shadow-md p-0 mb-3">
                                <img src={kyronLogo} alt="Kyron Logo" className="w-full h-full object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
                              </div>
                              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-955 leading-none">KYRON OS</h5>
                            </motion.div>

                            <motion.div 
                              key={`desktop-footer-${splashAnimationTrigger}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.6 }}
                              transition={{ delay: 0.6, duration: 0.8 }}
                              className="text-center"
                            >
                              <p className="text-[7.5px] font-mono tracking-widest text-[#64748B] uppercase">Desenvolvido por Rubi Inteligência</p>
                            </motion.div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = kyronLogo;
                            link.download = 'kyron_splash_desktop.png';
                            link.click();
                          }}
                          className="h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-widest rounded-lg mt-4 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download size={11} /> {lang === 'PT' ? 'Exportar Desktop' : 'Export Desktop'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'usage' && (
                  <motion.div
                    key="usage-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          {lang === 'PT' ? 'Uso dos Ativos' : 'Cohesive Ecosystem Usage'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-2 flex items-center gap-2">
                          <CheckSquare className="text-indigo-500" size={16} />
                          {lang === 'PT' ? 'Matriz de Aplicação de Ativos' : 'Asset Application Guidelines'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {lang === 'PT'
                            ? 'Este sistema dita onde cada elemento de marca do KYRON OS é aplicado de forma consistente por todo o ecossistema.'
                            : 'This matrix governs where each KYRON OS identifier is displayed across our visual environments.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { 
                          category: lang === 'PT' ? 'App Icon' : 'App Icon', 
                          items: ['PWA', lang === 'PT' ? 'Lançador Mobile' : 'Mobile Launcher', 'App Store', 'Play Store'] 
                        },
                        { 
                          category: lang === 'PT' ? 'Logo' : 'Logo', 
                          items: ['Navbar', 'Dashboard', lang === 'PT' ? 'Autenticação' : 'Authentication', 'Footer'] 
                        },
                        { 
                          category: lang === 'PT' ? 'Favicon' : 'Favicon', 
                          items: [lang === 'PT' ? 'Abas do Navegador' : 'Browser Tabs', lang === 'PT' ? 'Favoritos' : 'Bookmarks', lang === 'PT' ? 'Atalhos Desktop' : 'Desktop Shortcuts'] 
                        },
                        { 
                          category: lang === 'PT' ? 'Splash Screen' : 'Splash Screen', 
                          items: [lang === 'PT' ? 'Inicialização Mobile' : 'Mobile Launch', lang === 'PT' ? 'Inicialização Tablet' : 'Tablet Launch', lang === 'PT' ? 'Carregamento Desktop' : 'Desktop Loading'] 
                        }
                      ].map((grp, gIdx) => (
                        <div key={gIdx} className="bg-slate-50/60 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-widest border-b border-slate-200/50 pb-1.5 mb-2.5">
                              {grp.category}
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {grp.items.map((it, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-250/50 rounded-lg hover:border-[#7BA7FF]/30 transition-all cursor-default select-none shadow-xs"
                                >
                                  {it}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-[8px] font-mono text-slate-400 mt-3 text-right">
                            ✓ STANDARD ACTIVE
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'validation' && (
                  <motion.div
                    key="validation-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {lang === 'PT' ? 'Validador Inteligente' : 'Active Compliance Validation'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mt-2 flex items-center gap-2">
                          <CheckCircle2 className="text-[#7BA7FF]" size={16} />
                          {lang === 'PT' ? 'Validador de Consistência de Identidade' : 'Identity Consistency Engine'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                          {lang === 'PT'
                            ? 'Este painel analisa a coerência dos logos, fontes e espaçamentos do ecossistema para evitar desvios visuais futuros.'
                            : 'This live evaluator tracks if structural assets, fonts, and elements adhere to brand alignment conventions.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-4 border border-slate-200 bg-[#0F172A] text-white p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-5">
                          <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] rounded-full blur-[40px] bg-[#7BA7FF]" />
                        </div>
                        
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF] block">
                            {lang === 'PT' ? 'Consistência de Marca' : 'Logo Consistency'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-400 mt-1 uppercase">
                            {lang === 'PT' ? 'Alinhamento Global' : 'Overall Score'}
                          </h4>
                        </div>

                        <div className="my-6">
                          <div className="text-5xl font-black text-[#7BA7FF] tracking-tighter leading-none flex items-baseline">
                            96%
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            {lang === 'PT'
                              ? 'Excelente sincronia. Os espaçamentos, vidros, contrastes e fontes estão altamente alinhados.'
                              : 'Outstanding sync. Spacing ratios, card glows, font scales, and background blurs comply with pixel-perfect guidelines.'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex items-center justify-between">
                          <span>KYRON REGULATION</span>
                          <span className="text-emerald-500">✓ OPTIMIZED</span>
                        </div>
                      </div>

                      <div className="md:col-span-8 border border-slate-200 bg-white p-6 rounded-2xl space-y-5">
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-[#0F172A] border-b border-slate-100 pb-2">
                          {lang === 'PT' ? 'Métricas de Harmonia de Marca' : 'Brand Balance Indicators'}
                        </h5>

                        <div className="space-y-4">
                          {[
                            { name: lang === 'PT' ? 'Área de Segurança (Safe Area Ratio)' : 'Safe Area Ratio', value: 98, level: lang === 'PT' ? 'Perfeito' : 'Perfect', color: 'bg-emerald-500' },
                            { name: lang === 'PT' ? 'Alinhamento de Símbolos (Symbol Alignment)' : 'Symbol Alignment', value: 96, level: lang === 'PT' ? 'Alinhado' : 'Centered', color: 'bg-[#7BA7FF]' },
                            { name: lang === 'PT' ? 'Equilíbrio Geométrico (Geometric Balance)' : 'Geometric Balance', value: 97, level: lang === 'PT' ? 'Simétrico' : 'Balanced', color: 'bg-indigo-500' },
                            { name: lang === 'PT' ? 'Centro Óptico (Optical Center)' : 'Optical Center', value: 95, level: lang === 'PT' ? 'Otimizado' : 'Optimized', color: 'bg-[#818CF8]' },
                            { name: lang === 'PT' ? 'Conformidade de Marca (Brand Compliance)' : 'Brand Compliance', value: 100, level: lang === 'PT' ? 'Aprovado' : 'Approved', color: 'bg-emerald-600' }
                          ].map((metric, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-700">{metric.name}</span>
                                <div className="flex gap-2 items-center text-[10px] text-slate-500 uppercase tracking-wider font-black">
                                  <span>{metric.level}</span>
                                  <span className="text-slate-900">{metric.value}%</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-slate-150 rounded-full overflow-hidden">
                                <div className={`h-full ${metric.color} rounded-full`} style={{ width: `${metric.value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2">
                          <p className="text-[10px] text-slate-400 italic">
                            {lang === 'PT'
                              ? 'Análise heurística de marca atualizada de forma inteligente.'
                              : 'Real-time heuristic evaluation ensures brand assets follow the guidelines perfectly.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* QUALITY & LICENSE DECLARATION */}
                <div className="bg-[#7BA7FF]/5 border border-[#7BA7FF]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-2 sm:p-3 bg-[#7BA7FF]/15 text-[#6094FF] rounded-xl shrink-0">
                    <ShieldCheck size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900">
                      {lang === 'PT' ? 'Diretrizes de Identidade Visual Ativa' : 'Active Visual Identity Guidelines'}
                    </h5>
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                      {lang === 'PT'
                        ? 'Estes ativos são marcas registradas do ecossistema KYRON OS. Você está autorizado a utilizá-los para fins de divulgação biológica, relatórios de evolução de atletas ou integrações parceiras, desde que a integridade original das proporções do logotipo seja sempre mantida e respeitada.'
                        : 'These branding assets are trademarks of the KYRON OS ecosystem. You are authorized to use them for biometric reports, athlete promotion, or partnership integrations, provided the typography and aspect ratios are respected.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200/50 flex justify-end">
                <button
                  onClick={() => setShowBrandKit(false)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9.5px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {lang === 'PT' ? 'Fechar' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
