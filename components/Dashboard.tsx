
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
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Protocolo Rubi...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
        <i className="fas fa-exclamation-triangle text-2xl"></i>
      </div>
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Falha na Sincronização</h3>
      <p className="text-slate-500 text-xs mb-8 max-w-xs">{error}</p>
      <button 
        onClick={() => fetchData()}
        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
      >
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-8 pt-6 pb-40 animate-in fade-in duration-500">
      <main className="lg:col-span-8 space-y-10">
        <header className="bg-slate-900/60 p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5"><i className="fas fa-gem text-9xl"></i></div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2.5rem] border-4 border-blue-600/30 p-1 bg-slate-800 shadow-2xl overflow-hidden">
                 <img src={profile?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Protocolo Rubi Ativo</p>
                 <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter leading-tight">Olá, {profile?.full_name?.split(' ')[0] || 'Atleta'}</h2>
                 <div className="flex gap-3 mt-6">
                    <span className="px-5 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest">{stats.sessions} Sessões</span>
                    <span className="px-5 py-2 bg-orange-600/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest">Elite Member</span>
                 </div>
              </div>
           </div>
        </header>

        <section className="space-y-8">
           <div className="flex flex-wrap gap-3 py-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveFolderId(null)} className={`px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFolderId === null ? 'bg-white text-slate-900 shadow-2xl' : 'bg-slate-900/60 text-slate-500'}`}>Todos</button>
              {folders.map(f => (
                <button key={f.id} onClick={() => setActiveFolderId(f.id)} className={`px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeFolderId === f.id ? 'bg-blue-600 text-white shadow-2xl' : 'bg-slate-900/60 text-slate-500'}`}>{f.name}</button>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredWorkouts.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum protocolo nesta categoria</p>
                </div>
              )}
              {filteredWorkouts.map(w => (
                <div key={w.id} className="bg-slate-900/80 p-10 rounded-[3.5rem] border border-white/5 hover:border-blue-500/40 transition-all duration-500 group relative">
                   <div className="absolute top-8 right-8 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); navigate('editor', { id: w.id }); }} className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 active:scale-90"><i className="fas fa-edit text-[10px]"></i></button>
                      <button onClick={(e) => handleDeleteWorkout(e, w.id, w.name)} disabled={isDeleting === w.id} className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 active:scale-90 border border-red-500/10">
                         {isDeleting === w.id ? <i className="fas fa-spinner animate-spin text-[10px]"></i> : <i className="fas fa-trash-alt text-[10px]"></i>}
                      </button>
                   </div>
                   <h4 className="font-black text-white uppercase text-2xl tracking-tighter mb-4 group-hover:text-blue-500 transition-colors pr-16">{w.name}</h4>
                   <p className="text-[11px] text-slate-500 uppercase leading-relaxed line-clamp-2 mb-10">{w.description || 'Ficha técnica Rubi para otimização de volume e força.'}</p>
                   <button onClick={() => navigate('workout', { id: w.id })} className="w-full py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Começar Treino</button>
                </div>
              ))}
              <button onClick={() => navigate('editor')} className="border-4 border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-slate-700 hover:text-blue-500 hover:border-blue-500/20 transition-all">
                 <i className="fas fa-plus-circle text-4xl mb-4"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Novo Protocolo</span>
              </button>
           </div>
        </section>
      </main>

      <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
         <section className="bg-slate-900 p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-12">
            <div>
               <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3">Status Neural</h3>
               <div className="flex justify-between items-center">
                  <p className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Recuperação</p>
                  <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 text-xl font-black">100%</div>
               </div>
            </div>
            {profile?.is_admin && (
              <button onClick={() => navigate('admin')} className="w-full py-6 bg-red-600 rounded-[2rem] font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                <i className="fas fa-user-shield"></i> Coach Hub
              </button>
            )}
            <div>
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Conquistas</h3>
               <div className="grid grid-cols-3 gap-4">
                  {achievedBadges.length === 0 ? [1,2,3].map(i => <div key={i} className="aspect-square bg-slate-950 rounded-3xl border border-white/5 flex items-center justify-center opacity-20"><i className="fas fa-lock text-xl"></i></div>) : achievedBadges.map(b => (
                    <div key={b.id} className={`aspect-square bg-gradient-to-br ${b.color} rounded-3xl p-0.5 shadow-xl group cursor-help`}><div className="w-full h-full bg-slate-900 rounded-[1.6rem] flex items-center justify-center overflow-hidden"><i className={`fas ${b.icon} text-xl transition-transform group-hover:scale-125`}></i></div></div>
                  ))}
               </div>
            </div>
            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Bio-Insight (Rubi AI)</p>
               <p className="text-xs font-bold text-slate-300 italic">"Mantenha a consistência. O seu volume de trabalho está progredindo de forma linear."</p>
            </div>
         </section>
      </aside>
    </div>
  );
};

export default Dashboard;
