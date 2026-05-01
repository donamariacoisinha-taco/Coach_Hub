import React from 'react';
import { motion } from 'motion/react';
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
  ArrowRight,
  Target,
  BarChart3,
  Search,
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const ExecutiveDashboard: React.FC = () => {
  const { stats, exercises } = useAdminStore();

  const chartData = [
    { name: 'Seg', total: 400, growth: 240 },
    { name: 'Ter', total: 420, growth: 260 },
    { name: 'Qua', total: 450, growth: 280 },
    { name: 'Qui', total: 480, growth: 310 },
    { name: 'Sex', total: 512, growth: 340 },
    { name: 'Sáb', total: 540, growth: 380 },
    { name: 'Dom', total: 600, growth: 420 },
  ];

  const distributionData = [
    { muscle: 'Peito', count: 45 },
    { muscle: 'Costas', count: 52 },
    { muscle: 'Pernas', count: 68 },
    { muscle: 'Ombros', count: 32 },
    { muscle: 'Bíceps', count: 18 },
    { muscle: 'Tríceps', count: 22 },
  ];

  return (
    <div className="space-y-16 pb-24">
      {/* KPI Section - Dynamic Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
         <KPICard 
            label="Total Exercises" 
            value={stats?.total || 0} 
            trend="+12%" 
            icon={<Dumbbell size={20} />} 
            color="indigo" 
         />
         <KPICard 
            label="Premium Asset %" 
            value={`${Math.round((stats?.premium / stats?.total) * 100) || 0}%`} 
            trend="+5.2%" 
            icon={<ShieldCheck size={20} />} 
            color="emerald" 
         />
         <KPICard 
            label="Avg Quality Score" 
            value={stats?.avgScore?.toFixed(1) || 0} 
            trend="+1.2" 
            icon={<Zap size={20} />} 
            color="blue" 
         />
         <KPICard 
            label="Pending Review" 
            value={stats?.improvable || 0} 
            trend="-4" 
            icon={<Clock size={20} />} 
            color="orange" 
         />
         <KPICard 
            label="App Reach (30d)" 
            value="12.4k" 
            trend="+18%" 
            icon={<BarChart3 size={20} />} 
            color="indigo" 
         />
      </section>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Core Charts Area */}
        <div className="lg:col-span-8 space-y-12">
           <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">Growth Intelligence</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Biblioteca vs Performance Mensal</p>
                 </div>
                 <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.25rem] border border-slate-100">
                    <button className="px-5 py-2 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-950/20 transition-all">Week</button>
                    <button className="px-5 py-2 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">Month</button>
                 </div>
              </div>

              <div className="h-96 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
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
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        dy={12}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        dx={-12}
                      />
                      <Tooltip 
                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        contentStyle={{ 
                          borderRadius: '24px', 
                          border: 'none', 
                          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                          backgroundColor: '#0f172a',
                          padding: '16px'
                        }} 
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        animationDuration={1500}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="growth" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        fill="transparent" 
                        strokeDasharray="10 10"
                        animationDuration={1500}
                      />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Secondary Distribution Chart */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                       <Target size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-tight">Distribution</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Muscular Coverage</p>
                    </div>
                 </div>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={distributionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                             dataKey="muscle" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                          />
                          <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={24}>
                             {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0f172a' : '#3b82f6'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-slate-950 rounded-[3rem] p-10 shadow-2xl shadow-slate-950/20 text-white flex flex-col justify-between">
                 <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 mb-6">
                       <Sparkles size={22} />
                    </div>
                    <h4 className="text-2xl font-black tracking-tight leading-tight uppercase italic italic">Smarter Governance with Rubi AI</h4>
                    <p className="text-blue-200/50 text-[11px] font-bold uppercase tracking-widest mt-4 leading-relaxed">
                       Our intelligence engine detected 14 high-impact exercises missing technical prompts. Fix it now.
                    </p>
                 </div>
                 <button className="w-full mt-10 h-14 rounded-full bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95">
                    Start AI Audit
                 </button>
              </div>
           </div>
        </div>

        {/* Sidebar Alerts Area */}
        <div className="lg:col-span-4 space-y-12">
           <div>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">Operational Alerts</h3>
                 <span className="text-[10px] font-black px-2 py-1 bg-red-50 text-red-600 rounded-lg">Critical</span>
              </div>
              <div className="space-y-5">
                 <AlertItem 
                    icon={<AlertCircle size={18} />} 
                    title="Empty Technical Descriptions"
                    count={23}
                    type="error"
                 />
                 <AlertItem 
                    icon={<Search size={18} />} 
                    title="Semantic Duplicates"
                    count={11}
                    type="warning"
                 />
                 <AlertItem 
                    icon={<BarChart3 size={18} />} 
                    title="Low Coverage: Legs"
                    count={6}
                    type="info"
                 />
                 <AlertItem 
                    icon={<Play size={18} />} 
                    title="Missing Video Refs"
                    count={42}
                    type="error"
                 />
                 
                 <button className="w-full group py-6 rounded-3xl border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-3">
                    <span className="text-[11px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">View All Insights</span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase mb-8">Trending Usage</h3>
              <div className="space-y-6">
                 <TrendingItem label="Supino Reto" usage="4.2k" trend="+12%" />
                 <TrendingItem label="Agachamento Livre" usage="3.8k" trend="+8%" />
                 <TrendingItem label="Levantamento Terra" usage="3.1k" trend="+24%" />
                 <TrendingItem label="Remada Barra" usage="2.9k" trend="-2%" />
                 <TrendingItem label="Desenvolvimento" usage="2.5k" trend="+15%" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

function KPICard({ label, value, trend, icon, color }: { label: string, value: any, trend: string, icon: React.ReactNode, color: string }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    orange: 'bg-orange-50 border-orange-100 text-orange-600',
  };

  const isUp = typeof trend === 'string' && trend.startsWith('+');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 group"
    >
       <div className="flex items-start justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-current/10 group-hover:scale-110 transition-transform ${colors[color as keyof typeof colors]}`}>
             {icon}
          </div>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend}
          </span>
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">{label}</p>
          <p className="text-4xl font-black tracking-tighter mt-1 text-slate-950 leading-none">{value}</p>
       </div>
    </motion.div>
  );
}

function AlertItem({ icon, title, count, type }: { icon: React.ReactNode, title: string, count: number, type: 'error' | 'warning' | 'info' }) {
  const styles = {
    error: 'bg-red-50 text-red-900 border-red-100',
    warning: 'bg-orange-50 text-orange-900 border-orange-100',
    info: 'bg-blue-50 text-blue-900 border-blue-100'
  };

  const iconColors = {
    error: 'bg-red-100 text-red-600',
    warning: 'bg-orange-100 text-orange-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer group ${styles[type]}`}>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12 ${iconColors[type]}`}>
          {icon}
       </div>
       <div className="flex-1">
          <p className="text-[11px] font-black uppercase tracking-tight leading-none group-hover:translate-x-1 transition-transform">{title}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-60">Impact: {count} Assets</p>
       </div>
       <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur flex items-center justify-center shadow-sm">
          <ChevronRight size={16} />
       </div>
    </div>
  );
}

function TrendingItem({ label, usage, trend }: { label: string, usage: string, trend: string }) {
  const isUp = typeof trend === 'string' && trend.startsWith('+');
  return (
    <div className="flex items-center justify-between group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition-all">
       <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-xs font-black uppercase tracking-tight text-slate-800">{label}</span>
       </div>
       <div className="flex items-center gap-6">
          <span className="text-[11px] font-black text-slate-900">{usage}</span>
          <span className={`text-[10px] font-black w-12 text-right ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</span>
       </div>
    </div>
  );
}

export default ExecutiveDashboard;
