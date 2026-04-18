
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, CheckCircle2, Shield, Star, BarChart3 } from 'lucide-react';
import { Exercise } from '../../types';
import { ekeService, RecommendationContext } from '../../domain/eke/ekeService';

interface EKEExplanationProps {
  exercise: Exercise;
  context: RecommendationContext;
  isOpen: boolean;
  onClose: () => void;
}

export const EKEExplanation: React.FC<EKEExplanationProps> = ({ exercise, context, isOpen, onClose }) => {
  const reasons = ekeService.explainRecommendation(exercise, context);
  const qScore = exercise.quality_score || 0;
  const pScore = exercise.performance_score || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000]" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl z-[2001] overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white relative">
              <div className="absolute top-4 right-4 text-blue-400">
                <Sparkles size={20} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">EKE v1.1 Insights</h4>
              <h3 className="text-xl font-black tracking-tight leading-tight">{exercise.name}</h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Shield size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Qualidade</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 leading-none">{qScore}%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <BarChart3 size={14} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Performance</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 leading-none">{pScore}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Por que foi recomendado?</h5>
                <div className="space-y-2">
                  {reasons.map((reason, i) => (
                    <div key={i} className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                      <CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                  {reasons.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic font-medium p-2">Análise contextual concluída com sucesso.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
