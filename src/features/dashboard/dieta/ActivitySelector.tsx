import React from 'react';
import { motion } from 'motion/react';

interface ActivitySelectorProps {
  selected: 'Sedentário' | 'Leve' | 'Moderado' | 'Alto' | 'Extremo';
  onChange: (value: 'Sedentário' | 'Leve' | 'Moderado' | 'Alto' | 'Extremo') => void;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({ selected, onChange }) => {
  const levels: { id: typeof selected; factor: number; text: string; details: string }[] = [
    {
      id: 'Sedentário',
      factor: 1.2,
      text: 'Mínimo',
      details: 'Sem atividade física regular. Trabalho de escritório.'
    },
    {
      id: 'Leve',
      factor: 1.375,
      text: 'Leve',
      details: 'Sessões moderadas de treino 1-3x por semana.'
    },
    {
      id: 'Moderado',
      factor: 1.55,
      text: 'Moderado',
      details: 'Movimentação regular e treinos 3-5x por semana.'
    },
    {
      id: 'Alto',
      factor: 1.725,
      text: 'Ativo',
      details: 'Estilo de vida ativo, treinos intensos 5-7x por semana.'
    },
    {
      id: 'Extremo',
      factor: 1.9,
      text: 'Atleta',
      details: 'Duplo treino diário ou trabalho com altíssimo desgaste.'
    }
  ];

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400">
          NÍVEL DE ATIVIDADE DIÁRIA
        </span>
        <span className="text-[10px] text-[#7BA7FF] font-semibold tracking-tight">
          Fator: x{(levels.find(l => l.id === selected)?.factor || 1.2).toFixed(3)}
        </span>
      </div>

      {/* Selector Row */}
      <div className="flex gap-1.5 p-1 bg-slate-100/60 rounded-full border border-slate-200/20 overflow-x-auto no-scrollbar scroll-smooth">
        {levels.map((level) => {
          const isActive = selected === level.id;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => {
                onChange(level.id);
                if ('vibrate' in navigator) navigator.vibrate(4);
              }}
              className="relative px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 shrink-0 select-none outline-none"
            >
              {/* Animated active pill background with layoutId */}
              {isActive && (
                <motion.div
                  layoutId="activeActivityPill"
                  className="absolute inset-0 bg-[#7BA7FF] rounded-full shadow-[0_4px_14px_rgba(123,167,255,0.35)]"
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-450 hover:text-slate-700'
              }`}>
                {level.id}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description below */}
      <motion.p
        key={selected}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[11px] font-light leading-relaxed text-slate-450 italic px-1"
      >
        {levels.find(l => l.id === selected)?.details}
      </motion.p>
    </div>
  );
};
