import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Play, 
  Pause,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { useAutoFixStore } from '../store/autoFixStore';
import { useAdminStore } from '../../../store/adminStore';
import { autoFixApi } from '../api/autoFixApi';
import { auditExercise } from '../services/aiAuditService';
import { applyAiFix } from '../services/aiFixService';

const AutoFixDashboard: React.FC = () => {
  const { 
    isAutoPilotOn, 
    setAutoPilot, 
    stats, 
    updateStats, 
    isAuditing, 
    setAuditing,
    auditProgress,
    setAuditProgress,
    addActivity
  } = useAutoFixStore();
  const { exercises, setExercises } = useAdminStore();

  const handleStartAudit = async () => {
    if (isAuditing) return;
    
    setAuditing(true);
    setAuditProgress(0);
    
    const unAudited = exercises.filter(ex => !ex.last_ai_audit);
    const total = unAudited.length;
    
    if (total === 0) {
      setAuditing(false);
      return;
    }

    addActivity({
      id: Date.now().toString(),
      type: 'AUDIT_STARTED',
      message: `Iniciando auditoria de ${total} exercícios.`,
      timestamp: new Date().toISOString()
    });

    let processed = 0;
    for (const ex of unAudited) {
      const result = await auditExercise(ex);
      if (result) {
        const updatedEx = {
          ...ex,
          last_ai_audit: new Date().toISOString(),
          ai_issues: result.issues,
          ai_suggestions: result.suggestions,
          ai_confidence: result.confidence,
          needs_human_review: result.confidence < 0.9,
        };

        // If autopilot is on and confidence is high, auto fix it
        if (isAutoPilotOn && result.confidence >= 0.92) {
          const fixedEx = applyAiFix(updatedEx, result.suggestions);
          await autoFixApi.updateExercise(fixedEx);
          addActivity({
            id: `fix-${ex.id}-${Date.now()}`,
            type: 'AUTO_FIXED',
            message: `IA corrigiu automaticamente: ${ex.name}`,
            exerciseName: ex.name,
            timestamp: new Date().toISOString()
          });
        } else {
          await autoFixApi.updateExercise(updatedEx);
        }
      }
      
      processed++;
      setAuditProgress(Math.round((processed / total) * 100));
      if (!isAuditing) break;
    }

    setAuditing(false);
    addActivity({
      id: Date.now().toString(),
      type: 'AUDIT_COMPLETED',
      message: `Auditoria completa. ${processed} itens processados.`,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-12">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <Zap className="text-blue-600 fill-blue-600" size={32} />
            AUTO FIX ENGINE
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            AI-POWERED SELF-HEALING LIBRARY OS
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 px-4">
            <div className={`w-3 h-3 rounded-full ${isAutoPilotOn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">Auto-Pilot</span>
            <button 
              onClick={() => setAutoPilot(!isAutoPilotOn)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isAutoPilotOn ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <motion.div 
                animate={{ x: isAutoPilotOn ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
          <button 
            onClick={handleStartAudit}
            disabled={isAuditing}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isAuditing ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-white hover:scale-105 active:scale-95 shadow-xl shadow-slate-200'}`}
          >
            {isAuditing ? <Pause size={16} /> : <Play size={16} />}
            {isAuditing ? 'Auditoria em curso...' : 'Iniciar Auditoria Global'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          label="Auditados Hoje" 
          value={stats.auditedToday} 
          subValue="+12% vs ontem" 
          icon={Search} 
          color="blue" 
        />
        <StatCard 
          label="Auto-Corrigidos" 
          value={stats.autoFixedCount} 
          subValue="98% Confiança" 
          icon={Sparkles} 
          color="amber" 
        />
        <StatCard 
          label="Em Revisão Humana" 
          value={stats.inReviewCount} 
          subValue="Prioridade Crítica" 
          icon={AlertTriangle} 
          color="red" 
        />
        <StatCard 
          label="Ganho de Qualidade" 
          value={`${stats.qualityGain}%`} 
          subValue="Média Global Up" 
          icon={TrendingUp} 
          color="emerald" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
           {/* Progress Panel */}
           {isAuditing && (
             <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                   <Brain size={120} className="animate-pulse" />
                </div>
                <div className="relative z-10 space-y-8">
                   <div>
                      <h3 className="text-2xl font-black mb-2">Processando Biblioteca...</h3>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">O Motor de Auditoria está analisando inconsistências e falhas técnicas.</p>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                         <span>Progresso da tarefa</span>
                         <span>{auditProgress}%</span>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${auditProgress}%` }}
                           className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-6 pt-4">
                      <ProgressStat label="Detectando falhas" count={auditProgress > 20 ? 14 : 0} />
                      <ProgressStat label="Corrigindo biomecânica" count={auditProgress > 50 ? 5 : 0} />
                      <ProgressStat label="Enviando para Review" count={auditProgress > 80 ? 2 : 0} />
                   </div>
                </div>
             </div>
           )}

           {/* Health Overview */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">Health Index Biblioteca</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight mt-1">Visão geral da integridade dos dados</p>
                 </div>
                 <div className="px-6 py-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                    <BarChart3 size={16} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-900 uppercase">Ver Relatório Full</span>
                 </div>
              </div>

              <div className="space-y-8">
                 <HealthBar label="Nomeclatura Padronizada" value={88} color="blue" />
                 <HealthBar label="Descrições Premium" value={64} color="amber" />
                 <HealthBar label="Biomecânica Mapeada" value={92} color="emerald" />
                 <HealthBar label="Mídia de Alta Qualidade" value={45} color="red" />
              </div>
           </div>
        </div>

        {/* Sidebar Activity */}
        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black text-slate-900">LOG ENGINE</h3>
                 <span className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                    <Clock size={16} />
                 </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
                 <ActivityItem 
                   title="Auditoria Global Finalizada"
                   time="2m atrás"
                   type="success"
                   desc="152 exercícios auditados com sucesso."
                 />
                 <ActivityItem 
                   title="Auto-Fix Aplicado"
                   time="5m atrás"
                   type="fix"
                   desc="Padronização de nome: Rosca Scott -> Rosca Scott com Barra W."
                 />
                 <ActivityItem 
                   title="Conflito Detectado"
                   time="12m atrás"
                   type="warning"
                   desc="Supino com Halteres e Supino com Dumbbell parecem duplicados."
                 />
                 <ActivityItem 
                   title="Health Check Semanal"
                   time="1h atrás"
                   type="info"
                   desc="Score médio da biblioteca subiu para 84."
                 />
              </div>

              <button className="w-full py-4 mt-6 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-200 hover:text-slate-600 transition-all">
                 Ver Logs Completos
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value, subValue, icon: Icon, color }: { label: string, value: string | number, subValue: string, icon: any, color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:translate-y-[-4px] transition-all group">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color] || 'bg-slate-50 text-slate-600'}`}>
          <Icon size={24} />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-3xl font-black text-slate-900 mb-2">{value}</h4>
       <div className="flex items-center gap-2">
          <TrendingUp size={12} className={color === 'red' ? 'rotate-180' : ''} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{subValue}</span>
       </div>
    </div>
  );
}

function ProgressStat({ label, count }: { label: string, count: number }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
       <div className="text-xl font-black mb-1">{count}</div>
       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function HealthBar({ label, value, color }: { label: string, value: number, color: string }) {
  const colors: any = {
    blue: 'bg-blue-600 shadow-blue-200',
    amber: 'bg-amber-500 shadow-amber-200',
    emerald: 'bg-emerald-500 shadow-emerald-200',
    red: 'bg-red-500 shadow-red-200',
  };

  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
          <span className="text-slate-900">{label}</span>
          <span className={value > 80 ? 'text-emerald-600' : value > 50 ? 'text-amber-600' : 'text-red-600'}>{value}%</span>
       </div>
       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${colors[color]}`}
          />
       </div>
    </div>
  );
}

function ActivityItem({ title, time, type, desc }: { title: string, time: string, type: 'success' | 'fix' | 'warning' | 'info', desc: string }) {
  const icons: any = {
    success: <CheckCircle2 size={14} className="text-emerald-600" />,
    fix: <Sparkles size={14} className="text-blue-600" />,
    warning: <AlertTriangle size={14} className="text-amber-600" />,
    info: <ShieldCheck size={14} className="text-slate-600" />,
  };

  return (
    <div className="flex gap-4">
       <div className="mt-1">{icons[type]}</div>
       <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h5>
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{time}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{desc}</p>
       </div>
    </div>
  );
}

export default AutoFixDashboard;
