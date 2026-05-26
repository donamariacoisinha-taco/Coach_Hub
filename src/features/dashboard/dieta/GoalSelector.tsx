import React from 'react';
import { motion } from 'motion/react';
import { Target, TrendingDown, RefreshCw, Zap } from 'lucide-react';

interface GoalSelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

export const GoalSelector: React.FC<GoalSelectorProps> = ({ selected, onChange }) => {
  const goals = [
    {
      id: 'Hipertrofia',
      title: 'Hipertrofia',
      desc: 'Superávit biológico adaptado para síntese de novas fibras musculares.',
      icon: Target,
      color: 'border-[#7BA7FF] bg-[#7BA7FF]/5 text-[#7BA7FF]',
      glow: 'shadow-[#7BA7FF]/10'
    },
    {
      id: 'Emagrecimento',
      title: 'Emagrecimento',
      desc: 'Déficit calórico micro-ajustado preservando tônus e glicogênio muscular.',
      icon: TrendingDown,
      color: 'border-[#60A5FA] bg-[#60A5FA]/5 text-[#60A5FA]',
      glow: 'shadow-[#60A5FA]/10'
    },
    {
      id: 'Recomposição',
      title: 'Recomposição',
      desc: 'Homeostase calórica para queima lipídica concomitante a anabolismo suave.',
      icon: RefreshCw,
      color: 'border-[#818CF8] bg-[#818CF8]/5 text-[#818CF8]',
      glow: 'shadow-[#818CF8]/10'
    },
    {
      id: 'Performance',
      title: 'Performance',
      desc: 'Recuperação energética densificada com foco em substratos de alta potência.',
      icon: Zap,
      color: 'border-[#34D399] bg-[#34D399]/5 text-[#34D399]',
      glow: 'shadow-[#34D399]/10'
    }
  ];

  return (
    <div className="flex flex-col space-y-3">
      <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400 px-1">
        FOCO BIOLÓGICO PRIMÁRIO
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {goals.map((goal) => {
          const isActive = selected === goal.id;
          const Icon = goal.icon;

          return (
            <motion.div
              key={goal.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange(goal.id);
                if ('vibrate' in navigator) navigator.vibrate(8);
              }}
              className={`cursor-pointer group flex flex-col p-4 rounded-[1.5rem] border transition-all text-left relative overflow-hidden h-36 justify-between select-none ${
                isActive
                  ? `border-[#7BA7FF] bg-[#7BA7FF]/[0.03] shadow-[0_12px_30px_rgba(123,167,255,0.12)]`
                  : 'bg-white/70 border-slate-150 hover:border-slate-350 hover:bg-white/90 shadow-sm'
              }`}
            >
              {/* Animated soft glow inside card if active */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#7BA7FF]/[0.03] to-transparent pointer-events-none" />
              )}

              {/* Icon Bubble */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                  isActive ? goal.color : 'bg-slate-50 border-slate-200 text-slate-450'
                }`}
              >
                <Icon size={16} />
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mt-3">
                <span
                  className={`text-sm font-semibold tracking-tight transition-colors block ${
                    isActive ? 'text-slate-900' : 'text-slate-750 group-hover:text-slate-900'
                  }`}
                >
                  {goal.title}
                </span>
                <span className="text-[11px] font-light leading-relaxed text-slate-400 block line-clamp-2">
                  {goal.desc}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
