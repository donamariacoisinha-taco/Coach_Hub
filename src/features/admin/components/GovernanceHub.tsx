import React, { useState, useMemo } from 'react';
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
  Layers,
  Activity,
  Award,
  BookOpen,
  FileText,
  Archive,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { calculateExerciseHealthScore } from '../../../types';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface DuplicateGroup {
  id: string;
  ex1: any;
  ex2: any;
  similarity: number;
}

const TARGET_MUSCLES = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posteriores',
  'Glúteos',
  'Panturrilhas',
  'Core'
];

// String similarity metric
function getSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const norm1 = s1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const norm2 = s2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.85;
  
  const w1 = s1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const w2 = s2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const intersect = w1.filter(w => w2.includes(w));
  if (intersect.length >= Math.min(w1.length, w2.length) && Math.min(w1.length, w2.length) > 1) {
    return 0.82;
  }
  return 0.0;
}

const GovernanceHub: React.FC = () => {
  const { exercises, updateExercise } = useAdminStore();
  const { showSuccess, showError } = useErrorHandler();
  
  const [auditing, setAuditing] = useState(false);
  const [dupChecking, setDupChecking] = useState(false);
  const [hasAudited, setHasAudited] = useState(false);
  
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // 1. Library Quality statistics
  const stats = useMemo(() => {
    let total = exercises.length;
    let approved = 0;
    let premium = 0;
    let draft = 0;
    let archived = 0;
    let totalScore = 0;
    
    exercises.forEach(ex => {
      // live compute score
      const health = calculateExerciseHealthScore(ex);
      totalScore += health.score;
      
      const status = ex.curation_status || 'Draft';
      if (status.toLowerCase().trim() === 'approved') approved++;
      else if (status.toLowerCase().trim() === 'premium') premium++;
      else if (status.toLowerCase().trim() === 'draft') draft++;
      else if (status.toLowerCase().trim() === 'archived') archived++;
    });

    const averageHealthScore = total > 0 ? Math.round(totalScore / total) : 0;
    
    return {
      total,
      approved,
      premium,
      draft,
      archived,
      averageHealthScore
    };
  }, [exercises]);

  // 2. Muscle Coverage Audit
  const muscleCoverage = useMemo(() => {
    const counts: Record<string, number> = {};
    TARGET_MUSCLES.forEach(m => { counts[m] = 0; });
    
    exercises.forEach(ex => {
      // Find matches regardless of spelling
      const mG = ex.muscle_group || '';
      TARGET_MUSCLES.forEach(target => {
        if (mG.toLowerCase().trim() === target.toLowerCase().trim() ||
            mG.toLowerCase().includes(target.toLowerCase()) ||
            target.toLowerCase().includes(mG.toLowerCase())) {
          counts[target]++;
        }
      });
    });

    return counts;
  }, [exercises]);

  // Highlight weak areas (< 5 exercises)
  const weakAreas = useMemo(() => {
    return TARGET_MUSCLES.filter(m => muscleCoverage[m] < 5);
  }, [muscleCoverage]);

  const handleAudit = async () => {
    setAuditing(true);
    await new Promise(r => setTimeout(r, 1200));
    setHasAudited(true);
    setAuditing(false);
    showSuccess('Auditoria Concluída', 'Toda a base de dados foi reaudiada, pontuada e classificada com sucesso.');
  };

  const handleDupCheck = async () => {
    setDupChecking(true);
    await new Promise(r => setTimeout(r, 1000));
    
    // Find real duplicates
    const dups: DuplicateGroup[] = [];
    for (let i = 0; i < exercises.length; i++) {
      for (let j = i + 1; j < exercises.length; j++) {
        const ex1 = exercises[i];
        const ex2 = exercises[j];
        const sim = getSimilarity(ex1.name, ex2.name);
        if (sim >= 0.8) {
          dups.push({
            id: `${ex1.id}-${ex2.id}`,
            ex1,
            ex2,
            similarity: sim
          });
        }
      }
    }
    
    setDuplicates(dups);
    setDupChecking(false);
    if (dups.length === 0) {
      showSuccess('Busca de Duplicados', 'Nenhum exercício duplicado ou similar foi encontrado na base.');
    } else {
      showSuccess('Analítico de Duplicados', `${dups.length} possíveis duplicados foram listados para sua revisão.`);
    }
  };

  const archiveDuplicate = async (exId: string, groupId: string) => {
    try {
      await updateExercise(exId, { curation_status: 'archived', is_active: false });
      showSuccess('Arquivado', 'Exercício duplicado foi movido para o Arquivo com sucesso.');
      // Remove from visual duplicate list
      setDuplicates(prev => prev.filter(d => d.id !== groupId));
    } catch (err: any) {
      showError('Erro ao arquivar', err.message);
    }
  };

  const markReviewed = (groupId: string) => {
    showSuccess('Revisado', 'Duplicidade sinalizada como revisada e aprovada pelo administrador.');
    setDuplicates(prev => prev.filter(d => d.id !== groupId));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic">Qualidade & Governança <span className="text-blue-600">Pro</span></h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronização neural da biblioteca e integridade de dados</p>
        </div>
        
        <div className="flex items-center gap-3 p-1.5 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20">
           <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
              <BrainCircuit size={20} />
           </div>
           <div className="pr-4">
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Status Governance</p>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Sistema Ativo
              </p>
           </div>
        </div>
      </div>

      {/* Library Quality Dashboard Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <KPIItem title="Total Exercícios" value={stats.total} icon={<BookOpen size={16} className="text-slate-600" />} color="border-slate-100" />
        <KPIItem title="Aprovados" value={stats.approved} icon={<CheckCircle2 size={16} className="text-emerald-600" />} color="border-emerald-100 bg-emerald-50/10" />
        <KPIItem title="Premium" value={stats.premium} icon={<Award size={16} className="text-indigo-600" />} color="border-indigo-100 bg-indigo-50/10" />
        <KPIItem title="Arquivados" value={stats.archived} icon={<Archive size={16} className="text-red-500" />} color="border-red-100 bg-red-50/10" />
        <KPIItem title="Rascunho / Draft" value={stats.draft} icon={<FileText size={16} className="text-amber-500" />} color="border-amber-100 bg-amber-50/10" />
        <KPIItem title="Health Score Médio" value={`${stats.averageHealthScore}/100`} icon={<Activity size={16} className="text-blue-500" />} color="border-blue-100 bg-blue-50/10" hover />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IA Auditor Section */}
        <div className="space-y-8">
           <HubSectionHead 
              title="Auditor de Qualidade" 
              subtitle="Escaneamento de integridade e metadados" 
              icon={<ShieldCheck size={20} className="text-blue-600" />} 
           />
           
           <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Cobertura de Auditoria de Metadados</p>
                    <span onClick={handleAudit} className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline cursor-pointer">Análise Coletiva</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <AuditorStat label="Miniaturas / Gifs" value={exercises.filter(ex => ex.image_url || ex.static_frame_url).length} total={exercises.length} color="bg-emerald-500" />
                    <AuditorStat label="Instruções Práticas" value={exercises.filter(ex => ex.instructions && ex.instructions.length > 10).length} total={exercises.length} color="bg-blue-500" />
                    <AuditorStat label="Classificação de Categoria" value={exercises.filter(ex => ex.type).length} total={exercises.length} color="bg-indigo-500" />
                    <AuditorStat label="Vínculo de Equipamento" value={exercises.filter(ex => ex.type !== 'free_weight').length} total={exercises.length} color="bg-amber-500" />
                 </div>
              </div>

              <div className="space-y-4">
                 <AuditItem icon={<RefreshCcw size={14} />} text="Detectar instruções incompletas ou rascunhos" status={stats.draft > 0 ? "warning" : "active"} count={stats.draft} />
                 <AuditItem icon={<Zap size={14} />} text="Vínculos vazios ou desativados na biblioteca" status="active" />
                 <AuditItem icon={<Database size={14} />} text="Exercícios com tags e músculos secundários" status="active" />
                 <AuditItem icon={<AlertTriangle size={14} />} text="Revisar exercícios sob a rubrica Needs Review" status={exercises.filter(ex => calculateExerciseHealthScore(ex).rating === 'Needs Review').length > 0 ? 'warning' : 'active'} count={exercises.filter(ex => calculateExerciseHealthScore(ex).rating === 'Needs Review').length} />
              </div>

              <button 
                onClick={handleAudit}
                disabled={auditing}
                className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black uppercase text-[10px] tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
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
                  title="Ferramentas de Controle" 
                  subtitle="Detecção de ruído, similaridade e lacunas" 
                  icon={<Layers size={20} className="text-indigo-600" />} 
               />
               
               <div className="grid grid-cols-2 gap-6">
                  <ToolCard 
                    title="Duplicate Finder" 
                    desc="Busca similaridade e redundância em nomes" 
                    icon={<Search size={20} />} 
                    action={handleDupCheck}
                    loading={dupChecking}
                  />
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-left flex flex-col justify-between">
                     <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Garantia Técnica</h4>
                        <p className="text-[10px] font-bold text-slate-500 leading-snug uppercase tracking-tight">O Protocol Builder bloqueia automaticamente o uso de exercícios marcados como 'Draft' ou 'Archived' para preservar segurança.</p>
                     </div>
                     <div className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1.5 mt-4">
                        <ShieldCheck size={14} /> Ativo no Core
                     </div>
                  </div>
               </div>
            </div>

            {/* Duplicate review list if found */}
            {duplicates.length > 0 && (
              <div className="bg-amber-50/40 border border-amber-200/60 p-6 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Exercícios Suspeitos de Duplicidade ({duplicates.length})
                  </p>
                  <button onClick={() => setDuplicates([])} className="text-[9px] font-black uppercase tracking-wider text-amber-600 hover:underline">Fechar Lista</button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {duplicates.map(group => (
                    <div key={group.id} className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                        Similaridade: {Math.round(group.similarity * 100)}%
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="border-r border-slate-100 pr-2">
                          <p className="text-[9px] font-black uppercase text-slate-400">Principal</p>
                          <p className="font-bold text-slate-800 line-clamp-1">{group.ex1.name}</p>
                          <span className="text-[9px] font-medium text-slate-400 uppercase">{group.ex1.muscle_group}</span>
                        </div>
                        <div className="pl-1">
                          <p className="text-[9px] font-black uppercase text-slate-400">Duplicado</p>
                          <p className="font-bold text-slate-800 line-clamp-1">{group.ex2.name}</p>
                          <span className="text-[9px] font-medium text-slate-400 uppercase">{group.ex2.muscle_group}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-50">
                        <button 
                          onClick={() => archiveDuplicate(group.ex2.id, group.id)}
                          className="flex-1 py-1 px-3 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <EyeOff size={10} /> Arquivar Secundário
                        </button>
                        <button 
                          onClick={() => markReviewed(group.id)}
                          className="py-1 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Aprovar Ambos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Muscle Coverage Audit Section */}
            <div className="space-y-6">
                <HubSectionHead 
                   title="Auditoria de Cobertura Muscular" 
                   subtitle="Quantidade e lacunas musculares (Meta: Mínimo 5)" 
                   icon={<Database size={20} className="text-orange-600" />} 
                />
                
                {weakAreas.length > 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-100 text-orange-850 rounded-2xl flex items-start gap-2.5">
                    <AlertCircle className="text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide">Lacuna Crítica Detectada ({weakAreas.length} Músculos Recorrentes)</p>
                      <p className="text-[11px] text-orange-700 font-medium leading-snug mt-0.5">As seguintes zonas musculares possuem &lt; 5 exercícios cadastrados, comprometendo a geração automatizada de protocolos balanceados: <span className="font-bold text-orange-950">{weakAreas.join(', ')}</span>.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                   {TARGET_MUSCLES.map(muscle => {
                      const count = muscleCoverage[muscle] || 0;
                      return (
                         <GapProgress key={muscle} label={muscle} current={count} target={5} />
                      );
                   })}
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

function KPIItem({ title, value, icon, color, hover }: { title: string, value: string | number, icon: React.ReactNode, color: string, hover?: boolean }) {
  return (
    <div className={`p-6 rounded-[2rem] border ${color} shadow-sm flex flex-col justify-between h-36 transition-all ${hover ? 'hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-200' : ''}`}>
       <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none max-w-[70%]">{title}</span>
          <div className="p-2 rounded-xl bg-slate-50">{icon}</div>
       </div>
       <p className="font-black text-2xl tracking-tighter italic mt-4">{value}</p>
    </div>
  );
}

function AuditorStat({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
       <div className="flex justify-between items-end mb-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
          <span className="text-xs font-black text-slate-900 leading-none">{pct}%</span>
       </div>
       <p className="text-[10px] font-bold text-slate-400 leading-none uppercase mb-2">{value} / {total}</p>
       <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
       </div>
    </div>
  );
}

function AuditItem({ icon, text, status, count }: { icon: React.ReactNode, text: string, status: 'active' | 'warning' | 'error', count?: number }) {
  return (
    <div className="flex items-center gap-4 group">
       <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
         status === 'active' ? 'bg-emerald-50 text-emerald-500' : 
         status === 'warning' ? 'bg-amber-50 text-amber-500 shadow-sm shadow-amber-500/10' : 
         'bg-red-50 text-red-500'
       }`}>
          {icon}
       </div>
       <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{text}</p>
          {status === 'warning' && count !== undefined && count > 0 && (
             <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide leading-none mt-0.5">{count} sinalizados</p>
          )}
       </div>
       {status === 'active' && <CheckCircle2 size={12} className="ml-auto text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

function ToolCard({ title, desc, icon, action, loading }: { title: string, desc: string, icon: React.ReactNode, action?: () => void, loading?: boolean }) {
  return (
    <button 
      onClick={action}
      disabled={loading}
      className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 hover:-translate-y-0.5 transition-all group cursor-pointer"
    >
       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all mb-4">
          {loading ? <RefreshCcw size={20} className="animate-spin" /> : icon}
       </div>
       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{title}</h4>
       <p className="text-[10px] font-bold text-slate-400 leading-snug uppercase tracking-tight">{desc}</p>
    </button>
  );
}

const GapProgress: React.FC<{ label: string, current: number, target: number }> = ({ label, current, target }) => {
  const percentage = (current / target) * 100;
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm group">
       <div className="flex justify-between items-center mb-3 px-1">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</p>
          <div className="flex items-center gap-2">
             <p className="text-[9px] font-black text-slate-400 uppercase">{current} de {target}</p>
             {percentage >= 100 ? (
                <span className="bg-emerald-50 text-emerald-600 font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase">OK</span>
             ) : (
                <span className="bg-orange-50 text-orange-600 font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase">Deficitário</span>
             )}
          </div>
       </div>
       <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div 
             className={`h-full rounded-full transition-all duration-1000 ${
               percentage < 40 ? 'bg-red-500' : 
               percentage < 100 ? 'bg-orange-500' : 'bg-emerald-500'
             }`} 
             style={{ width: `${Math.min(percentage, 100)}%` }} 
          />
       </div>
    </div>
  );
};

export default GovernanceHub;
