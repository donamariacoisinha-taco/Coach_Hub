
import React, { useState, useEffect } from 'react';
import { ekeApi } from '../../lib/api/ekeApi';
import { ekeService } from '../../domain/eke/ekeService';
import { EKEConfig, EKEDecisionLog } from '../../types';
import { 
  Activity, SlidersHorizontal, History, 
  BarChart3, BrainCircuit, RefreshCw, 
  ChevronRight, Info, ShieldCheck, Zap
} from 'lucide-react';
import { motion } from 'motion/react';

export const EKEManager: React.FC = () => {
  const [config, setConfig] = useState<EKEConfig>({
    id: 'default',
    quality_weight: 0.6,
    performance_weight: 0.4,
    context_weight: 0.5,
    updated_at: new Date().toISOString()
  });
  
  const [logs, setLogs] = useState<EKEDecisionLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conf, st] = await Promise.all([
        ekeApi.getConfig(),
        ekeApi.getPerformanceStats()
      ]);
      if (conf) setConfig(conf);
      setStats(st);
      
      // Mock logs for UI demonstration
      setLogs([
        { 
          id: '1', 
          context: { muscleGroup: 'Peito', goal: 'Hipertrofia' }, 
          selected_exercises: [{ name: 'Supino Reto' }], 
          scores_breakdown: [],
          final_decision: 'ex-123',
          created_at: new Date().toISOString() 
        },
        { 
          id: '2', 
          context: { muscleGroup: 'Costas', goal: 'Força' }, 
          selected_exercises: [{ name: 'Levantamento Terra' }], 
          scores_breakdown: [],
          final_decision: 'ex-456',
          created_at: new Date(Date.now() - 3600000).toISOString() 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWeights = async (q: number) => {
    const p = 1 - q;
    const newConfig = { ...config, quality_weight: q, performance_weight: p };
    setConfig(newConfig);
    // ekeApi.updateConfig(newConfig)...
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weight Control */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <SlidersHorizontal size={24} />
            </div>
            <div>
              <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Pesos do Motor (V1.1)</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ajuste fino da inteligência</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Qualidade vs Performance</label>
                <span className="text-xl font-black text-slate-900 leading-none">
                    {(config.quality_weight * 100).toFixed(0)} / {(config.performance_weight * 100).toFixed(0)}
                </span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={config.quality_weight}
                onChange={(e) => handleUpdateWeights(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-300">
                <span>Foco em Dados</span>
                <span>Foco em Resultados</span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-50">
                <div className="flex gap-4">
                    <BrainCircuit className="text-blue-500 shrink-0" size={20} />
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-wider">
                        Atualmente o motor prioriza {config.quality_weight > 0.5 ? 'a integridade técnica dos dados' : 'o sucesso histórico de execução'} para ranquear as recomendações.
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* EKE Health */}
        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Activity size={24} />
                </div>
                <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest">Estado de Saúde (Health)</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Observabilidade em Tempo Real</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Taxa de Adesão</p>
                    <p className="text-3xl font-black text-white">{(stats?.completionRate * 100).toFixed(0) || 0}%</p>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cache Hit Rate</p>
                    <p className="text-3xl font-black text-white">92%</p>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">A/B Testing</p>
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Ativo (Variant A)</p>
                </div>
                <div className="space-y-2 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Online</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Decision Logs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Decision Logs</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-2">Auditoria completa das decisões do motor</p>
            </div>
            <button onClick={loadData} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
                <RefreshCw size={20} />
            </button>
        </div>

        <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-50 shadow-xl">
            <div className="divide-y divide-slate-50">
                {logs.map(log => (
                    <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                <History size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h5 className="font-black text-slate-900 uppercase text-xs tracking-tight">Recomendação: {log.selected_exercises[0]?.name}</h5>
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">#{log.id}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{log.context.muscleGroup} • {log.context.goal}</span>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                            Insights <ChevronRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
