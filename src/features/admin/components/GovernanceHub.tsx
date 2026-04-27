
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  AlertTriangle,
  RefreshCcw,
  Search,
  CheckCircle2,
  BrainCircuit,
  Database,
  BarChart3,
  Layers
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';

const GovernanceHub: React.FC = () => {
  const { exercises, stats } = useAdminStore();
  const [auditing, setAuditing] = useState(false);
  const [dupChecking, setDupChecking] = useState(false);

  const handleAudit = async () => {
    setAuditing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAuditing(false);
  };

  const handleDupCheck = async () => {
    setDupChecking(true);
    await new Promise(r => setTimeout(r, 1500));
    setDupChecking(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic">IA & Governança <span className="text-blue-600">Pro</span></h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronização neural da biblioteca</p>
        </div>
        
        <div className="flex items-center gap-3 p-1.5 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20">
           <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
              <BrainCircuit size={20} />
           </div>
           <div className="pr-4">
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Status Rubi Engine</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online & Sincronizado
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IA Auditor Section */}
        <div className="space-y-8">
           <HubSectionHead 
              title="Auditor IA" 
              subtitle="Scaneamento profundo de inconsistências" 
              icon={<ShieldCheck size={20} className="text-blue-600" />} 
           />
           
           <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Cobertura de Auditoria</p>
                    <span className="text-xs font-black text-blue-600 underline cursor-pointer">Histórico</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <AuditorStat label="Descrições" value="94%" color="bg-emerald-500" />
                    <AuditorStat label="Biomecânica" value="82%" color="bg-blue-500" />
                    <AuditorStat label="Vídeos HD" value="65%" color="bg-orange-500" />
                    <AuditorStat label="Imagens" value="98%" color="bg-emerald-500" />
                 </div>
              </div>

              <div className="space-y-4">
                 <AuditItem icon={<RefreshCcw size={14} />} text="Detectar descrições incompletas ou genéricas" status="active" />
                 <AuditItem icon={<Zap size={14} />} text="Inconsistências em equipamentos vs grupos" status="active" />
                 <AuditItem icon={<Database size={14} />} text="Checagem de slugs e nomes técnicos" status="active" />
                 <AuditItem icon={<AlertTriangle size={14} />} text="Auditoria de vídeos offline ou corrompidos" status="warning" />
              </div>

              <button 
                onClick={handleAudit}
                disabled={auditing}
                className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {auditing ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-blue-400" />}
                Reauditar Base Completa
              </button>
           </div>
        </div>

        {/* Intelligence Tools */}
        <div className="space-y-12">
            <div className="space-y-8">
               <HubSectionHead 
                  title="Semantic Tools" 
                  subtitle="Detecção de ruído e redundância" 
                  icon={<Layers size={20} className="text-indigo-600" />} 
               />
               
               <div className="grid grid-cols-2 gap-6">
                  <ToolCard 
                    title="Duplicate Finder" 
                    desc="Busca similaridade semântica em nomes" 
                    icon={<Search size={20} />} 
                    action={handleDupCheck}
                    loading={dupChecking}
                  />
                  <ToolCard 
                    title="Gap Finder" 
                    desc="Sugere exercícios para grupos carentes" 
                    icon={<BarChart3 size={20} />} 
                  />
               </div>
            </div>

            <div className="space-y-6">
               <HubSectionHead 
                  title="Health Audit" 
                  subtitle="Músculos com pouca cobertura" 
                  icon={<Database size={20} className="text-orange-600" />} 
               />
               <div className="space-y-3">
                  <GapProgress label="Panturrilha" current={4} target={12} />
                  <GapProgress label="Trapézio" current={2} target={8} />
                  <GapProgress label="Lombar" current={5} target={10} />
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

function HubSectionHead({ title, subtitle, icon }: { title: string, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-xl tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function AuditorStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100/50 shadow-sm">
       <div className="flex justify-between items-center mb-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <span className="text-[10px] font-black text-slate-900">{value}</span>
       </div>
       <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: value }}></div>
       </div>
    </div>
  );
}

function AuditItem({ icon, text, status }: { icon: React.ReactNode, text: string, status: 'active' | 'warning' | 'error' }) {
  return (
    <div className="flex items-center gap-4 group">
       <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
         status === 'active' ? 'bg-emerald-50 text-emerald-500' : 
         status === 'warning' ? 'bg-amber-50 text-amber-500 shadow-sm shadow-amber-500/10' : 
         'bg-red-50 text-red-500'
       }`}>
          {icon}
       </div>
       <p className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{text}</p>
       {status === 'active' && <CheckCircle2 size={12} className="ml-auto text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

function ToolCard({ title, desc, icon, action, loading }: { title: string, desc: string, icon: React.ReactNode, action?: () => void, loading?: boolean }) {
  return (
    <button 
      onClick={action}
      disabled={loading}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 hover:-translate-y-1 transition-all group"
    >
       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all mb-4">
          {loading ? <RefreshCcw size={20} className="animate-spin" /> : icon}
       </div>
       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{title}</h4>
       <p className="text-[10px] font-bold text-slate-400 leading-snug uppercase tracking-tight">{desc}</p>
    </button>
  );
}

function GapProgress({ label, current, target }: { label: string, current: number, target: number }) {
  const percentage = (current / target) * 100;
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm group">
       <div className="flex justify-between items-center mb-3 px-1">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</p>
          <p className="text-[9px] font-black text-slate-400 underline">{current} / {target}</p>
       </div>
       <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div 
             className={`h-full rounded-full transition-all duration-1000 ${
               percentage < 30 ? 'bg-red-500' : 
               percentage < 60 ? 'bg-orange-500' : 'bg-emerald-500'
             }`} 
             style={{ width: `${percentage}%` }} 
          />
       </div>
    </div>
  );
}

export default GovernanceHub;
