import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, 
  Sparkles, 
  Zap, 
  Layers, 
  Search, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Database,
  ShieldCheck,
  Wand2,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { useIntelligenceStore } from '../store/intelligenceStore';

const AIOperator: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'audit' | 'semantic' | 'generator' | 'auto-improve'>('audit');
  const { openModal } = useIntelligenceStore();

  const modules = [
    { id: 'audit', title: 'Deep Audit', icon: ShieldCheck, color: 'text-blue-600', desc: 'Scan full library for inconsistencies' },
    { id: 'semantic', title: 'Semantic Deduplicator', icon: Fingerprint, color: 'text-indigo-600', desc: 'Find duplicate meanings in names' },
    { id: 'generator', title: 'Rubi Generator', icon: Wand2, color: 'text-emerald-600', desc: 'Generate premium technical metadata' },
    { id: 'auto-improve', title: 'Auto-Improve (Batch)', icon: Zap, color: 'text-orange-600', desc: 'AI-led refinement in bulk' }
  ] as const;

  return (
    <div className="space-y-16">
      {/* AI Hub Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-950 rounded-[2rem] flex items-center justify-center text-blue-400 shadow-2xl shadow-slate-950/20 relative">
               <Cpu size={32} />
               <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#F7F8FA]" 
               />
            </div>
            <div>
               <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">AI OPERATOR <span className="text-blue-600">v2.4</span></h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} className="text-blue-600" />
                  Powered by Rubi Intelligence Engine
               </p>
            </div>
         </div>
         
         <div className="hidden lg:flex items-center gap-8 pr-8">
            <StatsMini label="AI Accuracy" value="99.4%" />
            <div className="h-10 w-px bg-slate-200" />
            <StatsMini label="Weekly Gaps Filled" value="1.2k" />
            <div className="h-10 w-px bg-slate-200" />
            <StatsMini label="Token Efficiency" value="84%" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Sidebar Modules */}
         <div className="lg:col-span-1 space-y-4">
            {modules.map(mod => {
               const Icon = mod.icon;
               const isActive = activeModule === mod.id;
               return (
                  <button 
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`w-full p-6 rounded-[2rem] border text-left transition-all group ${
                      isActive 
                        ? 'bg-white border-blue-200 shadow-xl shadow-blue-200/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm opacity-60 hover:opacity-100'
                    }`}
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${mod.color} ${isActive ? 'bg-slate-50' : 'bg-slate-50'}`}>
                        <Icon size={20} />
                     </div>
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{mod.title}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2 leading-relaxed">{mod.desc}</p>
                  </button>
               );
            })}
         </div>

         {/* Module Execution Area */}
         <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={activeModule}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm min-h-[600px] flex flex-col"
               >
                  {activeModule === 'audit' && (
                    <div className="space-y-12 flex-1 flex flex-col">
                       <div className="flex items-center justify-between">
                          <div>
                             <h4 className="text-xl font-black uppercase tracking-tight">Full Library Audit</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-referencing names, biomechanics and media</p>
                          </div>
                          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                             Stable
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <AuditMetric label="Data Integrity" value="94.2%" />
                          <AuditMetric label="Biomechanics Sync" value="82.0%" />
                          <AuditMetric label="Media Coverage" value="68.5%" />
                          <AuditMetric label="Technical Depth" value="45.1%" warning />
                       </div>

                       <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 border-dashed space-y-6">
                          <p className="text-xs font-black uppercase tracking-widest text-blue-900">Detected Issues (Last 24h)</p>
                          <div className="space-y-4">
                             <AuditLogItem text="Chest press machines missing technical prompts" type="error" />
                             <AuditLogItem text="43 video URLs returning non-CDN warnings" type="warning" />
                             <AuditLogItem text="Muscle group overlap in 12 shoulder exercises" type="warning" />
                          </div>
                       </div>

                       <div className="mt-auto pt-12">
                          <button 
                             onClick={() => openModal('audit')}
                             className="w-full h-20 rounded-[2rem] bg-slate-950 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                          >
                             <Sparkles size={20} className="text-blue-400" />
                             Trigger Deep Library Audit
                          </button>
                       </div>
                    </div>
                  )}

                  {activeModule === 'semantic' && <ModuleEmptyState title="Semantic Deduplicator" onRun={() => openModal('full')} />}
                  {activeModule === 'generator' && <ModuleEmptyState title="Rubi Generator" onRun={() => openModal('content')} />}
                  {activeModule === 'auto-improve' && <ModuleEmptyState title="Batch Auto-Improve" onRun={() => openModal('fix')} />}
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

function StatsMini({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-right">
       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
       <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function AuditMetric({ label, value, warning }: { label: string, value: string, warning?: boolean }) {
  return (
    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
       <div className="flex items-end justify-between">
          <span className={`text-2xl font-black tracking-tight ${warning ? 'text-orange-600' : 'text-slate-900'}`}>{value}</span>
          <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
             <div className={`h-full rounded-full ${warning ? 'bg-orange-500' : 'bg-blue-600'}`} style={{ width: value }}></div>
          </div>
       </div>
    </div>
  );
}

function AuditLogItem({ text, type }: { text: string, type: 'error' | 'warning' }) {
  return (
    <div className="flex items-center gap-4 group">
       <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500' : 'bg-orange-500'}`} />
       <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{text}</p>
       <ChevronRight size={12} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
    </div>
  );
}

function ModuleEmptyState({ title, onRun }: { title: string, onRun: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
       <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
          <BrainCircuit size={40} />
       </div>
       <h4 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h4>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px]">Module training in progress. This tool uses Rubi Elite weights for high accuracy.</p>
       <button 
         onClick={onRun}
         className="mt-8 px-10 h-14 rounded-full border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all"
       >
          Initialize Engine
       </button>
    </div>
  );
}

export default AIOperator;
