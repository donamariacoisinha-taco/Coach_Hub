import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Check, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Zap, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Exercise } from '../../../types';
import { useAdminStore } from '../../../store/adminStore';
import { autoFixApi } from '../api/autoFixApi';
import { applyAiFix } from '../services/aiFixService';

interface CompareChangesProps {
  exercise: Exercise;
  onClose: () => void;
}

const CompareChanges: React.FC<CompareChangesProps> = ({ exercise, onClose }) => {
  const { setExercises, exercises } = useAdminStore();
  const suggestions = exercise.ai_suggestions || {};

  const handleApprove = async () => {
    const fixed = applyAiFix(exercise, suggestions);
    fixed.ai_review_status = 'approved';
    fixed.needs_human_review = false;
    
    try {
      await autoFixApi.updateExercise(fixed);
      setExercises(exercises.map(ex => ex.id === fixed.id ? fixed : ex));
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    const rejected = { 
       ...exercise, 
       ai_review_status: 'rejected' as const,
       needs_human_review: false 
    };
    try {
      await autoFixApi.updateExercise(rejected);
      setExercises(exercises.map(ex => ex.id === rejected.id ? rejected : ex));
      onClose();
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl bg-slate-50 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-12 py-8 bg-white border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                 <Zap size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Modo Comparativo IA</p>
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{exercise.name}</h2>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-950 transition-colors">
              <X size={28} />
           </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
           {/* Summary of Issues */}
           {exercise.ai_issues && exercise.ai_issues.length > 0 && (
             <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex items-start gap-6">
                <AlertTriangle className="text-red-500 mt-1" size={24} />
                <div className="space-y-4">
                   <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Problemas Identificados pela Auditoria</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {exercise.ai_issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-red-50 shadow-sm">
                           <div className="w-2 h-2 rounded-full bg-red-400" />
                           <span className="text-xs font-bold text-slate-700">{issue.description}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-12">
              {/* Original */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest px-4 py-2 bg-slate-200 rounded-full inline-block">Versão Atual</h3>
                 </div>
                 
                 <div className="bg-white rounded-[2rem] p-10 space-y-8 border border-slate-100 opacity-60 grayscale-[0.5]">
                    <FieldGroup label="Nome" value={exercise.name} />
                    <FieldGroup label="Descrição" value={exercise.description || 'Sem descrição'} />
                    <FieldGroup label="Instruções" value={exercise.instructions || 'Sem instruções'} isList />
                    <FieldGroup label="Dicas Técnicas" value={exercise.technical_tips || 'Sem dicas'} />
                    <FieldGroup label="Músculos Secundários" value={exercise.secondary_muscles?.join(', ') || 'Nenhum'} />
                 </div>
              </div>

              {/* Suggested */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-blue-600 uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-full inline-block flex items-center gap-2">
                       <Sparkles size={18} />
                       AI OPTIMIZED
                    </h3>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confiança: {(exercise.ai_confidence || 0) * 100}%</div>
                 </div>

                 <div className="bg-white rounded-[2rem] p-10 space-y-8 border-2 border-blue-100 shadow-[0_20px_50px_rgba(59,130,246,0.1)] relative">
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                       <ArrowRight size={24} />
                    </div>

                    <FieldGroup 
                      label="Nome" 
                      value={suggestions.name || exercise.name} 
                      changed={!!suggestions.name && suggestions.name !== exercise.name} 
                    />
                    <FieldGroup 
                      label="Descrição" 
                      value={suggestions.description || exercise.description} 
                      changed={!!suggestions.description && suggestions.description !== exercise.description} 
                    />
                    <FieldGroup 
                      label="Instruções" 
                      value={suggestions.instructions || exercise.instructions} 
                      changed={!!suggestions.instructions && suggestions.instructions !== exercise.instructions} 
                      isList
                    />
                    <FieldGroup 
                      label="Dicas Técnicas" 
                      value={suggestions.technical_tips || exercise.technical_tips} 
                      changed={!!suggestions.technical_tips && suggestions.technical_tips !== exercise.technical_tips} 
                    />
                    <FieldGroup 
                      label="Músculos Secundários" 
                      value={suggestions.secondary_muscles?.join(', ') || exercise.secondary_muscles?.join(', ')} 
                      changed={!!suggestions.secondary_muscles} 
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="px-12 py-8 bg-white border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleReject}
                className="px-8 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
              >
                 <Trash2 size={16} />
                 Rejeitar Alterações
              </button>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="px-8 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-slate-300 hover:text-slate-600 transition-all flex items-center gap-2">
                 <Edit3 size={16} />
                 Editar Manualmente
              </button>
              <button 
                onClick={handleApprove}
                className="px-10 py-5 rounded-3xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-blue-200 transition-all flex items-center gap-4"
              >
                 <Check size={20} />
                 Aprovar & Publicar
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

function FieldGroup({ label, value, changed, isList }: { label: string, value: string, changed?: boolean, isList?: boolean }) {
  return (
    <div className={`space-y-3 p-4 rounded-2xl transition-colors ${changed ? 'bg-blue-50/50' : ''}`}>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>{label}</span>
          {changed && <span className="text-[9px] font-black text-blue-600 bg-white px-2 py-0.5 rounded shadow-sm border border-blue-50">ALTERADO</span>}
       </p>
       {isList ? (
         <div className="space-y-2">
            {value.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-slate-900 leading-relaxed font-black">{line}</p>
            ))}
         </div>
       ) : (
         <p className="text-sm text-slate-900 leading-relaxed font-black">{value}</p>
       )}
    </div>
  );
}

export default CompareChanges;
