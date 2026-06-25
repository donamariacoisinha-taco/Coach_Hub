import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Globe,
  Settings,
  X,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { profileApi } from '../../../lib/api/profileApi';
import { supabase } from '../../../lib/api/supabase';
import { authApi } from '../../../lib/api/authApi';
import { workoutApi } from '../../../lib/api/workoutApi';

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
  _is_mock?: boolean;
}

type FilterType = 'all' | 'active' | 'suspended' | 'premium' | 'free' | 'admin';

export const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<AthleteProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [suspendedUserIds, setSuspendedUserIds] = useState<string[]>([]);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('admin@kyron.os');
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [viewingWorkoutsUserId, setViewingWorkoutsUserId] = useState<string | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<any[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Custom feedback/dialog actions
  const [selectedProfile, setSelectedProfile] = useState<AthleteProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<AthleteProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<AthleteProfile | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    // Standard localStorage hydration
    const suspended = JSON.parse(localStorage.getItem('kyron_suspended_user_ids') || '[]');
    const deleted = JSON.parse(localStorage.getItem('kyron_deleted_user_ids') || '[]');
    setSuspendedUserIds(suspended);
    setDeletedUserIds(deleted);

    // Resolve current logged in admin
    authApi.getUser().then(u => {
      if (u?.email) {
        setCurrentUserEmail(u.email);
      }
    });

    loadProfiles();
  }, []);

  useEffect(() => {
    if (viewingWorkoutsUserId) {
      setLoadingWorkouts(true);
      workoutApi.getDashboardData(viewingWorkoutsUserId)
        .then(data => setUserWorkouts(data.workouts || []))
        .catch(console.error)
        .finally(() => setLoadingWorkouts(false));
    } else {
      setUserWorkouts([]);
    }
  }, [viewingWorkoutsUserId]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getAllProfiles();
      const deleted = JSON.parse(localStorage.getItem('kyron_deleted_user_ids') || '[]');
      const filtered = (data as AthleteProfile[]).filter(p => !deleted.includes(p.id));
      setProfiles(filtered);
    } catch (e) {
      console.error('Error fetching admin profiles list:', e);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Check if a user account is protected
  const isProtectedUser = (p: AthleteProfile) => {
    if (!p) return false;
    const protectedEmails = [
      'marivaldotorres@gmail.com',
      'donamariacoisinha@gmail.com',
      currentUserEmail
    ].map(e => e.toLowerCase());

    if (p.email && protectedEmails.includes(p.email.toLowerCase())) return true;
    if (p.role === 'admin' || p.is_admin) return true;
    return false;
  };

  // Admin logger
  const addAdminLog = (action: 'Suspensão' | 'Reativação' | 'Exclusão', adminEmail: string, athleteName: string, athleteEmail: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('kyron_admin_operations_log_v2') || '[]');
      const now = new Date();
      const newLog = {
        action,
        admin: adminEmail,
        athlete: `${athleteName || 'Atleta Convidado'} (${athleteEmail})`,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      logs.unshift(newLog);
      localStorage.setItem('kyron_admin_operations_log_v2', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error('Error logging core administrative event:', e);
    }
  };

  // Actions functions
  const handleSuspendUser = (user: AthleteProfile) => {
    if (isProtectedUser(user)) {
      setErrorNotice('Segurança do Núcelo: Não é possível suspender uma conta administrativa ou configurada sob proteção ativa.');
      return;
    }
    const suspended = [...suspendedUserIds];
    if (!suspended.includes(user.id)) {
      suspended.push(user.id);
      localStorage.setItem('kyron_suspended_user_ids', JSON.stringify(suspended));
      setSuspendedUserIds(suspended);
    }
    addAdminLog('Suspensão', currentUserEmail, user.name, user.email);
    showSuccess(`Conta de ${user.name || user.email} suspensa com sucesso.`);
    setActiveMenuUserId(null);
  };

  const handleReactivateUser = (user: AthleteProfile) => {
    const suspended = suspendedUserIds.filter(id => id !== user.id);
    localStorage.setItem('kyron_suspended_user_ids', JSON.stringify(suspended));
    setSuspendedUserIds(suspended);
    addAdminLog('Reativação', currentUserEmail, user.name, user.email);
    showSuccess(`Conta de ${user.name || user.email} reativada com integridade total.`);
    setActiveMenuUserId(null);
  };

  const handleSaveEdit = async (updated: AthleteProfile) => {
    try {
      // Direct updates mapped locally
      setProfiles(prev => prev.map(u => u.id === updated.id ? updated : u));
      
      const payload: any = {
        name: updated.name,
        role: updated.role,
        is_admin: updated.role === 'admin',
        is_premium: updated.is_premium
      };
      
      // Email change is only permitted for non-protected athletes
      if (!isProtectedUser(updated)) {
        payload.email = updated.email;
      }

      await profileApi.updateProfile(updated.id, payload);
      setEditingProfile(null);
      showSuccess(`Cadastro de ${updated.name || updated.email} atualizado.`);
      loadProfiles();
    } catch (err: any) {
      console.error(err);
      setErrorNotice('Erro na sincronização: Não foi possível gravar modificações cadastrais no banco de dados.');
    }
  };

  const handleDeleteUser = async (user: AthleteProfile) => {
    if (isProtectedUser(user)) {
      setErrorNotice('Ação Proibida: Administradores e contas protegidas do sistema não podem ser permanentemente excluídos.');
      return;
    }
    try {
      // 1. Comprehensive deletion of all user-related data from all system tables
      const tablesToDelete = [
        { name: 'body_measurements', field: 'user_id' },
        { name: 'progress_photos', field: 'user_id' },
        { name: 'partial_workout_sessions', field: 'user_id' },
        { name: 'workout_sets_log', field: 'user_id' },
        { name: 'workout_history', field: 'user_id' },
        { name: 'user_badges', field: 'user_id' },
        { name: 'user_favorite_exercises', field: 'user_id' },
        { name: 'user_personal_bests', field: 'user_id' },
        { name: 'user_notifications', field: 'user_id' },
        { name: 'workout_folders', field: 'user_id' },
        { name: 'workout_categories', field: 'user_id' },
        { name: 'athlete_memory', field: 'user_id' },
        { name: 'exercise_performance_memory', field: 'user_id' }
      ];

      const deletePromises = tablesToDelete.map(t => 
        supabase
          .from(t.name)
          .delete()
          .eq(t.field, user.id)
          .then(({ error }) => {
            if (error && error.code !== 'PGRST116') {
              console.warn(`[User Cleanup] Table ${t.name} deletion warning:`, error.message);
            }
          })
      );

      await Promise.all(deletePromises);

      // 2. Delete the profile itself
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // 3. Sync local storage caches for tracking deleted/suspended state
      const deleted = JSON.parse(localStorage.getItem('kyron_deleted_user_ids') || '[]');
      if (!deleted.includes(user.id)) {
        deleted.push(user.id);
        localStorage.setItem('kyron_deleted_user_ids', JSON.stringify(deleted));
      }

      const suspended = suspendedUserIds.filter(id => id !== user.id);
      localStorage.setItem('kyron_suspended_user_ids', JSON.stringify(suspended));
      setSuspendedUserIds(suspended);
      
      addAdminLog('Exclusão', currentUserEmail, user.name, user.email);
      setProfiles(prev => prev.filter(p => p.id !== user.id));
      showSuccess(`Operação Completa. Todos os dados de treino, histórico, biometria e registros de ${user.name || user.email} foram expurgados permanentemente do banco de dados. Caso ele tente se cadastrar ou logar novamente, o sistema o tratará como um novo usuário cadastrado e ele iniciará o onboarding do zero!`);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(`Proteção de Integridade: Houve uma exceção ao tentar excluir os dados do atleta. Operação cancelada. Detalhe: ${err.message || err}`);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return;
    try {
      await workoutApi.deleteWorkout(workoutId);
      setUserWorkouts(prev => prev.filter(w => w.id !== workoutId));
      showSuccess('Treino excluído com sucesso.');
    } catch (err) {
      console.error(err);
      setErrorNotice('Erro ao excluir treino.');
    }
  };

  // Real-time filtering computation
  const filtered = profiles.filter(p => {
    const matchesSearch = 
      (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
      (p.email?.toLowerCase() || '').includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    const isSusp = suspendedUserIds.includes(p.id);

    if (filterType === 'active') return !isSusp;
    if (filterType === 'suspended') return isSusp;
    if (filterType === 'premium') return p.is_premium;
    if (filterType === 'free') return !p.is_premium && p.role !== 'admin' && !p.is_admin;
    if (filterType === 'admin') return p.role === 'admin' || p.is_admin;
    return true;
  });

  // KPI calculations
  const totalCount = profiles.length;
  const activeCount = profiles.filter(p => !suspendedUserIds.includes(p.id)).length;
  const suspendedCount = profiles.filter(p => suspendedUserIds.includes(p.id)).length;
  const premiumCount = profiles.filter(p => p.is_premium).length;
  const freeCount = profiles.filter(p => !p.is_premium && p.role !== 'admin' && !p.is_admin).length;
  const adminCount = profiles.filter(p => p.role === 'admin' || p.is_admin).length;
  
  const isFallbackMode = profiles.length === 0 || profiles.some(p => p._is_mock);

  return (
    <div className="space-y-8 pb-32">
      {/* Notifications overlay elements */}
      {successNotice && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="text-[#7BA7FF]" size={18} />
          <span className="text-xs font-bold font-sans">{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="fixed bottom-6 right-6 bg-rose-950 border border-rose-800 text-rose-100 px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-center gap-3 animate-slide-up">
          <ShieldAlert className="text-rose-450" size={18} />
          <div className="font-sans">
            <span className="text-xs font-bold block">{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="text-[10px] font-black uppercase text-rose-300 mt-1 cursor-pointer hover:underline border-none bg-transparent">Ok, fechar</button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Atletas
            </h2>
            {isFallbackMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-600 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Modo Sandbox
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Base em Tempo Real
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {isFallbackMode 
              ? "Exibindo base de demonstração (local fallback) de atletas devido a conexão offline ou pendência de credenciais." 
              : "Conectado com Sucesso: Sincronização direta com a tabela 'profiles' do banco de dados."}
          </p>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Atletas</p>
          <p className="text-3xl font-black text-slate-950 mt-1">{totalCount}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ativos / Suspensos</p>
          <p className="text-3xl font-black mt-1 flex items-baseline gap-2">
             <span className="text-blue-600">{activeCount}</span>
             <span className="text-slate-300 text-lg">/</span>
             <span className="text-slate-500 text-xl font-bold">{suspendedCount}</span>
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano Premium</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{premiumCount}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm font-sans">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admins & Staff</p>
          <p className="text-3xl font-black text-rose-500 mt-1">{adminCount}</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-slate-200 p-4 rounded-[2rem] shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-450 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Pesquisar atleta por nome/e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all text-slate-900 placeholder:text-slate-450"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-950 border-slate-950 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'active'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('suspended')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'suspended'
                ? 'bg-slate-500 border-slate-500 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Suspensos ({suspendedCount})
          </button>
          <button
            onClick={() => setFilterType('premium')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'premium'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Premium ({premiumCount})
          </button>
          <button
            onClick={() => setFilterType('free')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'free'
                ? 'bg-slate-950 border-slate-950 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Free ({freeCount})
          </button>
          <button
            onClick={() => setFilterType('admin')}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
              filterType === 'admin'
                ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
            }`}
          >
            Admins ({adminCount})
          </button>
        </div>
      </div>

      {/* Main Table Segment */}
      {loading ? (
        <div className="flex justify-center py-24 text-slate-400 font-sans text-xs">
          Sincronizando banco de dados Kyron OS...
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Atleta</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Acesso</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pacote / Assinatura</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Streak</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cadastro</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Menu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-700">
                  {filtered.map(p => {
                    const isSusp = suspendedUserIds.includes(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase shrink-0">
                              {p.name ? p.name.charAt(0) : 'A'}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-900 truncate">{p.name || 'Atleta Convidado'}</p>
                              <p className="text-slate-450 text-[11px] mt-0.5 truncate">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                            p.role === 'admin' || p.is_admin 
                              ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                              : 'text-slate-600 bg-slate-100/80 border border-slate-200/50'
                          }`}>
                            {p.role === 'admin' || p.is_admin ? 'Admin' : 'Atleta'}
                          </span>
                        </td>

                        <td className="p-6">
                          {isSusp ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md text-slate-500 bg-slate-100/80 border border-slate-200">
                              • Suspenso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md text-blue-600 bg-blue-50 border border-blue-100">
                              • Ativo
                            </span>
                          )}
                        </td>

                        <td className="p-6">
                          {p.role === 'admin' || p.is_admin ? (
                            <span className="text-slate-400 text-[10px] font-semibold">Ilimitado</span>
                          ) : p.is_premium ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase">
                              <Lock size={11} className="text-blue-400" /> Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-450 uppercase">
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

                        <td className="p-6 text-slate-450 font-semibold text-[11px]">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>

                        <td className="p-6 text-right relative font-sans">
                          <div className="flex items-center justify-end gap-3">
                            {isProtectedUser(p) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 rounded-md border border-slate-200/60 select-none">
                                Protegido
                              </span>
                            )}
                            
                            <button
                              onClick={() => setActiveMenuUserId(activeMenuUserId === p.id ? null : p.id)}
                              className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-900 border-none bg-transparent"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuUserId === p.id && (
                              <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMenuUserId(null)} />
                                <div className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-left divide-y divide-slate-100 font-sans">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setSelectedProfile(p);
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                    >
                                      Ver Perfil
                                    </button>
                                    <button
                                      onClick={() => {
                                        setViewingWorkoutsUserId(p.id);
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                    >
                                      Ver Treinos
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingProfile(p);
                                        setActiveMenuUserId(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                    >
                                      Editar Usuário
                                    </button>
                                  </div>
                                  <div className="py-1 text-slate-700">
                                    {!isSusp ? (
                                      <button
                                        disabled={isProtectedUser(p)}
                                        onClick={() => handleSuspendUser(p)}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer ${
                                          isProtectedUser(p) ? 'text-slate-300 cursor-not-allowed' : 'text-amber-650 hover:bg-amber-50/50'
                                        }`}
                                      >
                                        Suspender Conta
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleReactivateUser(p)}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                      >
                                        Reativar Conta
                                      </button>
                                    )}
                                    <button
                                      disabled={isProtectedUser(p)}
                                      onClick={() => {
                                        setDeletingProfile(p);
                                        setDeleteConfirmInput('');
                                        setActiveMenuUserId(null);
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer ${
                                        isProtectedUser(p) ? 'text-slate-300 cursor-not-allowed' : 'text-rose-600 hover:bg-rose-50/50'
                                      }`}
                                    >
                                      Excluir Usuário
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
              <Inbox size={32} className="text-slate-350" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-800">Nenhum atleta mapeado com este filtro.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog for: "Ver Perfil" */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setSelectedProfile(null)} />
          <div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl overflow-hidden font-sans z-50 text-left animate-scale-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Ficha Cadastral do Atleta</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identidade & Status Kyron OS</p>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="p-2 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-450 font-bold uppercase text-2xl shrink-0">
                  {selectedProfile.name ? selectedProfile.name.charAt(0) : 'A'}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 leading-tight">{selectedProfile.name || 'Atleta Convidado'}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedProfile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-xs font-bold text-slate-800">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Status da Conta</p>
                  <p>{suspendedUserIds.includes(selectedProfile.id) ? '🔴 Suspenso (Acesso Bloqueado)' : '🟢 Ativo (Acesso Total)'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Assinatura</p>
                  <p>{selectedProfile.is_premium ? 'Premium ⭐' : 'Gratuito 🌍'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Função / Cargo</p>
                  <p className="uppercase">{selectedProfile.role || 'user'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Cadastrado Em</p>
                  <p>{selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Streak de Treinos</p>
                  <p>{selectedProfile.workout_streak || 0} Dias Ativo</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Status de Segurança</p>
                  <p className="text-emerald-600 font-extrabold uppercase">KYRON SECURE</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedProfile(null)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-none cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for: "Editar Usuário" */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setEditingProfile(null)} />
          <div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl overflow-hidden z-50 text-left animate-scale-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Editar Atleta</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alteração cadastral imediata</p>
              </div>
              <button onClick={() => setEditingProfile(null)} className="p-2 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingProfile) handleSaveEdit(editingProfile);
            }} className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  value={editingProfile.name || ''} 
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-2">E-mail</label>
                <input 
                  type="email" 
                  value={editingProfile.email || ''} 
                  disabled={isProtectedUser(editingProfile)}
                  onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                  className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-105 transition-all font-sans"
                  required
                />
                {isProtectedUser(editingProfile) && (
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 block">🔒 Protegido: E-mail de administrador não elegível para edição local.</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-2">Plano de Assinatura</label>
                  <select
                    value={editingProfile.is_premium ? 'true' : 'false'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, is_premium: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-105 transition-all font-sans"
                  >
                    <option value="false">Gratuito (Free)</option>
                    <option value="true">Premium ⭐</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-2">Nível de Acesso (Cargo)</label>
                  <select
                    value={editingProfile.role || 'user'}
                    disabled={isProtectedUser(editingProfile)}
                    onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value, is_admin: e.target.value === 'admin' })}
                    className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-105 transition-all font-sans"
                  >
                    <option value="user">Atleta (Default)</option>
                    <option value="admin">Administrador (Admin)</option>
                  </select>
                  {isProtectedUser(editingProfile) && (
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 block">🔒 Protegido: Nível hierárquico bloqueado.</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 font-sans">
                <button 
                  type="button"
                  onClick={() => setEditingProfile(null)} 
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-slate-950 hover:bg-slate-850 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all border-none cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for: "Excluir Usuário" */}
      {deletingProfile && (() => {
        const isProtected = isProtectedUser(deletingProfile);
        const emailMatch = deleteConfirmInput.trim().toLowerCase() === deletingProfile.email.trim().toLowerCase();
        const canDelete = !isProtected && emailMatch;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setDeletingProfile(null)} />
            <div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl overflow-hidden z-50 text-left animate-scale-up animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-rose-600 tracking-tight">Excluir Atleta Permanentemente?</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ação de Alta Destruição</p>
                </div>
                <button onClick={() => setDeletingProfile(null)} className="p-2 text-slate-450 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 text-slate-700">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atleta Selecionado</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{deletingProfile.name || 'Atleta Convidado'}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{deletingProfile.email}</p>
                </div>

                {isProtected ? (
                  <div className="bg-red-50 border border-red-150 p-5 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-black text-red-800 uppercase tracking-wide">Ação bloqueada</p>
                      <p className="text-xs text-red-700 mt-1 font-bold">Ação bloqueada. Esta conta é protegida pelo sistema.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 text-xs">
                    <p className="font-extrabold text-rose-800 uppercase tracking-wide mb-3">Esta ação é irreversível e apagará todos os treinos, medidas e histórico:</p>
                    <ul className="space-y-1.5 font-bold text-rose-700 list-disc list-inside">
                      <li>Perfil do Atleta</li>
                      <li>Histórico completo de treinos executados</li>
                      <li>Medidas corporais e histórico de evolução física</li>
                      <li>Protocolos ativos e treinos agendados</li>
                      <li>Preferências de onboarding e restrições</li>
                    </ul>
                  </div>
                )}

                {!isProtected && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                      Digite o e-mail do atleta para confirmar:
                    </label>
                    <input 
                      type="text" 
                      placeholder={deletingProfile.email}
                      value={deleteConfirmInput} 
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-rose-100 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setDeletingProfile(null)} 
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!canDelete}
                  onClick={() => {
                    if (canDelete) {
                      const temp = deletingProfile;
                      setDeletingProfile(null);
                      handleDeleteUser(temp);
                    }
                  }}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-none cursor-pointer ${
                    canDelete 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Excluir Atleta
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {viewingWorkoutsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setViewingWorkoutsUserId(null)} />
          <div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl overflow-hidden z-50 text-left animate-scale-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Lista de Treinos</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerenciamento individual</p>
              </div>
              <button onClick={() => setViewingWorkoutsUserId(null)} className="p-2 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-all">
                <X size={18} />
              </button>
            </div>
            {loadingWorkouts ? (
              <div className="text-center py-10 text-sm text-slate-500">Carregando treinos...</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {userWorkouts.length > 0 ? userWorkouts.map(workout => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{workout.name}</p>
                      <p className="text-[10px] text-slate-500">{workout.description}</p>
                    </div>
                    <button onClick={() => handleDeleteWorkout(workout.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                )) : (
                  <p className="text-center text-sm text-slate-500 py-10">Nenhum treino encontrado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
