import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, WorkoutHistory } from '../../types';
import { authApi, isGuestSession } from '../../lib/api/authApi';
import { workoutApi } from '../../lib/api/workoutApi';
import { useNavigation } from '../../App';
import { MoreVertical, Plus, Flame, Play, Layers3, TrendingUp, FileText, Edit2, Trash2, Dumbbell, Copy, Calendar, Award, Compass, Heart, FolderPlus, Globe, RefreshCw } from 'lucide-react';
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
import { supabase } from '../../lib/api/supabase';
import { Goal, ExperienceLevel, MuscleGroup } from '../../types';
import { Sparkles, Loader2, Clock, CheckCircle2, Shield, Star, Activity, AlertTriangle } from 'lucide-react';
import { ProgressIntelligence } from './ProgressIntelligence';
import { ProtocolEvolutionDashboard } from './components/ProtocolEvolutionDashboard';
import { systemTemplatesApi } from '../../lib/api/systemTemplatesApi';
import { PremiumLibraryV3 } from './components/PremiumLibraryV3';
import { PremiumLibraryComponent } from './components/PremiumLibraryComponent';
import { premiumProtocolsApi } from '../../lib/api/premiumProtocolsApi';
import { premiumProtocolRealtimeService } from '../../lib/api/PremiumProtocolRealtimeService';
import { Crown, Sliders } from 'lucide-react';
import { isAdmin } from '../../lib/utils/auth';
import { playHapticFeedback } from '../../services/athleteMemoryEngine';
import { buildCalendarDays, buildEmotionalGuidance } from './dashboardDayState';
import { getWorkoutCardAvgDuration, getWorkoutCardEvolutionInsight } from './workoutCardInsights';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const prefetch = usePrefetch();
  const isGuestMode = Boolean(localStorage.getItem('kyron_guest_session'));
  
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
  
  // Debug log
  useEffect(() => {
    console.log('[DEBUG] activeFolderId changed to:', activeFolderId);
  }, [activeFolderId]);
  const [activeTab, setActiveTab] = useState<'protocols' | 'evolution' | 'premium'>('protocols');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'workout' | 'folder' } | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  const handleSyncPlan = async () => {
    try {
      setIsSyncing(true);
      const session = await authApi.getSession();
      if (!session?.user) {
        showError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      if (isGuestSession(session)) {
        showError('O modo convidado mantém os dados somente neste aparelho. Crie uma conta grátis para sincronizar.');
        return;
      }
      const userId = session.user.id;

      // 1. Clear caches
      cacheStore.clear();
      localStorage.removeItem(`rubi_dashboard_cache_${userId}`);

      // 2. Fetch all folders
      const { data: userFolders } = await supabase
        .from('workout_folders')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      let targetFolderId = localStorage.getItem('favorite_workout_folder_id');

      // Se não houver pasta configurada localmente ou se ela não existir no banco, pega a mais recente
      if (userFolders && userFolders.length > 0) {
        const folderExists = userFolders.some(f => f.id === targetFolderId);
        if (!folderExists || !targetFolderId) {
          targetFolderId = userFolders[0].id;
          localStorage.setItem('favorite_workout_folder_id', targetFolderId);
        }
      }

      // Re-set active folder id to force visual alignment
      if (targetFolderId) {
        setActiveFolderId(targetFolderId);
        setFavoriteFolderId(targetFolderId);
      }

      // 3. Force query refetch
      await refresh();
      showSuccess('Sincronização Concluída!', 'Seu plano de treino ativo foi sincronizado e carregado com sucesso.');
    } catch (err: any) {
      console.error('Error syncing plan:', err);
      showError('Ocorreu um erro ao sincronizar seu plano.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRegenerate = () => {
    navigate('onboarding');
  };
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [magicParams, setMagicParams] = useState({
    goal: Goal.HYPERTROPHY,
    duration: 45,
    level: ExperienceLevel.BEGINNER,
    focusMuscles: [] as string[]
  });
  const [outdatedFolderIds, setOutdatedFolderIds] = useState<string[]>([]);
  const dashboardQuery = useSmartQuery(isGuestMode ? 'guest_dashboard_data' : 'dashboard_data', async () => {
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

    if (isGuestSession(session)) return workoutApi.getGuestDashboardData();
    return workoutApi.getDashboardData(session.user.id);
  }, {
    revalidateOnFocus: true,
    refreshInterval: 60000
  });

  const { data, status, isFetching, error, refresh, mutate } = dashboardQuery;
  const { profile: storeProfile } = useUserStore();
  const profile = storeProfile || data?.profile;
  const folders = data?.folders || [];
  const workouts = data?.workouts || [];
  const history = data?.history || [];
  const stats = data?.stats || { sessions: 0 };

  const [publicProtocols, setPublicProtocols] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  useEffect(() => {
    if (isGuestMode) {
      setPublicProtocols([]);
      return;
    }
    const loadPublicProtocols = async () => {
      try {
        setLoadingPublic(true);
        const allProtocols = await premiumProtocolsApi.getProtocols();
        // Filtrar protocolos com premium === false (públicos do administrador) e ativos
        const publics = allProtocols.filter(p => p.premium === false && p.is_active !== false && p.status === 'published');
        setPublicProtocols(publics);
      } catch (e) {
        console.warn("Error loading public protocols:", e);
      } finally {
        setLoadingPublic(false);
      }
    };
    loadPublicProtocols();

    // Subscribe to premium protocol real-time updates
    const unsubscribe = premiumProtocolRealtimeService.subscribe((payload) => {
      console.log('[Dashboard] Real-time protocol update received, re-fetching...', payload);
      loadPublicProtocols();
    });

    return () => {
      unsubscribe();
    };
  }, [workouts]);

  const mappedPublicWorkouts = useMemo(() => {
    const list: any[] = [];
    publicProtocols.forEach(p => {
      p.workouts?.forEach((w: any) => {
        list.push({
          id: `public-workout-${p.id}-${w.id}`,
          name: w.name,
          description: w.description || `${p.name} - Ficha Pública`,
          exercises_count: w.exercises?.length || 0,
          is_public_admin: true,
          protocol_id: p.id,
          protocol_name: p.name,
          created_at: p.created_at
        });
      });
    });
    return list;
  }, [publicProtocols]);

  const { nextAction } = usePredictive(profile || null, history, workouts);

  // Dados reais do treino sugerido no card principal (nunca valores fixos/fictícios).
  const suggestedWorkout = useMemo(
    () => (nextAction?.suggestedWorkoutId ? workouts.find(w => w.id === nextAction.suggestedWorkoutId) : undefined),
    [nextAction?.suggestedWorkoutId, workouts]
  );
  const suggestedWorkoutAvgDuration = useMemo(() => {
    if (!suggestedWorkout) return null;
    const suggestedWorkoutHistory = history.filter(h => h.category_id === suggestedWorkout.id && h.completed_at);
    return getWorkoutCardAvgDuration(suggestedWorkoutHistory);
  }, [suggestedWorkout, history]);
  const suggestedWorkoutExercisesCount = suggestedWorkout?.exercises_count ?? null;

  // Check which user folders contain outdated protocols compared to templates published globally
  useEffect(() => {
    async function checkUpdates() {
      if (isGuestMode) return;
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
  }, [folders, isGuestMode]);

  // Alinha o activeFolderId com as pastas existentes do usuário para evitar telas de erro de pasta inexistente ou obsoleta
  useEffect(() => {
    if (folders.length > 0) {
      const isValidFolder = activeFolderId === null || activeFolderId === 'public_admin' || activeFolderId === 'uncategorized' || folders.some(f => f.id === activeFolderId);
      if (!isValidFolder) {
        const favId = localStorage.getItem('favorite_workout_folder_id');
        const favExists = favId && folders.some(f => f.id === favId);
        if (favExists) {
          setActiveFolderId(favId);
        } else if (profile?.active_plan_id && folders.some(f => f.id === profile.active_plan_id)) {
          setActiveFolderId(profile.active_plan_id);
          setFavoriteFolderId(profile.active_plan_id);
          localStorage.setItem('favorite_workout_folder_id', profile.active_plan_id);
        } else {
          setActiveFolderId(folders[0].id);
          setFavoriteFolderId(folders[0].id);
          localStorage.setItem('favorite_workout_folder_id', folders[0].id);
        }
      }
    } else if (folders.length === 0 && activeFolderId && activeFolderId !== 'public_admin' && activeFolderId !== 'uncategorized') {
      setActiveFolderId(null);
    }
  }, [folders, activeFolderId, profile?.active_plan_id]);

  const filteredWorkouts = useMemo(() => {
    if (activeFolderId === 'public_admin') return mappedPublicWorkouts;
    if (activeFolderId === null) return workouts;
    const folderIds = folders.map(f => f.id);
    return workouts.filter(w => {
      if (activeFolderId === 'uncategorized') {
        return !w.folder_id || !folderIds.includes(w.folder_id);
      }
      return w.folder_id === activeFolderId;
    });
  }, [workouts, folders, activeFolderId, mappedPublicWorkouts]);


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

  // Zerar a store ao entrar num treino DIFERENTE do que já estava ativo é
  // correto — descarta estado de sessão obsoleto. Zerar incondicionalmente
  // (como este componente fazia antes) apaga historyId/currentIndex/
  // currentSet de uma sessão em andamento sempre que o usuário volta a este
  // mesmo treino — inclusive ao reabrir o app depois de fechá-lo no meio de
  // uma série — fazendo o WorkoutPlayer tratar a sessão como nova e perder
  // todo o progresso.
  const startWorkoutSession = (workoutId: string) => {
    if (useWorkoutStore.getState().currentWorkoutId !== workoutId) {
      useWorkoutStore.getState().resetWorkout();
    }
    navigate('preparation', { id: workoutId });
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
        startWorkoutSession(category.id);
    } catch (err: any) {
        showError(err);
    } finally {
        setMagicLoading(false);
    }
  };

  // 7-day calendar strip computation
  const calendarDays = useMemo(
    () => buildCalendarDays(history, profile?.preferred_training_days || []),
    [history, profile?.preferred_training_days],
  );

  const emotionalGuidance = useMemo(
    () => buildEmotionalGuidance(history, {
      streak: profile?.workout_streak || 0,
      preferredTrainingDays: profile?.preferred_training_days || [],
    }),
    [profile?.workout_streak, profile?.preferred_training_days, history],
  );

  const localizedDateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [isGuestMode]);

  // Soft Adaptive glows relative to User state or readiness
  const readinessValue = useMemo(() => {
    let score = 78;
    const streak = profile?.workout_streak || 0;
    score += Math.min(streak * 2, 12);
    return Math.min(98, score);
  }, [profile?.workout_streak]);

  const weeklyGoal = Math.min(7, Math.max(1, profile?.preferred_training_days?.length || 3));
  const weeklyCompleted = useMemo(() => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const completedDays = new Set(
      history.filter(h => {
        if (!h.completed_at) return false;
        const completed = new Date(h.completed_at);
        return !Number.isNaN(completed.getTime()) && completed >= monday && completed < nextMonday && completed <= now;
      }).map(h => new Date(h.completed_at!).toLocaleDateString('en-CA'))
    );
    return completedDays.size;
  }, [history]);

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-32 relative overflow-hidden"
      onClick={() => setActiveMenuId(null)}
    >
      {/* Ondas leves da identidade Kyron OS, decorativas e sem bloquear interação */}
      <div className="absolute inset-x-0 top-0 h-[295px] opacity-80 pointer-events-none z-0 bg-[url('/brand/kyron-dashboard-waves.svg')] bg-top bg-cover bg-no-repeat" aria-hidden="true" />

      <div className="max-w-md mx-auto px-6 pt-12 relative z-10">
        
        <div className="mb-5 flex items-center justify-between border-b border-blue-100/40 pb-4" aria-label="Identidade KYRON OS">
          <img src="/icons/kyron-brand-wordmark.svg" alt="Kyron OS" className="h-10 w-auto max-w-[215px] object-contain" />
          <span className="rounded-full bg-blue-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#14558D]">Sua evolução</span>
        </div>

        {/* PREMIUM ADAPTIVE HEADER */}
        <header className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('profile')}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-xl relative z-10 active:scale-95 transition-all p-0.5 mr-0.5"
                title="Acessar Perfil"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-lg font-black text-blue-700">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                )}
              </button>
              
              <div className="flex flex-col">
                <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase leading-none mb-1">
                  Bom dia! Vamos evoluir hoje.
                </p>
                <div className="flex items-baseline gap-1.5">
                  {(() => {
                    const fullName = profile?.name || profile?.full_name || 'Atleta';
                    const parts = fullName.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return (
                        <p className="text-lg font-black text-slate-900 flex gap-1.5 leading-none tracking-tight">
                          <span>{parts[0]}</span>
                          <span className="text-blue-700 font-extrabold">{parts[1]}</span>
                        </p>
                      );
                    }
                    return (
                      <p className="text-lg font-black text-slate-900 leading-none tracking-tight">
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
        </header>

        {/* Approved V1 hierarchy: workout, progress, recommendation, shortcuts. */}
        <section aria-label="Treino de hoje" className="mb-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f3f8ff] via-[#e9f2ff] to-[#dceaff] border border-[#d7e6fb] p-5 text-slate-900 shadow-sm relative">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4b7fbd]">TREINO DE HOJE</p>
            <h2 className="mt-3 text-[27px] font-black leading-tight">{suggestedWorkout?.name || nextAction?.title || 'Seu próximo treino'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{nextAction?.description || 'Escolha seu próximo treino para continuar evoluindo.'}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              {suggestedWorkoutAvgDuration != null && <span className="rounded-xl border border-blue-100 bg-white/75 px-3 py-2 text-slate-700">{suggestedWorkoutAvgDuration} min em média</span>}
              {suggestedWorkoutExercisesCount != null && <span className="rounded-xl border border-blue-100 bg-white/75 px-3 py-2 text-slate-700">{suggestedWorkoutExercisesCount} exercícios</span>}
            </div>
            {suggestedWorkout ? (
              <button type="button" onClick={() => startWorkoutSession(suggestedWorkout.id)} className="mt-5 w-full rounded-2xl bg-[#7BA7FF] px-4 py-4 text-base font-black text-white shadow-lg active:scale-[0.98] transition-transform">Iniciar treino</button>
            ) : (
              <button type="button" onClick={() => setActiveTab('protocols')} className="mt-5 w-full rounded-2xl bg-[#7BA7FF] px-4 py-4 text-base font-black text-white">Escolher treino</button>
            )}
          </div>
        </section>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <section aria-label="Progresso semanal" className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-800">Progresso semanal</p><p className="mt-1 text-[11px] leading-snug text-slate-500">Dias com treino concluído nesta semana</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#16a34a ${Math.min(100, weeklyCompleted / weeklyGoal * 100)}%, #e2e8f0 0)` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">{Math.round(Math.min(100, weeklyCompleted / weeklyGoal * 100))}%</div>
              </div>
              <p className="text-xs font-bold leading-snug text-slate-600"><strong className="block text-lg text-slate-900">{Math.min(weeklyCompleted, weeklyGoal)} de {weeklyGoal}</strong> dias de treino</p>
            </div>
          </section>
          <section aria-label="Sua semana" className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-slate-800">Sua semana</p>
            <p className="mt-3 text-sm font-extrabold leading-tight text-slate-900">{weeklyCompleted >= weeklyGoal ? 'Meta semanal alcançada' : 'Continue evoluindo'}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{weeklyCompleted >= weeklyGoal ? 'Você já atingiu sua meta de dias de treino.' : `Faltam ${Math.max(0, weeklyGoal - weeklyCompleted)} dias de treino para sua meta.`}</p>
          </section>
        </div>
        <nav aria-label="Acessos rápidos" className="mb-7 grid grid-cols-4 gap-2">
          <button type="button" onClick={() => setActiveTab('protocols')} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50 px-1 py-3 text-[11px] font-bold text-blue-950 border border-blue-100"><Layers3 size={23} strokeWidth={2.2} aria-hidden="true" />Protocolos</button>
          <button type="button" onClick={() => setActiveTab('evolution')} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50 px-1 py-3 text-[11px] font-bold text-blue-950 border border-blue-100"><TrendingUp size={23} strokeWidth={2.2} aria-hidden="true" />Evolução</button>
          <button type="button" onClick={() => setActiveTab('premium')} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50 px-1 py-3 text-[11px] font-bold text-amber-700 border border-blue-100"><Crown size={23} strokeWidth={2.2} aria-hidden="true" />Premium</button>
          <button type="button" onClick={() => setActiveTab('protocols')} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-blue-50 px-1 py-3 text-[11px] font-bold text-blue-950 border border-blue-100"><FileText size={23} strokeWidth={2.2} aria-hidden="true" />Fichas</button>
        </nav>

        {/* NAVIGATION TAB CONTROLS */}
        <div className="flex bg-white/70 backdrop-blur-xl p-1 rounded-3xl border border-white/40 mb-6 shadow-sm">
          <button 
            onClick={() => { setActiveTab('protocols'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-normal transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'protocols' ? 'bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white shadow-md shadow-[#7BA7FF]/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Dumbbell size={13} className={activeTab === 'protocols' ? 'text-white' : 'text-slate-400'} />
            Protocolos
          </button>
          <button 
            onClick={() => { setActiveTab('premium'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 pt-[11px] pb-3 px-3 h-[47px] rounded-2xl text-[11px] font-bold uppercase tracking-normal transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'premium' ? 'bg-gradient-to-r from-[#818CF8] to-[#9333EA] text-white shadow-md shadow-[#818CF8]/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Crown size={12} className={activeTab === 'premium' ? 'text-white' : 'text-slate-400'} />
            Biblioteca Premium
          </button>
          <button 
            onClick={() => { setActiveTab('evolution'); if ('vibrate' in navigator) navigator.vibrate(5); }}
            className={`flex-1 h-[47px] w-[127px] py-3 rounded-2xl text-[11px] font-bold uppercase tracking-normal transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'evolution' ? 'bg-gradient-to-r from-[#059669] to-[#10B981] text-white shadow-md shadow-emerald-500/15' : 'text-slate-500 hover:text-slate-855'}`}
          >
            <Activity size={13} className={activeTab === 'evolution' ? 'text-white' : 'text-slate-400'} />
            Evolução
          </button>
        </div>

        {activeTab === 'premium' ? (
          <PremiumLibraryV3 
            profile={profile || null} 
            onRefreshDashboard={refresh} 
            onTabChange={(tab) => setActiveTab(tab)} 
            history={history}
          />
        ) : activeTab === 'protocols' ? (
          <>

            {/* SECONDARY GUIDANCE METRICS (Moved to the top of the Protocols tab per user request) */}
            <div className="pb-8 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none flex items-center gap-1.5 ml-1">
                  <Calendar size={12} className="text-slate-400" />
                  Métricas & Calendário
                </h4>
                <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Sessão Ativa
                </p>
              </div>

              {/* EDITORIAL CALENDAR STRIP PILLS */}
              <div className="flex items-center justify-between gap-2.5 bg-white/70 backdrop-blur-xl p-2 rounded-[2rem] border border-white/50 overflow-x-auto no-scrollbar">
                {calendarDays.map((day) => {
                  let cellClass = "bg-white/40 border-transparent text-slate-400 hover:bg-white/90";
                  let indicatorLabel = null;
                  let cellTitle = '';

                  if (day.state === 'completed') {
                    cellClass = "bg-gradient-to-tr from-[#7BA7FF] to-[#A5C8FF] border-[#7BA7FF]/30 text-white shadow-lg shadow-[#7BA7FF]/25 font-black";
                    indicatorLabel = <span className="absolute bottom-1 text-[8px] tracking-[0.2em] font-extrabold text-white/90 animate-pulse">✓</span>;
                    cellTitle = 'Treino concluído';
                  } else if (day.state === 'partial') {
                    // Sessão parcial: nunca recebe o check de treino completo.
                    cellClass = "bg-amber-50 border-2 border-amber-300 text-amber-700 font-black";
                    indicatorLabel = <span className="absolute bottom-1 text-[8px] font-[1000] text-amber-600">◑</span>;
                    cellTitle = 'Sessão parcial';
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
                    cellTitle = 'Dia de descanso';
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
                      title={cellTitle}
                      aria-label={`${day.dayName} ${day.dayNum}${cellTitle ? ` — ${cellTitle}` : ''}`}
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

              {calendarDays.some(day => day.state === 'partial') && (
                <div className="flex items-center gap-2 -mt-3 ml-1">
                  <span className="text-[11px] font-[1000] text-amber-600 leading-none">◑</span>
                  <p className="text-[11px] font-bold text-amber-700 tracking-tight">
                    Parcial — sessão registrada em parte, sem contar como treino completo.
                  </p>
                </div>
              )}

              {/* EMOTIONAL CALENDAR STRIP GUIDANCE */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-3xl border text-xs font-bold leading-relaxed flex items-center gap-3 shadow-sm transition-all ${emotionalGuidance.color}`}
              >
                <span className="text-xl select-none shrink-0">{emotionalGuidance.emoji}</span>
                <p className="flex-1 text-[11px] font-bold tracking-tight">{emotionalGuidance.text}</p>
              </motion.div>

              {/* SOFT RECOVERY BLOCK FOR BROKEN STREAKS */}
              {profile?.workout_streak === 0 && (profile?.preferred_training_days?.length || 0) > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#EEF4FF] border border-blue-150 rounded-[1.8rem] p-5 flex items-start gap-4 shadow-sm"
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
            </div>

            {/* PROTOCOLS SECTIONS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  Seus Protocolos
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('editor')}
                    onMouseEnter={() => prefetch('editor_init_new', async () => {
                      const user = await authApi.getUser();
                      if (!user) return null;
                      return workoutApi.getWorkoutEditorData(user.id);
                    })}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-500 transition-colors bg-white hover:bg-indigo-50/50 py-1.5 px-3.5 rounded-full border border-slate-100 shadow-[0_2px_6px_rgba(0,0,0,0.01)] cursor-pointer"
                  >
                    <span className="text-[9.5px] font-black uppercase tracking-wider">Criar Nova</span>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
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

                <button
                  onClick={() => setActiveFolderId('uncategorized')}
                  className={`text-[9.5px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeFolderId === 'uncategorized' 
                      ? "bg-gradient-to-r from-[#7BA7FF] to-[#818CF8] text-white shadow-md shadow-[#7BA7FF]/15 border-transparent font-extrabold" 
                      : "bg-white/70 backdrop-blur-xl border border-slate-200/40 text-slate-400 hover:text-[#7BA7FF] hover:bg-white"
                  }`}
                >
                  Sem pasta
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
                  error={error instanceof Error ? error.message : null}
                  isFetching={isFetching}
                  skeleton={<DashboardSkeleton />}
                  onRetry={refresh}
                >
                  {filteredWorkouts.length === 0 ? (
                    <div className="text-center py-10 px-6 bg-slate-50 rounded-[2.5rem] border border-slate-200/60 max-w-md mx-auto my-6 shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        {isGuestMode ? <Dumbbell size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
                        {isGuestMode ? 'Crie seu primeiro plano' : 'Nenhum plano ativo encontrado'}
                      </h3>
                      
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        {isGuestMode
                          ? 'Você ainda não criou um plano neste aparelho. Responda ao onboarding para gerar e salvar sua ficha local.'
                          : 'Nenhum treino ativo foi encontrado. Você pode sincronizar novamente ou gerar um novo plano.'}
                      </p>

                      <div className="flex flex-col gap-2.5">
                        {!isGuestMode && <button
                          onClick={handleSyncPlan}
                          disabled={isSyncing}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          {isSyncing ? (
                            <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : '🔄 Sincronizar Plano'}
                        </button>}
                        
                        <button 
                          onClick={handleRegenerate}
                          disabled={isSyncing}
                          className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-700 text-white py-3.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          {isGuestMode ? 'Gerar meu plano' : 'Gerar novamente'}
                        </button>
                      </div>
                    </div>
                  ) : filteredWorkouts.map((workout) => {
                    const isOptimistic = typeof workout.id === 'string' && workout.id.startsWith('temp-');

                    const workoutHistory = history.filter(h => h.category_id === workout.id && h.completed_at);
                    const exercisesCount = workout.exercises_count ?? 0;
                    const avgDurationMinutes = getWorkoutCardAvgDuration(workoutHistory);

                    const getLastExecutionText = () => {
                      if (workout.is_public_admin) {
                        return 'Disponível para importação';
                      }
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

                    const getEvolutionInsight = () => getWorkoutCardEvolutionInsight(workoutHistory, {
                      isPublicAdmin: workout.is_public_admin,
                      createdAt: workout.created_at,
                    });

                    return (
                      <div key={workout.id} className={`relative group mb-6 ${activeMenuId === workout.id ? 'z-[100]' : 'z-[1]'} ${isOptimistic ? 'opacity-65 grayscale-[0.2]' : ''}`}>
                        <motion.div 
                          onClick={async () => {
                            if (workout.is_public_admin) {
                              setIsPerformingAction(true);
                              try {
                                const session = await authApi.getSession();
                                if (!session?.user) return;
                                await premiumProtocolsApi.cloneToUser(session.user.id, workout.protocol_id);
                                showSuccess("Protocolo Importado!", `O protocolo "${workout.protocol_name}" foi salvo em seus treinos privados.`);
                                refresh();
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsPerformingAction(false);
                              }
                            } else if (!isOptimistic) {
                              startWorkoutSession(workout.id);
                            }
                          }}
                          onMouseEnter={() => !isOptimistic && !workout.is_public_admin && handlePrefetchWorkout(workout.id)}
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
                              {exercisesCount} {exercisesCount === 1 ? 'exercício' : 'exercícios'} • {avgDurationMinutes !== null ? `${avgDurationMinutes} min em média` : '— min'}
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

                          {workout.is_public_admin ? (
                            <div className="flex items-center justify-between border-t border-slate-100/60 pt-3 mt-4 z-25 relative">
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setIsPerformingAction(true);
                                  try {
                                    const session = await authApi.getSession();
                                    if (!session?.user) return;
                                    await premiumProtocolsApi.cloneToUser(session.user.id, workout.protocol_id);
                                    showSuccess("Protocolo Importado!", `O protocolo "${workout.protocol_name}" foi salvo em seus treinos privados.`);
                                    refresh();
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setIsPerformingAction(false);
                                  }
                                }}
                                className="flex items-center gap-1.5 text-[9.5px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/8 hover:bg-amber-500/15 px-3.5 py-2 rounded-full transition-all border border-amber-500/20 shadow-sm"
                              >
                                <FolderPlus size={11} className="text-amber-500" />
                                <span>Importar Protocolo</span>
                              </button>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <Globe size={11} className="text-slate-300" />
                                Público
                              </span>
                            </div>
                          ) : !isOptimistic && (
                            <div className="flex items-center justify-between border-t border-slate-100/60 pt-3 mt-4 z-25 relative">
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startWorkoutSession(workout.id);
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
                                onClick={() => startWorkoutSession(workout.id)}
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
    const focusMuscleGroups = muscleGroups
        .filter((group) => !group.parent_id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((group) => group.name);

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
                                    {(focusMuscleGroups.length > 0
                                        ? focusMuscleGroups
                                        : ['Peito', 'Costas', 'Ombros', 'Braços', 'Abdômen', 'Pernas']
                                    ).map(m => (
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
