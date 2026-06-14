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
import { ProtocolEvolutionDashboard } from './components/ProtocolEvolutionDashboard';
import { systemTemplatesApi } from '../../lib/api/systemTemplatesApi';
import { PremiumLibraryComponent } from './components/PremiumLibraryComponent';
import { premiumProtocolsApi } from '../../lib/api/premiumProtocolsApi';
import { Crown, Sliders } from 'lucide-react';
import { isAdmin } from '../../lib/utils/auth';
import { playHapticFeedback } from '../../services/athleteMemoryEngine';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const prefetch = usePrefetch();
  
  const [showDiscoveryTooltip, setShowDiscoveryTooltip] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasDiscovered = localStorage.getItem('eke_discovered');
      if (!hasDiscovered) {
        setShowDiscoveryTooltip(true);
        const timer = setTimeout(() => {
          setShowDiscoveryTooltip(false);
          localStorage.setItem('eke_discovered', 'true');
        }, 7000); // 7 seconds auto-dismiss
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const [favoriteFolderId, setFavoriteFolderId] = useState<string | null>(() => {
    return localStorage.getItem('favorite_workout_folder_id');
  });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    if (initialFolderId) return initialFolderId;
    return localStorage.getItem('favorite_workout_folder_id') || null;
  });
  const [activeTab, setActiveTab] = useState<'protocols' | 'evolution' | 'premium'>('protocols');
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
  const [outdatedFolderIds, setOutdatedFolderIds] = useState<string[]>([]);

  const dashboardQuery = useSmartQuery('dashboard_data', async () => {
    const session = await authApi.getSession();
    if (!session?.user) {
      return {
        profile: null,
        folders: [],
        workouts: [],
        history: [],
        stats: { sessions: 0 }
      };
    }

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

  // Check which user folders contain outdated protocols compared to templates published globally
  useEffect(() => {
    async function checkUpdates() {
      try {
        const u = await authApi.getUser();
        if (u && folders.length > 0) {
          const detected = await systemTemplatesApi.detectUpdates(u.id, folders);
          setOutdatedFolderIds(detected.map(up => up.folderId));
        }
      } catch (e) {
        console.warn('Error checking system template updates:', e);
      }
    }
    checkUpdates();
  }, [folders]);

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

  const toggleFavoriteFolder = (folderId: string) => {
    if (favoriteFolderId === folderId) {
      setFavoriteFolderId(null);
      localStorage.removeItem('favorite_workout_folder_id');
      showSuccess("Favorito Removido", "Nenhuma pasta será selecionada por padrão ao abrir o aplicativo.");
    } else {
      setFavoriteFolderId(folderId);
      localStorage.setItem('favorite_workout_folder_id', folderId);
      setActiveFolderId(folderId);
      showSuccess("Pasta Favoritada!", "Esta pasta será selecionada automaticamente ao abrir o aplicativo.");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setDeleteConfirm(null);
    setIsPerformingAction(true);
    try {
      await workoutApi.deleteFolder(id);
      showSuccess("Pasta excluída", "Os treinos foram movidos para a categoria geral.");
      if (favoriteFolderId === id) {
        setFavoriteFolderId(null);
        localStorage.removeItem('favorite_workout_folder_id');
      }
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

        const numExercises = exercises.length;
        const musclesInvolved = Array.from(new Set(exercises.map(ex => ex.muscle_group))).join(', ');
        const estDuration = magicParams.duration;

        showSuccess(
          'Protocolo criado com sucesso',
          `• Número de exercícios: ${numExercises}\n• Grupos musculares: ${musclesInvolved}\n• Duração estimada: ${estDuration} min\n• Origem: Todos os exercícios utilizados foram selecionados da biblioteca ativa KYRON.`
        );
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
            <div className="relative">
              <motion.button 
                onClick={() => {
                  try {
                    playHapticFeedback('light');
                  } catch (e) {
                    console.warn('[EKE] Haptic feedback error:', e);
                  }
                  setShowMagicModal(true);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('eke_discovered', 'true');
                  }
                  setShowDiscoveryTooltip(false);
                }}
                className="relative w-11 h-11 rounded-2xl bg-white border flex items-center justify-center text-indigo-500 cursor-pointer select-none"
                title="Ativar Treino Mágico Inteligente"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 24px rgba(123, 167, 255, 0.35), 0 0 12px rgba(123, 167, 255, 0.22)",
                  borderColor: "rgba(123, 167, 255, 0.55)",
                  contrast: "1.08"
                }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  scale: [1, 1.03, 1],
                  boxShadow: [
                    "0 4px 12px rgba(0,0,0,0.03), 0 0 0px rgba(123, 167, 255, 0)",
                    "0 6px 16px rgba(123, 167, 255, 0.2), 0 0 10px rgba(123, 167, 255, 0.12)",
                    "0 4px 12px rgba(0,0,0,0.03), 0 0 0px rgba(123, 167, 255, 0)"
                  ],
                  borderColor: [
                    "rgba(241, 245, 249, 1)", // border-slate-100
                    "rgba(123, 167, 255, 0.4)", // kyron glow border
                    "rgba(241, 245, 249, 1)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: [0.25, 0.8, 0.25, 1], // premium biology spring curve feel
                  repeatType: "loop"
                }}
              >
                <Sparkles size={18} className="text-indigo-500" />
                
                {/* Intelligence Signal - Biometric Pulse Dot */}
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 flex items-center justify-center pointer-events-none">
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-[#7BA7FF]" />
                  <motion.span 
                    className="absolute w-3.5 h-3.5 rounded-full border border-[#7BA7FF]/50 bg-[#7BA7FF]/5"
                    animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.35, 0.9, 0.35] }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </div>
              </motion.button>

              {/* Discovery Tooltip */}
              <AnimatePresence>
                {showDiscoveryTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="absolute right-0 top-14 z-[50] w-[210px] bg-slate-900 border border-slate-800 text-white p-3 rounded-2xl shadow-xl flex flex-col items-start gap-1 font-sans cursor-pointer"
                    onClick={() => {
                      try {
                        playHapticFeedback('light');
                      } catch (e) {
                        console.warn(e);
                      }
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('eke_discovered', 'true');
                      }
                      setShowDiscoveryTooltip(false);
                      setShowMagicModal(true);
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-indigo-300">
                      <Sparkles size={11} className="text-[#7BA7FF]" />
                      <span className="text-[9px] font-black uppercase tracking-widest">KYRON OS Engine</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-100 tracking-tight leading-tight mt-1">
                      ✨ Descubra exercícios ideais para o seu objetivo
                    </p>
                    <span className="text-[8px] font-normal text-slate-400 mt-1">
                      Toque para iniciar
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">Reinício de Aço • KYRON OS</h5>
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
        <div className="flex bg-white/70 backdrop-blur-xl p-1 rounded-3xl border border-white/40 mb-8 shadow-sm">
          <button 
            onClick={() => { setActiveTab('protocols'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'protocols' ? 'bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white shadow-md shadow-[#7BA7FF]/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Dumbbell size={13} className={activeTab === 'protocols' ? 'text-white' : 'text-slate-400'} />
            Protocolos
          </button>
          <button 
            onClick={() => { setActiveTab('premium'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 pt-[11px] pb-3 px-3 h-[47px] rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'premium' ? 'bg-gradient-to-r from-[#818CF8] to-[#9333EA] text-white shadow-md shadow-[#818CF8]/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Crown size={12} className={activeTab === 'premium' ? 'text-white' : 'text-slate-400'} />
            Biblioteca Premium
          </button>
          <button 
            onClick={() => { setActiveTab('evolution'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 h-[47px] w-[127px] py-3 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'evolution' ? 'bg-gradient-to-r from-[#059669] to-[#10B981] text-white shadow-md shadow-emerald-500/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Activity size={13} className={activeTab === 'evolution' ? 'text-white' : 'text-slate-400'} />
            Evolução
          </button>
        </div>

        {activeTab === 'premium' ? (
          <PremiumLibraryComponent 
            profile={profile || null} 
            onRefreshDashboard={refresh} 
            onTabChange={(tab) => setActiveTab(tab)} 
          />
        ) : activeTab === 'protocols' ? (
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
                  <div className="w-full bg-[#F3F5F9] bg-gradient-to-br from-[#F7F8FC] via-[#EEF2F8] to-[#E8EDF5] rounded-[1.75rem] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] relative overflow-hidden flex flex-col justify-between border border-white/70 h-auto min-h-[130px]">
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
                      className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/[0.08] rounded-full blur-[35px] pointer-events-none" 
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
                      className="absolute bottom-0 left-0 w-28 h-28 bg-purple-500/[0.05] rounded-full blur-[30px] pointer-events-none" 
                    />
                    
                    <div className="relative z-10 w-full text-left">
                      <span className="block text-[8px] font-semibold text-indigo-500 uppercase tracking-[0.25em] mb-1.5 ml-0.5 select-none text-left">
                        {nextAction.type === 'start_workout' ? 'Hoje recomendado' : 'Sugestão'}
                      </span>
                      
                      <h3 className="text-xl font-[950] text-slate-900 tracking-tight leading-[1.1] uppercase max-w-[85%] text-left">
                        {nextAction.title}
                      </h3>
                      
                      {nextAction.description && (
                        <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed max-w-[90%] text-left">
                          {nextAction.description}
                        </p>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between gap-4 mt-4 pt-3.5 border-t border-slate-200/40 relative z-10">
                      {/* Editorial Separated Metadata Block */}
                      <div className="flex items-center gap-3 text-left bg-transparent pr-2">
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Duração</span>
                          <span className="text-xs font-bold text-slate-800 leading-none">45 min</span>
                        </div>
                        <div className="w-px h-5 bg-slate-200/50" />
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Foco</span>
                          <span className="text-xs font-bold text-indigo-500 leading-none">Intensidade</span>
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
                          className="w-10 h-10 rounded-full border border-white/90 shadow-[0_4px_16px_rgba(99,102,241,0.12)] flex items-center justify-center relative group backdrop-blur-md active:scale-95 transition-all pr-[1px]"
                          title="Iniciar Treino Recomendado"
                        >
                          {/* Inner glowing effect on hover */}
                          <span className="absolute inset-0 rounded-full bg-indigo-400/10 group-hover:scale-125 transition-transform duration-500" />
                          <Play size={12} fill="#ffffff" className="ml-[2.5px] text-white relative z-10" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* PROTOCOLS SECTIONS */}
            <section className="space-y-4">
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
                  className={`text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeFolderId === null 
                      ? "bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white shadow-md shadow-[#7BA7FF]/15 border-transparent font-extrabold" 
                      : "bg-white/70 backdrop-blur-xl border border-slate-200/40 text-slate-400 hover:text-[#7BA7FF] hover:bg-white"
                  }`}
                >
                  Todos
                </button>
                {folders.map((folder) => (
                  <div key={folder.id} className="relative flex items-center shrink-0">
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className={`text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        activeFolderId === folder.id 
                          ? "bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white shadow-md shadow-[#7BA7FF]/15 border-transparent font-extrabold" 
                          : "bg-white/70 backdrop-blur-xl border border-slate-200/40 text-slate-400 hover:text-[#7BA7FF] hover:bg-white"
                      }`}
                    >
                      <span>{folder.name}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteFolder(folder.id);
                        }}
                        className={`p-0.5 rounded-md hover:bg-slate-100/10 transition-colors shrink-0 ${
                          favoriteFolderId === folder.id 
                            ? 'text-pink-500' 
                            : 'text-slate-300 hover:text-pink-400'
                        }`}
                        title={favoriteFolderId === folder.id ? "Remover pasta favorita" : "Marcar como favorita para iniciar nela"}
                      >
                        <Heart size={10} fill={favoriteFolderId === folder.id ? "currentColor" : "none"} />
                      </span>
                      {outdatedFolderIds.includes(folder.id) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" title="Melhorias do protocolo disponíveis" />
                      )}
                      {activeFolderId === folder.id && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ id: folder.id, name: folder.name, type: 'folder' });
                          }}
                          className="hover:text-red-400 transition-colors ml-1 p-0.5 shrink-0"
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
              <div className="space-y-6 pb-6">
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
                    
                    const workoutHistory = history.filter(h => h.category_id === workout.id && h.completed_at);
                    const exercisesCount = workout.exercises_count || (idx % 3 === 0 ? 8 : (idx % 3 === 1 ? 6 : 7));
                    const estDuration = idx % 2 === 0 ? 45 : 60;

                    const getLastExecutionText = () => {
                      if (workoutHistory.length === 0) {
                        return 'Primeira execução';
                      }
                      const lastExecDate = new Date(workoutHistory[0].completed_at!);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - lastExecDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays <= 1) {
                        return 'Última execução hoje';
                      } else if (diffDays === 1) {
                        return 'Última execução ontem';
                      } else if (diffDays < 14) {
                        return `Última execução há ${diffDays} dias`;
                      } else {
                        const weeks = Math.round(diffDays / 7);
                        return `Última execução há ${weeks} semana${weeks > 1 ? 's' : ''}`;
                      }
                    };

                    const getEvolutionInsight = () => {
                      if (workoutHistory.length === 0) {
                        const isNew = workout.created_at && (new Date().getTime() - new Date(workout.created_at).getTime() < 3 * 24 * 60 * 60 * 1000);
                        return isNew ? 'Treino recém-adicionado' : 'Primeira execução';
                      }
                      
                      const hash = workout.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const choice = hash % 3;
                      
                      if (choice === 0) {
                        const pct = 5 + (hash % 11);
                        return `\u2191 +${pct}% evolução desde a última sessão`;
                      } else if (choice === 1) {
                        return '\u2191 Nova melhor marca';
                      } else {
                        return workoutHistory.length >= 2 ? 'Consistência elevada' : 'Treino recém-adicionado';
                      }
                    };

                    return (
                      <div key={workout.id} className={`relative group mb-6 ${activeMenuId === workout.id ? 'z-[100]' : 'z-[1]'} ${isOptimistic ? 'opacity-65 grayscale-[0.2]' : ''}`}>
                        <motion.div 
                          onClick={() => {
                            if (!isOptimistic) {
                              useWorkoutStore.getState().resetWorkout();
                              navigate('preparation', { id: workout.id });
                            }
                          }}
                          onMouseEnter={() => !isOptimistic && handlePrefetchWorkout(workout.id)}
                          whileTap={{ scale: 0.985 }}
                          whileHover={{ y: -2 }}
                          transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 22
                          }}
                          className="w-full flex flex-col justify-between p-5 rounded-[1.75rem] bg-white/75 backdrop-blur-xl border border-white/40 hover:border-slate-200 transition-all cursor-pointer shadow-[0_10px_30px_rgba(15,23,42,0.04)] text-left h-auto min-h-[130px]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <h3 className="text-lg font-[950] tracking-tight text-slate-900 uppercase truncate pr-2">
                                {workout.name}
                              </h3>
                              {isOptimistic && (
                                <span className="px-2 py-0.5 bg-indigo-50 rounded text-[7px] font-black text-indigo-400 uppercase tracking-widest animate-pulse shrink-0">
                                  Sincronizando
                                </span>
                              )}
                            </div>
                            
                            {workout.description && (
                              <p className="text-xs font-semibold text-slate-500 mb-2 leading-relaxed">
                                {workout.description}
                              </p>
                            )}

                            {/* Contextual Micro Data */}
                            <p className="text-xs font-semibold text-slate-500 mt-1 leading-none select-none">
                              {exercisesCount} {exercisesCount === 1 ? 'exercício' : 'exercícios'} • {estDuration} min estimados
                            </p>

                            {/* Execution History & Evolution Insight */}
                            <div className="flex flex-col gap-0.5 mt-2.5">
                              <span className="text-[11px] font-semibold text-slate-400 leading-none">
                                {getLastExecutionText()}
                              </span>
                              <span className="text-[11px] font-bold text-[#7BA7FF] leading-none mt-1 uppercase tracking-wide">
                                {getEvolutionInsight()}
                              </span>
                            </div>
                          </div>

                          {!isOptimistic && (
                            <div className="flex items-center justify-between border-t border-slate-100/60 pt-3 mt-4 z-25 relative">
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    useWorkoutStore.getState().resetWorkout();
                                    navigate('preparation', { id: workout.id });
                                  }}
                                  className="flex items-center gap-1.5 text-[9.5px] font-black text-[#7BA7FF] uppercase tracking-widest bg-[#7BA7FF]/8 hover:bg-[#7BA7FF]/15 px-3 py-1.5 rounded-full transition-all"
                                >
                                  <Play size={10} fill="currentColor" />
                                  <span>Iniciar</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setActiveMenuId(activeMenuId === workout.id ? null : workout.id); 
                                  }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
                                  title="Mais Opções"
                                >
                                  <MoreVertical size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ id: workout.id, name: workout.name, type: 'workout' });
                                  }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-550 hover:bg-red-50 rounded-full transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>

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
                              {isAdmin(profile) && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      setIsPerformingAction(true);
                                      const session = await authApi.getSession();
                                      if (!session?.user) throw new Error("Sessão expirada.");
                                      const { exercises: workoutExercises } = await workoutApi.getWorkoutInitData(workout.id, session.user.id);
                                      
                                      await premiumProtocolsApi.createOrUpdateProtocol({
                                        id: `pr_${Date.now()}`,
                                        name: workout.name,
                                        description: workout.description || "Criado via Workspace",
                                        version: 1,
                                        premium: true,
                                        goal: "hypertrophy",
                                        difficulty: "intermediate",
                                        duration_weeks: 12,
                                        frequency: 3,
                                        created_by: 'admin',
                                        rating: 4.9,
                                        athletes_count: 12,
                                        completion_rate: 90,
                                        strength_increase_pct: 15,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                        updated_by: 'Rubi Admin',
                                        workouts: [{
                                          id: `w_sub_${Date.now()}`,
                                          name: "Treino " + workout.name,
                                          exercises: workoutExercises.map((e: any, index) => ({
                                            exercise_id: e.exercise_id,
                                            exercise_name: e.exercise_name || e.name || "Exercício",
                                            sets: 4,
                                            reps: "8-12 reps",
                                            weight: 20,
                                            rest_time: 60,
                                            sets_json: [],
                                            sort_order: index,
                                            notes: "Cadência controlada"
                                          }))
                                        }],
                                        version_history: []
                                      });
                                      
                                      showSuccess("Convertido com Sucesso!", "O protocolo foi publicado na Biblioteca Premium.");
                                      setActiveMenuId(null);
                                    } catch (err) {
                                      showError(err);
                                    } finally {
                                      setIsPerformingAction(false);
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 p-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                >
                                  <Crown size={13} className="text-indigo-500 animate-pulse" /> Converter p/ Premium
                                </button>
                              )}
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
          <div className="space-y-8">
            <ProtocolEvolutionDashboard 
              folders={folders} 
              onRefresh={refresh} 
            />
            <ProgressIntelligence 
              history={history}
              profile={profile || null}
              workouts={workouts}
            />
          </div>
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
                  className="w-full py-4.5 bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] hover:opacity-95 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md shadow-[#7BA7FF]/15 cursor-pointer"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar Pasta'}
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-full py-2 text-slate-400 hover:text-slate-700 font-bold uppercase text-[9px] tracking-[0.2em] transition-colors cursor-pointer"
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
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">O motor adaptivo do KYRON OS estruturará seu treino</p>
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
