import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../translations';
import kyronLogo from '../assets/images/kyron_official_logo_1781087891387.png';
import kyronCoreLogo from '../assets/images/kyron_core_logo_1781042739395.png';
import kyronCoreV2 from '../assets/images/kyron_core_v2_1781043247216.png';
import kyronOsLogo3D from '../assets/images/kyron_os_logo_1782226707061.jpg';
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
  Tablet,
  BookOpen,
  Info
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

  // Elegant static background gradients inspired by the reference picture
  const publicBackgroundStyle = {
    background: `
      radial-gradient(circle at top left, rgba(255, 245, 225, 0.95), transparent 40%),
      radial-gradient(circle at top right, rgba(0, 107, 99, 0.07), transparent 35%),
      radial-gradient(circle at 50% 50%, rgba(247, 239, 226, 0.4), transparent 50%),
      linear-gradient(180deg, #FAF4EA 0%, #FFF8EE 50%, #FAF4EA 100%)
    `
  };

  return (
    <div 
      className="min-h-screen text-[#241610] font-light tracking-tight overflow-x-hidden selection:bg-[#006B63]/20 selection:text-[#241610] pb-20 font-sans"
      style={publicBackgroundStyle}
    >
      {/* Subtle organic elegant background aura */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none opacity-[0.4] bg-[radial-gradient(#006B63_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* NAVIGATION BAR - PREMIUM TRANSLUCENT CREME */}
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 border-b border-[#E8DCC8]/60 bg-[#FAF4EA]/80 backdrop-blur-xl px-6 sm:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="border border-[#E8DCC8] rounded-2xl flex items-center justify-center overflow-hidden shadow-xs bg-[#FFF9F0] p-1.5" style={{ width: '48px', height: '47px' }}>
            <img 
              src={kyronLogo} 
              alt="KYRON LABS" 
              className="w-full h-full object-contain scale-[1.7] transform transition-transform hover:scale-[1.85] duration-500" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#241610] leading-none">KYRON LABS</span>
            <span className="text-[8px] font-bold text-[#006B63] tracking-[0.15em] uppercase mt-0.5 font-mono">Performance & Science</span>
          </div>
        </div>

        {/* Links public navbar */}
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#5B4A3F]">
          <a href="#" className="hover:text-[#006B63] transition-colors">{lang === 'PT' ? 'Início' : 'Home'}</a>
          <button onClick={onStart} className="hover:text-[#006B63] transition-colors bg-transparent border-none cursor-pointer uppercase font-semibold text-xs text-left">KYRON OS</button>
          <a href="#protocols-preview" className="hover:text-[#006B63] transition-colors">{lang === 'PT' ? 'Protocolos' : 'Protocols'}</a>
          <a href="#labs-blog" className="hover:text-[#006B63] transition-colors">{lang === 'PT' ? 'Labs' : 'Labs'}</a>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Language Selector */}
          <div className="bg-[#FFF9F0] backdrop-blur-md rounded-full border border-[#E8DCC8] p-0.5 sm:p-1 flex items-center gap-0.5 shadow-xs">
            <button
              onClick={() => toggleLang('PT')}
              className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-full transition-all cursor-pointer ${lang === 'PT' ? 'bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20' : 'text-[#8B7868] hover:text-[#5B4A3F] border border-transparent'}`}
            >
              PT
            </button>
            <button
              onClick={() => toggleLang('EN')}
              className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-full transition-all cursor-pointer ${lang === 'EN' ? 'bg-[#006B63]/10 text-[#006B63] border border-[#006B63]/20' : 'text-[#8B7868] hover:text-[#5B4A3F] border border-transparent'}`}
            >
              EN
            </button>
          </div>

          <button 
            id="nav-login"
            onClick={onLogin} 
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B4A3F] hover:text-[#006B63] transition-colors cursor-pointer"
          >
            {t('login')}
          </button>
          
          <button 
            id="nav-start"
            onClick={onStart}
            className="hidden sm:inline-flex bg-[#006B63] hover:bg-[#075C56] text-white font-bold text-[10.5px] tracking-[0.18em] uppercase py-3 px-6 rounded-full shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {t('start')}
          </button>
        </div>
      </nav>

      {/* SECTION 01 — HERO & PREMIUM PRODUCT PREVIEW */}
      <section className="relative pt-28 sm:pt-36 pb-16 px-6 sm:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Premium Transformative Hook with Editorial Serif Heading */}
          <div className="lg:col-span-5 text-left space-y-8 relative">
            
            {/* Elegant Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F3D5A6] border border-[#E8DCC8] rounded-full"
            >
              <span className="w-1.5 h-1.5 bg-[#006B63] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7A3E18] font-mono">
                KYRON LABS
              </span>
            </motion.div>
            
            {/* Editorial Serif Headline */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-[3.35rem] font-serif font-medium tracking-tight leading-[1.12] text-[#241610]"
              >
                {lang === 'PT' ? (
                  <>
                    Treine com <span className="text-[#006B63] italic">inteligência</span>. <br />
                    Entenda seu corpo. <br />
                    Evolua com precisão.
                  </>
                ) : (
                  <>
                    Train with <span className="text-[#006B63] italic">intelligence</span>. <br />
                    Understand your body. <br />
                    Evolve with precision.
                  </>
                )}
              </motion.h1>
              
              {/* Subheadline focus */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.2 }}
                className="text-sm sm:text-base text-[#5B4A3F] font-light leading-relaxed max-w-xl"
              >
                {lang === 'PT' 
                  ? "Protocolos clínicos de performance, análise biomecânica e acompanhamento inteligente para transformar cada gota de esforço em evolução fisiológica real."
                  : "Clinical performance protocols, biomechanical analysis, and smart tracking to translate every drop of effort into true physiological evolution."
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
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.button 
                  id="hero-cta-start"
                  onClick={onStart}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="w-full sm:w-auto h-12.5 px-8 bg-[#006B63] hover:bg-[#075C56] text-white font-bold uppercase text-[10.5px] tracking-[0.18em] flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-full"
                >
                  <span>{lang === 'PT' ? 'Começar agora' : 'Get Started Now'}</span>
                  <ArrowRight size={13} className="text-white" />
                </motion.button>
                
                <motion.button 
                  onClick={() => {
                    const el = document.getElementById('protocols-preview');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="w-full sm:w-auto h-12.5 px-8 bg-[#FFF9F0] text-[#241610] hover:bg-[#FAF4EA] rounded-full font-bold uppercase text-[10.5px] tracking-[0.18em] flex items-center justify-center gap-1 cursor-pointer border border-[#E8DCC8]"
                >
                  {lang === 'PT' ? 'Conhecer o método' : 'Explore Method'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive Simulator redesigned in Soft Cream and Green-Teal */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center w-full relative">
            <div className="absolute inset-0 bg-[#FFF9F0]/60 rounded-[3rem] blur-2xl -z-10 border border-[#E8DCC8]/30" />
            
            {/* Sleek Tabs Selection bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 p-1 bg-[#F7EFE2] rounded-2xl w-full max-w-[540px] border border-[#E8DCC8]/60">
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
                        className="absolute inset-0 bg-[#FFF9F0] border border-[#E8DCC8] rounded-xl shadow-xs"
                        transition={springConfig}
                      />
                    )}
                    <Icon size={12} className={isActive ? 'text-[#006B63] relative z-10' : 'text-[#8B7868] relative z-10'} />
                    <span className={isActive ? 'text-[#241610] font-bold relative z-10' : 'text-[#8B7868] hover:text-[#5B4A3F] relative z-10'}>
                      {t(tab.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* High fidelity simulation preview */}
            <div className="w-full max-w-[480px] bg-[#FFF9F0]/90 border border-[#E8DCC8] shadow-[0_18px_50px_rgba(70,45,20,0.05)] rounded-[2.5rem] p-5 min-h-[360px] flex items-center justify-center overflow-hidden relative">
              <AnimatePresence mode="wait">
                {/* Workout system */}
                {activeTab === 'workout' && (
                  <motion.div
                    key="workout-mock"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={springConfig}
                    className="w-full max-w-[340px] bg-[#FFF9F0] text-[#241610] rounded-[2.25rem] p-6 shadow-xs relative border border-[#E8DCC8] backdrop-blur-md"
                  >
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-[#FAF4EA] rounded-full flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-[#E8DCC8]" />
                    </div>

                    <div className="space-y-5 pt-4">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-mono text-[#006B63] font-bold uppercase tracking-wider">{t('activeProtocol')}</span>
                        <span className="font-mono text-[#8B7868]">{t('rpeTarget')}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#006B63] font-bold block">{t('inclinePress')}</span>
                        <h5 className="text-base font-serif font-medium text-[#241610] leading-tight">{t('setCount').replace('{currentSet}', currentSet.toString())}</h5>
                      </div>

                      <div className="bg-[#FAF4EA] border border-[#E8DCC8]/70 rounded-xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] uppercase font-bold text-[#8B7868] block">{t('activeLoad')}</span>
                          <span className="text-base font-semibold text-[#241610] font-mono tabular-nums">{customLoad} kg <span className="text-xs font-normal text-[#8B7868]">{t('total')}</span></span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.max(10, prev - 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-7 h-7 rounded-md bg-[#FFF9F0] border border-[#E8DCC8] hover:bg-[#F7EFE2] text-[#241610] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                          >
                            -
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setCustomLoad(prev => Math.min(200, prev + 2)); if ('vibrate' in navigator) navigator.vibrate(3); }}
                            className="w-7 h-7 rounded-md bg-[#FFF9F0] border border-[#E8DCC8] hover:bg-[#F7EFE2] text-[#241610] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#DDEFEA] border border-[#006B63]/20 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-[#006B63] block mb-0.5 font-mono">{t('restDecay')}</span>
                          <span className="text-lg font-light text-[#075C56] font-mono leading-none tabular-nums">00:{secsRemaining < 10 ? '0' + secsRemaining : secsRemaining}</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="w-7 h-7 bg-[#FFF9F0] border border-[#E8DCC8] rounded-md hover:bg-[#FAF4EA] flex items-center justify-center text-xs cursor-pointer text-[#241610]"
                          >
                            {timerRunning ? "||" : "▶"}
                          </button>
                          <button 
                            onClick={() => setSecsRemaining(90)}
                            className="w-7 h-7 bg-[#006B63] hover:bg-[#075C56] text-white font-bold text-xs rounded-md flex items-center justify-center cursor-pointer"
                          >
                            <RotateCcw size={10} className="text-white" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSetIncrement}
                        className="w-full bg-[#241610] hover:bg-[#5B4A3F] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
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
                    className="w-full max-w-[340px] bg-[#FFF9F0] border border-[#E8DCC8] rounded-[2.25rem] p-6 shadow-xs space-y-4 text-[#241610]"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8DCC8]/60 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest font-black text-[#8B7868] block">{t('metabolicCore')}</span>
                        <h6 className="text-xs font-semibold tracking-tight text-[#241610]">{t('nutritionIntel')}</h6>
                      </div>
                      
                      <div className="bg-[#DDEFEA] text-[#075C56] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-mono">
                        {t('bioScore')}: {bioState}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-[#5B4A3F] font-medium font-mono text-[9.5px]">{t('caloricBalance')}</span>
                        <span className="text-[#241610] font-bold font-mono">1,420 / 2,580 kcal</span>
                      </div>
                      <div className="h-2 w-full bg-[#FAF4EA] rounded-full overflow-hidden border border-[#E8DCC8]/40">
                        <div className="h-full bg-[#006B63] rounded-full w-[55%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="bg-[#FAF4EA] p-2 rounded-xl border border-[#E8DCC8]/50">
                        <span className="text-[#8B7868] block mb-0.5 text-[8px] uppercase font-bold">{t('protein')}</span>
                        <span className="font-bold text-[#241610] font-mono leading-none">148g</span>
                      </div>
                      <div className="bg-[#FAF4EA] p-2 rounded-xl border border-[#E8DCC8]/50">
                        <span className="text-[#8B7868] block mb-0.5 text-[8px] uppercase font-bold">{t('carbs')}</span>
                        <span className="font-bold text-[#241610] font-mono leading-none">184g</span>
                      </div>
                      <div className="bg-[#FAF4EA] p-2 rounded-xl border border-[#E8DCC8]/50">
                        <span className="text-[#8B7868] block mb-0.5 text-[8px] uppercase font-bold">{t('fats')}</span>
                        <span className="font-bold text-[#241610] font-mono leading-none">58g</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF4EA] border border-[#E8DCC8] p-3 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[#5B4A3F] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Droplet size={10} className="text-[#006B63]" />
                          {t('waterEquilibrium')}
                        </span>
                        <span className="text-[10px] font-bold text-[#241610] font-mono">
                          {(liveWaterMl / 1000).toFixed(2)}L <span className="text-[#8B7868] font-normal">/ 3.5L</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 bg-[#FFF9F0] border border-[#E8DCC8]/60 rounded-lg overflow-hidden h-8.5 relative flex items-center justify-center">
                          <span className="absolute text-[8px] tracking-wider text-[#006B63] font-mono font-bold z-10 leading-none">{t('activeBioRatio')}</span>
                          <div 
                            className="bg-[#DDEFEA] h-full absolute left-0 top-0 transition-all duration-300"
                            style={{ width: `${Math.min(100, (liveWaterMl / 3500) * 100)}%` }}
                          />
                        </div>

                        <button
                          onClick={handleWaterDrink}
                          className="bg-[#006B63] text-white rounded-lg px-3.5 hover:bg-[#075C56] text-[9.5px] uppercase tracking-wide font-bold active:scale-95 transition-all outline-none cursor-pointer"
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
                    className="w-full max-w-[340px] bg-[#FFF9F0] text-[#241610] rounded-[2.25rem] p-6 shadow-xs flex flex-col justify-between min-h-[300px] border border-[#E8DCC8] backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 border-b border-[#E8DCC8]/60 pb-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#006B63]/10 text-[#006B63] flex items-center justify-center">
                        <Brain size={12} />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-widest text-[#8B7868] font-bold block leading-none font-mono">{t('rubiLog')}</span>
                        <span className="text-[10.5px] font-semibold text-[#241610] tracking-tight">{t('systemicCalibration')}</span>
                      </div>
                    </div>

                    <div className="space-y-3 py-3.5 flex-1">
                      <div className="text-right">
                        <span className="inline-block bg-[#FAF4EA] text-[#241610] text-[10px] px-3.5 py-2 rounded-2xl rounded-tr-none text-left max-w-[85%] font-light border border-[#E8DCC8]/40 shadow-xs">
                          {t('interactiveQuestion')}
                        </span>
                      </div>

                      <div className="text-left flex gap-2">
                        <div className="w-5.5 h-5.5 bg-[#006B63] text-white font-bold rounded-full flex items-center justify-center text-[8.5px] font-mono shrink-0 pt-0.5">R</div>
                        <div className="bg-[#DDEFEA] border border-[#006B63]/10 text-[9.5px] px-3 py-2 rounded-xl rounded-tl-none font-light leading-relaxed max-w-[88%] text-[#075C56]">
                          {t('interactiveAnswer')}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF4EA] p-2 rounded-lg border border-[#E8DCC8]/60 flex items-center gap-2 text-[8px] text-[#8B7868] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006B63] animate-pulse" />
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
                    className="w-full max-w-[340px] bg-[#FFF9F0] border border-[#E8DCC8] rounded-[2.25rem] p-6 shadow-xs space-y-4 text-[#241610]"
                  >
                    <div className="flex justify-between items-center border-b border-[#E8DCC8]/60 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#8B7868] block">{t('biometricSlope')}</span>
                        <h6 className="text-xs font-semibold text-[#241610] tracking-tight">{t('activeOverloadStream')}</h6>
                      </div>
                      <span className="text-[9.5px] text-[#006B63] font-bold font-mono">{t('efficiency')}</span>
                    </div>

                    <div className="p-3 bg-[#FAF4EA] border border-[#E8DCC8]/60 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5 flex-1">
                        <span className="text-[8px] uppercase font-bold text-[#8B7868] block">{t('tonnageFactor')}</span>
                        <span className="text-[10.5px] font-bold tracking-tight text-[#5B4A3F] block">{t('weeklyVolume')}</span>
                      </div>
                      <div className="w-9 h-9 bg-[#DDEFEA] text-[#006B63] rounded-lg flex items-center justify-center font-bold text-xs border border-[#006B63]/15">
                        1RM
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[8px] uppercase font-bold text-[#8B7868] block px-1">{t('continuousEvolution')}</span>
                      
                      <div className="relative h-20 w-full bg-[#FAF4EA] border border-[#E8DCC8]/60 rounded-lg overflow-hidden flex items-end p-1">
                        <svg className="w-full h-full text-[#006B63]" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            fill="none" 
                          />
                          <path 
                            d="M0,25 Q15,18 30,22 T60,11 T90,5 T100,2 L100,30 L0,30 Z" 
                            fill="url(#progressGradientTeal)" 
                            opacity="0.1" 
                          />
                          <defs>
                            <linearGradient id="progressGradientTeal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#006B63" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute right-4 top-1.5 w-2 h-2 rounded-full bg-[#006B63] animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 02 — THE CORE PROBLEM (Elegant & Crisp) */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E8DCC8]/50 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#006B63] font-mono block">
              {lang === 'PT' ? 'MUDANÇA DE PARADIGMA' : 'PARADIGM SHIFT'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#241610] tracking-tight">
              {lang === 'PT' ? 'Seu treino é estático, mas sua biologia é dinâmica.' : 'Your workout is static, but your biology is dynamic.'}
            </h2>
            <p className="text-sm text-[#5B4A3F] leading-relaxed">
              {lang === 'PT' 
                ? "A maioria das fichas de academia mede apenas números arbitrários de repetições e séries. Elas desconsideram o estresse do dia a dia, a qualidade do sono, o tempo de descanso e a biodisponibilidade neuromuscular. O KYRON foi feito para mudar isso."
                : "Most gym routines only measure arbitrary set and rep counts. They neglect daily stress, sleep quality, rest times, and neuromuscular bioavailability. KYRON was designed to correct this imbalance."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FFF9F0] border border-[#E8DCC8] p-6 rounded-[24px] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F3D5A6] text-[#7A3E18] flex items-center justify-center font-bold text-sm">
                ✕
              </div>
              <h4 className="text-sm font-bold uppercase text-[#241610] tracking-wide">{lang === 'PT' ? 'Fichas Estáticas' : 'Static Routines'}</h4>
              <p className="text-xs text-[#5B4A3F] leading-relaxed">
                {lang === 'PT' ? 'Fórmulas prontas que ignoram a fadiga muscular e o tempo de regeneração das fibras.' : 'Pre-made sheets ignoring raw muscular fatigue and fiber recovery cycles.'}
              </p>
            </div>

            <div className="bg-[#FFF9F0] border border-[#E8DCC8] p-6 rounded-[24px] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#DDEFEA] text-[#006B63] flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <h4 className="text-sm font-bold uppercase text-[#241610] tracking-wide">{lang === 'PT' ? 'Biologia Ativa' : 'Active Biology'}</h4>
              <p className="text-xs text-[#5B4A3F] leading-relaxed">
                {lang === 'PT' ? 'Cálculos biomecânicos e micro-ajustes automáticos conforme seu estado atual de performance.' : 'Biomechanical algorithms and micro-adjustments adapted to your actual state of strength.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — SOLUÇÃO KYRON OS (5 Pillars of Excellence) */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E8DCC8]/50">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#006B63] font-mono block">
            {lang === 'PT' ? 'RECURSOS DE ELITE' : 'ELITE FEATURES'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#241610] tracking-tight">
            {lang === 'PT' ? 'O Ecossistema da Evolução' : 'The Ecosystem of Evolution'}
          </h2>
          <p className="text-sm text-[#5B4A3F] font-light leading-relaxed">
            {lang === 'PT'
              ? 'Uma interface criada para o máximo de clareza prática. Menos toques, mais resultados.'
              : 'A sleek interface designed for absolute clarity. Minimal interaction, maximum bio-efficiency.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: lang === 'PT' ? 'Protocolos Inteligentes' : 'Intelligent Protocols',
              desc: lang === 'PT' ? 'Planilhas baseadas em ciência adaptadas progressivamente de acordo com seu feedback neural.' : 'Science-based spreadsheets adapted continuously based on your active load feedback.',
              tag: 'BIOMECÂNICA',
              icon: Target
            },
            {
              title: lang === 'PT' ? 'Análise Biomecânica' : 'Biomechanical Analytics',
              desc: lang === 'PT' ? 'Acompanhamento do equilíbrio muscular e distribuição para evitar desníveis e lesões.' : 'Tracking of muscular balances and load distribution to avoid joint bottlenecks and injuries.',
              tag: 'PREVENÇÃO',
              icon: Activity
            },
            {
              title: lang === 'PT' ? 'Progressão por Histórico' : 'Overload Progression Memory',
              desc: lang === 'PT' ? 'Cada quilo adicionado é arquivado. Seu algoritmo calcula a sobrecarga ideal para a próxima série.' : 'Every micro-load is recorded. Your internal system calculates the recommended overload weight.',
              tag: 'MEMÓRIA',
              icon: TrendingUp
            },
            {
              title: lang === 'PT' ? 'Biblioteca de Exercícios' : 'Elite Exercise Library',
              desc: lang === 'PT' ? 'Substitutos de alta eficiência clínica para manter a intensidade do estímulo sem sobrecarga articular.' : 'High-efficiency clinical exercise substitutes to maintain high intensity safely without joint pain.',
              tag: 'ANATOMIA',
              icon: Dumbbell
            },
            {
              title: lang === 'PT' ? 'Feedback de Evolução' : 'Continuous Bio Feedback',
              desc: lang === 'PT' ? 'Acompanhamento claro do volume de tonelagem e estimativas de 1RM por grupo muscular.' : 'Clear visual analysis of calculated weekly tonnage and estimated 1RM changes per block.',
              tag: 'MÉTRICAS',
              icon: LineChart
            }
          ].map((pillar, idx) => {
            const PillarIcon = pillar.icon;
            return (
              <div 
                key={idx} 
                className="bg-[#FFF9F0] border border-[#E8DCC8] p-8 rounded-[28px] shadow-[0_12px_40px_rgba(70,45,20,0.03)] flex flex-col justify-between hover:border-[#006B63]/60 transition-all hover:translate-y-[-2px] duration-300"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-[#DDEFEA] text-[#006B63] rounded-full flex items-center justify-center">
                    <PillarIcon size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[#7A3E18] tracking-widest font-mono uppercase bg-[#F3D5A6]/50 px-2 py-0.5 rounded-md inline-block">
                      {pillar.tag}
                    </span>
                    <h3 className="text-lg font-serif font-semibold text-[#241610] tracking-tight">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5B4A3F] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
                
                <div className="pt-6 mt-6 border-t border-[#E8DCC8]/40 flex items-center text-[10.5px] font-bold text-[#006B63] uppercase tracking-wider font-mono">
                  {lang === 'PT' ? 'Consistência Máxima' : 'Maximum Consistency'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 04 — KYRON LABS (Educational & Scientific Content) */}
      <section id="labs-blog" className="py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E8DCC8]/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#006B63] font-mono block">
              {lang === 'PT' ? 'CIÊNCIA APLICADA' : 'APPLIED SCIENCE'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#241610] tracking-tight">
              {lang === 'PT' ? 'Entenda os Sinais do Seu Corpo' : 'Decode Your Physiological Signals'}
            </h2>
            <p className="text-sm text-[#5B4A3F] font-light max-w-2xl">
              {lang === 'PT' 
                ? 'Conteúdo educativo premium para fazer melhores escolhas e entender a fundo as reações do seu metabolismo.' 
                : 'Premium educational content to make better clinical choices and thoroughly comprehend your metabolic responses.'}
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DDEFEA] border border-[#006B63]/25 rounded-full self-start md:self-end">
            <BookOpen size={12} className="text-[#006B63]" />
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#075C56]">KYRON LABS JOURNAL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              titlePT: "A cor da sua urina diz muito sobre sua saúde",
              titleEN: "What the color of your urine reveals about your internal status",
              catPT: "HIDRATAÇÃO",
              catEN: "HYDRATION",
              descPT: "Saiba avaliar o nível de desidratação e o impacto renal antes de iniciar sua próxima sessão de esforço máximo.",
              descEN: "Learn to assess systemic hydration levels and renal impact before starting your next heavy overload block."
            },
            {
              titlePT: "Como identificar excesso de volume no treino",
              titleEN: "How to identify training volume overflow early",
              catPT: "PERIODIZAÇÃO",
              catEN: "PERIODIZATION",
              descPT: "Os sinais biológicos sutis de fadiga do sistema nervoso central e declínio do rendimento progressivo.",
              descEN: "Subtle biological biomarkers indicating central nervous system fatigue and a decline in strength curve progression."
            },
            {
              titlePT: "Por que seu supino pode estar machucando o ombro",
              titleEN: "Why your chest press might be overloading your shoulders",
              catPT: "BIOMEÂNICA",
              catEN: "BIOMECHANICS",
              descPT: "Ajustes simples de rotação de úmero e ângulo de inclinação do banco para isolar as fibras peitorais com segurança.",
              descEN: "Simple adjustments to humeral rotation and bench angle to safely isolate pectoral fibers while preserving joints."
            },
            {
              titlePT: "O que sua fadiga matinal está tentando mostrar",
              titleEN: "What your early fatigue is trying to communicate",
              catPT: "RECUPERAÇÃO",
              catEN: "RECOVERY",
              descPT: "Entenda a relação entre oscilações de cortisol basal, sono profundo e adaptações de hipertrofia acumuladas.",
              descEN: "Understand the correlation between morning cortisol fluctuations, deep sleep patterns, and hypertrophic adaptations."
            }
          ].map((article, idx) => {
            const title = lang === 'PT' ? article.titlePT : article.titleEN;
            const cat = lang === 'PT' ? article.catPT : article.catEN;
            const desc = lang === 'PT' ? article.descPT : article.descEN;

            return (
              <div 
                key={idx}
                className="bg-[#FFF9F0] border border-[#E8DCC8] rounded-[28px] p-6 hover:shadow-md transition-all hover:border-[#006B63]/60 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-bold text-[#7A3E18] uppercase tracking-wider font-mono bg-[#F3D5A6] px-2 py-0.5 rounded">
                      {cat}
                    </span>
                    <span className="text-[10px] text-[#8B7868] font-mono">
                      {idx + 1} min read
                    </span>
                  </div>

                  <h3 className="text-base font-serif font-semibold text-[#241610] tracking-tight group-hover:text-[#006B63] transition-colors leading-snug">
                    {title}
                  </h3>

                  <p className="text-xs text-[#5B4A3F] leading-relaxed font-light">
                    {desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E8DCC8]/40 flex items-center justify-between text-[#006B63] text-xs font-bold uppercase tracking-wider font-mono cursor-pointer">
                  <span>{lang === 'PT' ? 'Ler conteúdo' : 'Read Article'}</span>
                  <ArrowRight size={12} className="transform transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 05 — CURATED PREMIUM PROTOCOLS */}
      <section id="protocols-preview" className="py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E8DCC8]/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#006B63] font-mono block">
              {lang === 'PT' ? 'ESTRUTURAS CLÍNICAS' : 'CLINICAL STRUCTURES'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#241610] tracking-tight">
              {lang === 'PT' ? 'Protocolos Científicos Disponíveis' : 'Scientific Training Protocols'}
            </h2>
            <p className="text-sm text-[#5B4A3F] font-light max-w-2xl">
              {lang === 'PT' 
                ? 'Periodizações completas focadas em máxima entrega biológica. Selecione o bloco correto para seu momento físico.' 
                : 'Complete periodizations focused on maximum biological delivery. Select the right block matching your current physical tempo.'}
            </p>
          </div>
          
          <div className="text-xs font-mono text-[#8B7868] hidden md:block">
            {lang === 'PT' ? 'Arraste para o lado →' : 'Swipe to explore →'}
          </div>
        </div>

        {/* Elegant Horizontal Carousel */}
        <div className="flex overflow-x-auto gap-5 pb-6 px-1 -mx-4 sm:-mx-12 sm:px-12 scrollbar-none snap-x snap-mandatory pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {protocolsList.map((prot, idx) => {
            const title = lang === 'PT' ? prot.titlePT : prot.titleEN;
            const difficulty = lang === 'PT' ? prot.difficultyPT : prot.difficultyEN;
            const objective = lang === 'PT' ? prot.objectivePT : prot.objectiveEN;
            const duration = lang === 'PT' ? prot.durationPT : prot.durationEN;

            return (
              <motion.div 
                key={idx}
                onClick={onStart}
                className="bg-[#FFF9F0] border border-[#E8DCC8] p-6 rounded-[28px] shrink-0 w-[280px] sm:w-[320px] h-[160px] snap-align-start flex flex-col justify-between cursor-pointer hover:border-[#006B63] transition-all shadow-xs group"
                whileHover={{ y: -3 }}
                transition={springConfig}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] uppercase tracking-wider font-bold bg-[#DDEFEA] text-[#075C56] px-2.5 py-1 rounded-md">
                      {difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-[#8B7868] font-medium">{duration}</span>
                  </div>

                  <h3 className="text-base font-serif font-semibold text-[#241610] group-hover:text-[#006B63] tracking-tight leading-snug transition-colors">
                    {title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#E8DCC8]/40 flex items-center justify-between">
                  <span className="text-[11px] text-[#5B4A3F] truncate">
                    {objective}
                  </span>
                  <span className="text-[9px] font-bold text-[#006B63] uppercase tracking-wider shrink-0 font-mono">
                    → {lang === 'PT' ? 'Acessar' : 'Access'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 06 — ACCESSIBLE COMPACT PROGRESSION SUMMARY */}
      <section className="py-16 px-6 sm:px-12 bg-[#FFF9F0] border-y border-[#E8DCC8]/60 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#006B63]/3 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#006B63] font-mono block">
              {lang === 'PT' ? 'EVOLUÇÃO REAL' : 'REAL EVOLUTION'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#241610] tracking-tight">
              {lang === 'PT' ? 'Métricas Biológicas de Força' : 'Biological Metrics of Strength'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B4A3F] font-light">
              {lang === 'PT' 
                ? 'O único sistema integrado com calibradores de sobrecarga que otimiza sua tensão mecânica ativa semana após semana.' 
                : 'The only integrated setup combining mechanical overload calculators that refines active tension weekly.'}
            </p>
          </div>

          <div className="max-w-md mx-auto bg-[#FAF4EA] border border-[#E8DCC8] rounded-[2.5rem] p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#075C56] bg-[#DDEFEA] px-3 py-1 rounded-full font-mono">
                {lang === 'PT' ? 'Exemplo de Progressão' : 'Progression Case'}
              </span>
              <span className="text-xs font-mono font-bold text-[#006B63] bg-[#006B63]/10 px-3 py-1 rounded-full">
                +20kg
              </span>
            </div>

            <div className="flex flex-col items-start gap-1 py-1 text-left">
              <h3 className="text-lg font-serif font-medium text-[#241610]">
                {lang === 'PT' ? 'Supino com Halteres' : 'Dumbbell Press'}
              </h3>
              <p className="text-xs text-[#8B7868]">
                {lang === 'PT' ? 'Protocolo Hipertrofia Essencial — Semana 8' : 'Essential Hypertrophy Protocol — Week 8'}
              </p>
            </div>

            <div className="flex items-center justify-between bg-[#FFF9F0] border border-[#E8DCC8]/70 p-4 rounded-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-[#8B7868] font-mono tracking-wider">
                  {lang === 'PT' ? 'Carga Inicial' : 'Initial Weight'}
                </span>
                <span className="text-lg font-semibold text-[#5B4A3F] font-mono mt-1">24kg × 10</span>
              </div>

              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#006B63]/10">
                <ArrowRight size={16} className="text-[#006B63]" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-[#006B63] font-mono tracking-wider">
                  {lang === 'PT' ? 'Carga Final' : 'Final Weight'}
                </span>
                <span className="text-lg font-bold text-[#241610] font-mono mt-1">34kg × 10</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07 — ELEGANT CHIC FINAL CTA */}
      <section className="py-16 px-6 text-center select-none bg-[#FAF4EA]">
        <div className="max-w-4xl mx-auto bg-[#FFF9F0] border border-[#E8DCC8] rounded-[3rem] p-8 sm:p-14 relative overflow-hidden shadow-xs">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[#006B63]/4 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <span className="uppercase tracking-[0.25em] text-[10px] font-bold text-[#006B63] font-mono block">KYRON LABS</span>
            
            <h2 className="text-3xl sm:text-4.5xl font-serif font-medium text-[#241610] leading-tight max-w-xl mx-auto">
              {lang === 'PT' ? 'Seu treino pode ser muito mais inteligente.' : 'Your training can be significantly smarter.'}
            </h2>

            <p className="text-[#5B4A3F] text-sm font-light italic max-w-md mx-auto leading-relaxed">
              {lang === 'PT' 
                ? 'Abandone planilhas estáticas e PDF genéricos. Integre sua biologia a um sistema de performance adaptativo de alta fidelidade.'
                : 'Leave static spreadsheets and generic PDFs behind. Integrate your biology with a high-fidelity adaptive performance system.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                id="footer-cta-start"
                onClick={onStart}
                className="w-full sm:w-auto px-10 h-13 bg-[#006B63] hover:bg-[#075C56] text-white transition-all font-bold uppercase text-[10.5px] tracking-[0.2em] border-none rounded-full cursor-pointer shadow-md"
              >
                {lang === 'PT' ? 'Acessar KYRON OS' : 'Access KYRON OS'}
              </button>
              
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-10 h-13 bg-transparent text-[#241610] hover:bg-[#FAF4EA] transition-all font-bold uppercase text-[10.5px] tracking-[0.2em] border border-[#E8DCC8] rounded-full cursor-pointer"
              >
                {lang === 'PT' ? 'Entrar na Conta' : 'Login to Account'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY FOOTER */}
      <footer className="py-10 px-8 sm:px-12 border-t border-[#E8DCC8]/60 bg-[#FAF4EA] relative z-15 select-none text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FFF9F0] border border-[#E8DCC8] rounded-xl flex items-center justify-center overflow-hidden shadow-xs p-1.5 shrink-0">
                <img src={kyronLogo} alt="KYRON LABS" className="w-full h-full object-contain scale-[1.7] transform" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#241610]">KYRON LABS © 2026</span>
            </div>
            <span className="text-[8.5px] font-bold text-[#8B7868] tracking-wider uppercase mt-1 pl-1">
              {t('poweredBy')}
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider text-[#5B4A3F] justify-center sm:justify-start">
            <a href="#" className="hover:text-[#006B63] transition-colors">{t('footerTerms')}</a>
            <a href="#" className="hover:text-[#006B63] transition-colors">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-[#006B63] transition-colors">{t('footerPerformanceLab')}</a>
            <button 
              onClick={() => setShowBrandKit(true)} 
              className="hover:text-[#006B63] transition-colors cursor-pointer bg-transparent border-none p-0 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 text-[#5B4A3F]"
            >
              <Download size={11} className="stroke-[2.5]" />
              {t('footerBrandKit')}
            </button>
          </div>

        </div>
      </footer>

      {/* FLOATING ACTION PILL */}
      <AnimatePresence>
        {scrollProgress > 0.12 && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="fixed bottom-6 inset-x-0 z-[120] flex justify-center px-4"
          >
            <div className="bg-[#FFF9F0]/95 text-[#241610] backdrop-blur-md px-5 py-2.5 rounded-full border border-[#E8DCC8] shadow-[0_12px_44px_rgba(70,45,20,0.08)] flex items-center gap-4.5">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#006B63] rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B7868]">{t('floatBadge')}</span>
              </div>

              <div className="hidden sm:block w-[1px] h-4 bg-[#E8DCC8]/60" />

              <span className="text-[11px] font-light text-[#5B4A3F] hidden md:block">{t('floatSubtitle')}</span>

              <button 
                id="floating-cta-start"
                onClick={onStart}
                className="bg-[#006B63] hover:bg-[#075C56] text-white font-bold px-4 py-2 text-[9.5px] tracking-[0.16em] uppercase rounded-full transition-all cursor-pointer shadow-xs"
              >
                {t('floatBtnStart')}
              </button>

              <button 
                id="floating-cta-login"
                onClick={onLogin} 
                className="text-[#8B7868] hover:text-[#241610] px-2 text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
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
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#241610]/50 backdrop-blur-md"
            onClick={() => setShowBrandKit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#FFF9F0] rounded-3xl shadow-2xl border border-[#E8DCC8] w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="relative sticky top-0 bg-[#FFF9F0]/95 backdrop-blur-md px-6 sm:px-8 py-5 border-b border-[#E8DCC8] flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-[#241610] flex items-center gap-2">
                    <Sparkles className="text-[#006B63]" size={18} />
                    {lang === 'PT' ? 'Kit Oficial de Marca' : 'Official Brand Kit'}
                  </h3>
                  <p className="text-xs text-[#5B4A3F] mt-1">
                    {lang === 'PT' 
                      ? 'Faça o download das versões oficiais de alta resolução do logotipo do KYRON LABS.' 
                      : 'Download high-resolution official versions of Kyron Labs logos.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBrandKit(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#FAF4EA] text-[#8B7868] hover:text-[#241610] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="px-6 sm:px-8 border-b border-[#E8DCC8] flex gap-2 overflow-x-auto no-scrollbar bg-[#FAF4EA] py-3 sticky top-[84px] z-20">
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
                          ? 'bg-[#006B63] border-[#006B63] text-white shadow-xs' 
                          : 'bg-[#FFF9F0] hover:bg-[#FAF4EA] text-[#8B7868] border-[#E8DCC8] hover:text-[#241610]'
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* LOGO 1: OFFICIAL LIGHT PREVIEW */}
                      <div className="border border-[#E8DCC8] rounded-2xl p-4 flex flex-col justify-between bg-[#FAF4EA]/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-white flex items-center justify-center p-2 border border-[#E8DCC8]/60 overflow-hidden">
                            <img 
                              src={kyronLogo} 
                              alt="Kyron Labs Official Logo - Light Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.6]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-serif font-semibold text-[#241610]">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Claro' : 'Official Logo — Light Backdrop'}
                          </h4>
                          <p className="text-[10px] text-[#5B4A3F] mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial conforme renderizado na barra superior do site público. Versão para mídias claras.'
                              : 'The official brand symbol as displayed in the public header. Formatted for light mode compositions.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#E8DCC8]/40 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_labs_logo_light.png"
                            className="flex-1 h-9 bg-[#006B63] hover:bg-[#075C56] text-white font-bold hover:shadow-md text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                        </div>
                      </div>

                      {/* LOGO 2: OFFICIAL DARK PREVIEW */}
                      <div className="border border-[#E8DCC8] rounded-2xl p-4 flex flex-col justify-between bg-[#FAF4EA]/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-[#241610] flex items-center justify-center p-2 border border-[#241610] overflow-hidden">
                            <img 
                              src={kyronLogo} 
                              alt="Kyron Labs Official Logo - Dark Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.6]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-serif font-semibold text-[#241610]">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Escuro' : 'Official Logo — Dark Backdrop'}
                          </h4>
                          <p className="text-[10px] text-[#5B4A3F] mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial em contraste com fundo marrom escuro profundo.'
                              : 'The official logo rendered in stark contrast against a deep dark canvas.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#E8DCC8]/40 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_labs_logo_dark.png"
                            className="flex-1 h-9 bg-[#006B63] hover:bg-[#075C56] text-white font-bold hover:shadow-md text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                        </div>
                      </div>

                      {/* LOGO 3: COGNITIVE DIGITAL GRADIENT */}
                      <div className="border border-[#E8DCC8] rounded-2xl p-4 flex flex-col justify-between bg-[#FAF4EA]/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-gradient-to-tr from-[#241610] to-[#006B63]/30 flex items-center justify-center p-2 border border-[#E8DCC8]/60 overflow-hidden">
                            <img 
                              src={kyronLogo} 
                              alt="Kyron Labs Official Logo - Premium Ambient" 
                              className="max-h-full max-w-full object-contain scale-[1.6]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-serif font-semibold text-[#241610]">
                            {lang === 'PT' ? 'Logo Oficial — Atmosfera' : 'Official Logo — Ambient'}
                          </h4>
                          <p className="text-[10px] text-[#5B4A3F] mt-1 leading-relaxed">
                            {lang === 'PT'
                              ? 'O emblema oficial imerso em nosso gradiente editorial premium. Utilizado para posts e banners.'
                              : 'The official emblem set during our active digital atmosphere gradient. Used for promotional cards.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#E8DCC8]/40 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_labs_logo_ambient.png"
                            className="flex-1 h-9 bg-[#006B63] hover:bg-[#075C56] text-white font-bold hover:shadow-md text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            {lang === 'PT' ? 'Baixar' : 'Download'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'appicons' && (
                  <motion.div
                    key="appicons-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  >
                    {[
                      { title: lang === 'PT' ? 'Ícone Clássico' : 'Classic Icon', desc: 'Selo oficial creme e teal', img: kyronLogo },
                      { title: lang === 'PT' ? 'Ícone Mínimo' : 'Minimal Icon', desc: 'Foco no contraste clínico', img: kyronLogo }
                    ].map((icon, idx) => (
                      <div key={idx} className="border border-[#E8DCC8] rounded-2xl p-4 bg-[#FAF4EA]/40 text-center">
                        <div className="w-16 h-16 bg-white border border-[#E8DCC8] rounded-2xl mx-auto flex items-center justify-center p-2 shadow-xs mb-3 overflow-hidden">
                          <img src={icon.img} alt={icon.title} className="w-full h-full object-contain scale-[1.6]" />
                        </div>
                        <h4 className="text-xs font-serif font-semibold text-[#241610]">{icon.title}</h4>
                        <p className="text-[10px] text-[#8B7868] mt-1">{icon.desc}</p>
                      </div>
                    ))}
                  </motion.div>
                )}

                {brandKitTab === 'favicons' && (
                  <motion.div
                    key="favicons-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-8 border border-dashed border-[#E8DCC8] rounded-2xl bg-[#FAF4EA]/20"
                  >
                    <div className="w-8 h-8 bg-white border border-[#E8DCC8] rounded-lg mx-auto flex items-center justify-center p-1.5 shadow-xs mb-3 overflow-hidden">
                      <img src={kyronLogo} alt="Favicon" className="w-full h-full object-contain scale-[1.5]" />
                    </div>
                    <h4 className="text-xs font-serif font-semibold text-[#241610]">{lang === 'PT' ? 'Favicon de Alta Resolução' : 'High-Res Favicon'}</h4>
                    <p className="text-[10px] text-[#8B7868] mt-1">32x32px e 16x16px incluídos no build padrão.</p>
                  </motion.div>
                )}

                {brandKitTab === 'splash' && (
                  <motion.div
                    key="splash-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="border border-[#E8DCC8] rounded-2xl p-4 bg-[#FAF4EA]/40">
                      <h4 className="text-xs font-bold text-[#241610] uppercase mb-2">{lang === 'PT' ? 'Abertura Mobile' : 'Mobile Splash'}</h4>
                      <div className="aspect-[9/16] max-w-[140px] mx-auto rounded-xl bg-[#FFF9F0] border border-[#E8DCC8] flex flex-col items-center justify-center p-4">
                        <img src={kyronLogo} alt="Logo" className="w-8 h-8 object-contain scale-[1.5] mb-2" />
                        <span className="text-[8px] font-black tracking-widest text-[#241610]">KYRON LABS</span>
                      </div>
                    </div>
                    
                    <div className="border border-[#E8DCC8] rounded-2xl p-4 bg-[#FAF4EA]/40">
                      <h4 className="text-xs font-bold text-[#241610] uppercase mb-2">{lang === 'PT' ? 'Abertura Tablet & Desktop' : 'Tablet & Desktop Splash'}</h4>
                      <div className="aspect-[16/9] max-w-[220px] mx-auto rounded-xl bg-[#FFF9F0] border border-[#E8DCC8] flex flex-col items-center justify-center p-4">
                        <img src={kyronLogo} alt="Logo" className="w-10 h-10 object-contain scale-[1.5] mb-2" />
                        <span className="text-[9px] font-black tracking-widest text-[#241610]">KYRON LABS</span>
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
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-serif font-semibold text-[#241610]">{lang === 'PT' ? 'Diretrizes de Aplicação' : 'Application Guidelines'}</h4>
                    <p className="text-xs text-[#5B4A3F] leading-relaxed">
                      {lang === 'PT'
                        ? 'O logo do KYRON LABS deve ser sempre renderizado com margem mínima de respiro de 1.5x sua largura. O uso do fundo creme (#FAF4EA) com contraste de texto marrom (#241610) e elementos teal (#006B63) é o padrão primário regulamentado para a marca.'
                        : 'The KYRON LABS logo must always be rendered with a minimum padding of 1.5x its width. The usage of creme backdrops (#FAF4EA) paired with dark charcoal text (#241610) and green-teal (#006B63) highlights is the standard trademark guideline.'}
                    </p>
                  </motion.div>
                )}

                {brandKitTab === 'validation' && (
                  <motion.div
                    key="validation-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#DDEFEA] text-[#075C56] p-4 rounded-xl border border-[#006B63]/25 flex items-start gap-3">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#006B63]" />
                      <div>
                        <h5 className="text-xs font-bold uppercase">{lang === 'PT' ? 'Identidade Visual Consistente' : 'Visual Identity Consistently Validated'}</h5>
                        <p className="text-[10px] mt-1 leading-relaxed">
                          Selo ativo de conformidade. Todas as cores e tipografias do site público seguem rigorosamente a paleta aprovada de design de saúde premium de alta fidelidade.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DIRECTIVES */}
                <div className="bg-[#FAF4EA] border border-[#E8DCC8] rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4 mt-6">
                  <div className="p-2 bg-[#DDEFEA] text-[#006B63] rounded-xl shrink-0">
                    <ShieldCheck size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-[#241610]">
                      {lang === 'PT' ? 'Diretrizes de Identidade Visual Ativa' : 'Active Visual Identity Guidelines'}
                    </h5>
                    <p className="text-[10px] text-[#5B4A3F] mt-1.5 leading-relaxed">
                      {lang === 'PT'
                        ? 'Estes ativos são marcas registradas do ecossistema KYRON LABS. Você está autorizado a utilizá-los para fins de relatórios de evolução de atletas ou integrações parceiras, mantendo a integridade original das proporções do logotipo.'
                        : 'These branding assets are trademarks of the KYRON LABS ecosystem. You are authorized to use them for biometric reports, athlete promotion, or partnership integrations, provided the typography and aspect ratios are respected.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="bg-[#FAF4EA] px-6 sm:px-8 py-4 border-t border-[#E8DCC8] flex justify-end">
                <button
                  onClick={() => setShowBrandKit(false)}
                  className="px-6 py-2 bg-[#241610] hover:bg-[#5B4A3F] text-white font-bold text-[9.5px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
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
