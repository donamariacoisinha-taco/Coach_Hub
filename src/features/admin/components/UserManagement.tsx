import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  User, 
  ShieldAlert, 
  Flame, 
  Sparkles, 
  Award, 
  Calendar, 
  Inbox,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { profileApi } from '../../../lib/api/profileApi';

interface AthleteProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
  onboarding_completed: boolean;
  workout_streak: number;
  created_at: string;
  last_access?: string;
  is_premium?: boolean;
}

export const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<AthleteProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free' | 'admin'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getAllProfiles();
      setProfiles(data as any[]);
    } catch (e) {
      console.error('Error loading profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePremium = async (p: AthleteProfile) => {
    try {
      const updatedStatus = !p.is_premium;
      const updatedProfiles = profiles.map(u => u.id === p.id ? { ...u, is_premium: updatedStatus } : u);
      setProfiles(updatedProfiles);
      
      // Update local storage or profile api
      await profileApi.updateProfile(p.id, { is_premium: updatedStatus } as any);
      
      // Toggle client local flag if modifying self to see immediate UI transitions
      const { data: userData } = await profileApi.ensureProfile(p.id);
      if (userData && userData.id === p.id) {
        localStorage.setItem('kyron_premium_subscription_active', updatedStatus ? 'true' : 'false');
      }
    } catch (err) {
      console.error('Failed to toggle premium status of athlete:', err);
    }
  };

  const filtered = profiles.filter(p => {
    const matchesSearch = 
      (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
      (p.email?.toLowerCase() || '').includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === 'premium') return p.is_premium;
    if (filterType === 'free') return !p.is_premium && p.role !== 'admin';
    if (filterType === 'admin') return p.role === 'admin' || p.is_admin;
    return true;
  });

  const premiumCount = profiles.filter(p => p.is_premium).length;
  const freeCount = profiles.filter(p => !p.is_premium && p.role !== 'admin').length;
  const adminCount = profiles.filter(p => p.role === 'admin' || p.is_admin).length;

  return (
    <div className="space-y-8 pb-32">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Gestão de Atletas
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Lista unificada de usuários ativos, assinantes premium e acessos administrativos.
          </p>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Atletas</p>
          <p className="text-3xl font-black text-slate-950 mt-1">{profiles.length}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano Premium</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{premiumCount}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano Gratuito</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{freeCount}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Administradores</p>
          <p className="text-3xl font-black text-rose-500 mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-white/40 p-4 rounded-[2rem] shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Pesquisar atleta por nome/e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-950 border-slate-950 text-white'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Todos ({profiles.length})
          </button>
          <button
            onClick={() => setFilterType('premium')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterType === 'premium'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Premium ({premiumCount})
          </button>
          <button
            onClick={() => setFilterType('free')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterType === 'free'
                ? 'bg-slate-950 border-slate-950 text-white'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Gratuito ({freeCount})
          </button>
          <button
            onClick={() => setFilterType('admin')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterType === 'admin'
                ? 'bg-rose-600 border-rose-600 text-white'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Admins ({adminCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-400">
          Carregando lista de atletas...
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Atleta</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Acesso</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pacote / Assinatura</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Streak</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cadastro</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-700">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 border flex items-center justify-center text-slate-400 font-bold uppercase">
                            {p.name ? p.name.charAt(0) : 'A'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.name || 'Atleta Convidado'}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                          p.role === 'admin' || p.is_admin 
                            ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                            : 'text-slate-600 bg-slate-100/80 border'
                        }`}>
                          {p.role === 'admin' || p.is_admin ? 'Admin' : 'Atleta'}
                        </span>
                      </td>

                      <td className="p-6">
                        {p.role === 'admin' || p.is_admin ? (
                          <span className="text-slate-400 text-[10px] font-semibold">Ilimitado</span>
                        ) : p.is_premium ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase">
                            <Lock size={11} className="text-blue-400" /> Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                            <Globe size={11} /> Gratuito (Free)
                          </span>
                        )}
                      </td>

                      <td className="p-6">
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <Flame size={14} className="text-amber-500 fill-amber-50" />
                          <span>{p.workout_streak || 0}</span>
                        </div>
                      </td>

                      <td className="p-6 text-slate-400 font-semibold text-[11px]">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>

                      <td className="p-6 text-right">
                        {p.role !== 'admin' && !p.is_admin && (
                          <button
                            onClick={() => handleTogglePremium(p)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                              p.is_premium 
                                ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                                : 'bg-blue-50 border-blue-105 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            {p.is_premium ? 'Remover Premium' : 'Tornar Premium'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
              <Inbox size={32} className="text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhum atleta mapeado com este filtro.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
