import React from 'react';
import { motion } from 'motion/react';
import { Target, ShieldCheck, Dumbbell } from 'lucide-react';
import { MetabolicState } from '../../../store/nutritionStore';

interface MacroDistributionVisualizerProps {
  state: MetabolicState;
}

export const MacroDistributionVisualizer: React.FC<MacroDistributionVisualizerProps> = ({ state }) => {
  const totalCalories = state.proteinCalories + state.carbCalories + state.fatCalories;
  
  const proteinPct = Math.round((state.proteinCalories / totalCalories) * 100) || 30;
  const carbPct = Math.round((state.carbCalories / totalCalories) * 100) || 50;
  const fatPct = Math.round((state.fatCalories / totalCalories) * 100) || 20;

  const macros = [
    {
      label: 'Proteínas',
      grams: state.proteinGrams,
      calories: state.proteinCalories,
      pct: proteinPct,
      color: 'bg-[#7BA7FF]',
      border: 'border-[#7BA7FF]/30',
      tag: '4 kcal/g',
      desc: 'Síntese de aminoácidos estruturais para reparação miofibrilar.'
    },
    {
      label: 'Carboidratos',
      grams: state.carbGrams,
      calories: state.carbCalories,
      pct: carbPct,
      color: 'bg-[#A5C8FF]',
      border: 'border-[#A5C8FF]/30',
      tag: '4 kcal/g',
      desc: 'Combustível muscular secundário de alta velocidade e energia direta.'
    },
    {
      label: 'Gorduras',
      grams: state.fatGrams,
      calories: state.fatCalories,
      pct: fatPct,
      color: 'bg-[#60A5FA]',
      border: 'border-[#60A5FA]/30',
      tag: '9 kcal/g',
      desc: 'Regulação lipídica celular, síntese hormonal e homeostase de vitaminas.'
    }
  ];

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/50 space-y-6 select-none">
      <div className="space-y-1">
        <span className="uppercase tracking-[0.22em] text-[10px] font-bold text-slate-400 block px-1">
          BIOLOGICAL DISTRIBUTION
        </span>
        <h4 className="text-lg font-light tracking-tight text-slate-800">
          Divisão e Densidade de Macronutrientes
        </h4>
      </div>

      {/* Modern Fluid Distribution Ring Layout */}
      <div className="flex h-5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20 shadow-inner relative">
        <motion.div
          animate={{ width: `${proteinPct}%` }}
          className="h-full bg-[#7BA7FF]"
          title={`Proteínas: ${proteinPct}%`}
        />
        <motion.div
          animate={{ width: `${carbPct}%` }}
          className="h-full bg-[#A5C8FF]"
          title={`Carboidratos: ${carbPct}%`}
        />
        <motion.div
          animate={{ width: `${fatPct}%` }}
          className="h-full bg-[#60A5FA]"
          title={`Gorduras: ${fatPct}%`}
        />
      </div>

      {/* Row Labels & Pcts */}
      <div className="grid grid-cols-3 gap-2 px-1 text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7BA7FF]" />
            <span className="text-[10px] text-slate-500 font-bold">Proteínas</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{proteinPct}%</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A5C8FF]" />
            <span className="text-[10px] text-slate-500 font-bold">Carboidratos</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{carbPct}%</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
            <span className="text-[10px] text-slate-500 font-bold">Gorduras</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">{fatPct}%</span>
        </div>
      </div>

      {/* Editorial detailed logs cards */}
      <div className="space-y-3.5 pt-2">
        {macros.map((macro, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-105 space-x-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">{macro.label}</span>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/50 text-slate-400 transition-colors">
                  {macro.tag}
                </span>
              </div>
              <p className="text-[10.5px] font-light leading-relaxed text-slate-450">
                {macro.desc}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-sm font-semibold text-slate-800 tabular-nums">
                {macro.grams} g
              </span>
              <span className="text-[10px] text-slate-400 block font-light tabular-nums">
                {macro.calories} kcal
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
