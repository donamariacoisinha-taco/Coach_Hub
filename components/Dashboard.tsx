
import React, { useEffect, useState, useMemo } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, UserBadge } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const [folders, setFolders] = useState<WorkoutFolder[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutCategory[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [achievedBadges, setAchievedBadges] = useState<UserBadge[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState({ sessions: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const startTs = Date.now();
    console.log(`[DASH][PERF] Início fetchData t=${startTs}`);
    setLoading(true);
    setError(null);

    let isStillLoading = true;
    const timeout = setTimeout(() => {
      if (isStillLoading) {
        console.warn(`[DASH][PERF] Timeout atingido (10s). Forçando erro de conexão.`);
        setError("A conexão está demorando mais que o esperado. Verifique seu sinal.");
        setLoading(false);
      }
    }, 10000);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      console.log(`[DASH][PERF] Auth check t=${Date.now() - startTs}ms`);
      
      if (authError || !session?.user) {
        throw new Error("Sessão expirada ou usuário não autenticado.");
      }

      const userId = session.user.id;

      // 1. Verificação de Seed (Mínimo impacto)
      console.log(`[DASH][PERF] Seed check start t=${Date.now() - startTs}ms`);
      const { count, error: countError } = await supabase
        .from('workout_categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (countError) console.error("[DASH] Erro ao contar categorias:", countError);
      
      if (!countError && (count === 0 || count === null)) {
        console.log("[DASH] Iniciando seed de treinos...");
        await supabase.rpc('seed_beginner_workouts', { target_user_id: userId });
      }

      // 2. Busca paralela de dados principais
      console.log(`[DASH][PERF] Parallel queries start t=${Date.now() - startTs}ms`);
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
        supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId),
        supabase.from('workout_history').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      console.log(`[DASH][PERF] Parallel queries end t=${Date.now() - startTs}ms`);

      // Processamento seguro dos resultados
      const [profileRes, foldersRes, workoutsRes, badgesRes, historyRes] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        setProfile(profileRes.value.data);
      }
      
      if (foldersRes.status === 'fulfilled' && foldersRes.value.data) {
        setFolders(foldersRes.value.data);
      }

      if (workoutsRes.status === 'fulfilled' && workoutsRes.value.data) {
        setWorkouts(workoutsRes.value.data);
      }

      if (badgesRes.status === 'fulfilled' && badgesRes.value.data) {
        setAchievedBadges((badgesRes.value.data as any[]).map((b: any) => ({ 
          ...b.badges, 
          achieved_at: b.achieved_at 
        })));
      }

      if (historyRes.status === 'fulfilled') {
        setStats({ sessions: historyRes.value.count || 0 });
      }

      // Se houver erros em queries fundamentais, reportar
      if (workoutsRes.status === 'fulfilled' && workoutsRes.value.error) {
        throw new Error(workoutsRes.value.error.message);
      }

      console.log(`[DASH][PERF] Carregamento completo t=${Date.now() - startTs}ms`);
    } catch (err: any) {
      console.error("[DASH][PERF] Erro fatal durante fetch:", err);
      setError(err.message || "Erro desconhecido ao carregar dados.");
    } finally {
      isStillLoading = false;
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`⚠️ Deseja excluir permanentemente a ficha "${name}"?`)) return;
    
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('workout_categories').delete().eq('id', id);
      if (error) throw error;
      setWorkouts(prev => prev.filter(w => w.id !== id));
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
    } catch (err) {
      alert("Erro ao excluir ficha.");
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredWorkouts = useMemo(() => {
    if (activeFolderId === null) return workouts;
    return workouts.filter(w => w.folder_id === activeFolderId || (!w.folder_id && activeFolderId === 'uncategorized'));
  }, [workouts, activeFolderId]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F7F8FA] p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-xs">{error}</p>
      <button 
        onClick={() => fetchData()}
        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
      >
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32 animate-in fade-in duration-500">
      {/* Header Minimalista */}
      <header className="px-6 pt-12 pb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Visão Geral</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {profile?.full_name?.split(' ')[0] || 'Atleta'}
          </h2>
        </div>
        <button 
          onClick={() => navigate('profile')}
          className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white p-0.5 shadow-sm active:scale-95 transition-all"
        >
          <img 
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop'} 
            className="w-full h-full object-cover rounded-full" 
            alt="Profile" 
          />
        </button>
      </header>

      {/* Stats Rápidas - Estilo Horizontal Minimalista */}
      <div className="px-6 flex gap-8 mb-12 overflow-x-auto no-scrollbar">
        <div className="shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sessões</p>
          <p className="text-2xl font-black text-slate-900">{stats.sessions}</p>
        </div>
        <div className="shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sequência</p>
          <p className="text-2xl font-black text-slate-900">3 <span className="text-xs text-orange-500"><i className="fas fa-fire"></i></span></p>
        </div>
        {profile?.is_admin && (
          <button 
            onClick={() => navigate('admin')}
            className="shrink-0 flex items-center gap-2 text-blue-600 active:opacity-60 transition-opacity"
          >
            <i className="fas fa-user-shield text-lg"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
          </button>
        )}
      </div>

      {/* Seção de Protocolos - Lista Estilo iOS */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meus Protocolos</h3>
          <button 
            onClick={() => navigate('editor')}
            className="w-10 h-10 flex items-center justify-center text-blue-600 active:scale-90 transition-all"
          >
            <i className="fas fa-plus text-lg"></i>
          </button>
        </div>

        {/* Filtro de Pastas - Minimalista */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 -mx-6 px-6">
          <button 
            onClick={() => setActiveFolderId(null)} 
            className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap pb-2 border-b-2 transition-all ${activeFolderId === null ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            Todos
          </button>
          {folders.map(f => (
            <button 
              key={f.id} 
              onClick={() => setActiveFolderId(f.id)} 
              className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap pb-2 border-b-2 transition-all ${activeFolderId === f.id ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Lista de Treinos - iOS Style */}
        <div className="space-y-1">
          {filteredWorkouts.length === 0 ? (
            <div className="py-20 text-center">
              <i className="fas fa-dumbbell text-slate-200 text-4xl mb-4"></i>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum protocolo ativo</p>
            </div>
          ) : (
            filteredWorkouts.map((w, idx) => (
              <div 
                key={w.id} 
                onClick={() => navigate('workout', { id: w.id })}
                className={`group flex items-center justify-between py-6 active:bg-slate-50 transition-colors cursor-pointer ${idx !== filteredWorkouts.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate pr-4">{w.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">8 Exercícios</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">• 45 min</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('editor', { id: w.id }); }}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                  <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Resumo Semanal e Conquistas - Integrados sem cards pesados */}
      <section className="mt-16 px-6 space-y-12">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Frequência Semanal</h3>
          <div className="flex justify-between items-center">
            {['S','T','Q','Q','S','S','D'].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs ${i < 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border border-slate-100 text-slate-300'}`}>
                  {i < 3 ? <i className="fas fa-check"></i> : ''}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Conquistas</h3>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{achievedBadges.length} Ativas</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {achievedBadges.length === 0 ? (
              [1,2,3,4].map(i => (
                <div key={i} className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-100">
                  <i className="fas fa-medal text-xl"></i>
                </div>
              ))
            ) : (
              achievedBadges.map(b => (
                <div key={b.id} className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <i className={`fas ${b.icon} text-blue-600 text-xl`}></i>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dica do Dia - Estilo Quote Minimalista */}
        <div className="pt-8 border-t border-slate-100">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Dica do Coach</p>
          <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
            "A consistência supera a intensidade no longo prazo. Mantenha o foco no processo."
          </p>
        </div>
      </section>

      {/* Botão de Ação Principal Flutuante (Thumb Zone) */}
      <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center pointer-events-none">
        <button 
          onClick={() => navigate('editor')}
          className="pointer-events-auto h-16 px-8 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
        >
          <i className="fas fa-bolt"></i>
          Novo Treino
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
