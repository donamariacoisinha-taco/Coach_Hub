import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Apple, 
  Droplet, 
  Plus, 
  Minus, 
  Sparkles, 
  Scale, 
  Flame, 
  Utensils, 
  Coffee, 
  Heart, 
  Sliders,
  TrendingUp,
  Activity,
  User,
  Trash2,
  Calendar
} from 'lucide-react';
import { useNavigation } from '../../App';
import { nutritionEngine, DayLog } from '../../services/nutritionEngine';
import { useNutritionStore } from '../../store/nutritionStore';

// Custom sub-components
import { MetabolicSettingsSheet } from './dieta/MetabolicSettingsSheet';
import { MetabolicBalanceRing } from './dieta/MetabolicBalanceRing';
import { NutritionInsightEngine } from './dieta/NutritionInsightEngine';
import { MacroDistributionVisualizer } from './dieta/MacroDistributionVisualizer';

export const MinhaDieta: React.FC = () => {
  const { profile: userProfile } = useNavigation();
  const { profile: metabolicProfile, metabolicState, showMetabolicSettings, setShowSettings, syncFromUserProfile } = useNutritionStore();

  const [activeDate, setActiveDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [dayLog, setDayLog] = useState<DayLog>(() => {
    return nutritionEngine.getLogForDate(activeDate, metabolicProfile.weight || 75);
  });

  // Load log whenever date or metabolic profile changes
  useEffect(() => {
    setDayLog(nutritionEngine.getLogForDate(activeDate, metabolicProfile.weight || 75));
  }, [activeDate, metabolicProfile.weight]);

  // Sync from central core userProfile if available initially
  useEffect(() => {
    if (userProfile) {
      syncFromUserProfile(userProfile);
    }
  }, [userProfile]);

  // State for user actions
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [customWater, setCustomWater] = useState('');
  
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('Café da Manhã');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const [showWeightLog, setShowWeightLog] = useState(false);
  const [weightInput, setWeightInput] = useState(() => String(metabolicProfile.weight || 75));

  // Sync weight text input when metabolic profile weight updates
  useEffect(() => {
    setWeightInput(String(metabolicProfile.weight || 75));
  }, [metabolicProfile.weight]);

  // Handle saving day log back to nutritionEngine service (persistent local db helper)
  const handleSaveLog = (updatedLog: DayLog) => {
    setDayLog(updatedLog);
    nutritionEngine.saveLog(updatedLog);
  };

  const handleAddWater = (amount: number) => {
    const newWater = Math.max(0, dayLog.waterConsumedMl + amount);
    handleSaveLog({
      ...dayLog,
      waterConsumedMl: newWater
    });
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const handleCustomWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customWater, 10);
    if (!isNaN(val) && val > 0) {
      handleAddWater(val);
      setCustomWater('');
      setShowWaterModal(false);
    }
  };

  // Pre-configured Typical Quick Choices
  const quickMeals = [
    { name: '🍳 Café da Manhã Completo', cal: 390, p: 26, c: 35, f: 14, type: 'Café da Manhã' },
    { name: '🍚 Almoço Corporativo', cal: 680, p: 46, c: 78, f: 18, type: 'Almoço' },
    { name: '🍌 Shake Whey c/ Banana', cal: 340, p: 30, c: 42, f: 4, type: 'Lanche' },
    { name: '🥩 Jantar Proteico Leve', cal: 520, p: 48, c: 32, f: 16, type: 'Jantar' },
  ];

  const handleAddQuickMeal = (meal: typeof quickMeals[0]) => {
    handleSaveLog({
      ...dayLog,
      caloriesConsumed: dayLog.caloriesConsumed + meal.cal,
      proteinConsumed: dayLog.proteinConsumed + meal.p,
      carbsConsumed: dayLog.carbsConsumed + meal.c,
      fatConsumed: dayLog.fatConsumed + meal.f,
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleManualMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseInt(mealCalories, 10) || 0;
    const p = parseInt(mealProtein, 10) || 0;
    const carb = parseInt(mealCarbs, 10) || 0;
    const f = parseInt(mealFat, 10) || 0;

    handleSaveLog({
      ...dayLog,
      caloriesConsumed: dayLog.caloriesConsumed + c,
      proteinConsumed: dayLog.proteinConsumed + p,
      carbsConsumed: dayLog.carbsConsumed + carb,
      fatConsumed: dayLog.fatConsumed + f,
    });
    
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setShowMealModal(false);
    if ('vibrate' in navigator) navigator.vibrate(12);
  };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!isNaN(w) && w > 30 && w < 250) {
      // Sync both to active day log weighing and metabolic store
      handleSaveLog({
        ...dayLog,
        weightLog: w
      });
      // Import store's direct set field action
      useNutritionStore.getState().setProfileField('weight', w);
      setShowWeightLog(false);
      if ('vibrate' in navigator) navigator.vibrate(8);
    }
  };

  const handleClearTodayLogs = () => {
    if (confirm("Deseja zerar os registros de alimentos e hidratação de hoje?")) {
      handleSaveLog({
        ...dayLog,
        caloriesConsumed: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatConsumed: 0,
        waterConsumedMl: 0
      });
    }
  };

  // Base progress variables computed in real-time
  const calTarget = metabolicState.caloriesTarget;
  const waterTarget = metabolicState.hydrationGoalMl;

  const caloriePercent = Math.round((dayLog.caloriesConsumed / calTarget) * 105) || 0; // representational target scale
  const realCaloriePercent = Math.round((dayLog.caloriesConsumed / calTarget) * 100);
  
  const proteinPercent = Math.min(100, Math.round((dayLog.proteinConsumed / metabolicState.proteinGrams) * 100)) || 0;
  const carbsPercent = Math.min(100, Math.round((dayLog.carbsConsumed / metabolicState.carbGrams) * 100)) || 0;
  const fatPercent = Math.min(100, Math.round((dayLog.fatConsumed / metabolicState.fatGrams) * 100)) || 0;
  
  const hydrationPercent = Math.min(100, Math.round((dayLog.waterConsumedMl / waterTarget) * 100)) || 0;

  // Active biological atmosphere color mood based on selected focus
  const getAtmosphereGlow = () => {
    const goalStr = String(metabolicProfile.goal).toLowerCase();
    if (goalStr.includes('emagrecimento') || goalStr.includes('loss')) return 'bg-[#60A5FA]/10'; // cutting focus
    if (goalStr.includes('hipertrofia') || goalStr.includes('hypertrophy') || goalStr.includes('ganho')) return 'bg-[#7BA7FF]/10'; // bulk focus
    if (goalStr.includes('recomposição') || goalStr.includes('recomp')) return 'bg-[#818CF8]/10'; // recomp focus
    return 'bg-[#34D399]/10'; // high power wellness focus
  };

  const atmosphereColor = getAtmosphereGlow();

  const springTransition = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 0.8
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] py-4 px-3 sm:px-6 md:px-8 space-y-8 select-none overflow-x-hidden">
      
      {/* ATMOSPHERIC LUXURY GLOWS */}
      <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none blur-3xl opacity-60 transition-colors duration-1000 ${atmosphereColor}`} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#A5C8FF]/5 rounded-full pointer-events-none blur-3xl opacity-30" />

      {/* 1. EDITORIAL INTEGRATE CONTROL BAR */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-6 shadow-sm gap-4">
        
        {/* Assistant Title Unit */}
        <div className="flex items-center space-x-4 pl-1">
          <div className="w-11 h-11 bg-[#7BA7FF]/10 text-[#7BA7FF] rounded-2xl flex items-center justify-center font-bold">
            <Apple size={20} className="animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <span className="uppercase tracking-[0.22em] text-[10px] font-bold text-slate-400 block leading-none">
              METABOLIC INTELLIGENCE ENGINE
            </span>
            <span className="text-sm font-light text-slate-800 tracking-tight block">
              Rubi Assistente de Alto Rendimento
            </span>
          </div>
        </div>

        {/* Horizontal Navigation Control / Date Picker */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Date Select */}
          <div className="inline-flex bg-slate-100/70 p-1 rounded-2xl border border-slate-200/20 max-w-full overflow-x-auto">
            {[-2, -1, 0].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const str = d.toISOString().split('T')[0];
              const isToday = offset === 0;
              const label = isToday ? 'Hoje' : offset === -1 ? 'Ontem' : `${d.getDate()}/${d.getMonth() + 1}`;
              const active = activeDate === str;
              return (
                <button
                  key={str}
                  type="button"
                  onClick={() => { setActiveDate(str); if ('vibrate' in navigator) navigator.vibrate(3); }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
                    active ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-450 hover:text-slate-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Premium Sliders Trigger to open Bottom Sheet */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              setShowSettings(true);
              if ('vibrate' in navigator) navigator.vibrate(5);
            }}
            className="bg-slate-900 text-white rounded-2xl px-5 py-3 text-xs font-bold tracking-tight shadow-md flex items-center space-x-2 cursor-pointer border border-slate-950 hover:bg-slate-800 transition-colors"
          >
            <Sliders size={13} />
            <span>Configurar Metabolismo</span>
          </motion.button>

        </div>
      </div>

      {/* 2. DYNAMICAL METABOLIC HERO CARD (WHOOP / LEVELS inspired) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/70 backdrop-blur-3xl px-8 py-8 rounded-[2.8rem] border border-white/40 shadow-[0_12px_45px_rgba(15,23,42,0.04)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7BA7FF10,transparent_65%)] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          
          <div className="space-y-4 max-w-xl">
            {/* Header badges */}
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="uppercase tracking-[0.22em] text-[10.5px] font-bold text-slate-400">
                CONSUMO DIÁRIO INTEGRADO
              </span>
              <span className="text-[9.5px] font-bold tracking-tight bg-[#7BA7FF]/10 text-[#7BA7FF] px-2.5 py-0.5 rounded-full capitalize">
                {metabolicProfile.goal}
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-light tracking-tight text-slate-905">
                {dayLog.caloriesConsumed}
              </span>
              <span className="text-xl font-light text-slate-400">/ {calTarget} kcal</span>
            </div>

            <p className="text-sm leading-relaxed text-slate-505 font-light">
              Suas metas nutricionais diárias ajustam-se dinamicamente conforme sua rotina esportiva de <strong className="text-slate-700 font-semibold">{metabolicProfile.training_frequency} dias/semana</strong> sob atividade <strong className="text-slate-700 font-semibold">{metabolicProfile.activityLevel.toLowerCase()}</strong>.
              {dayLog.caloriesConsumed > 0 ? (
                <span> Você já completou correspondência calórica de <strong className="text-[#7BA7FF] font-semibold">{realCaloriePercent}%</strong> da energia total estipulada.</span>
              ) : (
                <span> Insira seus alimentos e refeições para iniciar a contagem sincronizada.</span>
              )}
            </p>
          </div>

          {/* Rings Compliance visualization block */}
          <div className="relative w-40 h-40 flex items-center justify-center mx-auto lg:mx-0 shrink-0 select-none">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="80" cy="80" r="62" 
                className="stroke-slate-100/50" strokeWidth="7" fill="transparent" 
              />
              <motion.circle 
                cx="80" cy="80" r="62" 
                className="stroke-[#7BA7FF]" strokeWidth="7" fill="transparent"
                strokeDasharray={2 * Math.PI * 62}
                initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 62 * (1 - Math.min(100, realCaloriePercent) / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-light text-slate-800 tracking-tighter tabular-nums leading-none">
                {realCaloriePercent}%
              </span>
              <span className="uppercase tracking-[0.16em] text-[8px] font-bold text-slate-400 mt-1 leading-none">
                Alvo Batido
              </span>
            </div>
          </div>

        </div>

        {/* Sub-bar stats */}
        <div className="mt-8 pt-6 border-t border-slate-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11.5px] text-slate-455">
          <div className="flex items-center space-x-2">
            <Flame size={14} className="text-[#818CF8]" />
            <span>
              Taxa de Metabolismo Basal (TMB): <strong className="text-slate-800 font-bold">{metabolicState.bmr} kcal/dia</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity size={13} className="text-[#7BA7FF]" />
            <span>
              Custo de Atividade Estimado (TDEE): <strong className="text-slate-800 font-bold">{metabolicState.tdee} kcal</strong>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. DUAL GRID OF LIVE ELEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* PROGRESS DE ANÁLISE INTERATIVA (Left column - 7 items) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* BALANCE SCORE RING CARD (WHOOP/OURA) */}
          <MetabolicBalanceRing score={metabolicState.metabolicBalance} />

          {/* DYNAMIC NUTRITIONAL INSIGHT FROM ACTIVE COACH RUBI */}
          <NutritionInsightEngine profile={metabolicProfile} state={metabolicState} />

          {/* PROGRESS DOS MACROS - TRACKING DIÁRIO DE CONSUMIDOS */}
          <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-7">
            
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="uppercase tracking-[0.22em] text-[9.5px] font-bold text-slate-400 block pb-0.5">
                  METABOLIC MACROS COHERENCE
                </span>
                <h4 className="text-lg font-light tracking-tight text-slate-905">
                  Macronutrientes Consumidos
                </h4>
              </div>

              <button
                type="button"
                onClick={handleClearTodayLogs}
                className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50/50 px-3.5 py-2 rounded-xl transition-all border border-slate-205 cursor-pointer"
              >
                Limpar Logs
              </button>
            </div>

            {/* List Progress bars */}
            <div className="space-y-5">
              
              {/* Protein indicator */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7BA7FF]" />
                    <span>Proteínas</span>
                  </span>
                  <span className="text-slate-800 font-semibold tabular-nums">
                    {dayLog.proteinConsumed}g <span className="text-slate-400 font-normal">/ {metabolicState.proteinGrams}g</span>
                  </span>
                </div>
                {/* Visual bar container */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${proteinPercent}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#7BA7FF] rounded-full" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                  <span>{proteinPercent}% batido</span>
                  <span>{metabolicState.proteinCalories} kcal estipulados</span>
                </div>
              </div>

              {/* Carbs indicator */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-505 font-medium flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A5C8FF]" />
                    <span>Carboidratos</span>
                  </span>
                  <span className="text-slate-800 font-semibold tabular-nums">
                    {dayLog.carbsConsumed}g <span className="text-slate-400 font-normal">/ {metabolicState.carbGrams}g</span>
                  </span>
                </div>
                {/* Visual bar container */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${carbsPercent}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#A5C8FF] rounded-full" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                  <span>{carbsPercent}% batido</span>
                  <span>{metabolicState.carbCalories} kcal estipulados</span>
                </div>
              </div>

              {/* Fat indicator */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-505 font-medium flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]" />
                    <span>Gorduras</span>
                  </span>
                  <span className="text-slate-800 font-semibold tabular-nums">
                    {dayLog.fatConsumed}g <span className="text-slate-400 font-normal">/ {metabolicState.fatGrams}g</span>
                  </span>
                </div>
                {/* Visual bar container */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${fatPercent}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#60A5FA] rounded-full" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                  <span>{fatPercent}% batido</span>
                  <span>{metabolicState.fatCalories} kcal estipulados</span>
                </div>
              </div>

            </div>

            {/* Quick triggers section */}
            <div className="pt-4 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => { setShowWeightLog(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
                className="flex-1 bg-slate-100/60 hover:bg-slate-100 border border-slate-200/20 active:scale-95 py-3.5 px-4 rounded-2xl font-bold text-xs text-slate-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Scale size={14} className="text-slate-400" />
                <span>{dayLog.weightLog ? `Peso: ${dayLog.weightLog} kg` : "Registrar Peso"}</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedMealType('Lanche'); setShowMealModal(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
                className="flex-1 bg-[#7BA7FF]/10 text-[#7BA7FF] hover:bg-[#7BA7FF]/15 active:scale-95 py-3.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Registrar Alimento</span>
              </button>
            </div>

          </div>

        </div>

        {/* COMPREHENSIVE COMPLIANCE & MACROS RADIAL DESIGNS (Right column - 5 items) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* MACROS DISTRIBUTION VISUALIZER CARD */}
          <MacroDistributionVisualizer state={metabolicState} />

          {/* QUICK PICK FEEDER BOX */}
          <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <span className="uppercase tracking-[0.22em] text-[9.5px] font-bold text-slate-400 block">
                MEAL PRESETS FEEDS
              </span>
              <h4 className="text-lg font-light tracking-tight text-slate-805">
                Feeds de Refeições Práticas
              </h4>
              <p className="text-[11.5px] text-slate-400">Insira blocos metabólicos padronizados e equilibrados com 1 toque.</p>
            </div>

            <div className="space-y-3">
              {quickMeals.map((meal, index) => (
                <div
                  key={index}
                  onClick={() => handleAddQuickMeal(meal)}
                  className="group cursor-pointer flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/50 transition-all active:scale-98 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      {meal.type.includes('Café') ? <Coffee size={14} /> : <Utensils size={14} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-800">{meal.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        P: {meal.p}g • C: {meal.c}g • F: {meal.f}g
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#7BA7FF] bg-white group-hover:bg-[#7BA7FF] group-hover:text-white border border-slate-200/30 group-hover:border-transparent px-2.5 py-1 rounded-lg transition-colors shadow-sm font-mono whitespace-nowrap">
                    +{meal.cal} kcal
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">
              *Metas calibradas com base na composição alimentar padrão nacional.
            </p>
          </div>

        </div>

      </div>

      {/* 4. INTENSE COMPRESSED HYDRATION SYSTEM (WHOOP inspired) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/70 backdrop-blur-2xl px-8 py-8 rounded-[2.8rem] border border-white/40 shadow-sm overflow-hidden"
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#7BA7FF]/[0.02] to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <span className="uppercase tracking-[0.22em] text-[10px] font-bold text-slate-400 block">
                HYDRATION MANAGEMENT MODULE
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-light tracking-tight text-slate-800">
                  {dayLog.waterConsumedMl / 1000} L
                </span>
                <span className="text-sm font-light text-slate-400">
                  de {(waterTarget / 1000).toFixed(2)} L meta recomendada
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-500 font-light max-w-lg">
              Sua meta recomendada de hidratação é de <strong className="text-slate-700 font-semibold">{(waterTarget / 1000).toFixed(2)} Litros</strong> para assegurar homeostase, mitocôndrias ativas e transporte facilitado pós-estimulação.
              {dayLog.waterConsumedMl >= waterTarget ? (
                <span className="text-emerald-500 font-semibold block mt-1.5">✓ Ótimo trabalho! Meta de hidratação batida no dia!</span>
              ) : null}
            </p>

            {/* Quick controllers */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="bg-white hover:bg-slate-50 border border-slate-200/50 font-semibold text-slate-600 px-4 py-2 text-xs rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Droplet size={13} className="text-[#60A5FA]" />
                <span>+250ml Copo</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="bg-white hover:bg-slate-50 border border-slate-200/50 font-semibold text-slate-600 px-4 py-2 text-xs rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Droplet size={14} className="text-[#7BA7FF]" />
                <span>+500ml Garrafa</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddWater(-250)}
                className="bg-white hover:bg-slate-50 border border-slate-200/50 font-semibold text-slate-400 px-3.5 py-2 text-xs rounded-xl flex items-center space-x-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Remover 250ml"
              >
                <Minus size={12} />
                <span>Remover</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowWaterModal(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
                className="bg-slate-100 hover:bg-slate-200/50 font-semibold text-slate-500 px-4 py-2 text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Customizar ml
              </button>
            </div>
          </div>

          {/* Progress tube fluid slider container */}
          <div className="w-full md:w-72 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs tracking-tight">
              <span className="text-slate-400 font-medium font-mono">Progresso de Água</span>
              <span className="text-[#7BA7FF] font-bold font-mono">{hydrationPercent}%</span>
            </div>

            <div className="h-11 w-full bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${hydrationPercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-[#60A5FA]/80 to-[#7BA7FF]/90 flex items-center justify-end pr-4 rounded-2xl shadow-inner relative"
              >
                <span className="absolute left-4 top-3 text-[8px] tracking-widest text-white/50 uppercase font-bold select-none">HYDRA</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-30" />
              </motion.div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Safety space at the bottom */}
      <div className="h-24" />


      {/* ======================================================== */}
      {/* ==================== OVERLAYS / MODALS ================= */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* METABOLIC SETTINGS SHEET (Premium bottom configurator panel) */}
        {showMetabolicSettings && <MetabolicSettingsSheet />}

        {/* WATER INJECT MODAL */}
        {showWaterModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWaterModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Adicionar Água Diária</h4>
                <p className="text-xs text-slate-450">Insira a quantidade exata em mililitros (ml) ingeridos.</p>
              </div>

              <form onSubmit={handleCustomWaterSubmit} className="space-y-4">
                <div className="relative">
                  <input 
                    type="number"
                    autoFocus
                    placeholder="Ex: 350"
                    value={customWater}
                    onChange={(e) => setCustomWater(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-3.5 px-4 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#7BA7FF]/80 transition-colors"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">ml</span>
                </div>

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button"
                    onClick={() => setShowWaterModal(false)}
                    className="flex-1 border border-slate-200 text-slate-500 py-3.5 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs transition-colors hover:bg-slate-800"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MANUAL FOOD INSERT MODAL */}
        {showMealModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMealModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-lg font-semibold text-slate-900 tracking-tight text-center">Registrar Alimento</h4>
                <p className="text-xs text-slate-450 text-center">Escolha a categoria e preencha a tabela de macronutrientes do dia.</p>
              </div>

              {/* Meal select categories */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['Café da Manhã', 'Almoço', 'Lanche', 'Jantar'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedMealType(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                      selectedMealType === t 
                        ? 'bg-[#7BA7FF]/10 border-[#7BA7FF] text-[#7BA7FF]' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-205 text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={handleManualMealSubmit} className="space-y-4">
                
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Energia Total (kcal)</label>
                    <input 
                      type="number"
                      required
                      placeholder="Ex: 450"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">Proteínas</label>
                      <input 
                        type="number"
                        placeholder="g"
                        value={mealProtein}
                        onChange={(e) => setMealProtein(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-800 text-center outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">Carbos</label>
                      <input 
                        type="number"
                        placeholder="g"
                        value={mealCarbs}
                        onChange={(e) => setMealCarbs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-800 text-center outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">Gorduras</label>
                      <input 
                        type="number"
                        placeholder="g"
                        value={mealFat}
                        onChange={(e) => setMealFat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-800 text-center outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowMealModal(false)}
                    className="flex-1 border border-slate-250 text-slate-505 py-3.5 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-905 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-slate-800"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* WEIGHT DIAL LOG INGRESS MODAL */}
        {showWeightLog && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightLog(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Inserir Registro do Peso</h4>
                <p className="text-xs text-slate-450 font-light">Este valor atualizará simultaneamente sua identidade e os cálculos calóricos basais.</p>
              </div>

              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    autoFocus
                    placeholder="Ex: 75.4"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-3.5 px-4 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#7BA7FF]/80 transition-colors"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">kg</span>
                </div>

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button"
                    onClick={() => setShowWeightLog(false)}
                    className="flex-1 border border-slate-200 text-slate-505 py-3.5 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-slate-800"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};
export default MinhaDieta;
