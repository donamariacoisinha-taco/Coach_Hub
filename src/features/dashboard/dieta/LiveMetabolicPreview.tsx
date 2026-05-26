import React from 'react';
import { motion } from 'motion/react';
import { Flame, Droplet, ArrowRight, Activity, Percent } from 'lucide-react';
import { MetabolicState } from '../../../store/nutritionStore';

interface LiveMetabolicPreviewProps {
  state: MetabolicState;
}

export const LiveMetabolicPreview: React.FC<LiveMetabolicPreviewProps> = ({ state }) => {
  return (
    <div className="bg-[#7BA7FF]/5 border border-[#7BA7FF]/15 rounded-[2rem] p-6 space-y-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none blur-3xl opacity-20 bg-[#7BA7FF]" />
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="uppercase tracking-[0.22em] text-[10px] font-bold text-[#7BA7FF] block">
            PREVIEW METABÓLICO EM TEMPO REAL
          </span>
          <h4 className="text-sm font-semibold text-slate-800 tracking-tight">
            Resposta Celular Estimada
          </h4>
        </div>
        
        {/* Instantaneous Tag */}
        <span className="text-[10px] uppercase font-bold text-white bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] px-2.5 py-1 rounded-full shadow-[0_4px_10px_rgba(123,167,255,0.25)] animate-pulse">
          Ativo
        </span>
      </div>

      {/* Main Calories Shift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* BMR Box */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">TMB (BMR)</span>
            <Flame size={13} className="text-[#818CF8]" />
          </div>
          <div className="flex items-baseline space-x-1">
            <motion.span
              key={state.bmr}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-xl font-light tracking-tight text-slate-800 tabular-nums"
            >
              {state.bmr}
            </motion.span>
            <span className="text-[10px] text-slate-400 font-mono">kcal/dia</span>
          </div>
          <p className="text-[9px] text-slate-400 font-light leading-snug">
            Energia necessária para manter as funções vitais em repouso absoluto.
          </p>
        </div>

        {/* TDEE Box */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Gasto Total (TDEE)</span>
            <Activity size={13} className="text-[#7BA7FF]" />
          </div>
          <div className="flex items-baseline space-x-1">
            <motion.span
              key={state.tdee}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-xl font-light tracking-tight text-slate-800 tabular-nums"
            >
              {state.tdee}
            </motion.span>
            <span className="text-[10px] text-slate-400 font-mono">kcal/dia</span>
          </div>
          <p className="text-[9px] text-slate-400 font-light leading-snug">
            Seu consumo biológico estimado diário incluindo nível de atividade recente.
          </p>
        </div>

      </div>

      {/* Target & Water Section Banner */}
      <div className="bg-white/40 p-4 rounded-2xl border border-white/30 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100/60 text-orange-450 flex items-center justify-center font-bold font-mono">
            🎯
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Target Calórico</span>
            <span className="font-semibold text-slate-700 tracking-tight">{state.caloriesTarget} kcal</span>
          </div>
        </div>

        <ArrowRight size={13} className="text-slate-350" />

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#7BA7FF]/10 text-[#7BA7FF] flex items-center justify-center">
            <Droplet size={14} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Água Diária</span>
            <span className="font-semibold text-slate-700 tracking-tight">{(state.hydrationGoalMl / 1000).toFixed(2)}L</span>
          </div>
        </div>
      </div>

      {/* Macros Instant Slider Preview */}
      <div className="space-y-2.5">
        <span className="uppercase tracking-[0.18em] text-[9px] font-bold text-slate-400 block px-1">
          Divisão Percentual de Macronutrientes
        </span>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          {/* Protein */}
          <div className="bg-white/60 p-2 rounded-xl space-y-1">
            <span className="text-slate-450 font-semibold block">Proteína</span>
            <span className="font-bold text-slate-800 tabular-nums">{state.proteinGrams}g</span>
            <span className="text-[9px] text-slate-400 font-medium block">({state.proteinCalories} kcal)</span>
          </div>

          {/* Carbs */}
          <div className="bg-white/60 p-2 rounded-xl space-y-1">
            <span className="text-slate-450 font-semibold block">Carbos</span>
            <span className="font-bold text-slate-800 tabular-nums">{state.carbGrams}g</span>
            <span className="text-[9px] text-slate-400 font-medium block">({state.carbCalories} kcal)</span>
          </div>

          {/* Fat */}
          <div className="bg-white/60 p-2 rounded-xl space-y-1">
            <span className="text-slate-450 font-semibold block">Gordura</span>
            <span className="font-bold text-slate-800 tabular-nums">{state.fatGrams}g</span>
            <span className="text-[9px] text-slate-400 font-medium block">({state.fatCalories} kcal)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
