import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  ShieldCheck, 
  Zap, 
  BrainCircuit,
  BarChart3,
  Users,
  Activity,
  Target,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import RankingTable from './RankingTable';
import TopMovers from './TopMovers';

const PerformanceDashboard: React.FC = () => {
  const { exercises } = useAdminStore();

  const stats = {
    avgScore: Math.round(exercises.reduce((acc, ex) => acc + (ex.quality_score_v3 || 0), 0) / exercises.length) || 0,
    totalUsage: exercises.reduce((acc, ex) => acc + (ex.usage_count || 0), 0),
    topMoversCount: exercises.filter(ex => ex.ranking_status === 'rising').length,
    criticalCount: exercises.filter(ex => (ex.quality_score_v3 || 0) < 40).length
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
          <BrainCircuit className="text-indigo-600" size={36} />
          PERFORMANCE BRAIN
        </h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
          REAL-TIME ADAPTIVE LIBRARY INTELLIGENCE
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard 
          label="Quality Score Global" 
          value={stats.avgScore} 
          icon={Target} 
          color="indigo" 
          trend="+4.2%" 
        />
        <KPICard 
          label="Interações Reais" 
          value={stats.totalUsage.toLocaleString()} 
          icon={Users} 
          color="blue" 
          trend="+12k este mês" 
        />
        <KPICard 
          label="Rising Stars" 
          value={stats.topMoversCount} 
          icon={Sparkles} 
          color="amber" 
          trend="Novos Talentos" 
        />
        <KPICard 
          label="Taxa de Progressão" 
          value="68%" 
          icon={Activity} 
          color="emerald" 
          trend="Carga Média Up" 
        />
      </div>

      <div className="grid grid-cols-3 gap-8">
         {/* Main Chart Section */}
         <div className="col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">Evolução do Ranking</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tight mt-1">Distribuição de Status de Performance</p>
               </div>
               <div className="flex items-center gap-4">
                  <StatusBadge status="elite" count={exercises.filter(e => e.ranking_status === 'elite').length} />
                  <StatusBadge status="rising" count={exercises.filter(e => e.ranking_status === 'rising').length} />
                  <StatusBadge status="decline" count={exercises.filter(e => e.ranking_status === 'decline').length} />
               </div>
            </div>

            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '15px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            
            <RankingTable />
         </div>

         {/* Sidebar: Top Movers */}
         <div className="space-y-8">
            <TopMovers />
            
            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap size={100} className="fill-white" />
               </div>
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Auto-Decision</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed">
                     A IA sugere arquivar 8 exercícios com "Forgotton status" e baixa aderência histórica.
                  </p>
                  <button className="w-full mt-6 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                     Revisar Sugestões
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const chartData = [
  { name: 'Semana 1', score: 45 },
  { name: 'Semana 2', score: 52 },
  { name: 'Semana 3', score: 48 },
  { name: 'Semana 4', score: 61 },
  { name: 'Semana 5', score: 75 },
  { name: 'Semana 6', score: 82 },
];

function KPICard({ label, value, icon: Icon, color, trend }: { label: string, value: string | number, icon: any, color: string, trend: string }) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
          <Icon size={24} />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-3xl font-black text-slate-900 mb-2">{value}</h4>
       <div className="flex items-center gap-2">
          <ArrowUpRight size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{trend}</span>
       </div>
    </div>
  );
}

function StatusBadge({ status, count }: { status: string, count: number }) {
  const configs: any = {
    elite: { label: 'Elite', color: 'bg-indigo-500' },
    rising: { label: 'Rising', color: 'bg-amber-500' },
    decline: { label: 'Decline', color: 'bg-red-500' },
  };

  const config = configs[status];

  return (
    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
       <div className={`w-2 h-2 rounded-full ${config.color}`} />
       <span className="text-[10px] font-black text-slate-900 uppercase">{config.label}</span>
       <span className="text-[10px] font-bold text-slate-400">{count}</span>
    </div>
  );
}

export default PerformanceDashboard;
