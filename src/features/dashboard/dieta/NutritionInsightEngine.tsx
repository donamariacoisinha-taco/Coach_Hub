import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Info, Heart, ShieldAlert } from 'lucide-react';
import { EditableNutritionProfile, MetabolicState } from '../../../store/nutritionStore';

interface NutritionInsightEngineProps {
  profile: EditableNutritionProfile;
  state: MetabolicState;
}

export const NutritionInsightEngine: React.FC<NutritionInsightEngineProps> = ({ profile, state }) => {
  // Generate highly emotional, biological Coach Rubi Insights on the fly
  const loadDynamicInsight = (): { title: string; desc: string; tag: string } => {
    const goalLower = String(profile.goal).toLowerCase();
    
    if (goalLower.includes('emagrecimento') || goalLower.includes('loss') || goalLower.includes('corte')) {
      return {
        tag: "Lipólise e Mitocôndria",
        title: "Aceleração Metabólica Micro-Ajustada",
        desc: `Com a meta em ${state.caloriesTarget} kcal, estimamos um déficit ideal para seu corpo utilizar reservas lipídicas sem desidratar ou catabolizar. Suas proteínas estão calibradas em ${state.proteinGrams}g para preservar o tecido magro ativado.`
      };
    }
    
    if (goalLower.includes('hipertrofia') || goalLower.includes('hypertrophy') || goalLower.includes('ganho')) {
      return {
        tag: "Anabolismo Muscular",
        title: "Superávit de Glicogênio Sob Demanda",
        desc: `Seu superávit calórico de +350-400 kcal servirá de substrato energético direto para reposição do glicogênio pós-esforço. Foco nos carboidratos complexos (${state.carbGrams}g) para sinalizar síntese de síntese proteica ideal.`
      };
    }

    if (goalLower.includes('recomposição') || goalLower.includes('recomp')) {
      return {
        tag: "Sincronia Estável",
        title: "Balanciamento Autônomo Celular",
        desc: `Meta estabilizada em ${state.caloriesTarget} kcal. Seu perfil de treinamento exige reposição lipídica e hídrica perfeita (${(state.hydrationGoalMl / 1000).toFixed(1)}L). Excelente para otimizar força basal com perda de gordura.`
      };
    }

    return {
      tag: "Suporte e Recuperação",
      title: "Reserva Biológica Estabilizada",
      desc: `A meta calórica foi calibrada para prover suporte anabólico e reduzir marcadores latentes de fadiga. Ingestão proteica ajustada a ${state.proteinGrams}g para restauração celular.`
    };
  };

  const insight = loadDynamicInsight();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={profile.goal + '-' + profile.weight + '-' + profile.activityLevel}
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm relative overflow-hidden select-none"
      >
        <div className="absolute top-0 right-0 p-3 pointer-events-none text-slate-100 flex items-center justify-center">
          <Sparkles size={45} className="text-[#7BA7FF]/5" />
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-11 h-11 rounded-xl bg-[#7BA7FF]/10 text-[#7BA7FF] flex items-center justify-center shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="uppercase tracking-[0.2em] text-[9.5px] font-bold text-[#818CF8]">
                INSIGHT DO COACH RUBI
              </span>
              <span className="text-[9px] font-bold tracking-tight bg-[#7BA7FF]/10 text-[#7BA7FF] px-2 py-0.5 rounded-full">
                {insight.tag}
              </span>
            </div>

            <h5 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug">
              {insight.title}
            </h5>

            <p className="text-xs font-light leading-relaxed text-slate-500 italic">
              "{insight.desc}"
            </p>
          </div>
        </div>

        {/* Homeostasis Warnings */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-2 text-[10px] text-slate-400">
          <Heart size={11} className="text-rose-400 shrink-0" />
          <span>Foco principal: Garantir micronutrientes densos e ingestão ideal de água.</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
