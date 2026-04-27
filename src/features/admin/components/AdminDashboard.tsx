
import React from 'react';
import { 
  TrendingUp, 
  Dumbbell, 
  Zap, 
  AlertCircle, 
  Play, 
  ImageIcon, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const { stats, exercises, loading } = useAdminStore();

  const data = [
    { name: 'Seg', total: 400, premium: 240 },
    { name: 'Ter', total: 420, premium: 260 },
    { name: 'Qua', total: 450, premium: 280 },
    { name: 'Qui', total: 480, premium: 310 },
    { name: 'Sex', total: 512, premium: 340 },
    { name: 'Sáb', total: 540, premium: 380 },
    { name: 'Dom', total: 600, premium: 420 },
  ];

  const alerts = [
    { id: 1, type: 'error', msg: '14 exercícios sem descrição completa', icon: AlertCircle },
    { id: 2, type: 'warning', msg: '8 possíveis duplicados semânticos detectados', icon: Zap },
    { id: 3, type: 'info', msg: '23 exercícios com vídeo em baixa qualidade', icon: Play },
    { id: 4, type: 'success', msg: 'Meta semanal de cadastros atingida: 120%', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <section>
        <h2 className="text-3xl font-black tracking-tighter mb-2">Visão <span className="text-blue-600">Geral</span></h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Bem vindo ao centro de inteligência Rubi</p>
      </section>

      {/* KPI Cards */}
      <section className="flex gap-6 overflow-x-auto no-scrollbar pb-6 lg:grid lg:grid-cols-4 lg:overflow-visible">
        <KpiCard 
          label="Total Exercícios" 
          value={stats?.total || exercises.length} 
          trend="+12%" 
          icon={<Dumbbell className="text-slate-900" />} 
          color="bg-white"
        />
        <KpiCard 
          label="Base Premium" 
          value={`${Math.round((stats?.premium / stats?.total) * 100) || 0}%`} 
          trend="+5%" 
          icon={<ShieldCheck className="text-emerald-600" />} 
          color="bg-emerald-50/50 border-emerald-100"
        />
        <KpiCard 
          label="Pendentes Review" 
          value={stats?.improvable || 0} 
          trend="-2" 
          icon={<Clock className="text-amber-600" />} 
          color="bg-amber-50/50 border-amber-100"
        />
        <KpiCard 
          label="Score Médio" 
          value={stats?.avgScore?.toFixed(1) || 0} 
          trend="+1.2" 
          icon={<TrendingUp className="text-blue-600" />} 
          color="bg-blue-50/50 border-blue-100"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-xl tracking-tight">Evolução da Biblioteca</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Crescimento diário de conteúdo</p>
            </div>
            <div className="flex bg-white rounded-xl border border-slate-200 p-1">
              <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg bg-slate-900 text-white shadow-sm transition-all">Semana</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg text-slate-400 hover:bg-slate-50 transition-all">Mês</button>
            </div>
          </div>
          
          <div className="h-80 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#0f172a',
                    color: '#fff'
                  }} 
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="premium" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fill="transparent" 
                  strokeDasharray="8 8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Tasks */}
        <div className="space-y-8">
          <div>
            <h3 className="font-black text-xl tracking-tight">Alertas Inteligentes</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">IA Insights e Auditoria</p>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div 
                  key={alert.id} 
                  className={`p-5 rounded-3xl border flex items-start gap-4 transition-all hover:scale-[1.02] cursor-pointer ${
                    alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-900' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                    alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                    'bg-blue-50 border-blue-100 text-blue-900'
                  }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                    alert.type === 'error' ? 'bg-red-100' :
                    alert.type === 'warning' ? 'bg-amber-100' :
                    alert.type === 'success' ? 'bg-emerald-100' :
                    'bg-blue-100'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{alert.type}</p>
                    <p className="text-sm font-bold mt-1 leading-snug">{alert.msg}</p>
                  </div>
                </div>
              );
            })}

            <button className="w-full mt-4 flex items-center justify-center gap-2 py-5 rounded-full border border-slate-200 hover:bg-white transition-all text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 group">
              Ver Todos os Alertas
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ label, value, trend, icon, color }: { label: string, value: any, trend: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`min-w-[240px] p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 group ${color}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-4xl font-black tracking-tighter mt-1 text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
