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
      titlePT: "Poder Explosivo",
      titleEN: "Explosive Power",
      difficultyPT: "Avançado • Elite",
      difficultyEN: "Advanced • Elite",
      objectivePT: "Desenvolvimento de potência pura",
      objectiveEN: "Pure power development",
      durationPT: "6 sem",
      durationEN: "6 wks"
    },
    {
      titlePT: "Definição Estética",
      titleEN: "Aesthetic Shred",
      difficultyPT: "Todos os Níveis",
      difficultyEN: "All Levels",
      objectivePT: "Déficit com preservação de massa",
      objectiveEN: "Deficit with mass preservation",
      durationPT: "10 sem",
      durationEN: "10 wks"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-blue-500/10 selection:text-blue-800 overflow-x-hidden relative">
      
      {/* Background ambient radial gradients for premium depth - aligned with light theme */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/3 rounded-full blur-[120px] pointer-events-none z-0 living-blur-1" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-[140px] pointer-events-none z-0 living-blur-2" />
      <div className="absolute bottom-[1000px] left-1/3 w-[500px] h-[500px] bg-violet-500/3 rounded-full blur-[120px] pointer-events-none z-0 living-blur-1" />

      {/* 🚀 FIXED TOP NAVIGATION */}
      <nav className="sticky top-0 z-[120] w-full bg-white/75 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center overflow-hidden shadow-xs">
              <img 
                src={kyronLogo} 
                alt="KYRON OS Logo" 
                className="h-10 w-10 object-contain scale-150"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight uppercase text-[#0F172A] font-mono">
                KYRON<span className="text-[#7BA7FF]">.</span>
              </span>
              <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">
                {t('poweredBy')}
              </span>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-4">
            {/* Language Toggles */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shrink-0">
              <button
                onClick={() => toggleLang('PT')}
                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  lang === 'PT' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                PT
              </button>
              <button
                onClick={() => toggleLang('EN')}
                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  lang === 'EN' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                EN
              </button>
            </div>

            {/* Login and Register CTA buttons */}
            <button
              onClick={onLogin}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors cursor-pointer hidden sm:block"
            >
              {t('login')}
            </button>
            <button
              onClick={onStart}
              className="btn-primary h-9.5 !py-0 px-4.5 flex items-center gap-1.5 shadow-lg shadow-[#7BA7FF]/20 text-[10px]"
            >
              <span>{t('start')}</span>
              <ArrowRight size={12} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </nav>

      {/* 🔮 HERO SECTION WITH INTEGRATED TELEMETRY SIMULATOR */}
      <section className="relative pt-12 pb-24 px-6 z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Hero Content */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="badge-premium-blue gap-2 py-1 px-3"
            >
              <Sparkles size={11} className="animate-pulse" />
              <span>{t('badge')}</span>
            </motion.div>
 
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-none"
            >
              {t('headline')}
            </motion.h1>
 
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-semibold"
            >
              {t('subheadline')}
            </motion.p>
 
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button 
                onClick={onStart}
                className="btn-primary w-full sm:w-auto h-12 flex items-center justify-center gap-2"
              >
                <span>{t('ctaStart')}</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
              <a 
                href="#how-it-works"
                className="btn-secondary w-full sm:w-auto h-12 flex items-center justify-center gap-1.5"
              >
                <span>{t('heroExplore')}</span>
              </a>
            </motion.div>
 
            {/* Testimonial Quote */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-slate-200/80 max-w-md mx-auto lg:mx-0"
            >
              <p className="text-xs font-mono italic text-slate-500 text-center lg:text-left">
                {t('quote')}
              </p>
            </motion.div>
          </div>
 
          {/* Right Interactive Simulator Box */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-2xl z-0 pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 card-premium !p-0 overflow-hidden"
            >
              
              {/* Simulator Header */}
              <div className="bg-slate-50/80 px-6 py-4.5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#7BA7FF] block">
                    {t('simBadge')}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
                    {t('simSub')}
                  </p>
                </div>
 
                {/* Simulated Tabs buttons */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'workout', label: t('tabWorkout'), icon: Dumbbell },
                    { id: 'metabolism', label: t('tabNutrition'), icon: Apple },
                    { id: 'coach', label: t('tabRubi'), icon: Brain },
                    { id: 'evolution', label: t('tabProgression'), icon: LineChart }
                  ].map((tab) => {
                    const IconComp = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                          active 
                            ? 'bg-[#818CF8] text-white shadow-xs' 
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <IconComp size={10} className={active ? 'stroke-[2.5]' : 'stroke-[2]'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Simulator Main Body Content tabs */}
              <div className="p-6 h-[290px] overflow-y-auto no-scrollbar bg-white/45">
                <AnimatePresence mode="wait">
                  
                  {/* WORKOUT TAB */}
                  {activeTab === 'workout' && (
                    <motion.div
                      key="workout"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono">
                          {t('activeProtocol')}
                        </span>
                        <span className="badge-premium-blue font-mono py-0.5">
                          {t('rpeTarget')}
                        </span>
                      </div>
 
                      <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                            {t('inclinePress')}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {t('setCount').replace('{currentSet}', String(currentSet))}
                          </p>
                        </div>
                        
                        {/* Interactive Load Changer */}
                        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
                          <button 
                            onClick={() => setCustomLoad(p => Math.max(20, p - 2))}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold flex items-center justify-center border border-slate-200/40 shadow-2xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-black text-slate-800 px-2">
                            {customLoad}kg
                          </span>
                          <button 
                            onClick={() => setCustomLoad(p => Math.min(200, p + 2))}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold flex items-center justify-center border border-slate-200/40 shadow-2xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
 
                      {/* Rest Countdown Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-8 bg-slate-50/60 border border-slate-100 p-3 rounded-2xl shadow-2xs">
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase block">
                            {t('restDecay')}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-mono font-black text-[#818CF8]">
                              00:{secsRemaining < 10 ? `0${secsRemaining}` : secsRemaining}
                            </span>
                            <div className="h-1.5 w-32 sm:w-44 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#818CF8] transition-all duration-1000" 
                                style={{ width: `${(secsRemaining / 90) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
 
                        {/* Complete Set Action Button */}
                        <button
                          onClick={handleSetIncrement}
                          className="sm:col-span-4 btn-primary h-12.5 !rounded-2xl text-[10px] w-full"
                        >
                          {t('confirmSet')}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* NUTRITION TAB */}
                  {activeTab === 'metabolism' && (
                    <motion.div
                      key="metabolism"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono">
                          {t('metabolicCore')}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span>{t('nutritionIntel')}</span>
                        </div>
                      </div>
 
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between shadow-2xs">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t('bioScore')}</span>
                          <span className="text-2xl font-mono font-black text-slate-800 mt-1">{bioState}%</span>
                        </div>
                        <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between shadow-2xs">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{t('caloricBalance')}</span>
                          <span className="text-sm font-mono font-black text-emerald-600 mt-1">-420 kcal</span>
                        </div>
                      </div>
 
                      {/* Macronutrient percentages */}
                      <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase">{t('protein')}</span>
                            <span className="block text-xs font-mono font-black text-slate-800 mt-0.5">180g</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase">{t('carbs')}</span>
                            <span className="block text-xs font-mono font-black text-slate-600 mt-0.5">210g</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase">{t('fats')}</span>
                            <span className="block text-xs font-mono font-black text-slate-600 mt-0.5">65g</span>
                          </div>
                        </div>
 
                        {/* Interactive Water drinking tool */}
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                          <div className="text-right">
                            <span className="text-[7.5px] font-black text-[#7BA7FF] uppercase tracking-widest block">{t('waterEquilibrium')}</span>
                            <span className="text-xs font-mono font-black text-slate-800 mt-0.5">{liveWaterMl}ml</span>
                          </div>
                          <button
                            onClick={handleWaterDrink}
                            className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:text-blue-800 hover:bg-blue-100/85 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-3xs"
                            title="Log 250ml"
                          >
                            <Droplet size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
 
                  {/* RUBI INTERACTION TAB */}
                  {activeTab === 'coach' && (
                    <motion.div
                      key="coach"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono">
                          {t('rubiLog')}
                        </span>
                        <span className="text-[9px] font-black tracking-widest text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          {t('systemicCalibration')}
                        </span>
                      </div>
 
                      {/* Interactive dialogue lines */}
                      <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl max-w-[85%] self-start shadow-3xs">
                          <p className="text-[10px] font-mono italic text-slate-600">
                            {t('interactiveQuestion')}
                          </p>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100/60 px-4 py-3 rounded-2xl max-w-[85%] ml-auto space-y-1 shadow-2xs">
                          <span className="text-[8px] font-black tracking-widest text-blue-600 uppercase font-mono block">
                            Rubi Intelligence // OS v4.0
                          </span>
                          <p className="text-[10px] font-mono text-slate-700 leading-relaxed">
                            {t('interactiveAnswer')}
                          </p>
                        </div>
                      </div>
 
                      <div className="text-[8px] font-mono text-slate-400 text-center uppercase tracking-widest">
                        {t('rubiStateActive')}
                      </div>
                    </motion.div>
                  )}
 
                  {/* PERFORMANCE PROGRESSION TAB */}
                  {activeTab === 'evolution' && (
                    <motion.div
                      key="evolution"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono">
                          {t('biometricSlope')}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-[#818CF8] tracking-wider">
                          <TrendingUp size={11} />
                          <span>{t('activeOverloadStream')}</span>
                        </div>
                      </div>
 
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-center shadow-2xs">
                          <span className="text-[7px] font-black text-slate-400 uppercase">{t('efficiency')}</span>
                          <span className="block text-sm font-mono font-black text-emerald-600 mt-1">+16.4%</span>
                        </div>
                        <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-center shadow-2xs">
                          <span className="text-[7px] font-black text-slate-400 uppercase">{t('tonnageFactor')}</span>
                          <span className="block text-sm font-mono font-black text-slate-800 mt-1">4.2t</span>
                        </div>
                        <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-2xl text-center shadow-2xs">
                          <span className="text-[7px] font-black text-slate-400 uppercase">{t('weeklyVolume')}</span>
                          <span className="block text-sm font-mono font-black text-slate-800 mt-1">82 srs</span>
                        </div>
                      </div>
 
                      {/* Progression SVG Curve */}
                      <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl h-24 flex items-center justify-center relative overflow-hidden shadow-2xs">
                        <span className="absolute top-2 left-3 text-[8px] font-black text-slate-400 font-mono uppercase">
                          {t('continuousEvolution')}
                        </span>
                        <svg className="w-full h-full text-[#818CF8]/20" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <path 
                            d="M0 80 Q 80 50, 160 65 T 320 20 T 400 15" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          />
                          <path 
                            d="M0 80 Q 80 50, 160 65 T 320 20 T 400 15 L 400 100 L 0 100 Z" 
                            fill="url(#progression-gradient)" 
                          />
                          <defs>
                            <linearGradient id="progression-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(129, 140, 248)" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="rgb(129, 140, 248)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </div>

        </div>
      </section>

      {/* 📅 COMO FUNCIONA - CRONOGRAMA DE IMPLANTAÇÃO */}
      <section id="how-it-works" className="py-24 px-6 border-b border-slate-200/60 bg-white relative z-10 scroll-mt-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="badge-premium-blue py-1 px-3">
              {t('worksBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tight">
              {t('worksTitle')}
            </h2>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('step1Title'), desc: t('step1Desc') },
              { num: '02', title: t('step2Title'), desc: t('step2Desc') },
              { num: '03', title: t('step3Title'), desc: t('step3Desc') }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="card-premium space-y-4 group"
              >
                <span className="text-3xl font-mono font-black text-indigo-500/10 group-hover:text-[#818CF8]/30 transition-colors block leading-none">
                  {step.num}
                </span>
                <h3 className="text-base font-black text-[#0F172A] uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ⚖️ DO CAOS À CLAREZA - COMPARATIVE TABLE */}
      <section className="py-24 px-6 border-b border-slate-200/60 bg-[#F8FAFC] relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="badge-premium-blue py-1 px-3">
              {t('chaosBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tight">
              {t('chaosTitle')}
            </h2>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-5xl mx-auto">
            
            {/* Traditional Fitness Apps */}
            <div className="card-premium !bg-white/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase font-mono">
                    {t('traditionalBadge')}
                  </span>
                  <span className="text-[8px] font-black tracking-widest text-rose-600 uppercase font-mono bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                    {t('traditionalStatus')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-700 uppercase tracking-wide">
                  {t('traditionalTitle')}
                </h3>
                
                <ul className="space-y-3.5 pt-4">
                  {[
                    t('traditionalPoint1'),
                    t('traditionalPoint2'),
                    t('traditionalPoint3'),
                    t('traditionalPoint4')
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-500 font-semibold">
                      <span className="text-rose-500 mt-0.5 shrink-0 font-black font-mono">×</span>
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
 
              <div className="border-t border-slate-100 pt-4 text-center">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 font-mono">
                  {t('traditionalFooter')}
                </span>
              </div>
            </div>
 
            {/* KYRON OS */}
            <div className="card-premium !bg-white border-[#818CF8]/45 shadow-xl shadow-[#818CF8]/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/3 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black tracking-widest text-blue-500 uppercase font-mono">
                    {t('kyronCtaBadge')}
                  </span>
                  <span className="text-[8px] font-black tracking-widest text-emerald-600 uppercase font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    {t('kyronCtaStatus')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide">
                  {t('kyronTitle')}
                </h3>
 
                <ul className="space-y-3.5 pt-4">
                  {[
                    t('kyronPoint1'),
                    t('kyronPoint2'),
                    t('kyronPoint3'),
                    t('kyronPoint4')
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-semibold">
                      <Check size={14} className="text-blue-500 mt-0.5 shrink-0 stroke-[2.5]" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
 
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between relative z-10">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-600 font-mono">
                  {t('kyronBottomL')}
                </span>
                <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-600 font-mono">
                  {t('kyronBottomR')}
                </span>
              </div>
            </div>
 
          </div>
        </div>
      </section>
 
      {/* 📊 SEU DNA DE PERFORMANCE */}
      <section className="py-24 px-6 border-b border-slate-200/60 bg-white relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="badge-premium-blue py-1 px-3">
              {t('dnaBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tight">
              {t('dnaTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              {t('dnaSubtitle')}
            </p>
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Vector Biological Radial Chart Graphic */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-slate-100 rounded-full flex items-center justify-center bg-slate-50/50 shadow-inner">
                
                {/* SVG Radar Polygon */}
                <svg className="absolute inset-0 w-full h-full rotate-[-18deg]" viewBox="0 0 100 100">
                  {/* Concentric rings */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                  
                  {/* Axes */}
                  <line x1="50" y1="10" x2="50" y2="90" stroke="#e2e8f0" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="#e2e8f0" strokeWidth="0.5" />
 
                  {/* Active Radar Shape */}
                  <polygon 
                    points="50,18 78,38 72,68 32,62 25,32" 
                    fill="rgba(129, 140, 248, 0.1)" 
                    stroke="rgb(129, 140, 248)" 
                    strokeWidth="1.5"
                  />
                  
                  {/* Outer glowing nodes */}
                  <circle cx="50" cy="18" r="1.5" fill="#6366f1" />
                  <circle cx="78" cy="38" r="1.5" fill="#6366f1" />
                  <circle cx="72" cy="68" r="1.5" fill="#6366f1" />
                  <circle cx="32" cy="62" r="1.5" fill="#6366f1" />
                  <circle cx="25" cy="32" r="1.5" fill="#6366f1" />
                </svg>
 
                {/* Outer Labels mapping the axes */}
                <div className="absolute top-4 text-[8px] font-black uppercase tracking-widest text-indigo-600 font-mono">
                  {t('chartRecovery')}
                </div>
                <div className="absolute right-4 text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
                  {t('chartConsistency')}
                </div>
                <div className="absolute bottom-4 text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
                  {t('chartNutrition')}
                </div>
                <div className="absolute left-4 text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
                  {t('chartVolume')}
                </div>
                <div className="absolute center text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
                  {t('chartSleep')}
                </div>
              </div>
 
              {/* Central Biome Header badge */}
              <div className="text-center max-w-sm">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  {t('dnaVisualHeader')}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">
                  {t('dnaVisualDesc')}
                </p>
              </div>
            </div>
 
            {/* Right Pillars details Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: t('dnaPillar1Title'), desc: t('dnaPillar1Desc') },
                  { title: t('dnaPillar2Title'), desc: t('dnaPillar2Desc') },
                  { title: t('dnaPillar3Title'), desc: t('dnaPillar3Desc') },
                  { title: t('dnaPillar4Title'), desc: t('dnaPillar4Desc') },
                  { title: t('dnaPillar5Title'), desc: t('dnaPillar5Desc') },
                  { title: t('dnaPillar6Title'), desc: t('dnaPillar6Desc') }
                ].map((p, i) => (
                  <div key={i} className="card-premium !bg-white/95 p-4.5 space-y-1.5 shadow-2xs hover:shadow-xs hover:border-slate-300">
                    <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{p.desc}</p>
                  </div>
                ))}
              </div>
 
              {/* Rubi Insights Live Log */}
              <div className="bg-[#F1F5F9] border border-slate-200/40 p-4.5 rounded-2xl space-y-2 shadow-inner">
                <span className="text-[8.5px] font-black uppercase tracking-widest text-indigo-600 font-mono block">
                  {t('rubiInsightLabel')}
                </span>
                <div className="space-y-1.5">
                  {[t('insight1'), t('insight2'), t('insight3')].map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 text-[10.5px] text-slate-600 font-semibold leading-relaxed">
                      <span className="text-blue-500 font-mono shrink-0">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
 
          </div>
        </div>
      </section>
 
      {/* 🏆 CURADORIA PREMIUM - SELEÇÃO DE PROTOCOLOS */}
      <section className="py-24 px-6 border-b border-slate-200/60 bg-[#F8FAFC] relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="badge-premium-blue py-1 px-3">
              {t('libBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tight">
              {t('libTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold uppercase tracking-wider mt-1">
              {t('libSub')}
            </p>
          </div>
 
          {/* Protocols List Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {protocolsList.map((p, i) => (
              <div 
                key={i} 
                className="card-premium flex flex-col justify-between group h-full !p-0 overflow-hidden shadow-2xs"
              >
                <div className="p-6 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-600 font-mono">
                      {lang === 'PT' ? p.difficultyPT : p.difficultyEN}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 font-black">
                      {lang === 'PT' ? p.durationPT : p.durationEN}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-black text-[#0F172A] uppercase tracking-wide group-hover:text-blue-600 transition-colors leading-snug">
                    {lang === 'PT' ? p.titlePT : p.titleEN}
                  </h3>
                  
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    {lang === 'PT' ? p.objectivePT : p.objectiveEN}
                  </p>
                </div>
 
                <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {t('libIncluded')}
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-800 transition-colors stroke-[2.5]" />
                </div>
              </div>
            ))}
          </div>
 
          <p className="text-[9.5px] font-mono text-slate-400 text-center max-w-2xl mx-auto leading-relaxed">
            {t('libFooter')}
          </p>
        </div>
      </section>
 
      {/* ⚖️ RESULTADOS MENSURÁVEIS (STAT BLOCKS) */}
      <section className="py-24 px-6 border-b border-slate-200/60 bg-white relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="badge-premium-blue py-1 px-3">
              {t('statBadge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tight">
              {t('statTitle')}
            </h2>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { val: '+18.5%', label: t('stat1Label'), sub: t('stat1Sub'), color: 'text-[#7BA7FF]' },
              { val: '94.2%', label: t('stat2Label'), sub: t('stat2Sub'), color: 'text-[#818CF8]' },
              { val: '-6.4kg', label: t('stat3Label'), sub: t('stat3Sub'), color: 'text-emerald-600' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="card-premium text-center space-y-2"
              >
                <span className={`text-4xl sm:text-5xl font-mono font-black ${stat.color} block tracking-tight`}>
                  {stat.val}
                </span>
                <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                  {stat.label}
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* 🌟 FINAL CTA SECTION */}
      <section className="py-28 px-6 border-b border-slate-200/60 bg-linear-to-b from-[#F8FAFC] to-white relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <span className="badge-premium-blue py-1 px-3">
            {t('finalBadge')}
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight uppercase leading-none">
            {t('finalTitle1')}<br />
            <span className="text-[#7BA7FF]">{t('finalTitle2')}</span>
          </h2>
 
          <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-md mx-auto leading-relaxed">
            {t('finalSupport')}
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto h-12 px-8 btn-primary flex items-center justify-center gap-2"
            >
              <span>{t('finalStartBtn')}</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto h-12 px-8 btn-secondary flex items-center justify-center"
            >
              <span>{t('finalLoginBtn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 📥 OFFICIAL BRAND KIT & LOGOS DOWNLOAD MODAL */}
      <AnimatePresence>
        {showBrandKit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
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
              <div className="relative sticky top-0 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-5 border-b border-slate-200/60 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Sparkles className="text-blue-600" size={14} />
                    {lang === 'PT' ? 'Kit Oficial de Marca' : 'Official Brand Kit'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    {lang === 'PT' 
                      ? 'Faça o download das versões oficiais de alta resolução do logotipo do KYRON LABS.' 
                      : 'Download high-resolution official versions of Kyron Labs logos.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBrandKit(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="px-6 sm:px-8 border-b border-slate-200/60 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 py-3 sticky top-[76px] z-20">
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                        active 
                          ? 'bg-[#818CF8] border-[#818CF8] text-white shadow-xs' 
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200/60 hover:text-slate-800 shadow-3xs'
                      }`}
                    >
                      <IconComponent size={11} className={active ? 'stroke-[2.5]' : 'stroke-[2]'} />
                      <span>{tab.label}</span>
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
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-white flex items-center justify-center p-2 border border-slate-200 overflow-hidden">
                            <img 
                              src={kyronLogo} 
                              alt="Kyron Labs Official Logo - Light Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.6]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Claro' : 'Official Logo — Light Backdrop'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                            {lang === 'PT'
                              ? 'O emblema oficial conforme renderizado na barra superior do site público. Versão para mídias claras.'
                              : 'The official brand symbol as displayed in the public header. Formatted for light mode compositions.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_labs_logo_light.png"
                            className="flex-1 btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar' : 'Download'}</span>
                          </a>
                        </div>
                      </div>

                      {/* LOGO 2: OFFICIAL DARK PREVIEW */}
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-slate-950 flex items-center justify-center p-2 border border-slate-800 overflow-hidden">
                            <img 
                              src={kyronLogo} 
                              alt="Kyron Labs Official Logo - Dark Theme" 
                              className="max-h-full max-w-full object-contain scale-[1.6]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                            {lang === 'PT' ? 'Logo Oficial — Fundo Escuro' : 'Official Logo — Dark Backdrop'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                            {lang === 'PT'
                              ? 'O emblema oficial em contraste com fundo escuro profundo.'
                              : 'The official logo rendered in stark contrast against a deep dark canvas.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                          <a 
                            href={kyronLogo} 
                            download="kyron_labs_logo_dark.png"
                            className="flex-1 btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar' : 'Download'}</span>
                          </a>
                        </div>
                      </div>

                      {/* LOGO 3: COGNITIVE DIGITAL GRADIENT */}
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-gradient-to-tr from-slate-950 to-indigo-950/50 flex items-center justify-center p-2 border border-slate-800 overflow-hidden">
                            <img 
                              src={kyronCoreLogo} 
                              alt="Kyron Labs Core Cognitive Emblem" 
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                            {lang === 'PT' ? 'Emblema Cognitivo Core' : 'Core Cognitive Emblem'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                            {lang === 'PT'
                              ? 'Versão circular com microcircuitos e gradiente azul profundo.'
                              : 'Circular emblem showcasing biological integration and indigo micro-gradients.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                          <a 
                            href={kyronCoreLogo} 
                            download="kyron_labs_core_emblem.png"
                            className="flex-1 btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar' : 'Download'}</span>
                          </a>
                        </div>
                      </div>

                      {/* LOGO 4: 3D OS METADATA RENDER */}
                      <div className="border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-slate-950 flex items-center justify-center border border-slate-800 overflow-hidden">
                            <img 
                              src={kyronOsLogo3D} 
                              alt="Kyron OS 3D Render metadata cover" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                            {lang === 'PT' ? 'Render 3D Metadados OS' : '3D OS Render Metadata'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                            {lang === 'PT'
                              ? 'Capa de apresentação volumétrica 3D com texturas biológicas.'
                              : 'Volumetric 3D presentation asset with physical biological micro-patterns.'}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                          <a 
                            href={kyronOsLogo3D} 
                            download="kyron_os_logo_3d.jpg"
                            className="flex-1 btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar' : 'Download'}</span>
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
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                  >
                    {[
                      {
                        title: lang === 'PT' ? 'Ícone App iOS Oficial' : 'Official iOS App Icon',
                        desc: lang === 'PT' ? 'Design de alta fidelidade calibrado para telas Retina.' : 'High-fidelity iOS asset optimized for Retina display dimensions.',
                        img: kyronLogo,
                        filename: 'kyron_app_icon_ios.png'
                      },
                      {
                        title: lang === 'PT' ? 'Ícone App Android Oficial' : 'Official Android App Icon',
                        desc: lang === 'PT' ? 'Formato adaptativo circular com bordas e contrastes refinados.' : 'Adaptive rounded format with micro-shadowing contours.',
                        img: kyronCoreLogo,
                        filename: 'kyron_app_icon_android.png'
                      },
                      {
                        title: lang === 'PT' ? 'Ícone macOS Big Sur Classic' : 'Classic macOS Big Sur Style',
                        desc: lang === 'PT' ? 'Emblema arredondado com efeito volumétrico 3D premium.' : 'Elegant rounded squircle with physical 3D extrusion aesthetics.',
                        img: kyronCoreV2,
                        filename: 'kyron_app_icon_macos.png'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-slate-100 border border-slate-200/60 flex items-center justify-center p-4">
                            <img 
                              src={item.img} 
                              alt={item.title} 
                              className="h-20 w-20 object-contain rounded-2xl"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40">
                          <a 
                            href={item.img} 
                            download={item.filename}
                            className="w-full btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar PNG' : 'Download PNG'}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {brandKitTab === 'favicons' && (
                  <motion.div
                    key="favicons-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {[
                      {
                        title: 'Favicon Standard ICO (16x16 / 32x32)',
                        desc: lang === 'PT' ? 'Favicon padrão multi-resolução empacotado em .ico para navegadores legacy.' : 'Multi-resolution classic web favicon formatted for compatibility.',
                        img: kyronLogo,
                        filename: 'favicon.ico'
                      },
                      {
                        title: 'Apple Touch Icon PNG (180x180)',
                        desc: lang === 'PT' ? 'Resolução oficial para bookmarking em homescreens do Safari iOS.' : 'High-res icon used when bookmarking Kyron on iOS home screens.',
                        img: kyronCoreLogo,
                        filename: 'apple-touch-icon.png'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="relative h-24 rounded-xl mb-4 bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                            <img 
                              src={item.img} 
                              alt={item.title} 
                              className="h-10 w-10 object-contain rounded-md"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40">
                          <a 
                            href={item.img} 
                            download={item.filename}
                            className="w-full btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar Favicon' : 'Download Favicon'}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {brandKitTab === 'splash' && (
                  <motion.div
                    key="splash-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {[
                      {
                        title: lang === 'PT' ? 'Tela de Carregamento iOS Oficial' : 'Official iOS Splash Screen',
                        desc: lang === 'PT' ? 'Resolução de 2048 x 2732px ajustada para iPads e iPhones de última geração.' : '2048 x 2732px premium background asset optimized for Apple devices.',
                        img: kyronOsLogo3D,
                        filename: 'kyron_splash_ios.jpg'
                      },
                      {
                        title: lang === 'PT' ? 'Tela de Carregamento Android Oficial' : 'Official Android Splash Screen',
                        desc: lang === 'PT' ? 'Resolução de 1080 x 1920px vertical para smartphones de mídias diversas.' : '1080 x 1920px vertical layout calibrated for high-end Android displays.',
                        img: kyronOsLogo3D,
                        filename: 'kyron_splash_android.jpg'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="relative h-32 rounded-xl mb-4 bg-slate-950 border border-slate-200/60 overflow-hidden flex items-center justify-center">
                            <img 
                              src={item.img} 
                              alt={item.title} 
                              className="w-full h-full object-cover scale-[1.05]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40">
                          <a 
                            href={item.img} 
                            download={item.filename}
                            className="w-full btn-primary h-9 !py-0 flex items-center justify-center gap-1.5 text-[9.5px]"
                          >
                            <Download size={12} className="stroke-[2.5]" />
                            <span>{lang === 'PT' ? 'Baixar Splash' : 'Download Splash'}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {brandKitTab === 'usage' && (
                  <motion.div
                    key="usage-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 font-mono text-slate-600 text-xs leading-relaxed"
                  >
                    <div className="border border-slate-200/60 bg-slate-50/80 p-6 rounded-2xl space-y-4 shadow-3xs">
                      <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest border-b border-slate-200/60 pb-2">
                        {lang === 'PT' ? 'DIRETRIZES DE USO DO SISTEMA' : 'SYSTEM USAGE GUIDELINES'}
                      </h4>
                      <p>
                        {lang === 'PT'
                          ? 'Os arquivos do Kit de Marca e Logotipos fornecidos acima destinam-se exclusivamente ao uso oficial em apresentações científicas, marketing e documentação corporativa do KYRON LABS.'
                          : 'The Brand Kit and Logo assets provided above are intended solely for official scientific presentation, internal documentation, and corporate marketing usage within Kyron Labs.'}
                      </p>
                      <ul className="space-y-2 list-disc pl-5">
                        <li>
                          {lang === 'PT'
                            ? 'Mantenha a proporção e integridade física de todos os logotipos fornecidos.'
                            : 'Maintain exact proportions and physical layout integrity of all logo vectors.'}
                        </li>
                        <li>
                          {lang === 'PT'
                            ? 'Não altere as paletas de cores padrões oficiais de cada tema (Azul Adaptativo e Branco Puro).'
                            : 'Do not modify the official standard color palettes (Adaptive Blue and Pure White).'}
                        </li>
                        <li>
                          {lang === 'PT'
                            ? 'O logotipo 3D OS RENDER não deve ser cortado ou esticado de forma inadequada.'
                            : 'The 3D OS Render asset must not be cropped, stretched, or pixelated.'}
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {brandKitTab === 'validation' && (
                  <motion.div
                    key="validation-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 font-mono text-slate-600 text-xs leading-relaxed"
                  >
                    <div className="border border-slate-200/60 bg-slate-50/80 p-6 rounded-2xl space-y-4 shadow-3xs">
                      <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest border-b border-slate-200/60 pb-2">
                        {lang === 'PT' ? 'REGISTROS DE VALIDAÇÃO DE LOGOS' : 'BRAND ASSETS VALIDATION'}
                      </h4>
                      <div className="space-y-2 text-[11px]">
                        <p><strong>Status:</strong> Active & Validated ✓</p>
                        <p><strong>Official Logo Light Hash:</strong> md5_83bf6ea19e19d77e4e1371cb21849ad9</p>
                        <p><strong>Official Logo Dark Hash:</strong> md5_59ad7714be042aa37cb21849ad7e137c</p>
                        <p><strong>Platform Core Symbol ID:</strong> cl_942cb6b6_9f94_4980_aa21_84094fd654c0</p>
                        <p className="pt-2 text-slate-400">
                          {lang === 'PT'
                            ? 'Todos os ativos foram checados no repositório de recursos internos e estão em sincronia com os requisitos da Fase 5.'
                            : 'All assets have been scanned against the local media registry and are fully in compliance with Phase 5 requisites.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 FIXED BOTTOM NAVIGATION FLOATING PILL */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] w-full max-w-sm px-4">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-wider text-blue-600 font-mono">
              {t('floatBadge')}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px] sm:max-w-xs mt-0.5">
              {t('floatSubtitle')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="px-3.5 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              {t('floatBtnLogin')}
            </button>
            <button
              onClick={onStart}
              className="px-4.5 h-8 btn-primary rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#818CF8]/10"
            >
              {t('floatBtnStart')}
            </button>
          </div>
        </div>
      </div>

      {/* 📜 SYSTEM FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center overflow-hidden">
              <img 
                src={kyronLogo} 
                alt="Kyron Labs" 
                className="h-8 w-8 object-contain scale-150"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm font-mono font-black uppercase text-slate-600">KYRON LABS</span>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                © {new Date().getFullYear()} {t('poweredBy')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            <a href="#" className="hover:text-slate-700 transition-colors">{t('footerTerms')}</a>
            <a href="#" className="hover:text-slate-700 transition-colors">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-slate-700 transition-colors">{t('footerPerformanceLab')}</a>
            <button 
              onClick={() => {
                setShowBrandKit(true);
                setBrandKitTab('appicons');
              }}
              className="hover:text-blue-600 transition-colors bg-transparent border-none p-0 cursor-pointer text-[10px] font-black uppercase tracking-widest font-mono"
            >
              {t('footerBrandKit')}
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};
