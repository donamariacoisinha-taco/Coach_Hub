import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import kyronLogo from '../assets/images/kyron_core_v2_1781043247216.png';
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
  ShieldCheck
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
      titleKey: "strengthProg" as const,
      num: 14,
      difficultyKey: "difficultyBeginner" as const,
      objectiveKey: "strengthDesc" as const,
      bgGradient: "from-slate-900 via-slate-800 to-slate-950",
      accentColor: "border-[#7BA7FF]/35"
    },
    {
      titleKey: "hyperProg" as const,
      num: 22,
      difficultyKey: "difficultyIntermediate" as const,
      objectiveKey: "hyperDesc" as const,
      bgGradient: "from-slate-900 via-indigo-950 to-slate-950",
      accentColor: "border-[#818CF8]/35"
    },
    {
      titleKey: "metCutProg" as const,
      num: 12,
      difficultyKey: "difficultyAll" as const,
      objectiveKey: "metCutDesc" as const,
      bgGradient: "from-slate-900 via-cyan-950 to-slate-950",
      accentColor: "border-[#60A5FA]/35"
    },
    {
      titleKey: "athPerfProg" as const,
      num: 18,
      difficultyKey: "difficultyElite" as const,
      objectiveKey: "athPerfDesc" as const,
      bgGradient: "from-slate-900 via-violet-950 to-slate-950",
      accentColor: "border-[#34D399]/35"
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
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 border-b border-white/30 bg-white/60 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-slate-950/20">
            <img src={kyronLogo} alt="KYRON OS" className="w-[26px] h-[26px] object-contain scale-[1.12]" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.28em] text-slate-900 leading-none">KYRON OS</span>
            <span className="text-[7px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{t('poweredBy')}</span>
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
            className="hidden sm:inline-flex bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-[10.5px] tracking-[0.18em] uppercase py-3.5 px-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {t('start')}
          </button>
        </div>
      </nav>

      {/* SECTION 01 — HERO & PREMIUM PRODUCT PREVIEW (VISUALLY DOMINATING THE FIRST SCREEN) */}
      <section className="relative pt-24 sm:pt-28 pb-10 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Premium Transformative Hook */}
          <div className="lg:col-span-5 text-left space-y-8 relative z-10">
            
            {/* Elegant Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig}
              className="inline-flex items-center gap-2.5 px-4.5 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
            >
              <span className="w-1.5 h-1.5 bg-[#7BA7FF] rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#64748B]">
                {t('badge')}
              </span>
            </motion.div>
            
            {/* Headline focus: "Built Around Your Biology." */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-[3.8rem] font-light tracking-tight leading-[1.08] text-[#0F172A]"
              >
                {t('headline')}
              </motion.h1>
              
              {/* Subheadline focus: Unified Intelligent Ecosystem */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.2 }}
                className="text-base sm:text-lg text-[#334155] font-light leading-relaxed max-w-xl"
              >
                {t('subheadline')}
              </motion.p>
            </div>
            
            {/* Immediate Action Conversion Area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springConfig, delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.button 
                  id="hero-cta-start"
                  onClick={onStart}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  animate={{ y: 0 }}
                  variants={{
                    hover: { y: -2, scale: 1.01 }
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
                  className="w-full sm:w-auto h-14 px-9 text-white rounded-full font-medium uppercase text-[11px] tracking-[0.22em] flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #7BA7FF 0%, #6B8DFF 50%, #818CF8 100%)",
                    boxShadow: "0 12px 30px rgba(123, 167, 255, 0.22), 0 4px 12px rgba(15, 23, 42, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.25)"
                  }}
                >
                  {/* Internal gloss overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  
                  <span className="relative z-10">{t('ctaStart')}</span>
                  <motion.span
                    className="relative z-10"
                    variants={{
                      hover: { x: 4 }
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
                  >
                    <ArrowRight size={13} className="text-white" />
                  </motion.span>
                </motion.button>
                
                <motion.a 
                  href="#how-it-works"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
                  className="w-full sm:w-auto h-14 px-9 bg-white/70 backdrop-blur-xl border border-slate-200 rounded-full font-medium text-slate-600 hover:text-slate-900 uppercase text-[11px] tracking-[0.22em] shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  {t('heroExplore')}
                </motion.a>
              </div>

              {/* THREE MICRO-BENEFITS (STRICTLY SUBTLE, BELOW CTA) */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7BA7FF] text-xs font-semibold">✓</span>
                  <span className="font-mono text-[10.5px] font-medium tracking-tight uppercase">{t('benefit1')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7BA7FF] text-xs font-semibold">✓</span>
                  <span className="font-mono text-[10.5px] font-medium tracking-tight uppercase">{t('benefit2')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7BA7FF] text-xs font-semibold">✓</span>
                  <span className="font-mono text-[10.5px] font-medium tracking-tight uppercase">{t('benefit3')}</span>
                </div>
              </div>
            </motion.div>

            {/* Premium Emotional Statement */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[11.5px] text-[#475569] italic leading-relaxed max-w-md pt-2"
            >
              {t('quote')}
            </motion.p>
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
                        <span className="font-mono text-[#4F46E5] font-bold uppercase tracking-wider">{t('activeProtocol')}</span>
                        <span className="font-mono text-slate-400">{t('rpeTarget')}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#4F46E5] font-bold block">{t('inclinePress')}</span>
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
                          <span className="text-[8.5px] uppercase font-bold text-[#4F46E5] block mb-0.5 font-mono">{t('restDecay')}</span>
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
                      <div className="w-7 h-7 rounded-lg bg-[#818CF8]/10 text-[#4F46E5] flex items-center justify-center">
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
                        <div className="w-5.5 h-5.5 bg-[#4F46E5] text-white font-bold rounded-full flex items-center justify-center text-[8.5px] font-mono shrink-0 pt-0.5" id="rubi-response-pill">R</div>
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

      {/* SECTION 02 — EVERYTHING IN ONE SYSTEM (Four Premium Cards) */}
      <section className="py-10 px-6 sm:px-12 max-w-7xl mx-auto border-t border-slate-200/50">
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-3xl sm:text-4xl font-medium text-[#0F172A] tracking-tight">
            {lang === 'PT' ? 'Tudo Em Um Sistema' : 'Everything In One System'}
          </h2>
          <p className="text-sm text-slate-500 font-light">
            {lang === 'PT' ? 'Treino, nutrição, memória e evolução conectados.' : 'Training, nutrition, memory, and evolution connected.'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              category: lang === 'PT' ? 'TREINAMENTO' : 'TRAINING',
              title: lang === 'PT' ? 'Treinamento Adaptativo' : 'Adaptive Training',
              desc: lang === 'PT' ? 'Ajusta seu protocolo conforme sua evolução.' : 'Adjusts your protocol as you evolve.',
              icon: Dumbbell
            },
            {
              category: lang === 'PT' ? 'METABOLISMO' : 'METABOLISM',
              title: lang === 'PT' ? 'Nutrição Inteligente' : 'Intelligent Nutrition',
              desc: lang === 'PT' ? 'Metas metabólicas recalculadas continuamente.' : 'Metabolic targets continuously recalculated.',
              icon: Apple
            },
            {
              category: lang === 'PT' ? 'MEMÓRIA' : 'MEMORY',
              title: lang === 'PT' ? 'Memória do Atleta' : 'Athlete Memory',
              desc: lang === 'PT' ? 'Aprende seus hábitos, preferências e padrões.' : 'Learns your habits, preferences, and patterns.',
              icon: Brain
            },
            {
              category: lang === 'PT' ? 'PERFORMANCE' : 'PERFORMANCE',
              title: lang === 'PT' ? 'Performance Real' : 'Real Performance',
              desc: lang === 'PT' ? 'Monitora progresso, carga e consistência.' : 'Monitors progress, load, and consistency.',
              icon: LineChart
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8, delay: idx * 0.05 }}
                whileHover={{ y: -2, scale: 1.01 }}
                className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_4px_24px_rgba(15,23,42,0.02)] flex flex-col justify-between h-[130px] sm:h-[135px] group transition-all"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#7BA7FF] shrink-0">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                    {card.category}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 tracking-tight leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-light truncate leading-none">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 05 — PREMIUM PROTOCOL LIBRARY (REFINED) */}
      <section className="py-12 bg-gradient-to-b from-[#F8FAFC]/55 to-white border-y border-slate-200/50 text-[#0F172A]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4F46E5] font-mono">{t('libBadge')}</span>
              <h2 className="text-2xl sm:text-3.5xl font-medium tracking-tight text-[#0F172A]">
                {t('libTitle')}
              </h2>
              {/* MANDATORY SUBHEAD */}
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-wider block">
                {t('libSub')}
              </p>
            </div>
            <p className="text-[#64748B] text-xs font-mono uppercase tracking-widest leading-none hidden md:block">
              {t('libCurated')}
            </p>
          </div>

          {/* Compact Premium Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {protocolsList.map((prot, idx) => {
              const duration = lang === 'PT' 
                ? (idx === 0 ? "8 semanas" : idx === 1 ? "12 semanas" : idx === 2 ? "6 semanas" : "10 semanas") 
                : (idx === 0 ? "8 weeks" : idx === 1 ? "12 weeks" : idx === 2 ? "6 weeks" : "10 weeks");
              const difficultyShort = lang === 'PT'
                ? (idx === 0 ? "Iniciante → Intermediário" : idx === 1 ? "Intermediário → Avançado" : idx === 2 ? "Todos os Níveis" : "Performance Elite")
                : (idx === 0 ? "Beginner → Intermediate" : idx === 1 ? "Intermediate → Advanced" : idx === 2 ? "All Levels" : "Elite Performance");

              return (
                <motion.div 
                  key={idx}
                  onClick={onStart}
                  className="bg-white/70 backdrop-blur-xl border border-slate-200/50 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-[210px] cursor-pointer group shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.04)]"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={springConfig}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/15 px-2.5 py-1 rounded-full leading-none">
                        {t(prot.difficultyKey)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">{duration}</span>
                    </div>

                    <h3 className="text-base font-semibold text-[#0F172A] leading-snug pt-1 group-hover:text-[#4F46E5] transition-colors">
                      {t(prot.titleKey)}
                    </h3>
                    
                    <p className="text-xs text-slate-500 font-light leading-relaxed truncate">
                      {t(prot.objectiveKey)}
                    </p>
                  </div>

                  {/* Metadata and immediate action line */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col text-[9.5px] text-slate-400 leading-tight">
                      <span className="font-mono font-medium">{t('countProtocols').replace('{num}', prot.num.toString())}</span>
                      <span className="text-slate-500 font-medium truncate max-w-[130px]">{difficultyShort}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-[#4F46E5] font-bold uppercase tracking-wider group-hover:text-[#4F46E5]/80 transition-colors">
                      <span className="text-[10px]">{lang === 'PT' ? 'Explorar' : 'Explore'}</span>
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 05 — RUBI INTELLIGENCE */}
      <section className="py-12 px-6 sm:px-12 bg-slate-50/50 border-b border-slate-200/50 relative overflow-hidden">
        {/* Soft background light glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7BA7FF]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          {/* Header */}
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF] font-mono block">
              {lang === 'PT' ? 'INTELIGÊNCIA ALGORÍTMICA' : 'ALGORITHMIC INTELLIGENCE'}
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-medium text-[#0F172A] tracking-tight">
              {lang === 'PT' ? 'Rubi Intelligence' : 'Rubi Intelligence'}
            </h2>
            <p className="text-slate-500 font-light text-sm">
              {lang === 'PT' 
                ? 'Insights biológicos contínuos calculados com base na sua performance real e comportamento.' 
                : 'Continuous biological insights calculated based on your real performance and behavior.'}
            </p>
          </div>

          {/* 4 Premium Biological Insight Cards in an Elegant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: lang === 'PT' ? 'Foco Cronotrópico' : 'Chronotropic Focus',
                insight: lang === 'PT' ? '"Você costuma render melhor entre 18h e 20h."' : '"You tend to perform better between 6 PM and 8 PM."',
                badge: lang === 'PT' ? 'Padrão Circadiano' : 'Circadian Pattern',
                color: 'border-[#7BA7FF]/20 text-[#7BA7FF]',
                glow: 'from-[#7BA7FF]/5 via-transparent to-transparent'
              },
              {
                title: lang === 'PT' ? 'Volume de Carga' : 'Load Volume',
                insight: lang === 'PT' ? '"Seu volume semanal está aumentando de forma sustentável."' : '"Your weekly volume is increasing sustainably."',
                badge: lang === 'PT' ? 'Sobrecarga Progressiva' : 'Progressive Overload',
                color: 'border-[#818CF8]/20 text-[#818CF8]',
                glow: 'from-[#818CF8]/5 via-transparent to-transparent'
              },
              {
                title: lang === 'PT' ? 'Taxa de Recuperação' : 'Recovery Rate',
                insight: lang === 'PT' ? '"Sua recuperação melhorou 11% esta semana."' : '"Your recovery improved by 11% this week."',
                badge: lang === 'PT' ? 'Homeostase Ativa' : 'Active Homeostasis',
                color: 'border-[#34D399]/20 text-[#34D399]',
                glow: 'from-[#34D399]/5 via-transparent to-transparent'
              },
              {
                title: lang === 'PT' ? 'Prontidão Neuromuscular' : 'Neuromuscular Readiness',
                insight: lang === 'PT' ? '"Hoje é um bom dia para progressão de carga."' : '"Today is a good day for load progression."',
                badge: lang === 'PT' ? 'Mapeamento Sináptico' : 'Synaptic Mapping',
                color: 'border-[#60A5FA]/20 text-[#60A5FA]',
                glow: 'from-[#60A5FA]/5 via-transparent to-transparent'
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.01)] flex flex-col justify-between h-[155px] sm:h-[160px] relative overflow-hidden group border-slate-200/50"
              >
                {/* Micro Ambient Glow in Card */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} opacity-60 pointer-events-none`} />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className={`text-[8.5px] uppercase tracking-[0.2em] font-semibold px-2.5 py-0.5 bg-white border border-slate-150 rounded-full font-mono ${card.color}`}>
                      {card.badge}
                    </span>
                    <span className="text-[9px] font-black tracking-widest text-[#10B981] flex items-center gap-1 font-mono uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      {lang === 'PT' ? 'Aferido' : 'VERIFIED'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-800 tracking-tight pt-1">
                    {card.title}
                  </h3>
                </div>

                <div className="pt-2 relative z-10">
                  <p className="text-xs font-semibold italic text-[#0F172A] leading-snug">
                    {card.insight}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 07 — SOCIAL PROOF EVOLUTION (Elegant statistics instead of testimonials) */}
      <section className="py-12 px-6 sm:px-12 max-w-5xl mx-auto text-center space-y-8">
        
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7BA7FF] font-mono block">{t('statBadge')}</span>
          <h2 className="text-2xl sm:text-3.5xl font-medium text-[#0F172A] tracking-tight">
            {t('statTitle')}
          </h2>
        </div>

        {/* Triple luxury physical statistics layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          
          <div className="space-y-3 p-5.5 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between h-[160px]">
            <span className="text-4xl sm:text-5xl font-extralight tracking-tighter text-[#0F172A] font-mono block">
              +17%
            </span>
            <div className="space-y-0.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs sm:text-sm font-semibold text-[#0F172A] tracking-tight">
                {t('stat1Label')}
              </h4>
              <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-widest leading-none">
                {t('stat1Sub')}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5.5 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between h-[160px]">
            <span className="text-4xl sm:text-5xl font-extralight tracking-tighter text-[#0F172A] font-mono block">
              92%
            </span>
            <div className="space-y-0.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs sm:text-sm font-semibold text-[#0F172A] tracking-tight">
                {t('stat2Label')}
              </h4>
              <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-widest leading-none">
                {t('stat2Sub')}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5.5 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between h-[160px]">
            <span className="text-4xl sm:text-5xl font-extralight tracking-tighter text-[#0F172A] font-mono block">
              -8kg
            </span>
            <div className="space-y-0.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs sm:text-sm font-semibold text-[#0F172A] tracking-tight">
                {t('stat3Label')}
              </h4>
              <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-widest leading-none">
                {t('stat3Sub')}
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* SECTION 08 — FINAL CTA REFINEMENT */}
      <section className="py-12 px-6 text-center select-none">
        <div className="max-w-4xl mx-auto bg-slate-950 text-white rounded-[2.5rem] p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-slate-900">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-[#7BA7FF]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-5 relative z-10">
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF] font-mono block">{t('finalBadge')}</span>
            
            <h2 className="text-2xl sm:text-4.5xl font-light leading-tight tracking-tight">
              {t('finalTitle1')}<br/>
              <span className="font-semibold text-[#7BA7FF]">{t('finalTitle2')}</span>
            </h2>

            {/* MANDATORY SUPPORTING LINE */}
            <div className="space-y-1.5 max-w-lg mx-auto">
              <p className="text-slate-200 text-sm sm:text-base font-light italic">
                {t('finalSupport')}
              </p>
              {t('finalSubtext') && (
                <p className="text-slate-400 text-xs font-light">
                  {t('finalSubtext')}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button 
                id="footer-cta-start"
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-4 bg-[#7BA7FF] text-[#0F172A] hover:bg-[#7BA7FF]/90 rounded-2xl font-bold uppercase text-[11px] tracking-[0.22em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {t('finalStartBtn')}
              </button>

              <button 
                id="footer-cta-login"
                onClick={onLogin}
                className="w-full sm:w-auto px-10 py-4 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-2xl font-bold uppercase text-[11px] tracking-[0.22em] transition-colors cursor-pointer"
              >
                {t('finalLoginBtn')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY FOOTER */}
      <footer className="py-8 px-8 sm:px-12 border-t border-slate-200/55 bg-white relative z-15 select-none text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden text-white">
              <img src={kyronLogo} alt="KYRON OS" className="w-[22px] h-[22px] object-contain scale-[1.12]" referrerPolicy="no-referrer" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#64748B]">KYRON OS © 2026</span>
          </div>

          <div className="flex flex-wrap gap-8 text-[10.5px] font-bold uppercase tracking-wider text-[#64748B] justify-center sm:justify-start">
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerTerms')}</a>
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-slate-800 transition-colors">{t('footerPerformanceLab')}</a>
          </div>

        </div>
      </footer>

      {/* FLOATING ACTION PILL */}
      <AnimatePresence>
        {scrollProgress > 0.15 && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="fixed bottom-6 inset-x-0 z-[120] flex justify-center px-4"
          >
            <div className="bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-full border border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center gap-4.5">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D399] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">{t('floatBadge')}</span>
              </div>

              <div className="hidden sm:block w-[1px] h-4 bg-white/10" />

              <span className="text-xs font-light text-slate-100 hidden md:block">{t('floatSubtitle')}</span>

              <button 
                id="floating-cta-start"
                onClick={onStart}
                className="bg-[#7BA7FF] hover:bg-[#7BA7FF]/95 text-slate-950 font-bold px-4 py-2 text-[10px] tracking-[0.16em] uppercase rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {t('floatBtnStart')}
              </button>

              <button 
                id="floating-cta-login"
                onClick={onLogin} 
                className="text-white/70 hover:text-white px-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                {t('floatBtnLogin')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
