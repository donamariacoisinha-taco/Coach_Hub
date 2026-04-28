
import React, { useState, useMemo } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, WorkoutHistory } from '../../types';
import { authApi } from '../../lib/api/authApi';
import { workoutApi } from '../../lib/api/workoutApi';
import { useNavigation } from '../../App';
import { MoreVertical, Plus, Flame, Play, Edit2, Trash2, Dumbbell, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenState } from '../../components/ui/ScreenState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useSmartQuery } from '../../hooks/useSmartQuery';
import { usePrefetch } from '../../hooks/usePrefetch';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { usePredictive } from '../../hooks/usePredictive';
import { imagePrefetcher } from '../../lib/utils/imagePrefetcher';
import { useWorkoutStore } from '../../app/store/workoutStore';
import { cacheStore } from '../../lib/cache/cacheStore';
import { ekeService } from '../../domain/eke/ekeService';
import { Goal, ExperienceLevel, MuscleGroup } from '../../types';
import { Sparkles, Loader2, Clock, CheckCircle2, Shield, Star } from 'lucide-react';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const prefetch = usePrefetch();
  
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicParams, setMagicParams] = useState({
    goal: Goal.HYPERTROPHY,
    duration: 45,
    level: ExperienceLevel.BEGINNER,
    focusMuscles: [] as string[]
  });

  const dashboardQuery = useSmartQuery('dashboard_data', async () => {
    const session = await authApi.getSession();
    if (!session?.user) throw new Error("Sessão expirada.");

    return workoutApi.getDashboardData(session.user.id);
  }, {
    revalidateOnFocus: true,
    refreshInterval: 60000
  });

  const { data, status, isFetching, refresh, mutate } = dashboardQuery;
  const profile = data?.profile;
  const folders = data?.folders || [];
  const workouts = data?.workouts || [];
  const history = data?.history || [];
  const stats = data?.stats || { sessions: 0 };

  const { nextAction } = usePredictive(profile || null, history, workouts);

  const filteredWorkouts = useMemo(() => {
    if (activeFolderId === null) return workouts;
    return workouts.filter(w => w.folder_id === activeFolderId || (!w.folder_id && activeFolderId === 'uncategorized'));
  }, [workouts, activeFolderId]);

  const handlePrefetchWorkout = async (id: string) => {
    // Reset para evitar estados fantasmas
    const currentStoreId = useWorkoutStore.getState().currentWorkoutId;
    if (currentStoreId !== id) {
       cacheStore.clear(`workout_init_${id}`);
    }

    prefetch(`workout_init_${id}`, async () => {
      const user = await authApi.getUser();
      if (!user) return null;
      const initData = await workoutApi.getWorkoutInitData(id, user.id);
      
      // Prefetch exercise images for this workout
      if (initData?.exercises) {
        const images = initData.exercises.map(ex => ex.exercise_image).filter(Boolean) as string[];
        imagePrefetcher.prefetchBatch(images);
      }
      
      return initData;
    });
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Deseja excluir este protocolo?")) return;
    
    // Optimistic Update
    const previousData = data;
    if (data) {
      mutate({
        ...data,
        workouts: data.workouts.filter(w => w.id !== id)
      });
    }
    setActiveMenuId(null);

    try {
      await workoutApi.deleteWorkout(id);
      // Success - no need to do anything as UI is already updated
    } catch (err) {
      // Rollback
      if (previousData) mutate(previousData);
      showError(err);
    }
  };

  const handleDuplicateWorkout = async (workout: WorkoutCategory) => {
    const session = await authApi.getSession();
    if (!session?.user) return;

    const newWorkout: WorkoutCategory = {
      ...workout,
      id: `temp-${Date.now()}`, // Temporary ID
      name: `${workout.name} (Cópia)`,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    const previousData = data;
    if (data) {
      mutate({
        ...data,
        workouts: [newWorkout, ...data.workouts]
      });
    }
    setActiveMenuId(null);

    try {
      // 1. Get original exercises
      const { exercises } = await workoutApi.getWorkoutInitData(workout.id, session.user.id);
      
      // 2. Create new category
      const created = await workoutApi.createCategory({
        user_id: session.user.id,
        name: newWorkout.name,
        description: workout.description,
        folder_id: workout.folder_id
      });

      // 3. Insert exercises
      if (exercises.length > 0) {
        const newExercises = exercises.map((ex, idx) => ({
          category_id: created.id,
          exercise_id: ex.exercise_id,
          sort_order: idx,
          sets_json: ex.sets_json,
          rest_time: ex.rest_time
        }));
        await workoutApi.insertWorkoutExercises(newExercises);
      }

      // 4. Update with real data
      if (data) {
        mutate({
          ...data,
          workouts: data.workouts.map(w => w.id === newWorkout.id ? created : w)
        });
      }
    } catch (err) {
      // Rollback
      if (previousData) mutate(previousData);
      showError(err);
    }
  };

  const handleMagicBuild = async () => {
    if (magicParams.focusMuscles.length === 0) {
        showError("Selecione os focos musculares!");
        return;
    }
    setMagicLoading(true);
    try {
        const session = await authApi.getSession();
        if (!session?.user) return;

        const exercises = await ekeService.generateWorkoutPlan(magicParams);
        
        // Save as a temporary magical workout
        const name = `EKE: ${magicParams.focusMuscles.join(' & ')}`;
        const category = await workoutApi.createCategory({
            user_id: session.user.id,
            name,
            description: `Gerado automaticamente via EKE Engine (${magicParams.goal})`,
            folder_id: null
        });

        await workoutApi.insertWorkoutExercises(exercises.map((ex, i) => ({
            category_id: category.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            sets_json: ex.sets_json,
            sort_order: i + 1
        })));

        showSuccess('EKE Ativada', 'O motor inteligente montou seu treino personalizado.');
        useWorkoutStore.getState().resetWorkout();
        navigate('workout', { id: category.id });
    } catch (err: any) {
        showError(err);
    } finally {
        setMagicLoading(false);
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
                  {profile?.full_name ? profile.full_name.split(' ')[0] : 'Atleta'}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-2">
                   <div className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase tracking-widest">
                      <Shield size={10} /> Exercise Engine
                   </div>
                   <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">EKE v1.0 Ativa</div>
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
            </div>

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
        
        {/* PREDICTIVE ACTION */}
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
                    onClick={() => {
                      useWorkoutStore.getState().resetWorkout();
                      navigate('workout', { id: nextAction.suggestedWorkoutId });
                    }}
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
              onMouseEnter={() => prefetch('editor_init_new', async () => {
                return { workout: null, exercises: [] };
              })}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <span className="text-[9px] font-black uppercase tracking-widest">Manual</span>
              <Plus size={16} />
            </button>
            <button 
              onClick={() => setShowMagicModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition-all border border-blue-100/50"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Magic Builder</span>
            </button>
          </div>

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

          <div className="space-y-2">
            <ScreenState
              status={status}
              isFetching={isFetching}
              skeleton={<DashboardSkeleton />}
              onRetry={refresh}
            >
              {filteredWorkouts.map((workout, idx) => {
                const isOptimistic = workout.id.startsWith('temp-');
                
                return (
                  <div key={workout.id} className={`relative group ${isOptimistic ? 'opacity-60 grayscale-[0.2]' : ''}`}>
                    <div 
                      onClick={() => {
                      if (!isOptimistic) {
                        useWorkoutStore.getState().resetWorkout();
                        navigate('workout', { id: workout.id });
                      }
                    }}
                      onMouseEnter={() => !isOptimistic && handlePrefetchWorkout(workout.id)}
                      className={`flex items-center justify-between py-10 px-4 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group-active:scale-[0.98] ${
                        idx !== filteredWorkouts.length - 1 ? 'border-b border-slate-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase truncate pr-4">
                            {workout.name}
                          </h3>
                          {isOptimistic && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[7px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                              Sincronizando
                            </span>
                          )}
                        </div>
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

                    {!isOptimistic && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveMenuId(activeMenuId === workout.id ? null : workout.id); 
                        }}
                        className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-slate-900 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {activeMenuId === workout.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-2xl border border-slate-50 p-4 min-w-[160px] space-y-2"
                      >
                        <button 
                          onClick={() => {
                            useWorkoutStore.getState().resetWorkout();
                            navigate('workout', { id: workout.id });
                          }}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Play size={14} /> Iniciar
                        </button>
                        <button 
                          onClick={() => navigate('editor', { id: workout.id })}
                          onMouseEnter={() => prefetch(`editor_init_${workout.id}`, async () => {
                            const user = await authApi.getUser();
                            if (!user) return null;
                            return workoutApi.getWorkoutEditorData(user.id, workout.id);
                          })}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDuplicateWorkout(workout)}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Copy size={14} /> Duplicar
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
              );
            })}
            </ScreenState>
          </div>
        </section>

        <MagicBuildModal 
            isOpen={showMagicModal}
            onClose={() => setShowMagicModal(false)}
            loading={magicLoading}
            params={magicParams}
            setParams={setMagicParams}
            onBuild={handleMagicBuild}
            muscleGroups={data?.muscleGroups || []}
        />
      </div>
    </div>
  );
};

const MagicBuildModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    loading: boolean,
    params: any,
    setParams: (p: any) => void,
    onBuild: () => void,
    muscleGroups: MuscleGroup[]
}> = ({ isOpen, onClose, loading, params, setParams, onBuild, muscleGroups }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1200] flex items-end justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-white rounded-t-[3rem] p-10 space-y-10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto border border-blue-100">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Exercise Knowledge Engine</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">O AI Coach montará o treino ideal agora</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo Estratégico</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.values(Goal).map(g => (
                                        <button 
                                            key={g} onClick={() => setParams({...params, goal: g})}
                                            className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${params.goal === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                                        >{g}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foco Muscular</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => {
                                                const current = params.focusMuscles;
                                                if (current.includes(m)) setParams({...params, focusMuscles: current.filter((x: string) => x !== m)});
                                                else setParams({...params, focusMuscles: [...current, m]});
                                            }}
                                            className={`px-3 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${params.focusMuscles.includes(m) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-400'}`}
                                        >{m}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Duração: {params.duration} min</label>
                                <input 
                                    type="range" min="20" max="90" step="5" value={params.duration} 
                                    onChange={e => setParams({...params, duration: parseInt(e.target.value)})}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={onBuild} 
                                disabled={loading}
                                className="w-full py-6 bg-blue-600 rounded-3xl font-black text-white uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Gerar Treino Mágico</>}
                            </button>
                            <button onClick={onClose} className="w-full py-2 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors">Fechar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Dashboard;
