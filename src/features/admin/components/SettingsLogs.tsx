import React from 'react';
import { motion } from 'motion/react';
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
  Zap
} from 'lucide-react';

const SettingsLogs: React.FC = () => {
  return (
    <div className="space-y-16 pb-24">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Settings Panel */}
          <div className="lg:col-span-8 space-y-12">
             <section className="bg-white rounded-[3.5rem] border border-slate-200 p-12 shadow-sm">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center">
                      <Settings size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Core Configuration</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rubi OS System Parameters</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                         <Shield size={14} className="text-blue-600" />
                         Governance Rules
                      </h4>
                      <SettingField label="Minimum Publication Score" value="70%" />
                      <SettingField label="Auto-Audit Frequency" value="Every 12h" />
                      <SettingField label="Default Difficulty" value="Intermediate" />
                   </div>
                   
                   <div className="space-y-8">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                         <Scale size={14} className="text-blue-600" />
                         EKE Multipliers
                      </h4>
                      <SettingField label="Quality Weight" value="45%" />
                      <SettingField label="Performance Weight" value="35%" />
                      <SettingField label="Context Hybrid" value="20%" />
                   </div>
                </div>

                <div className="mt-12 pt-12 border-t border-slate-50 flex justify-end">
                   <button className="px-10 h-14 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all">
                      Save configuration
                   </button>
                </div>
             </section>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ActionCard 
                   title="Bulk Import / Export" 
                   icon={<Database size={20} />} 
                   desc="Import CSV from Airtable or export full JSON library backup."
                   actions={[
                      { label: "Import CSV", variant: "default", icon: <Upload size={14} /> },
                      { label: "Export JSON", variant: "outline", icon: <Download size={14} /> }
                   ]}
                />
                <ActionCard 
                   title="Media Maintenance" 
                   icon={<Archive size={20} />} 
                   desc="Clear broken video refs, optimize thumbnails and sync storage."
                   actions={[
                      { label: "Scan Broken", variant: "default", icon: <RefreshCcw size={14} /> },
                      { label: "Optimize all", variant: "outline", icon: <Zap size={14} /> }
                   ]}
                />
             </section>
          </div>

          {/* Audit Logs Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-12">
             <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-950/20 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                         <FileText size={18} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest italic">System Logs</h4>
                   </div>
                   <button className="text-[10px] font-black uppercase text-blue-400 hover:text-white transition-colors">Clear</button>
                </div>

                <div className="space-y-6 overflow-y-auto no-scrollbar pr-2 flex-1">
                   <LogEntry time="2m ago" user="Rubi AI" action="Auto-approved" target="Bench Press" />
                   <LogEntry time="15m ago" user="Admin" action="Updated Metadata" target="Leg Press" />
                   <LogEntry time="1h ago" user="System" action="Batch Sync" target="142 Items" />
                   <LogEntry time="4h ago" user="Rubi AI" action="Semantic Audit" target="Complete" />
                   <LogEntry time="6h ago" user="Admin" action="Bulk Import" target="New Items" />
                   <LogEntry time="12h ago" user="Security" action="Access Denied" target="Unauthorized" error />
                   <LogEntry time="14h ago" user="System" action="Daily Backup" target="Successful" />
                   <LogEntry time="1d ago" user="Rubi AI" action="Gap Detected" target="Hamstrings" />
                   <LogEntry time="1d ago" user="Admin" action="Deleted Item" target="Old Bench" error />
                </div>
                
                <button className="mt-10 w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">
                   Download Audit Trail
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

function SettingField({ label, value }: { label: string, value: string }) {
  return (
    <div className="group cursor-pointer">
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 group-hover:text-blue-600 transition-colors">{label}</p>
       <div className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-sm text-slate-900 group-hover:bg-white group-hover:border-blue-200 group-hover:shadow-lg group-hover:shadow-blue-200/20 transition-all flex justify-between items-center">
          {value}
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-slate-100">
             <ChevronRight size={12} />
          </div>
       </div>
    </div>
  );
}

function ActionCard({ title, icon, desc, actions }: { title: string, icon: React.ReactNode, desc: string, actions: { label: string, variant: string, icon?: React.ReactNode }[] }) {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between">
       <div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-8 border border-slate-100">
             {icon}
          </div>
          <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-3">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">{desc}</p>
       </div>
       
       <div className="grid grid-cols-2 gap-3">
          {actions.map((act, i) => (
             <button 
                key={i}
                className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  act.variant === 'default' 
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800' 
                    : 'bg-white border border-slate-200 text-slate-900 hover:border-slate-400'
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
    <div className="flex items-start gap-4 group">
       <div className="pt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'} opacity-50 group-hover:opacity-100 transition-all`} />
       </div>
       <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{user}</span>
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-tight">{time}</span>
          </div>
          <p className="text-[11px] font-bold text-white uppercase tracking-tight">
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
