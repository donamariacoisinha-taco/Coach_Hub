import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Shield, 
  Database, 
  FileText, 
  Archive, 
  RefreshCcw, 
  Download, 
  Upload, 
  Lock,
  Eye,
  Key,
  Globe,
  Tag,
  Scale,
  Zap,
  BarChart3,
  BrainCircuit,
  ListTodo,
  CheckCircle2
} from 'lucide-react';

// Import technical sub-components
import AnalyticsGrowth from './AnalyticsGrowth';
import AutoFixDashboard from './AutoFixDashboard';
import AutoFixQueue from './AutoFixQueue';
import ReviewCenter from './ReviewCenter';
import AIOperator from './AIOperator';

type ConfigSubTab = 'core' | 'analytics' | 'autofix' | 'review' | 'ai';

const SettingsLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigSubTab>('core');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('kyron_admin_operations_log_v2') || '[]');
      setAdminLogs(logs);
    } catch {
      setAdminLogs([]);
    }
  }, [activeTab]);

  return (
    <div className="space-y-8 pb-32">
      {/* Settings Navigation Menu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('core');
              setShowAdvancedTools(false);
            }}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'core' && !showAdvancedTools
                ? 'bg-slate-950 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={13} />
              Geral / Painel de Parâmetros
            </div>
          </button>

          <button
            onClick={() => {
              setShowAdvancedTools(!showAdvancedTools);
              if (!showAdvancedTools) {
                setActiveTab('analytics');
              } else {
                setActiveTab('core');
              }
            }}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
              showAdvancedTools
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <BrainCircuit size={13} />
              {showAdvancedTools ? 'Ocultar Diagnósticos' : 'Ver Ferramentas Avançadas'}
            </div>
          </button>
        </div>

        {/* Technical Navigation Submenu - Secondary Section */}
        {showAdvancedTools && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-950'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('autofix')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'autofix'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-950'
              }`}
            >
              Auto-Fix
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-950'
              }`}
            >
              Hub de Revisão
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-950'
              }`}
            >
              Rubi AI Operator
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'core' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left animate-fade-in">
              {/* Settings Configuration Card */}
              <div className="lg:col-span-8 space-y-12">
                <section className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Settings size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Configurações de Produção</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Parâmetros Ativos do Aplicativo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Shield size={13} className="text-blue-600" />
                        Diretrizes de Qualidade
                      </h4>
                      <SettingField label="Nota Mínima de Publicação" value="70%" />
                      <SettingField label="Frequência Audit Auto" value="A cada 12h" />
                      <SettingField label="Dificuldade Padrão" value="Intermediário" />
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Scale size={13} className="text-blue-600" />
                        Pesos Rubi Curation
                      </h4>
                      <SettingField label="Fator Biomecânico" value="45%" />
                      <SettingField label="Volume Muscular" value="35%" />
                      <SettingField label="Progressão Consecutiva" value="20%" />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                     <button className="px-8 h-12 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-950/10 hover:scale-101 hover:bg-slate-850 active:scale-98 transition-all cursor-pointer">
                        Salvar Configurações
                     </button>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ActionCard 
                    title="Importação / Exportação CSV" 
                    icon={<Database size={18} />} 
                    desc="Importe planilhas de exercícios do Airtable ou extraia backup JSON."
                    actions={[
                      { label: "Importar CSV", variant: "default", icon: <Upload size={13} /> },
                      { label: "Exportar JSON", variant: "outline", icon: <Download size={13} /> }
                    ]}
                  />
                  <ActionCard 
                    title="Manutenção de Mídias" 
                    icon={<Archive size={18} />} 
                    desc="Efetue varreduras por links de vídeo quebrados e regenere imagens."
                    actions={[
                      { label: "Escanear Links", variant: "default", icon: <RefreshCcw size={13} /> },
                      { label: "Otimizar Gifs", variant: "outline", icon: <Zap size={13} /> }
                    ]}
                  />
                </section>
              </div>

              {/* Core Activity Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl shadow-slate-950/10 flex flex-col justify-between min-h-[500px]">
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#7BA7FF]">
                        <FileText size={15} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest italic">Core Status & Activity</h4>
                    </div>

                    <div className="space-y-6">
                      {[
                        { label: 'Status do Sistema', value: 'Operacional', sub: 'Todos os módulos de aluno e admin ativos', badge: 'Saudável', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                        { label: 'Status da Base de Dados', value: 'Conectado em tempo real', sub: '/production postgres pool ativo', badge: 'Produção', badgeColor: 'bg-blue-500/20 text-[#7BA7FF] border-[#7BA7FF]/30' },
                        { label: 'Último Backup', value: 'Hoje às 03:00', sub: 'Redundância física local concluída' },
                        { label: 'Versão da Plataforma', value: 'KYRON OS v3.0 stable', sub: 'Último build de produção implantado' },
                        { label: 'Atividade do Núcleo', value: '1,248 atletas ativos', sub: 'Sincronizados nas últimas 24 horas' }
                      ].map((activity, i) => (
                        <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#7BA7FF]/80 mb-1">{activity.label}</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">{activity.value}</span>
                            {activity.badge && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${activity.badgeColor}`}>
                                {activity.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-normal font-normal">{activity.sub}</p>
                        </div>
                      ))}
                    </div>

                    {adminLogs.length > 0 && (
                      <div className="pt-6 border-t border-white/10 mt-6 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.125em] text-blue-400 flex items-center gap-1.5 leading-none">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                          Operações Administrativas
                        </p>
                        <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-2 no-scrollbar">
                          {adminLogs.map((log: any, i: number) => (
                            <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0 text-left">
                              <p className="text-[9px] font-black uppercase tracking-widest flex items-center justify-between">
                                <span className={
                                  log.action === 'Suspensão' ? 'text-amber-400' :
                                  log.action === 'Reativação' ? 'text-emerald-400' : 'text-rose-450'
                                }>{log.action}</span>
                                <span className="font-mono text-[8px] text-slate-500">{log.date} {log.time}</span>
                              </p>
                              <p className="text-[11px] font-bold text-white tracking-tight mt-1 truncate">{log.athlete}</p>
                              <p className="text-[8px] font-bold text-slate-500 mt-0.5">Por: {log.admin}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 mt-8">
                    <p className="text-[8px] font-mono text-slate-500 text-center uppercase tracking-widest">
                      KYRON OS V3.0 // SECURITY & METRICS COMPLIANT
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsGrowth />}
          {activeTab === 'autofix' && (
            <div className="space-y-12 animate-fade-in">
               <AutoFixDashboard />
               <AutoFixQueue />
            </div>
          )}
          {activeTab === 'review' && <ReviewCenter />}
          {activeTab === 'ai' && <AIOperator />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function SettingField({ label, value }: { label: string, value: string }) {
  return (
    <div className="group cursor-pointer">
       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-blue-600 transition-colors">{label}</p>
       <div className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs text-slate-800 group-hover:bg-white group-hover:border-blue-200 transition-all flex justify-between items-center">
          {value}
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-slate-100">
             <ChevronRight size={10} />
          </div>
       </div>
    </div>
  );
}

function ActionCard({ title, icon, desc, actions }: { title: string, icon: React.ReactNode, desc: string, actions: { label: string, variant: string, icon?: React.ReactNode }[] }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[250px] text-left">
       <div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
             {icon}
          </div>
          <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-2">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-4">{desc}</p>
       </div>
       
       <div className="grid grid-cols-2 gap-3">
          {actions.map((act, i) => (
             <button 
                key={i}
                className={`h-11 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border-none ${
                   act.variant === 'default' 
                     ? 'bg-slate-950 text-white hover:bg-slate-850' 
                     : 'bg-white border border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
             >
                {act.icon}
                {act.label}
             </button>
          ))}
       </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
       width={size} 
       height={size} 
       viewBox="0 0 24 24" 
       fill="none" 
       stroke="currentColor" 
       strokeWidth="3" 
       strokeLinecap="round" 
       strokeLinejoin="round" 
       className={className}
    >
       <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

export default SettingsLogs;
