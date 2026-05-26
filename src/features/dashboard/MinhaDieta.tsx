import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Apple, 
  Droplet, 
  TrendingUp, 
  Plus, 
  Minus, 
  Info, 
  Sparkles, 
  ChevronRight, 
  Scale, 
  Flame, 
  Utensils, 
  Coffee, 
  Heart, 
  Zap,
  Check
} from 'lucide-react';
import { useNavigation } from '../../App';
import { nutritionEngine, NutritionPlan, DayLog } from '../../services/nutritionEngine';

export const MinhaDieta: React.FC = () => {
  const { profile } = useNavigation();
  const [activeDate, setActiveDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [plan, setPlan] = useState<NutritionPlan>(() => {
    return nutritionEngine.calculatePlan(profile || {}, 'moderado');
  });

  const [dayLog, setDayLog] = useState<DayLog>(() => {
    return nutritionEngine.getLogForDate(activeDate, profile?.weight || 70);
  });

  // State for user interactions
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [customWater, setCustomWater] = useState('');
  
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('Café da Manhã');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  
  // Custom manual weight log state
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [weightInput, setWeightInput] = useState(() => String(profile?.weight || 70));

  // Recalculate plan if profile changes
  useEffect(() => {
    if (profile) {
      setPlan(nutritionEngine.calculatePlan(profile, 'moderado'));
      setWeightInput(String(profile.weight || 70));
    }
  }, [profile]);

  // Load log whenever date or profile changes
  useEffect(() => {
    setDayLog(nutritionEngine.getLogForDate(activeDate, profile?.weight || 70));
  }, [activeDate, profile]);

  // Helper inside saving logs
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

  // Pre-configured typical quick meals for quick logging and delight
  const quickMeals = [
    { name: '🍳 Café da Manhã Leve', cal: 320, p: 22, c: 30, f: 12, type: 'Café da Manhã' },
    { name: '🍚 Almoço Clássico', cal: 650, p: 45, c: 75, f: 18, type: 'Almoço' },
    { name: '🍌 Shake de Whey c/ Aveia', cal: 380, p: 32, c: 45, f: 6, type: 'Lanche Pós-Treino' },
    { name: '🥩 Jantar Proteico', cal: 580, p: 50, c: 40, f: 20, type: 'Jantar' },
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
      handleSaveLog({
        ...dayLog,
        weightLog: w
      });
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

  const springTransition = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 0.8
  };

  // Generate dynamic intelligent biological insights
  const insight = nutritionEngine.generateNutritionInsight(plan, profile || {});

  // Calculate percent metrics
  const caloriePercent = Math.round((dayLog.caloriesConsumed / plan.caloriesTarget) * 100);
  const proteinPercent = Math.min(100, Math.round((dayLog.proteinConsumed / plan.proteinGrams) * 100));
  const carbsPercent = Math.min(100, Math.round((dayLog.carbsConsumed / plan.carbGrams) * 100));
  const fatPercent = Math.min(100, Math.round((dayLog.fatConsumed / plan.fatGrams) * 100));
  const hydrationPercent = Math.min(100, Math.round((dayLog.waterConsumedMl / plan.hydrationGoalMl) * 100));

  // High-fidelity local weight mock trend lines
  const weightTrend = [
    { label: 'Ter', val: (profile?.weight || 75.2) - 0.4 },
    { label: 'Qua', val: (profile?.weight || 75.2) - 0.2 },
    { label: 'Qui', val: (profile?.weight || 75.2) - 0.3 },
    { label: 'Sex', val: (profile?.weight || 75.2) - 0.1 },
    { label: 'Sáb', val: (profile?.weight || 75.2) },
    { label: 'Dom', val: (profile?.weight || 75.2) + 0.1 },
    { label: 'Hoje', val: dayLog.weightLog || profile?.weight || 75.2 },
  ];

  const calComplianceTrend = [
    { label: 'Ter', pct: 95 },
    { label: 'Qua', pct: 102 },
    { label: 'Qui', pct: 88 },
    { label: 'Sex', pct: 100 },
    { label: 'Sáb', pct: 105 },
    { label: 'Dom', pct: 90 },
    { label: 'Hoje', pct: Math.min(120, caloriePercent) }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] py-4 px-1 sm:px-4 md:px-6 overflow-hidden space-y-10">
      
      {/* ATMOSPHERIC RADIAL GLOWS */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl opacity-[0.06] bg-[#7BA7FF]/50" />
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none blur-3xl opacity-[0.04] bg-[#818CF8]" />
      
      {/* EDITORIAL HEADER CONTAINER */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-6 shadow-sm gap-4">
        <div className="flex flex-col pl-2">
          <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-slate-400 leading-none">
            COMBUSTÍVEL METABÓLICO
          </span>
          <span className="text-sm font-light text-slate-800 tracking-tight mt-1.5 leading-none">
            Rubi Assistente de Alta Performance
          </span>
        </div>

        {/* Date Selector */}
        <div className="inline-flex bg-slate-100/60 p-0.5 rounded-2xl border border-slate-200/20 self-start md:self-auto shrink-0 overflow-x-auto max-w-full">
          {[-2, -1, 0].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const str = d.toISOString().split('T')[0];
            const isToday = offset === 0;
            const label = isToday ? 'Hoje' : offset === -1 ? 'Ontem' : `${d.getDate()}/${d.getMonth()+1}`;
            const active = activeDate === str;
            return (
              <button
                key={str}
                type="button"
                onClick={() => { setActiveDate(str); if ('vibrate' in navigator) navigator.vibrate(3); }}
                className={`px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold tracking-tight transition-all whitespace-nowrap ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-450 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. METABOLIC HERO */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/70 backdrop-blur-2xl px-8 py-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7BA7FF12,transparent_60%)] pointer-events-none blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <span className="uppercase tracking-[0.22em] text-[11px] font-semibold text-slate-400 block">
              ALVO ENERGÉTICO DIÁRIO
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light tracking-tight text-slate-900">
                {plan.caloriesTarget}
              </span>
              <span className="text-xl font-light text-slate-400">kcal</span>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-500 max-w-md">
              Seu planejamento reflete uma meta adaptativa baseada no seu objetivo de <strong className="text-slate-700 font-semibold">{profile?.goal || 'Ganho Muscular'}</strong> de forma modular. 
              {dayLog.caloriesConsumed > 0 ? (
                <span> Hoje você consumiu <strong className="text-[#7BA7FF] font-semibold">{dayLog.caloriesConsumed} kcal</strong> ({caloriePercent}% batido).</span>
              ) : (
                <span> Inicie o registro do seu consumo diário para sincronização metabólica.</span>
              )}
            </p>
          </div>

          {/* Oura-inspired visual interactive ring chart */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0 mx-auto md:mx-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="72" cy="72" r="54" 
                className="stroke-slate-100/50" strokeWidth="6" fill="transparent" 
              />
              <motion.circle 
                cx="72" cy="72" r="54" 
                className="stroke-[#7BA7FF]" strokeWidth="6" fill="transparent"
                strokeDasharray={2 * Math.PI * 54}
                initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - Math.min(100, caloriePercent) / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-light text-slate-800 tracking-tighter tabular-nums leading-none">
                {caloriePercent}%
              </span>
              <span className="uppercase tracking-[0.15em] text-[8px] font-semibold text-slate-400 mt-1 leading-none">
                Nutrição
              </span>
            </div>
          </div>
        </div>

        {/* Homeostasis Indicators */}
        <div className="mt-8 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-[#818CF8]" />
            <span>
              Taxa Basal Estimada (BMR): <strong className="text-slate-800 font-semibold">{plan.bmr} kcal/dia</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={13} className="text-rose-400" />
            <span>
              Gasto Total Calculado (TDEE): <strong className="text-slate-800 font-semibold">{plan.tdee} kcal</strong>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. ADAPTIVE INSIGHT */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/55 backdrop-blur-2xl border border-white/30 rounded-[2.5rem] p-8 shadow-sm"
      >
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#7BA7FF]/10 flex items-center justify-center text-[#7BA7FF] shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-[#818CF8] block">
              INSIGHT BIOLÓGICO DA REFEIÇÃO
            </span>
            <span className="text-sm font-semibold text-slate-800 tracking-tight block">
              {insight.title}
            </span>
            <p className="text-sm text-slate-500 font-light leading-relaxed italic">
              "{insight.text}"
            </p>
          </div>
        </div>
      </motion.div>

      {/* 1.5X GRID DE METAS DE MACRONUTRIENTES & LANÇAMENTO RÁPIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* MACROS (8 columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="lg:col-span-7 bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-slate-400 block">
                DISTRIBUIÇÃO BIOLÓGICA
              </span>
              <h4 className="text-xl font-light tracking-tight text-slate-900">
                Macronutrientes
              </h4>
            </div>
            
            <button 
              type="button"
              onClick={handleClearTodayLogs}
              className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 border border-slate-200/40 px-3 py-1.5 rounded-xl font-bold"
            >
              Zerar Macros
            </button>
          </div>

          <div className="space-y-6">
            
            {/* Proteínas */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7BA7FF]" />
                  Proteínas
                </span>
                <span className="text-slate-800 font-semibold tabular-nums text-xs">
                  {dayLog.proteinConsumed}g <span className="text-slate-400 font-normal">/ {plan.proteinGrams}g</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${proteinPercent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-[#7BA7FF] rounded-full" 
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{proteinPercent}% batido</span>
                <span>{plan.proteinCalories} kcal da meta</span>
              </div>
            </div>

            {/* Carboidratos */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A5C8FF]" />
                  Carboidratos
                </span>
                <span className="text-slate-800 font-semibold tabular-nums text-xs">
                  {dayLog.carbsConsumed}g <span className="text-slate-400 font-normal">/ {plan.carbGrams}g</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${carbsPercent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-[#A5C8FF] rounded-full" 
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{carbsPercent}% batido</span>
                <span>{plan.carbCalories} kcal da meta</span>
              </div>
            </div>

            {/* Gorduras */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]" />
                  Gorduras
                </span>
                <span className="text-slate-800 font-semibold tabular-nums text-xs">
                  {dayLog.fatConsumed}g <span className="text-slate-400 font-normal">/ {plan.fatGrams}g</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${fatPercent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-[#60A5FA] rounded-full" 
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{fatPercent}% batido</span>
                <span>{plan.fatCalories} kcal da meta</span>
              </div>
            </div>

          </div>

          {/* Action to trigger manual full logs */}
          <div className="pt-4 flex justify-between gap-4">
            <button
              type="button"
              onClick={() => { setShowWeightLog(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
              className="flex-1 bg-slate-100/60 hover:bg-slate-100 border border-slate-200/20 active:scale-95 py-3.5 px-4 rounded-2xl font-bold text-xs text-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Scale size={14} className="text-slate-450" />
              {dayLog.weightLog ? `Peso: ${dayLog.weightLog} kg` : "Registrar Peso"}
            </button>

            <button
              type="button"
              onClick={() => { setSelectedMealType('Lanche'); setShowMealModal(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
              className="flex-1 bg-[#7BA7FF]/10 text-[#7BA7FF] hover:bg-[#7BA7FF]/15 active:scale-95 py-3.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Registrar Alimento
            </button>
          </div>
        </motion.div>

        {/* QUICK PICKS / MEALS SUGGESTION (5 columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="lg:col-span-5 bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] flex flex-col justify-between space-y-6"
        >
          <div className="space-y-1">
            <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-slate-400 block">
              LANÇAMENTO INTEGRADO RÁPIDO
            </span>
            <h4 className="text-xl font-light tracking-tight text-slate-900">
              Atalhos Rápidos de Refeição
            </h4>
            <p className="text-xs text-slate-400">Insira valores macros padronizados do dia a dia com um único clique.</p>
          </div>

          <div className="space-y-3">
            {quickMeals.map((meal, idx) => (
              <div 
                key={idx}
                onClick={() => handleAddQuickMeal(meal)}
                className="group cursor-pointer flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/50 transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200/30 flex items-center justify-center text-slate-500">
                    {meal.type.includes('Café') ? <Coffee size={14} /> : <Utensils size={14} />}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800">{meal.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      P: {meal.p}g • C: {meal.c}g • F: {meal.f}g
                    </p>
                  </div>
                </div>
                
                <span className="text-xs font-semibold tracking-tight text-[#7BA7FF] bg-white group-hover:bg-[#7BA7FF] group-hover:text-white border border-slate-200/40 group-hover:border-transparent px-2.5 py-1 rounded-lg transition-colors">
                  +{meal.cal} kcal
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 italic text-center leading-relaxed">
            *As estimativas são calibradas automaticamente tendo como base fontes padrão de alimentos esportivos.
          </div>
        </motion.div>

      </div>

      {/* 3. CLINE DYNAMICS HYDRATION SYSTEM */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/70 backdrop-blur-2xl px-8 py-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#7BA7FF]/[0.02] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <span className="uppercase tracking-[0.22em] text-[11px] font-semibold text-slate-400 block">
                COMPLIANCE HÍDRICO
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light tracking-tight text-slate-800">
                  {dayLog.waterConsumedMl / 1000}L
                </span>
                <span className="text-sm font-light text-slate-400">
                  de {plan.hydrationGoalMl / 1000}L meta diária
                </span>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-500 max-w-sm">
              Sua meta recomendada de hidratação é de <strong className="text-slate-700 font-semibold">{(plan.hydrationGoalMl / 1000).toFixed(1)} Litros</strong> para garantir homeostase mitocondrial e ressíntese de força ideal. 
              {dayLog.waterConsumedMl >= plan.hydrationGoalMl ? (
                <span className="text-emerald-505 font-medium block mt-1">✓ Meta de hidratação de hoje alcançada! Maravilha!</span>
              ) : null}
            </p>

            {/* Quick water insertion dials */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="bg-white hover:bg-slate-50 border border-slate-200/60 font-semibold text-slate-600 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Droplet size={12} className="text-[#7BA7FF]" />
                +250ml Copo
              </button>
              
              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="bg-white hover:bg-slate-50 border border-slate-200/60 font-semibold text-slate-600 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Droplet size={13} className="text-[#7BA7FF]" />
                +500ml Garrafa
              </button>

              <button
                type="button"
                onClick={() => handleAddWater(-250)}
                className="bg-white hover:bg-slate-50 border border-slate-200/60 font-semibold text-slate-400 px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                title="Remover 250ml"
              >
                <Minus size={12} />
                remover
              </button>

              <button
                type="button"
                onClick={() => { setShowWaterModal(true); if ('vibrate' in navigator) navigator.vibrate(5); }}
                className="bg-slate-100 hover:bg-slate-200/80 font-semibold text-slate-500 px-3.5 py-2 rounded-xl text-xs active:scale-95 transition-all"
              >
                Valor Customizado
              </button>
            </div>
          </div>

          {/* Elegant liquid glass status visualizer */}
          <div className="w-full md:w-64 space-y-3">
            <div className="flex items-center justify-between text-xs tracking-tight">
              <span className="text-slate-400 font-medium">Progresso de Água</span>
              <span className="text-[#7BA7FF] font-semibold">{hydrationPercent}%</span>
            </div>
            
            {/* The liquid tube container */}
            <div className="h-10 w-full bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${hydrationPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#7BA7FF]/80 to-[#A5C8FF]/90 flex items-center justify-end pr-4 rounded-2xl shadow-inner relative"
              >
                {/* Floating wave reflection */}
                <span className="absolute left-4 top-1.5 text-[8px] tracking-widest text-white/50 uppercase font-bold select-none">Hydra</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-30" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. WEEKLY METABOLIC EVOLUTION DIAGRAMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* WEIGHT GRAPH */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] space-y-6"
        >
          <div className="space-y-1">
            <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-slate-400 block">
              BALANÇO DE MASSA CORPORAL
            </span>
            <h4 className="text-xl font-light tracking-tight text-slate-900">
              Evolução e Pesagem Recente
            </h4>
          </div>

          {/* SVG minimalist curve graph representational */}
          <div className="h-36 w-full flex items-end justify-between px-2 pt-6 relative select-none">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-1/3 border-t border-slate-100/50" />
            <div className="absolute inset-x-0 top-2/3 border-t border-slate-100/50" />

            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Curve of weight */}
              <defs>
                <linearGradient id="weight-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7BA7FF" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7BA7FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Curve Area */}
              <path 
                d={`M 20 100 
                    Q 80 85, 140 92
                    T 260 82, 380 75
                    L 380 140 L 20 140 Z`} 
                fill="url(#weight-glow)"
                className="transition-all duration-1000"
              />
              
              {/* Curve Stroke */}
              <path 
                d={`M 20 100 
                    Q 80 85, 140 92
                    T 260 82, 380 75`} 
                fill="none" 
                stroke="#7BA7FF" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                className="transition-all duration-1000"
              />

              {/* Glowing anchor today */}
              <circle cx="380" cy="75" r="5" fill="#7BA7FF" />
              <circle cx="380" cy="75" r="11" fill="#7BA7FF" fillOpacity="0.2" className="animate-pulse" />
            </svg>

            {weightTrend.map((pt, index) => (
              <div key={index} className="flex flex-col items-center z-10 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-800 tabular-nums">
                  {pt.val.toFixed(1)}kg
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-400 mt-2 leading-relaxed">
            Seu peso médio flutuou cerca de <strong className="text-slate-650 font-semibold">0.4 kg</strong> nos últimos 7 dias. Comportamento estável compatível com a adaptação.
          </div>
        </motion.div>

        {/* CALORIE COMPLIANCE GRAPH */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] space-y-6"
        >
          <div className="space-y-1">
            <span className="uppercase tracking-[0.22em] text-[10px] font-semibold text-slate-400 block">
              ADENHAMENTO DE METAS DE ENERGIA
            </span>
            <h4 className="text-xl font-light tracking-tight text-slate-900">
              Aderência às Calorias Planejadas
            </h4>
          </div>

          {/* Minimalist vertical column visual compliance blocks */}
          <div className="h-36 w-full flex items-end justify-between px-2 pt-6 select-none">
            {calComplianceTrend.map((pt, index) => {
              const heightPct = Math.min(100, Math.max(15, pt.pct));
              const isPerfect = pt.pct >= 90 && pt.pct <= 110;
              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-3 px-1 md:px-2">
                  <span className="text-[10px] text-slate-450 font-bold tabular-nums">
                    {pt.pct}%
                  </span>
                  
                  {/* Dynamic bar */}
                  <div className="w-full bg-slate-100 rounded-t-xl h-20 flex items-end">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 1, delay: index * 0.05 }}
                      className={`w-full rounded-t-xl transition-colors ${
                        isPerfect ? 'bg-[#7BA7FF]/80' : 'bg-amber-450/70'
                      }`}
                    />
                  </div>
                  
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[#818CF8]">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 mt-2 leading-relaxed">
            Seu score de consistência nutricional de 7 dias é de <strong className="text-slate-650 font-semibold">91%</strong>. Você está correspondendo bem às janelas micro-ajustadas.
          </div>
        </motion.div>

      </div>

      {/* 5. BIOLOGICAL TREND ENGINE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 bg-white/70 backdrop-blur-2xl px-8 py-8 rounded-[2.5rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.05)] space-y-8"
      >
        <div className="space-y-1">
          <span className="uppercase tracking-[0.22em] text-[11px] font-semibold text-slate-400 block">
            METABOLIC BIOMARKERS
          </span>
          <h4 className="text-2xl font-light tracking-tight text-slate-900">
            Tendências Biológicas Ativas
          </h4>
        </div>

        {/* Continuous editorial information records */}
        <div className="divide-y divide-slate-100/80">
          
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-slate-400 font-medium">Balanço de Resposta ao Déficit</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold text-xs tracking-tight bg-[#7BA7FF]/10 text-[#7BA7FF] px-3 py-1 rounded-full">
                MODERADO POSITIVO
              </span>
              <span className="text-slate-500 font-light text-xs">Você responde de forma estável a déficits leves de 300-400 kcal.</span>
            </div>
          </div>

          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-slate-400 font-medium">Estímulo e Sensibilidade à Insulina</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold text-xs tracking-tight bg-slate-150 px-3 py-1 rounded-full text-slate-600">
                PICO DE EFICIÊNCIA
              </span>
              <span className="text-slate-500 font-light text-xs">Seu corpo mantém alto rendimento muscular sob carboidratos complexos médios.</span>
            </div>
          </div>

          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-slate-400 font-medium">Controle Hídrico Celular</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold text-xs tracking-tight bg-emerald-50 text-emerald-500 px-3 py-1 rounded-full">
                OTIMIZADO
              </span>
              <span className="text-slate-500 font-light text-xs">Sua hidratação média diária de 3.2L evitou retenções limiares.</span>
            </div>
          </div>

          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-slate-400 font-medium">Variação Ponderal Média</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-semibold text-xs tracking-tight bg-[#818CF8]/10 text-[#818CF8] px-3 py-1 rounded-full">
                PLATÔ SAUDÁVEL
              </span>
              <span className="text-slate-500 font-light text-xs">Seu peso consolidou uma fixação anabólica positiva nas últimas duas semanas.</span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* FOOTER SAFETY */}
      <div className="h-20" />


      {/* ======================================================== */}
      {/* ==================== MODALS / OVERLAYS ================= */}
      {/* ======================================================== */}
      <AnimatePresence>
        
        {/* WATER LOG MODAL */}
        {showWaterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWaterModal(false)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springTransition}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-xl font-light text-slate-900 tracking-tight">Inserir Água Consumida</h4>
                <p className="text-xs text-slate-400">Insira a quantidade exata ingerida em mililitros (ml).</p>
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

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowWaterModal(false)}
                    className="flex-1 border border-slate-200 text-slate-500 py-3 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#7BA7FF] hover:bg-[#818CF8] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-[#7BA7FF]/25"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MEAL LOG MODAL */}
        {showMealModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMealModal(false)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springTransition}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-xl font-light text-slate-900 tracking-tight">Registrar Refeição</h4>
                <p className="text-xs text-slate-400">Insira as informações nutricionais do alimento.</p>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                {['Café da Manhã', 'Almoço', 'Lanche', 'Jantar'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedMealType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                      selectedMealType === t 
                        ? 'bg-[#7BA7FF]/10 border-[#7BA7FF] text-[#7BA7FF]' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <form onSubmit={handleManualMealSubmit} className="space-y-4">
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calorias (kcal)</label>
                    <input 
                      type="number"
                      required
                      placeholder="Ex: 450"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-855 outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alt. Proteína</label>
                      <input 
                        type="number"
                        placeholder="Em g"
                        value={mealProtein}
                        onChange={(e) => setMealProtein(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-855 outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Carboidratos</label>
                      <input 
                        type="number"
                        placeholder="Em g"
                        value={mealCarbs}
                        onChange={(e) => setMealCarbs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-855 outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gorduras</label>
                      <input 
                        type="number"
                        placeholder="Em g"
                        value={mealFat}
                        onChange={(e) => setMealFat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-sm font-semibold text-slate-855 outline-none focus:border-[#7BA7FF]/80 transition-colors mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowMealModal(false)}
                    className="flex-1 border border-slate-200 text-slate-500 py-3 rounded-xl font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#7BA7FF] hover:bg-[#818CF8] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-[#7BA7FF]/25"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MANUAL WEIGHT LOG MODAL */}
        {showWeightLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightLog(false)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springTransition}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-150 z-10 space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="text-xl font-light text-slate-900 tracking-tight">Inserir Registro de Peso</h4>
                <p className="text-xs text-slate-400">Insira sua pesagem atual em kg para recalcular o plano.</p>
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

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowWeightLog(false)}
                    className="flex-1 border border-slate-200 text-slate-500 py-3 rounded-xl font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#7BA7FF] hover:bg-[#818CF8] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-[#7BA7FF]/25"
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
