import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Zap, 
  Activity,
  ArrowRight,
  MousePointer2,
  PieChart,
  LineChart,
  Search
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

const AnalyticsGrowth: React.FC = () => {
  const usageData = [
    { name: 'Jan', usage: 1200 },
    { name: 'Fev', usage: 1900 },
    { name: 'Mar', usage: 1600 },
    { name: 'Abr', usage: 2400 },
    { name: 'Mai', usage: 3100 },
    { name: 'Jun', usage: 2800 },
  ];

  const radarData = [
    { subject: 'Hypertrophy', A: 120, fullMark: 150 },
    { subject: 'Strength', A: 98, fullMark: 150 },
    { subject: 'Endurance', A: 86, fullMark: 150 },
    { subject: 'Mobility', A: 99, fullMark: 150 },
    { subject: 'Power', A: 85, fullMark: 150 },
  ];

  return (
    <div className="space-y-16 pb-24">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricMini label="App Active Users" value="8.4k" trend="+12.5%" />
          <MetricMini label="Avg Exercises / Session" value="6.4" trend="+2.1%" />
          <MetricMini label="Retention 30d" value="42.1%" trend="-1.2%" />
          <MetricMini label="Library Engagement" value="94.8%" trend="+5.0%" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Chart Card */}
          <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-200 p-12 shadow-sm">
             <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Growth Trend</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Movement Catalog Reach</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                   <LineChart size={20} />
                </div>
             </div>
             
             <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={usageData}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
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
                        contentStyle={{ 
                          borderRadius: '24px', 
                          border: 'none', 
                          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                          backgroundColor: '#0f172a',
                        }} 
                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#3b82f6" 
                        strokeWidth={6} 
                        fillOpacity={1} 
                        fill="url(#colorUsage)" 
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
             <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                      <Target size={22} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 italic">User Profile Depth</h4>
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Library goal alignment</p>
                   </div>
                </div>
                
                <div className="h-64 flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                         <PolarGrid stroke="#ffffff10" />
                         <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff50', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} />
                         <Radar 
                           name="Goals" 
                           dataKey="A" 
                           stroke="#3b82f6" 
                           fill="#3b82f6" 
                           fillOpacity={0.6} 
                         />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-8">Performance Churn Risk</h4>
                <div className="space-y-6">
                   <ChurnItem title="Calf Isolation" risk="72%" count="4 Assets" />
                   <ChurnItem title="Traps" risk="45%" count="2 Assets" />
                   <ChurnItem title="Lumbar Stability" risk="23%" count="6 Assets" />
                </div>
                <button className="w-full mt-10 p-5 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all">
                   View Risk Report
                </button>
             </div>
          </div>
       </div>

       {/* Detailed Table for Analytics? No, maybe later. Let's add Top Query block */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SectionCard 
            title="Top User Queries" 
            icon={<Search size={18} />} 
            items={[
               { label: "Chest Barbell", use: "1.2k" },
               { label: "Leg Press Max", use: "980" },
               { label: "Lat Pulldown Pro", use: "850" }
            ]}
          />
          <SectionCard 
            title="Ignored Assets" 
            icon={<Activity size={18} />} 
            items={[
               { label: "Wrist Curls", use: "4" },
               { label: "Finger Extensors", use: "2" },
               { label: "Ankle Circles", use: "0" }
            ]}
          />
          <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-xl shadow-blue-600/30">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                <Zap size={22} fill="white" />
             </div>
             <h4 className="text-xl font-black uppercase tracking-tight leading-tight italic">Content Gap Opportunity</h4>
             <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mt-4 leading-relaxed">
                Users are searching for "Kettlebell Flows". We only have 3 assets. Adding 10 more could increase engagement by 15.4%.
             </p>
             <button className="mt-8 px-8 h-12 rounded-full bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Create Missing Assets
             </button>
          </div>
       </div>
    </div>
  );
};

function MetricMini({ label, value, trend }: { label: string, value: string, trend: string }) {
  const isUp = trend.startsWith('+');
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
       <div className="flex justify-between items-start mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600">{label}</p>
          <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{trend}</span>
       </div>
       <p className="text-3xl font-black tracking-tighter text-slate-900">{value}</p>
    </div>
  );
}

function ChurnItem({ title, risk, count }: { title: string, risk: string, count: string }) {
  return (
    <div className="flex items-center justify-between group">
       <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{title}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{count}</p>
       </div>
       <span className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">{risk} Risk</span>
    </div>
  );
}

function SectionCard({ title, icon, items }: { title: string, icon: React.ReactNode, items: { label: string, use: string }[] }) {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
       <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
             {icon}
          </div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{title}</h4>
       </div>
       <div className="space-y-4">
          {items.map((item, i) => (
             <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-950">{item.label}</span>
                <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100">{item.use}</span>
             </div>
          ))}
       </div>
    </div>
  );
}

export default AnalyticsGrowth;
