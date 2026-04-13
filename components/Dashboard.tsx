
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
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-32 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-white p-0.5 bg-white shadow-sm overflow-hidden">
             <img src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop'} className="w-full h-full object-cover rounded-[14px]" alt="Profile" />
          </div>
          <div>
             <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Olá, {profile?.full_name?.split(' ')[0] || 'Atleta'}</h2>
             <p className="text-xs font-medium text-slate-500">Pronto para o treino de hoje?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider shadow-sm flex items-center gap-2">
            <i className="fas fa-fire text-orange-500"></i>
            {stats.sessions} Treinos
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-8 space-y-8">
          <section>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Meus Protocolos</h3>
                <button onClick={() => navigate('editor')} className="text-blue-600 text-xs font-bold flex items-center gap-1">
                  <i className="fas fa-plus"></i> Novo
                </button>
             </div>

             <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar mb-6">
                <button onClick={() => setActiveFolderId(null)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border ${activeFolderId === null ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-500'}`}>Todos</button>
                {folders.map(f => (
                  <button key={f.id} onClick={() => setActiveFolderId(f.id)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border ${activeFolderId === f.id ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-500'}`}>{f.name}</button>
                ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWorkouts.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                    <i className="fas fa-dumbbell text-slate-300 text-3xl mb-3"></i>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum treino encontrado</p>
                  </div>
                )}
                {filteredWorkouts.map(w => (
                  <div key={w.id} onClick={() => navigate('workout', { id: w.id })} className="premium-card p-6 cursor-pointer group relative">
                     <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); navigate('editor', { id: w.id }); }} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 border border-slate-100"><i className="fas fa-pen text-[10px]"></i></button>
                        <button onClick={(e) => handleDeleteWorkout(e, w.id, w.name)} disabled={isDeleting === w.id} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100">
                           {isDeleting === w.id ? <i className="fas fa-spinner animate-spin text-[10px]"></i> : <i className="fas fa-trash text-[10px]"></i>}
                        </button>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                          <i className="fas fa-bolt text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-900 text-lg truncate pr-12">{w.name}</h4>
                           <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{w.description || 'Ficha técnica para otimização de volume e força.'}</p>
                           <div className="flex items-center gap-3 mt-4">
                              <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md">8 Exercícios</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Aprox. 45 min</span>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </main>

        <aside className="lg:col-span-4 space-y-6">
           <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div>
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo Semanal</h3>
                 <div className="grid grid-cols-7 gap-1">
                    {['S','T','Q','Q','S','S','D'].map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          {i < 3 ? <i className="fas fa-check"></i> : ''}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{day}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {profile?.is_admin && (
                <button onClick={() => navigate('admin')} className="w-full py-4 bg-slate-900 rounded-2xl font-bold text-white uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-user-shield"></i> Painel Admin
                </button>
              )}

              <div>
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Conquistas</h3>
                 <div className="grid grid-cols-4 gap-3">
                    {achievedBadges.length === 0 ? [1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-200"><i className="fas fa-medal"></i></div>) : achievedBadges.map(b => (
                      <div key={b.id} className={`aspect-square bg-gradient-to-br ${b.color} rounded-xl p-0.5 shadow-sm group cursor-help`}><div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden"><i className={`fas ${b.icon} text-blue-600 transition-transform group-hover:scale-110`}></i></div></div>
                    ))}
                 </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                 <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-lightbulb text-blue-600 text-xs"></i>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Dica do Coach</p>
                 </div>
                 <p className="text-xs font-medium text-slate-600 leading-relaxed">"Mantenha a consistência. O seu volume de trabalho está progredindo de forma linear."</p>
              </div>
           </section>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
