import React from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, HelpCircle } from 'lucide-react';

interface MetabolicBalanceRingProps {
  score: number;
}

export const MetabolicBalanceRing: React.FC<MetabolicBalanceRingProps> = ({ score }) => {
  const radius = 68;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  
  // Custom interactive bio feedback based on current Metabolic Balance score
  const getQualityText = (rawScore: number) => {
    if (rawScore >= 90) return { title: 'Homeostase Otimizada', color: 'text-emerald-500', bg: 'bg-emerald-50', level: 'Excelente' };
    if (rawScore >= 75) return { title: 'Consistência Linear', color: 'text-[#7BA7FF]', bg: 'bg-[#7BA7FF]/10', level: 'Equilibrado' };
    if (rawScore >= 55) return { title: 'Transição Funcional', color: 'text-amber-500', bg: 'bg-amber-50', level: 'Modulado' };
    return { title: 'Exigência de Ajustes', color: 'text-rose-500', bg: 'bg-rose-50', level: 'Limiar Baixo' };
  };

  const bioFeedback = getQualityText(score);

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/50 p-6 flex flex-col items-center sm:flex-row sm:items-center justify-between gap-6 relative select-none">
      
      {/* Circle Box */}
      <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base Gray ring */}
          <circle 
            cx="80" cy="80" r={radius} 
            className="stroke-slate-100" strokeWidth={strokeWidth} fill="transparent" 
          />
          {/* Dynamic Active ring */}
          <motion.circle 
            cx="80" cy="80" r={radius} 
            className="stroke-[#7BA7FF]" strokeWidth={strokeWidth} fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center texts */}
        <div className="absolute flex flex-col items-center">
          <motion.span 
            key={score}
            className="text-4xl font-light text-slate-900 tracking-tighter tabular-nums leading-none"
          >
            {score}
          </motion.span>
          <span className="uppercase tracking-[0.15em] text-[7.5px] font-bold text-slate-400 mt-1.5 leading-none">
            BIO SCORE
          </span>
        </div>
      </div>

      {/* Narrative Info Box */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <div className="space-y-1">
          <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-slate-400 block">
            ÍNDICE ADAPTATIVO GERAL
          </span>
          <h4 className="text-lg font-light tracking-tight text-slate-900">
            Metabolic Balance Score
          </h4>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-150 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7BA7FF] animate-ping" />
          <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tight uppercase">
            Aderência: {bioFeedback.level}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-slate-450 font-light max-w-sm">
          A calibração atual dos seus biomarcadores sinaliza <strong className="text-slate-700 font-semibold">{bioFeedback.title}</strong> hoje. Seu organismo assimila melhor os nutrientes nesta janela.
        </p>
      </div>

    </div>
  );
};
