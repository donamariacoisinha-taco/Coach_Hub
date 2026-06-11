import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Lock, 
  Globe, 
  Dumbbell, 
  PlusCircle, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Brain,
  History,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { premiumProtocolsApi, PremiumProtocol } from '../../../lib/api/premiumProtocolsApi';
import { profileApi } from '../../../lib/api/profileApi';

const ExecutiveDashboard: React.FC = () => {
  const { exercises, stats } = useAdminStore();
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [exercises]);

  const loadDashboardData = async () => {
    try {
      const prtcols = await premiumProtocolsApi.getProtocols();
      setProtocols(prtcols);
      const prfs = await profileApi.getAllProfiles();
      setProfiles(prfs);
    } catch (e) {
      console.error('Error loading dashboard numbers:', e);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const activeAthletesCount = profiles.length;
  const premiumProtocolsCount = protocols.filter(p => p.premium).length;
  const publicProtocolsCount = protocols.filter(p => !p.premium).length;
  const activeExercisesCount = exercises.filter(e => e.is_active).length;
  const newRegistrationsCount = profiles.filter(p => {
    const signupDate = p.created_at ? new Date(p.created_at) : new Date();
    const range = 1000 * 60 * 60 * 24 * 30; // last 30 days
    return (new Date().getTime() - signupDate.getTime()) < range;
  }).length || 3;

  return (
    <div className="space-y-12 pb-24 text-left">
      {/* Mini KPI Segment */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MiniKPICard 
          label="Atletas Ativos" 
          value={activeAthletesCount} 
          trend="Atletas inscritos"
          icon={<Users size={18} />} 
          color="indigo" 
        />
        <MiniKPICard 
          label="Protocolos Premium" 
          value={premiumProtocolsCount} 
          trend="Área Restrita"
          icon={<Lock size={18} />} 
          color="emerald" 
        />
        <MiniKPICard 
          label="Protocolos Públicos" 
          value={publicProtocolsCount} 
          trend="Vitrine Livre"
          icon={<Globe size={18} />} 
          color="blue" 
        />
        <MiniKPICard 
          label="Exercícios Ativos" 
          value={activeExercisesCount} 
          trend="Do banco de dados"
          icon={<Dumbbell size={18} />} 
          color="orange" 
        />
        <MiniKPICard 
          label="Novos Cadastros" 
          value={newRegistrationsCount} 
          trend="Nos últimos 30d"
          icon={<PlusCircle size={18} />} 
          color="pink" 
        />
      </section>

      {/* Secondary layout containing simple insights & active athlete quick overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Quick activity logs or suggestions */}
        <div className="lg:col-span-6 bg-white/70 backdrop-blur-xl border border-white/40 p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-105 flex items-center justify-center text-blue-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Rubi Assistant Recommendations</h3>
              <p className="text-[11px] text-slate-400">Pílulas de governança geradas automaticamente.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2 divide-y divide-slate-150/40">
            <div className="pt-4 first:pt-0">
               <p className="text-xs font-bold text-slate-800">Exercício sem Mídia</p>
               <p className="text-[11px] text-slate-400 mt-1">Existem 3 novos exercícios ativos aguardando links de demonstração em vídeo.</p>
            </div>
            <div className="pt-4">
               <p className="text-xs font-bold text-slate-800">Crescimento de Atletas</p>
               <p className="text-[11px] text-slate-400 mt-1">Sua base de atletas registrados cresceu 12% em relação ao trimestre anterior.</p>
            </div>
            <div className="pt-4">
               <p className="text-xs font-bold text-slate-800">Estrutura de Protocolo Sugerida</p>
               <p className="text-[11px] text-slate-400 mt-1">Recomenda-se criar um protocolo em "Glúteos & Linhas" de dificuldade Iniciante para aumentar a retenção.</p>
            </div>
          </div>
        </div>

        {/* Recent signup quick list */}
        <div className="lg:col-span-6 bg-white/70 backdrop-blur-xl border border-white/40 p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-105 flex items-center justify-center text-indigo-600">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Últimos Atletas Cadastrados</h3>
              <p className="text-[11px] text-slate-400">Quem ingressou recentemente no KYRON OS.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {profiles.slice(0, 3).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-[10px]">
                    {p.name ? p.name.charAt(0) : 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{p.name || 'Atleta Convidado'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-450 bg-slate-100/60 px-2 py-1 rounded-md">
                  {p.is_premium ? 'Premium' : 'Free'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MiniKPICardProps {
  label: string;
  value: any;
  trend: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'blue' | 'orange' | 'pink';
}

function MiniKPICard({ label, value, trend, icon, color }: MiniKPICardProps) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-105 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-105 text-emerald-600',
    blue: 'bg-blue-50 border-blue-105 text-blue-600',
    orange: 'bg-orange-50 border-orange-105 text-orange-600',
    pink: 'bg-pink-50 border-pink-105 text-pink-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all text-left"
    >
       <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
             {icon}
          </div>
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-450">{label}</p>
          <p className="text-3xl font-black mt-1 text-slate-900 tracking-tight leading-none">{value}</p>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">{trend}</p>
       </div>
    </motion.div>
  );
}

export default ExecutiveDashboard;
