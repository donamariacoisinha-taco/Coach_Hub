import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, WorkoutHistory } from '../../types';
import { authApi } from '../../lib/api/authApi';
import { workoutApi } from '../../lib/api/workoutApi';
import { useNavigation } from '../../App';
import { MoreVertical, Plus, Flame, Play, Edit2, Trash2, Dumbbell, Copy, Calendar, Award, Compass, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenState } from '../../components/ui/ScreenState';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useSmartQuery } from '../../hooks/useSmartQuery';
import { usePrefetch } from '../../hooks/usePrefetch';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { usePredictive } from '../../hooks/usePredictive';
import { imagePrefetcher } from '../../lib/utils/imagePrefetcher';
import { useWorkoutStore } from '../../app/store/workoutStore';
import { cacheStore } from '../../lib/cache/cacheStore';
import { ekeService } from '../../domain/eke/ekeService';
import { useUserStore } from '../../store/userStore';
import { Goal, ExperienceLevel, MuscleGroup } from '../../types';
import { Sparkles, Loader2, Clock, CheckCircle2, Shield, Star, Activity } from 'lucide-react';
import { ProgressIntelligence } from './ProgressIntelligence';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const prefetch = usePrefetch();
  
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [activeTab, setActiveTab] = useState<'protocols' | 'evolution'>('protocols');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'workout' | 'folder' } | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
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
  const { profile: storeProfile } = useUserStore();
  const profile = storeProfile || data?.profile;
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
    const currentStoreId = useWorkoutStore.getState().currentWorkoutId;
    if (currentStoreId !== id) {
       cacheStore.clear(`workout_init_${id}`);
    }

    prefetch(`workout_init_${id}`, async () => {
      const user = await authApi.getUser();
      if (!user) return null;
      const initData = await workoutApi.getWorkoutInitData(id, user.id);
      
      if (initData?.exercises) {
        const images = initData.exercises.map(ex => ex.exercise_image).filter(Boolean) as string[];
        imagePrefetcher.prefetchBatch(images);
      }
      
      return initData;
    });
  };

  const handleDeleteWorkout = async (id: string) => {
    setDeleteConfirm(null);
    setIsPerformingAction(true);
    
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
      showSuccess("Treino excluído", "O protocolo foi removido.");
    } catch (err) {
      if (previousData) mutate(previousData);
      showError(err);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setDeleteConfirm(null);
    setIsPerformingAction(true);
    try {
      await workoutApi.deleteFolder(id);
      showSuccess("Pasta excluída", "Os treinos foram movidos para a categoria geral.");
      cacheStore.clear('dashboard_data');
      cacheStore.clearPrefix('editor_init');
      refresh();
    } catch (err) {
      showError(err);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    setCreateFolderLoading(true);
    try {
      const session = await authApi.getSession();
      if (!session?.user) throw new Error("Sessão expirada.");

      const newFolder = await workoutApi.createFolder(session.user.id, name);
      showSuccess("Pasta criada", `A pasta "${name}" foi criada com sucesso.`);
      setShowCreateFolderModal(false);
      cacheStore.clear('dashboard_data');
      cacheStore.clearPrefix('editor_init');
      await refresh();
      setActiveFolderId(newFolder.id);
    } catch (err) {
      showError(err);
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleDuplicateWorkout = async (workout: WorkoutCategory) => {
    const session = await authApi.getSession();
    if (!session?.user) return;

    const newWorkout: WorkoutCategory = {
      ...workout,
      id: `temp-${Date.now()}`,
      name: `${workout.name} (Cópia)`,
      created_at: new Date().toISOString()
    };

    const previousData = data;
    if (data) {
      mutate({
        ...data,
        workouts: [newWorkout, ...data.workouts]
      });
    }
    setActiveMenuId(null);

    try {
      const { exercises } = await workoutApi.getWorkoutInitData(workout.id, session.user.id);
      
      const created = await workoutApi.createCategory({
        user_id: session.user.id,
        name: newWorkout.name,
        description: workout.description,
        folder_id: workout.folder_id
      });

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

      if (data) {
        mutate({
          ...data,
          workouts: data.workouts.map(w => w.id === newWorkout.id ? created : w)
        });
      }
    } catch (err) {
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
        navigate('preparation', { id: category.id });
    } catch (err: any) {
        showError(err);
    } finally {
        setMagicLoading(false);
    }
  };

  // 7-day calendar strip computation
  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    
    // Create completed dates map for faster lookup
    const completedDates = new Set(
      history
        .map(h => {
          if (!h.completed_at) return null;
          return new Date(h.completed_at).toDateString();
        })
        .filter(Boolean)
    );

    const daysOfWeekEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const isToday = i === 0;
      const isFuture = i > 0;
      
      const weekdayNameEn = daysOfWeekEn[d.getDay()];
      const isPreferred = (profile?.preferred_training_days || []).includes(weekdayNameEn);
      const isCompleted = completedDates.has(d.toDateString());

      let state: 'completed' | 'missed' | 'future' | 'rest' = 'rest';
      if (isCompleted) {
        state = 'completed';
      } else if (isPreferred) {
        if (isFuture || isToday) {
          state = 'future';
        } else {
          state = 'missed';
        }
      } else {
        state = 'rest';
      }

      days.push({
        date: d,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase().substring(0, 3),
        isToday,
        isFuture,
        isPreferred,
        isCompleted,
        state,
        id: `cal-${i}-${d.getDate()}`
      });
    }
    return days;
  }, [history, profile?.preferred_training_days]);

  const emotionalGuidance = useMemo(() => {
    const streak = profile?.workout_streak || 0;
    const now = new Date();
    const daysOfWeekEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check if today is preferred
    const todayWdEn = daysOfWeekEn[now.getDay()];
    const todayPreferred = (profile?.preferred_training_days || []).includes(todayWdEn);

    // Check today completed
    const completedToday = history.some(h => {
      if (!h.completed_at) return false;
      return new Date(h.completed_at).toDateString() === now.toDateString();
    });

    if (streak >= 3) {
      return {
        text: "Seu corpo está respondendo perfeitamente ao estímulo. Continue assim!",
        emoji: "🔥",
        color: "text-blue-600 bg-blue-50/60 border-blue-105"
      };
    }

    if (!todayPreferred && !completedToday) {
      return {
        text: "Hoje seu corpo se reconstrói. Hidrate-se e recupere o foco.",
        emoji: "☕",
        color: "text-indigo-600 bg-indigo-50/40 border-indigo-100/30"
      };
    }

    if (todayPreferred && !completedToday) {
      if (streak > 0) {
        return {
          text: "Última chamada para salvar sua sequência de consistência. Que tal 20 minutos de foco hoje?",
          emoji: "⚡",
          color: "text-amber-600 bg-amber-50/80 border-amber-200/50"
        };
      }
      return {
        text: "Sem culpa. O progresso não é linear. Um treino leve hoje é melhor do que nenhum.",
        emoji: "🤝",
        color: "text-purple-600 bg-purple-50/80 border-purple-100"
      };
    }

    return {
      text: "Hoje é dia de construir sobrecarga mecânica progressiva. Bons treinos!",
      emoji: "💪",
      color: "text-emerald-600 bg-emerald-50/80 border-emerald-100"
    };
  }, [profile?.workout_streak, profile?.preferred_training_days, history]);

  const localizedDateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  // Soft Adaptive glows relative to User state or readiness
  const readinessValue = useMemo(() => {
    let score = 78;
    const streak = profile?.workout_streak || 0;
    score += Math.min(streak * 2, 12);
    return Math.min(98, score);
  }, [profile?.workout_streak]);

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-32 relative overflow-hidden"
      onClick={() => setActiveMenuId(null)}
    >
      {/* Dynamic atmospheric fluid background spots (Premium OS feeling) */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[5%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-sky-200/20 to-indigo-300/25 blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[-5%] right-[5%] w-[340px] h-[340px] rounded-full bg-gradient-to-br from-purple-200/20 to-teal-100/30 blur-[90px] mix-blend-screen" />
      </div>

      <div className="max-w-md mx-auto px-6 pt-12 relative z-10">
        
        {/* PREMIUM ADAPTIVE HEADER */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('profile')}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-2xl relative z-10 active:scale-95 transition-all p-0.5"
                title="Acessar Perfil"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-black text-indigo-400">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                )}
              </button>
              
              <div className="flex flex-col">
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase leading-none mb-1">
                  Atleta de Performance
                </p>
                <div className="flex items-baseline gap-1.5">
                  {(() => {
                    const fullName = profile?.name || profile?.full_name || 'Atleta';
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (
                        <p className="text-xl font-black text-slate-900 flex gap-1.5 leading-none tracking-tight">
                          <span>{parts[0]}</span>
                          <span className="text-indigo-400 font-extrabold">{parts[1]}</span>
                        </p>
                      );
                    }
                    return (
                      <p className="text-xl font-black text-slate-900 leading-none tracking-tight">
                        {fullName}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* AI Action Trigger */}
            <button 
              onClick={() => setShowMagicModal(true)}
              className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-indigo-500 hover:text-indigo-600 hover:scale-105 active:scale-95 transition-all"
              title="Ativar Treino Mágico Inteligente"
            >
              <Sparkles size={18} className="animate-pulse" />
            </button>
          </div>

          <p className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-4 flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            {localizedDateStr}
          </p>
            {/* EDITORIAL CALENDAR STRIP PILLS (Consistency Intelligence Strip) */}
          <div className="flex items-center justify-between gap-2.5 bg-white/70 backdrop-blur-xl p-2 rounded-[2rem] border border-white/50 mb-3 overflow-x-auto no-scrollbar">
            {calendarDays.map((day) => {
              let cellClass = "bg-white/40 border-transparent text-slate-400 hover:bg-white/90";
              let indicatorLabel = null;

              if (day.state === 'completed') {
                cellClass = "bg-gradient-to-tr from-[#7BA7FF] to-[#A5C8FF] border-[#7BA7FF]/30 text-white shadow-lg shadow-[#7BA7FF]/25 font-black";
                indicatorLabel = <span className="absolute bottom-1 text-[8px] tracking-[0.2em] font-extrabold text-white/90 animate-pulse">✓</span>;
              } else if (day.state === 'missed') {
                cellClass = "bg-slate-50/50 border-2 border-dashed border-[#C4B5FD]/70 text-[#8B5CF6]/85 hover:bg-slate-50";
                indicatorLabel = <span className="absolute bottom-0.5 text-[7.5px] scale-90 font-[1000] text-[#8B5CF6]/70 uppercase tracking-widest">•</span>;
              } else if (day.state === 'future') {
                cellClass = "bg-white/90 border-2 border-dotted border-[#7BA7FF]/40 text-[#7BA7FF]/90 hover:border-[#7BA7FF] shadow-sm";
                indicatorLabel = <span className="absolute bottom-0.5 text-[7px] animate-pulse uppercase font-extrabold tracking-widest">…</span>;
              } else {
                // Rest day
                cellClass = "bg-slate-100/40 border border-slate-100 text-slate-400 hover:bg-slate-50";
                indicatorLabel = <span className="absolute bottom-1 text-[8px]">☕</span>;
              }

              return (
                <motion.div 
                  key={day.id} 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => {
                    if ('vibrate' in navigator) navigator.vibrate(5);
                  }}
                  className={`flex-1 flex flex-col items-center py-3 rounded-2xl border relative transition-all min-w-[43px] cursor-pointer ${cellClass}`}
                >
                  <span className="text-[7.5px] font-[1000] tracking-widest leading-none mb-2 uppercase">{day.dayName}</span>
                  <span className="text-sm font-black tracking-tighter leading-none mb-1">{day.dayNum}</span>
                  {indicatorLabel}
                  {day.isToday && (
                    <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 shadow-md ring-2 ring-white" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* EMOTIONAL CALENDAR STRIP GUIDANCE AND NOTIFICATIONS */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-3xl border text-xs font-bold leading-relaxed mb-6 flex items-center gap-3 shadow-sm transition-all ${emotionalGuidance.color}`}
          >
            <span className="text-xl select-none shrink-0">{emotionalGuidance.emoji}</span>
            <p className="flex-1 text-[11px] font-bold tracking-tight">{emotionalGuidance.text}</p>
          </motion.div>

          {/* SOFT RECOVERY BLOCK FOR BROKEN STREAKS */}
          {profile?.workout_streak === 0 && (profile?.preferred_training_days?.length || 0) > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#EEF4FF] border border-blue-150 rounded-[1.8rem] p-5 mb-6 flex items-start gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[#7BA7FF]/15 text-[#7BA7FF] flex items-center justify-center text-lg shrink-0 shadow-inner">
                🤝
              </div>
              <div className="space-y-1">
                <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">Reinício de Aço • Coach Rubi</h5>
                <p className="text-[11.5px] font-bold leading-relaxed text-slate-700">
                  Sem pressão. Reiniciar é parte natural do processo biológico de adaptação. O seu próximo treino é o único passo que importa agora.
                </p>
              </div>
            </motion.div>
          )}

          {/* QUICK READINESS & SEQUENCY CARDS (Orange dominance REMOVED) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-[1.8rem] p-4 border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.04)] flex flex-col justify-between min-h-[104px] hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
              <div>
                <span className="block text-[8px] font-black text-slate-450 uppercase tracking-[0.2em] mb-1">Score Prontidão</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-[#7BA7FF] tabular-nums">{readinessValue}%</span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase select-none">neuro</span>
                </div>
              </div>
              <div className="w-full bg-slate-100/50 h-1 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-[#7BA7FF] to-[#A5C8FF] rounded-full" style={{ width: `${readinessValue}%` }} />
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[1.8rem] p-4 border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.04)] flex flex-col justify-between min-h-[104px] hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all">
              <div>
                <span className="block text-[8px] font-black text-slate-450 uppercase tracking-[0.2em] mb-1">Consistência</span>
                <div className="flex items-baseline gap-1 mt-1">
                  {profile?.workout_streak && profile.workout_streak > 0 ? (
                    <span className="text-base font-black tracking-tight text-[#818CF8]">
                      🔥 {profile.workout_streak} {profile.workout_streak === 1 ? 'dia' : 'dias'}
                    </span>
                  ) : (
                    <span className="text-[14px] font-black tracking-tight text-slate-650">
                      {(() => {
                        const daysOfWeekEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const todayWdEn = daysOfWeekEn[new Date().getDay()];
                        const isTodayPref = profile?.preferred_training_days?.includes(todayWdEn);
                        if (isTodayPref) return "⚡ Ativo Hoje";
                        return "💤 Em recuperação";
                      })()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${profile?.workout_streak ? 'bg-emerald-400 animate-pulse' : 'bg-[#7BA7FF]/60'}`} />
                <span className="text-[8.5px] font-[1000] text-slate-500 uppercase tracking-wider truncate">
                  {profile?.workout_streak && profile.workout_streak > 0 ? "Foco Ativo" : "Estratégia Rubi"}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* NAVIGATION TAB CONTROLS */}
        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-[2rem] border border-white/70 mb-8 shadow-inner">
          <button 
            onClick={() => { setActiveTab('protocols'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'protocols' ? 'bg-white text-[#7BA7FF] shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Dumbbell size={13} className={activeTab === 'protocols' ? 'text-[#7BA7FF]' : 'text-slate-400'} />
            Protocolos
          </button>
          <button 
            onClick={() => { setActiveTab('evolution'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'evolution' ? 'bg-[#7BA7FF] text-white shadow-md shadow-[#7BA7FF]/15 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Activity size={13} className={activeTab === 'evolution' ? 'text-white animate-pulse' : 'text-slate-400'} />
            Evolução
          </button>
        </div>

        {activeTab === 'protocols' ? (
          <>
            {/* FEATURED ADAPTIVE ACTION CARD - PREDICTIVE ACTION (Apple Health & Oura Inspired Premium Style) */}
            <AnimatePresence>
              {nextAction && (
                <motion.section 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="mb-8 font-sans"
                >
                  <div className="w-full bg-[#F3F5F9] bg-gradient-to-br from-[#F7F8FC] via-[#EEF2F8] to-[#E8EDF5] rounded-[2.2rem] p-7 shadow-[0_10px_40px_rgba(15,23,42,0.06)] relative overflow-hidden flex flex-col items-start border border-white/70">
                    {/* Living high-tech biometrics background ambient glows (Ultra-slow movement) */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.15, 1], 
                        x: [0, 8, 0], 
                        y: [0, -8, 0] 
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: 12, 
                        ease: "easeInOut" 
                      }}
                      className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/[0.08] rounded-full blur-[45px] pointer-events-none" 
                    />
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1], 
                        x: [0, -6, 0], 
                        y: [0, 6, 0] 
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: 10, 
                        ease: "easeInOut" 
                      }}
                      className="absolute bottom-0 left-0 w-44 h-44 bg-purple-500/[0.05] rounded-full blur-[40px] pointer-events-none" 
                    />
                    
                    <span className="text-[8px] font-semibold text-indigo-500 uppercase tracking-[0.25em] mb-2.5 ml-0.5 relative z-10 select-none">
                      {nextAction.type === 'start_workout' ? 'Hoje recomendado' : 'Sugestão'}
                    </span>
                    
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-[0.95] uppercase mb-1.5 max-w-[85%] relative z-10">
                      {nextAction.title}
                    </h3>
                    
                    <p className="text-slate-500 font-medium text-xs leading-relaxed mb-6 max-w-[90%] relative z-10">
                      {nextAction.description}
                    </p>

                    <div className="w-full flex items-center justify-between gap-4 relative z-10">
                      {/* Editorial Separated Metadata Block */}
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Duração</span>
                          <span className="text-xs font-semibold text-slate-800">45 minutos</span>
                        </div>
                        <div className="w-px h-6 bg-slate-200/50" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Foco</span>
                          <span className="text-xs font-semibold text-indigo-500">Intensidade</span>
                        </div>
                      </div>

                      {nextAction.suggestedWorkoutId && (
                        <motion.button 
                          onClick={() => {
                            useWorkoutStore.getState().resetWorkout();
                            navigate('preparation', { id: nextAction.suggestedWorkoutId });
                          }}
                          onMouseEnter={() => handlePrefetchWorkout(nextAction.suggestedWorkoutId!)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          style={{ background: 'linear-gradient(135deg, rgba(93, 95, 239, 0.28), rgba(168, 85, 247, 0.18))' }}
                          className="w-13 h-13 rounded-full border border-white/90 shadow-[0_4px_16px_rgba(99,102,241,0.12)] flex items-center justify-center relative group backdrop-blur-md active:scale-95 transition-all pr-[1px]"
                          title="Iniciar Treino Recomendado"
                        >
                          {/* Inner glowing effect on hover */}
                          <span className="absolute inset-0 rounded-full bg-indigo-400/10 group-hover:scale-125 transition-transform duration-500" />
                          <Play size={15} fill="#ffffff" className="ml-[3px] text-white relative z-10 filter drop-shadow-[0_2px_4px_rgba(99,102,241,0.25)]" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* PROTOCOLS SECTIONS */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  Seus Protocolos
                </h2>
                <button 
                  onClick={() => navigate('editor')}
                  onMouseEnter={() => prefetch('editor_init_new', async () => {
                    const user = await authApi.getUser();
                    if (!user) return null;
                    return workoutApi.getWorkoutEditorData(user.id);
                  })}
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-500 transition-colors bg-white hover:bg-indigo-50/50 py-1.5 px-3.5 rounded-full border border-slate-100 shadow-[0_2px_6px_rgba(0,0,0,0.01)]"
                >
                  <span className="text-[9.5px] font-black uppercase tracking-wider">Criar Nova</span>
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* FOLDERS FILTER SCROLL TABS */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar border-b border-slate-100 -mx-6 px-6 pb-2.5">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className={`text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeFolderId === null 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "bg-white text-slate-400 hover:text-slate-700 border border-slate-200/40"
                  }`}
                >
                  Todos
                </button>
                {folders.map((folder) => (
                  <div key={folder.id} className="relative flex items-center shrink-0">
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className={`text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                        activeFolderId === folder.id 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "bg-white text-slate-400 hover:text-slate-700 border border-slate-200/40"
                      }`}
                    >
                      <span>{folder.name}</span>
                      {activeFolderId === folder.id && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ id: folder.id, name: folder.name, type: 'folder' });
                          }}
                          className="hover:text-red-400 transition-colors ml-1 p-0.5"
                          title="Remover Pasta"
                        >
                          <Trash2 size={10} />
                        </span>
                      )}
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-dashed border border-slate-200 text-slate-450 hover:text-slate-800 transition-all whitespace-nowrap bg-slate-50/30"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Nova Pasta</span>
                </button>
              </div>

              {/* WORKOUT LIST CARDS */}
              <div className="space-y-4">
                <ScreenState
                  status={status}
                  isFetching={isFetching}
                  skeleton={<DashboardSkeleton />}
                  onRetry={refresh}
                >
                  {filteredWorkouts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-200/35 p-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Nenhum protocolo nesta pasta</p>
                      <button 
                        onClick={() => navigate('editor')}
                        className="text-xs font-black text-indigo-500 uppercase tracking-widest"
                      >
                        Criar primeiro treino
                      </button>
                    </div>
                  ) : filteredWorkouts.map((workout, idx) => {
                    const isOptimistic = typeof workout.id === 'string' && workout.id.startsWith('temp-');
                    
                    return (
                      <div key={workout.id} className={`relative group ${activeMenuId === workout.id ? 'z-[100]' : 'z-[1]'} ${isOptimistic ? 'opacity-65 grayscale-[0.2]' : ''}`}>
                        <div 
                          onClick={() => {
                            if (!isOptimistic) {
                              useWorkoutStore.getState().resetWorkout();
                              navigate('preparation', { id: workout.id });
                            }
                          }}
                          onMouseEnter={() => !isOptimistic && handlePrefetchWorkout(workout.id)}
                          className="flex items-center justify-between p-6 px-7 rounded-[2rem] bg-white border border-slate-100 hover:scale-[1.01] hover:border-slate-200 hover:shadow-[0_12px_35px_rgba(0,0,0,0.02)] transition-all cursor-pointer group-active:scale-[0.99]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-[900] tracking-tight text-slate-900 uppercase truncate pr-2">
                                {workout.name}
                              </h3>
                              {isOptimistic && (
                                <span className="px-2 py-0.5 bg-indigo-50 rounded text-[7px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
                                  Sincronizando
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px]">
                              <span className="font-extrabold text-indigo-500 uppercase tracking-wider">
                                {workout.description || 'Treino Rubi'}
                              </span>
                              <div className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="font-semibold text-slate-400 uppercase tracking-wider">
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
                              className="w-10 h-10 flex items-center justify-center text-slate-350 hover:text-slate-800 transition-colors z-25 relative"
                            >
                              <MoreVertical size={16} />
                            </button>
                          )}
                        </div>

                        <AnimatePresence>
                          {activeMenuId === workout.id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-4 top-14 z-[110] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 min-w-[170px] space-y-1"
                            >
                              <button 
                                onClick={() => {
                                  useWorkoutStore.getState().resetWorkout();
                                  navigate('preparation', { id: workout.id });
                                }}
                                className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                              >
                                <Play size={13} className="text-slate-400" /> Iniciar
                              </button>
                              <button 
                                onClick={() => navigate('editor', { id: workout.id })}
                                onMouseEnter={() => prefetch(`editor_init_${workout.id}`, async () => {
                                  const user = await authApi.getUser();
                                  if (!user) return null;
                                  return workoutApi.getWorkoutEditorData(user.id, workout.id);
                                })}
                                className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                              >
                                <Edit2 size={13} className="text-slate-400" /> Editar Ficha
                              </button>
                              <button 
                                onClick={() => handleDuplicateWorkout(workout)}
                                className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                              >
                                <Copy size={13} className="text-slate-400" /> Duplicar
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button 
                                onClick={() => {
                                  const w = data?.workouts.find(wf => wf.id === workout.id);
                                  setDeleteConfirm({ id: workout.id, name: w?.name || 'este treino', type: 'workout' });
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
                              >
                                <Trash2 size={13} /> Excluir
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
          </>
        ) : (
          <ProgressIntelligence 
            history={history}
            profile={profile || null}
            workouts={workouts}
          />
        )}

        <MagicBuildModal 
            isOpen={showMagicModal}
            onClose={() => setShowMagicModal(false)}
            loading={magicLoading}
            params={magicParams}
            setParams={setMagicParams}
            onBuild={handleMagicBuild}
            muscleGroups={data?.muscleGroups || []}
        />

        <ConfirmModal 
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm?.type === 'workout') handleDeleteWorkout(deleteConfirm.id);
            else if (deleteConfirm?.type === 'folder') handleDeleteFolder(deleteConfirm.id);
          }}
          title={deleteConfirm?.type === 'workout' ? "Excluir Treino" : "Excluir Pasta"}
          message={deleteConfirm?.type === 'workout' 
            ? `Deseja excluir o protocolo "${deleteConfirm?.name || ''}" permanentemente?` 
            : (deleteConfirm?.type === 'folder' ? `Deseja excluir a pasta "${deleteConfirm?.name || ''}"? Os treinos nela serão movidos para "Todos".` : "")}
          confirmText="Sim, Excluir"
          loading={isPerformingAction}
        />

        <FolderCreateModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onCreate={handleCreateFolder}
          loading={createFolderLoading}
        />
      </div>
    </div>
  );
};

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  loading: boolean;
}

const FolderCreateModal: React.FC<FolderCreateModalProps> = ({ isOpen, onClose, onCreate, loading }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            className="w-full max-w-md bg-white rounded-t-[3rem] p-10 space-y-10 shadow-2xl relative z-10"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-600 mx-auto border border-slate-100 font-bold">
                <Plus size={32} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Criar Nova Pasta</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Organize seus treinos por categoria</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Pasta</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Força, Cardio, Hipertrofia..."
                  className="w-full p-5 rounded-2xl bg-slate-50 text-slate-800 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder-slate-300 text-sm"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full py-6 bg-slate-900 rounded-3xl font-black text-white uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar Pasta'}
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full py-2 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] active:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
                            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto border border-indigo-100">
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
                                            className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${params.goal === g ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-50 text-slate-400'}`}
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
                                            className={`px-3 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${params.focusMuscles.includes(m) ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-650/20' : 'bg-slate-50 text-slate-400'}`}
                                        >{m}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Duração: {params.duration} min</label>
                                <input 
                                    type="range" min="20" max="90" step="5" value={params.duration} 
                                    onChange={e => setParams({...params, duration: parseInt(e.target.value)})}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={onBuild} 
                                disabled={loading}
                                className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-white uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
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
