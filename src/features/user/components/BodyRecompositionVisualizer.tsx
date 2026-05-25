import React from 'react';
import { useUserStore } from '../../../store/userStore';
import { motion } from 'motion/react';
import { TrendingUp, Sparkles, Target, Calendar } from 'lucide-react';

export function BodyRecompositionVisualizer() {
  const { profile } = useUserStore();

  if (!profile) return null;

  const currentWeight = profile.weight || 0;
  const targetWeight = profile.target_weight || 0;
  const goal = profile.goal || '';

  const isWeightLoss = goal.toLowerCase().includes('emagrecimento') || targetWeight < currentWeight;
  const isHypertrophy = goal.toLowerCase().includes('hipertrofia') || goal.toLowerCase().includes('força') || targetWeight > currentWeight;

  // Let's calculate estimated months to target at healthy rate
  // Loss: 2kg per month
  // Gain: 0.5kg per month
  let estimatedMonths = 0;
  const weightDiff = Math.abs(currentWeight - targetWeight);

  if (weightDiff > 0) {
    if (isWeightLoss) {
      estimatedMonths = Math.ceil((weightDiff / 2) * 10) / 10;
    } else {
      estimatedMonths = Math.ceil((weightDiff / 0.8) * 10) / 10;
    }
  }

  // Pure SVG coordinates to draw a modern grid
  // We plot 5 points showing gradual shift
  const points = [];
  const totalSteps = 4;
  
  for (let i = 0; i <= totalSteps; i++) {
    const ratio = i / totalSteps;
    let val = currentWeight;
    if (targetWeight > 0) {
      // Linear interpolation with slight curve easing
      const factor = Math.sin((ratio * Math.PI) / 2); // easing curve
      val = currentWeight + (targetWeight - currentWeight) * factor;
    }
    points.push({
      label: `Mês ${i}`,
      val: parseFloat(val.toFixed(1)),
      x: (i * 240) / totalSteps + 20, // margins
      y: 100 - (ratio * 50) - (isWeightLoss ? 10 : -10) // simulated curve layout
    });
  }

  // Generate SVG path coordinate line
  const dPath = points.reduce((path, p, index) => {
    return path + `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-500 p-2.5 rounded-xl">
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Projeção Corporal</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recomposição estocástica</p>
          </div>
        </div>
        {estimatedMonths > 0 && (
          <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full uppercase tracking-widest">
            Meta: ~{estimatedMonths} {estimatedMonths === 1 ? 'Mês' : 'Meses'}
          </span>
        )}
      </div>

      {currentWeight && targetWeight ? (
        <div className="space-y-6">
          {/* Advice highlight */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
            <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
              Mantendo um ritmo consistente de treinos e adesão dietética, você estima atingir a meta de{' '}
              <strong className="text-slate-900 font-black">{targetWeight} kg</strong> em aproximadamente{' '}
              <strong className="text-blue-600 font-extrabold">{estimatedMonths} {estimatedMonths === 1 ? 'mês' : 'meses'}</strong>.
            </p>
          </div>

          {/* Minimalist Projections Graph */}
          <div className="relative border border-slate-50 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-center overflow-x-auto">
            <svg viewBox="0 0 280 120" className="w-full h-auto overflow-visible">
              {/* Curve Line */}
              <motion.path
                d={dPath}
                fill="none"
                stroke="url(#projectionGlow)"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              {/* Gradients definition */}
              <defs>
                <linearGradient id="projectionGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              {/* Data Node Points */}
              {points.map((p, index) => (
                <g key={index}>
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-white stroke-blue-500 stroke-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.15 }}
                  />
                  {/* Weight label */}
                  <text 
                    x={p.x} 
                    y={p.y - 8} 
                    textAnchor="middle" 
                    className="text-[8px] font-black fill-slate-700"
                  >
                    {p.val}kg
                  </text>
                  {/* Column marker title */}
                  <text 
                    x={p.x} 
                    y={118} 
                    textAnchor="middle" 
                    className="text-[7px] font-black fill-slate-400 uppercase tracking-wider"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Inicial</span>
              <span className="text-sm font-black text-slate-900">{currentWeight} kg</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alvo Futuro</span>
              <span className="text-sm font-black text-amber-500">{targetWeight} kg</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed justify-center items-center">
          💡 Defina seu <strong className="text-slate-700 font-bold">Peso Corporal</strong> e sua <strong className="text-slate-700 font-bold">Meta de Peso</strong> na seção acima para projetar sua curva estocástica!
        </div>
      )}
    </motion.div>
  );
}
