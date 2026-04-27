import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Activity, 
  Settings,
  Brain,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useIntelligenceStore } from '../store/intelligenceStore';
import { useAdminStore } from '../../../store/adminStore';
import OptimizationProgress from './OptimizationProgress';
import { rubiIntelligenceService } from '../services/rubiIntelligenceService';

const RubiIntelligenceModal: React.FC = () => {
  const { isModalOpen, closeModal, startProcessing, updateResult, finishProcessing, isProcessing, operation: activeOperation } = useIntelligenceStore();
  const { exercises } = useAdminStore();
  const [selectedOperation, setSelectedOperation] = useState<'audit' | 'fix' | 'metadata' | 'content' | 'scores' | 'full' | null>(null);
  
  // For demonstration, we'll process the "critical" or "all" depending on user context
  // Usually this is triggered from selected IDs in LibraryOS
  const [targetIds, setTargetIds] = useState<string[]>([]);

  const operations = [
    { id: 'audit', label: 'Auditar Selecionados', icon: ShieldCheck, desc: 'Detectar falhas estruturais e inconsistências.' },
    { id: 'fix', label: 'Corrigir Críticos', icon: Zap, desc: 'Reparar automaticamente itens com score baixo.' },
    { id: 'metadata', label: 'Completar Metadados', icon: Settings, desc: 'Preencher músculos e equipamentos faltantes.' },
    { id: 'content', label: 'Reescrever Conteúdo', icon: FileText, desc: 'Gerar descrições e passos técnicos premium.' },
    { id: 'scores', label: 'Recalcular Scores', icon: Activity, desc: 'Atualizar índices de qualidade via IA.' },
    { id: 'full', label: 'Full Optimization', icon: Sparkles, desc: 'Orquestração neural completa de cada asset.', premium: true },
  ];

  const handleStart = async () => {
    if (!selectedOperation) return;
    
    // In a real app, targetIds would come from selection
    // For this prototype, we'll take the first 10 for safety
    const ids = exercises.slice(0, 10).map(e => e.id);
    
    startProcessing(ids, selectedOperation);

    for (const id of ids) {
      const exercise = exercises.find(ex => ex.id === id);
      if (!exercise) continue;

      updateResult(id, { name: exercise.name, status: 'processing' });
      
      try {
        const optimized = await rubiIntelligenceService.optimizeExercise(exercise, selectedOperation);
        updateResult(id, { status: 'completed', optimizedData: optimized, originalData: exercise });
      } catch (err) {
        updateResult(id, { status: 'failed', error: 'Falha na conexão neural' });
      }
    }

    finishProcessing();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={closeModal}
         className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
       />

       <motion.div 
         initial={{ opacity: 0, scale: 0.9, y: 40 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.9, y: 40 }}
         className="relative w-full max-w-4xl bg-[#F7F8FA] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
       >
          {isProcessing ? (
            <OptimizationProgress />
          ) : (
            <>
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-12 py-10 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-slate-200 scale-110">
                       <Brain size={28} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Rubi Intelligence Engine</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                          Neural Orchestration v3.4 Active
                       </p>
                    </div>
                 </div>
                 <button onClick={closeModal} className="p-4 text-slate-300 hover:text-slate-950 transition-colors bg-slate-50 rounded-2xl">
                    <X size={24} />
                 </button>
              </div>

              {/* Operations Grid */}
              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {operations.map((op) => {
                      const Icon = op.icon;
                      const isActive = selectedOperation === op.id;
                      return (
                        <button
                          key={op.id}
                          onClick={() => setSelectedOperation(op.id as any)}
                          className={`flex items-start gap-6 p-8 rounded-[2.5rem] border-2 transition-all text-left group relative overflow-hidden ${
                            isActive 
                              ? 'bg-white border-slate-950 shadow-2xl shadow-slate-200 scale-[1.02]' 
                              : 'bg-white border-transparent hover:border-slate-200 text-slate-400'
                          }`}
                        >
                           {op.premium && (
                             <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-2xl">
                                Elite
                             </div>
                           )}
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-300'}`}>
                              <Icon size={24} />
                           </div>
                           <div className="flex-1">
                              <h4 className={`text-[13px] font-black uppercase tracking-tight mb-1 ${isActive ? 'text-slate-950' : 'text-slate-600'}`}>{op.label}</h4>
                              <p className="text-[10px] font-bold leading-relaxed">{op.desc}</p>
                           </div>
                           {isActive && <CheckCircle2 size={20} className="text-emerald-500" />}
                        </button>
                      );
                    })}
                 </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-slate-200 px-12 py-8 flex items-center justify-between">
                 <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold">
                    <Zap size={14} className="text-indigo-500" />
                    POWERED BY RUBI NEURAL CORE
                 </div>
                 <button 
                   onClick={handleStart}
                   disabled={!selectedOperation}
                   className="px-10 h-16 bg-slate-950 text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 flex items-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                 >
                    Iniciar Inteligência
                    <ChevronRight size={18} />
                 </button>
              </div>
            </>
          )}
       </motion.div>
    </div>
  );
};

export default RubiIntelligenceModal;
