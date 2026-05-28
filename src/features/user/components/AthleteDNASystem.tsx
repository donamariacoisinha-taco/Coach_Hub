import React from 'react';
import { useUserStore } from '../../../store/userStore';
import { motion } from 'motion/react';
import { Sparkles, Compass, Lightbulb, Zap, TrendingUp } from 'lucide-react';

export function AthleteDNASystem() {
  const { profile } = useUserStore();

  if (!profile) return null;

  const freq = parseInt(profile.frequency || '3') || 3;
  const goal = profile.goal || '';

  // Calculate DNA characteristics
  const getVolumeTolerance = () => {
    if (freq >= 5) return { label: 'Tolerância Alta', desc: 'Sua biologia suporta volume acumulado elevado. Divisões ABC/ABCD funcionam de forma otimizada para sua capacidade.' };
    return { label: 'Tolerância Moderada', desc: 'Excelente resposta a supercompensação. Treinos mais intensos com espaçamento inteligente otimizam seus resultados.' };
  };

  const getStyleDNA = () => {
    if (goal.includes('Hipertrofia') || goal.includes('Força')) {
      return {
        label: 'Intensidade Progressiva',
        desc: 'Sua assinatura biológica responde melhor a cargas incrementais (sobrecarga progressiva) e descanso focado na descompressão metabólica.'
      };
    } else if (goal.includes('Emagrecimento')) {
      return {
        label: 'Eficiência de Recomposição',
        desc: 'Foco em manter densidade de treino densa (menores tempos de repouso) para sustentar queima lipídica contínua sem perder força contrátil.'
      };
    }
    return {
      label: 'Volume de Resistência Estável',
      desc: 'Sua biomecânica é otimizada para endurance e manutenção glicogênica uniforme.'
    };
  };

  const tolerance = getVolumeTolerance();
  const style = getStyleDNA();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.26 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl">
          <Compass size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Assinatura de Treino (DNA)</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Padrão metodológico calculado</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Style signature */}
        <div className="bg-slate-50 p-5 rounded-2xl space-y-2 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={14} className="fill-indigo-100" />
            <span className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
            {style.desc}
          </p>
        </div>

        {/* Volume Tolerance */}
        <div className="bg-slate-50 p-5 rounded-2xl space-y-2 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tolerance.label}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
            {tolerance.desc}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
        <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
          O KYRON OS adapta a ordem, intensidade padrão RPE e volume das séries de performance com base nessa assinatura.
        </p>
      </div>
    </motion.div>
  );
}
