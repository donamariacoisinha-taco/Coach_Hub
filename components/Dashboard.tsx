
import React, { useEffect, useState, useMemo } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, WorkoutHistory } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';
import { MoreVertical, Plus, Shield, Flame, Play, Edit2, Trash2, FolderPlus, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenState } from './ui/ScreenState';
import { DashboardSkeleton } from './ui/Skeleton';
import { useSmartQuery } from '../hooks/useSmartQuery';
import { usePrefetch } from '../hooks/usePrefetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { usePredictive } from '../hooks/usePredictive';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const { showError } = useErrorHandler();
  const prefetch = usePrefetch();
  
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const dashboardQuery = useSmartQuery('dashboard_data', async () => {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) throw new Error("Sessão expirada.");

    const userId = session.user.id;

    const [profileRes, foldersRes, workoutsRes, historyRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
      supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false })
    ]);

    if (profileRes.error) throw profileRes.error;
    if (foldersRes.error) throw foldersRes.error;
    if (workoutsRes.error) throw workoutsRes.error;
    if (historyRes.error) throw historyRes.error;

    let lastWorkout: WorkoutCategory | null = null;
    if (historyRes.data && historyRes.data.length > 0 && workoutsRes.data) {
      lastWorkout = workoutsRes.data.find(w => w.id === historyRes.data[0].category_id) || null;
    }

    return {
      profile: profileRes.data as UserProfile | null,
      folders: foldersRes.data as WorkoutFolder[],
      workouts: workoutsRes.data as WorkoutCategory[],
      history: historyRes.data as WorkoutHistory[],
      stats: { sessions: historyRes.data?.length || 0 },
      lastWorkout
    };
  }, {
    revalidateOnFocus: true,
    refreshInterval: 60000 // Refresh every minute
  });

  const { data, uiState, isRefreshing, isLoading, refresh, mutate } = dashboardQuery;
  const profile = data?.profile;
  const folders = data?.folders || [];
  const workouts = data?.workouts || [];
  const history = data?.history || [];
  const stats = data?.stats || { sessions: 0 };
  const lastWorkout = data?.lastWorkout;

  const { nextAction } = usePredictive(profile || null, history, workouts);

  const filteredWorkouts = useMemo(() => {
    if (activeFolderId === null) return workouts;
    return workouts.filter(w => w.folder_id === activeFolderId || (!w.folder_id && activeFolderId === 'uncategorized'));
  }, [workouts, activeFolderId]);

  const handlePrefetchWorkout = (id: string) => {
    prefetch(`workout_init_${id}`, async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [catRes, exRes] = await Promise.all([
        supabase.from('workout_categories').select('*').eq('id', id).single(),
        supabase.from('workout_exercises').select(`*, exercises (*)`).eq('category_id', id).order('sort_order')
      ]);
      
      return { category: catRes.data, exercises: exRes.data };
    });
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Deseja excluir este protocolo?")) return;
    try {
      await supabase.from('workout_categories').delete().eq('id', id);
      if (data) {
        mutate({
          ...data,
          workouts: data.workouts.filter(w => w.id !== id)
        });
      }
      setActiveMenuId(null);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-32">
      <div className="max-w-md mx-auto px-6 pt-16">
        
        {/* HEADER */}
        <header className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                Bem-vindo de volta
              </p>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                {profile?.full_name?.split(' ')[0] || 'Atleta'}
              </h1>
            </div>

            <button 
              onClick={() => navigate('profile')}
              className="w-14 h-14 rounded-3xl bg-white flex items-center justify-center overflow-hidden border border-slate-50 shadow-sm active:scale-95 transition-all"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-black text-slate-200">
                  {profile?.full_name?.charAt(0) || 'A'}
                </span>
              )}
            </button>
          </div>

          {/* Metrics Inline - Premium Style */}
          <div className="flex items-end gap-16">
            <div className="flex flex-col">
              <span className="text-6xl font-black tracking-tighter tabular-nums leading-none mb-2">{stats.sessions}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Treinos</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-6xl font-black tracking-tighter tabular-nums leading-none">{profile?.workout_streak || 0}</span>
                <Flame size={28} className="text-orange-500 fill-orange-500 animate-bounce" />
              </div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                {profile?.workout_streak && profile.workout_streak > 0 ? `🔥 ${profile.workout_streak} dias seguidos` : 'Começar sequência'}
              </span>
            </div>
          </div>
        </header>
        
        {/* QUICK START - PREMIUM LIGHT */}
        <AnimatePresence>
          {nextAction && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col items-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                  {nextAction.type === 'start_workout' ? 'Hoje para você' : 'Sugestão'}
                </p>
                
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-2">
                  {nextAction.title}
                </h3>
                
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">
                  {nextAction.description}
                </p>

                {nextAction.suggestedWorkoutId && (
                  <button 
                    onClick={() => navigate('workout', { id: nextAction.suggestedWorkoutId })}
                    onMouseEnter={() => handlePrefetchWorkout(nextAction.suggestedWorkoutId!)}
                    className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[11px] tracking-[0.4em] active:scale-[0.97] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                  >
                    <Play size={16} fill="currentColor" />
                    {nextAction.type === 'start_workout' ? 'Iniciar Treino' : 'Retomar Agora'}
                  </button>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* PROTOCOLS */}
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Seus Protocolos
            </h2>
            <button 
              onClick={() => navigate('editor')}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <span className="text-[9px] font-black uppercase tracking-widest">Novo</span>
              <Plus size={16} />
            </button>
          </div>

          {/* Tabs Minimalistas - Scroll Horizontal */}
          <div className="flex gap-10 overflow-x-auto no-scrollbar border-b border-slate-100 -mx-6 px-6">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`text-[10px] font-black uppercase tracking-[0.2em] pb-6 border-b-4 transition-all whitespace-nowrap ${
                activeFolderId === null ? "border-slate-900 text-slate-900" : "border-transparent text-slate-300"
              }`}
            >
              Todos
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] pb-6 border-b-4 transition-all whitespace-nowrap ${
                  activeFolderId === folder.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-300"
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>

          {/* List iOS Style - Refined */}
          <div className="space-y-2">
            <ScreenState
              state={uiState}
              isRefreshing={isRefreshing}
              loadingComponent={<DashboardSkeleton />}
              onRetry={refresh}
              emptyIcon={<Dumbbell className="w-12 h-12 text-slate-200" />}
              emptyTitle="Nenhum protocolo"
              emptyDescription="Você ainda não criou nenhum treino nesta pasta."
              onEmptyAction={() => navigate('editor')}
              emptyActionLabel="Criar Treino"
            >
              {filteredWorkouts.map((workout, idx) => (
                <div key={workout.id} className="relative group">
                  <div 
                    onClick={() => navigate('workout', { id: workout.id })}
                    onMouseEnter={() => handlePrefetchWorkout(workout.id)}
                    className={`flex items-center justify-between py-10 px-4 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group-active:scale-[0.98] ${
                      idx !== filteredWorkouts.length - 1 ? 'border-b border-slate-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase truncate pr-4">
                        {workout.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                          {workout.description || 'Treino'}
                        </span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          {idx % 2 === 0 ? '45 min' : '60 min'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveMenuId(activeMenuId === workout.id ? null : workout.id); 
                      }}
                      className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-slate-900 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Bottom Sheet Menu (Simple inline for now or actual portal) */}
                  <AnimatePresence>
                    {activeMenuId === workout.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-2xl border border-slate-50 p-4 min-w-[160px] space-y-2"
                      >
                        <button 
                          onClick={() => navigate('workout', { id: workout.id })}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Play size={14} /> Iniciar
                        </button>
                        <button 
                          onClick={() => navigate('editor', { id: workout.id })}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </ScreenState>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
