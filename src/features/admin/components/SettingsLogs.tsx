import React, { useState } from 'react';
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
  ListTodo
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

  return (
    <div className="space-y-8 pb-32">
      {/* Settings Sub navigation menu */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('core')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'core'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={13} />
            Parâmetros do Sistema
          </div>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'analytics'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={13} />
            Analytics & Crescimento
          </div>
        </button>

        <button
          onClick={() => setActiveTab('autofix')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'autofix'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap size={13} />
            Auto-Fix Engine
          </div>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'review'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <ListTodo size={13} />
            Hub de Revisão
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'ai'
              ? 'bg-slate-950 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <BrainCircuit size={13} />
            Operador Rubi AI
          </div>
        </button>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
              {/* Settings Configuration Card */}
              <div className="lg:col-span-8 space-y-12">
                <section className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Settings size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Configurações Gerais</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Parâmetros Operacionais do Rubi OS</p>
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
                     <button className="px-8 h-12 bg-slate-950 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-950/10 hover:scale-101 hover:bg-slate-850 active:scale-98 transition-all">
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

              {/* Logs Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-950/10 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                        <FileText size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest italic">System Logs</h4>
                    </div>
                    <button className="text-[9px] font-black uppercase text-blue-400 hover:text-white transition-colors">Limpar</button>
                  </div>

                  <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                    <LogEntry time="2m atrás" user="Rubi AI" action="Auto-approved" target="Supino Reto" />
                    <LogEntry time="15m atrás" user="Admin" action="Updated Metadata" target="Leg Press" />
                    <LogEntry time="1h atrás" user="System" action="Batch Sync" target="142 Itens" />
                    <LogEntry time="4h atrás" user="Rubi AI" action="Semantic Audit" target="Completado" />
                    <LogEntry time="6h atrás" user="Admin" action="Bulk Import" target="Sincronizado" />
                    <LogEntry time="12h atrás" user="Segurança" action="Acesso Negado" target="Autenticação" error />
                    <LogEntry time="14h atrás" user="System" action="Backup Diário" target="Concluído" />
                  </div>
                  
                  <button className="mt-8 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/55 hover:text-white hover:bg-white/10 transition-all">
                     Exportar Registro de Auditoria
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsGrowth />}
          {activeTab === 'autofix' && (
            <div className="space-y-12">
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
                className={`h-11 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
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

function LogEntry({ time, user, action, target, error }: { time: string, user: string, action: string, target: string, error?: boolean }) {
  return (
    <div className="flex items-start gap-3 group text-left">
       <div className="pt-1 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : 'bg-blue-500'} opacity-50 group-hover:opacity-100 transition-all`} />
       </div>
       <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
             <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{user}</span>
             <span className="text-[8px] font-bold text-white/20 uppercase tracking-tight">{time}</span>
          </div>
          <p className="text-[10px] font-bold text-white uppercase tracking-tight">
             {action} <span className="text-white/40">→</span> <span className={`${error ? 'text-red-400' : 'text-slate-200'}`}>{target}</span>
          </p>
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
