
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UserProfile } from './types';
import Auth from './components/Auth';
import SmartOnboarding from './features/onboarding/SmartOnboarding';
import Dashboard from './features/dashboard/Dashboard';
import WorkoutPlayer from './features/workout/WorkoutPlayer';
import WorkoutEditor from './components/WorkoutEditor';
import { WorkoutPreparation } from './components/WorkoutPreparation';
import AdminPanelV2 from './features/admin/AdminPanelV2';
import HistoryView from './components/HistoryView';
import ProfileViewV2 from './features/user/ProfileViewV2';
import ExerciseLibrary from './components/ExerciseLibrary';
import { LandingPage } from './components/LandingPage';
import { useSync } from './hooks/useSync';
import { useUserStore } from './store/userStore';
import { useAuthStore } from './store/authStore';
import { ErrorProvider } from './hooks/useErrorHandler';
import { authApi } from './lib/api/authApi';
import { supabase } from './lib/api/supabase';
import { workoutApi } from './lib/api/workoutApi';
import { profileApi } from './lib/api/profileApi';
import { exerciseApi } from './lib/api/exerciseApi';
import { usePrefetch } from './hooks/usePrefetch';
import { imagePrefetcher } from './lib/utils/imagePrefetcher';
import { cacheStore } from './lib/cache/cacheStore';
import { useWorkoutStore } from './app/store/workoutStore';
import { Home, Dumbbell, History as HistoryIcon, User, Shield, Bolt, Flame, Apple, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ExercisePreviewProvider, useExercisePreview } from './context/ExercisePreviewContext';
import { NavItem } from './components/ui/NavItem';
import { isAdmin } from './lib/utils/auth';
import { ekeService } from './domain/eke/ekeService';
import { MinhaDieta } from './features/dashboard/MinhaDieta';
import kyronLogo from './assets/images/kyron_official_logo_1781087891387.png';

type View = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'workout' | 'preparation' | 'editor' | 'history' | 'admin' | 'profile' | 'library' | 'dieta';
type Theme = 'classic' | 'light' | 'aggressive' | 'bloom' | 'neon-strike';

interface NavigationState { view: View; params: any; }

const PROTECTED_VIEWS: View[] = ['dashboard', 'workout', 'editor', 'history', 'admin', 'profile', 'library', 'dieta', 'preparation'];
interface NavigationContextType {
  current: NavigationState;
  navigate: (view: View, params?: any) => void;
  goBack: () => void;
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
  profile: UserProfile | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within Provider");
  return context;
};

const getPathFromState = (view: View, params: any) => {
  switch (view) {
    case 'landing': return '/';
    case 'dashboard': return '/dashboard';
    case 'workout': return params.id ? `/workout/${params.id}` : '/workout';
    case 'preparation': return params.id ? `/preparation/${params.id}` : '/preparation';
    case 'editor': return params.id ? `/editor/${params.id}` : '/editor';
    case 'profile': return '/profile';
    case 'history': return '/history';
    case 'library': return '/library';
    case 'dieta': return '/dieta';
    case 'admin': return '/admin';
    case 'auth': return '/auth';
    case 'onboarding': return '/onboarding';
    default: return '/';
  }
};

const getStateFromUrl = (): NavigationState => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'landing', params: {} };
  const view = parts[0] as View;
  const id = parts[1];
  const validViews: View[] = ['auth', 'onboarding', 'dashboard', 'workout', 'preparation', 'editor', 'history', 'admin', 'profile', 'library', 'dieta'];
  if (validViews.includes(view)) return { view, params: id ? { id } : {} };
  return { view: 'landing', params: {} };
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const { profile, setProfile } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('coach_theme') as Theme) || 'light');
  const [navState, setNavState] = useState<NavigationState>(getStateFromUrl);
  const { isHydrated } = useWorkoutStore();
  const prefetch = usePrefetch();
  const isInitializing = useRef(false);

  // Initial Prefetching
  useEffect(() => {
    const initPrefetch = async () => {
      // 1. Prefetch most used exercises images
      try {
        const exercises = await exerciseApi.getExercises();
        const topImages = exercises.slice(0, 10).map(ex => ex.image_url).filter(Boolean) as string[];
        imagePrefetcher.prefetchBatch(topImages);
      } catch (e) {
        console.warn("Initial image prefetch failed", e);
      }
    };
    
    initPrefetch();
  }, []);

  // 1. Core Services & Theme
  useSync();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchProfile = async (userId: string) => {
    console.log(`[APP][DEBUG] Buscando/Garantindo perfil do usuário: ${userId}`);
    try {
      if (!isHydrated) {
        console.log("[APP] Aguardando hidratação do store...");
        return; 
      }

      // Garantir que o perfil existe
      const profileData = await profileApi.ensureProfile(userId);

      if (!profileData) {
        console.error(`[APP] Falha crítica: Perfil não pôde ser garantido para ${userId}`);
        setProfile(null);
        navigate('auth');
        return;
      }

      console.log(`[APP] Perfil carregado:`, { 
        id: profileData.id, 
        completed: profileData.onboarding_completed 
      });

      setProfile(profileData);
      
      const urlState = getStateFromUrl();
      
      // Se o onboarding não estiver completo, o usuário DEVE ir para o onboarding
      if (!profileData.onboarding_completed) {
        console.log("[APP] Onboarding incompleto, redirecionando...");
        if (urlState.view !== 'onboarding') {
          navigate('onboarding');
        }
      } else {
        // Se estiver logado e na tela de entrada/auth, decide para onde ir
        if (urlState.view === 'landing' || urlState.view === 'auth' || urlState.view === 'onboarding') {
          const partial = await workoutApi.getPartialSession(userId);

          if (partial) {
            console.log("[APP] Resuming partial session");
            navigate('workout', { id: partial.workout_id });
          } else {
            console.log("[APP] Tudo ok, indo para Dashboard");
            navigate('dashboard');
          }
        }
      }
    } catch (err) {
      console.error("[APP] Erro crítico ao carregar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Efeito de Inicialização Principal
  useEffect(() => {
    // Definimos o timeout de segurança IMEDIATAMENTE para evitar telas brancas infinitas
    const safetyTimeout = setTimeout(() => {
      setLoading(curr => {
        if (curr) console.warn("[APP] Inicialização lenta detectada. Forçando desbloqueio da UI.");
        return false;
      });
    }, 8000); 

    if (!isHydrated) {
      console.log("[APP] Aguardando hidratação do store para iniciar...");
      return () => clearTimeout(safetyTimeout);
    }
    
    if (isInitializing.current) return () => clearTimeout(safetyTimeout);
    isInitializing.current = true;

    const initApp = async () => {
      console.log("[APP] Iniciando inicialização...");
      try {
        await ekeService.initialize();
        console.log("[APP] EKE Initialized");
        const currentSession = await authApi.getSession();
        setSession(currentSession);
        useAuthStore.getState().setSession(currentSession);
        
        if (currentSession) {
          console.log("[APP] Sessão ativa encontrada:", currentSession.user.id);
          await fetchProfile(currentSession.user.id);
        } else {
          console.log("[APP] Nenhuma sessão ativa.");
          setLoading(false);
        }
      } catch (err) {
        console.error("[APP] Erro crítico na inicialização:", err);
        setLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
      }
    };

    initApp();

    const subscription = authApi.onAuthStateChange((event, s) => {
      console.log(`[AUTH] Evento detectado: ${event}`);
      setSession(s);
      useAuthStore.getState().setSession(s);
      if (s) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        if (PROTECTED_VIEWS.includes(getStateFromUrl().view)) {
          navigate('landing');
        }
      }
    });

    const handlePopState = (event: PopStateEvent) => setNavState(event.state || getStateFromUrl());
    window.addEventListener('popstate', handlePopState);
    const cleanupInterval = setInterval(() => cacheStore.cleanup(), 600000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      clearInterval(cleanupInterval);
    };
  }, [isHydrated]); // Executa uma vez após hidratação

  // 3. Efeito Reativo de Perfil
  useEffect(() => {
    if (isHydrated && session && !profile && !loading) {
      fetchProfile(session.user.id);
    }
  }, [isHydrated, session, profile, loading]);

  const navigate = (view: View, params: any = {}) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    const newState = { view, params };
    const path = getPathFromState(view, params);
    try {
      if (window.location.pathname !== path) {
        window.history.pushState(newState, '', path);
      }
    } catch (e) {
      console.warn("History API indisponível:", e);
    }
    setNavState(newState);
  };

  const goBack = () => {
    if (navState.view === 'admin') {
      navigate('dashboard');
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('dashboard');
    }
  };

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('coach_theme', newTheme);
  };

  if (loading) return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Light atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full blur-[100px] bg-[#7BA7FF]/5 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full blur-[100px] bg-[#818CF8]/5" />
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#7BA7FF] border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Carregando Seu OS de Alta Performance...</p>
      </div>
    </div>
  );

  const isSuspended = session?.user?.id && !isAdmin(profile) && (() => {
    try {
      const suspendedIds = JSON.parse(localStorage.getItem('kyron_suspended_user_ids') || '[]');
      return suspendedIds.includes(session.user.id);
    } catch (e) {
      return false;
    }
  })();

  if (isSuspended) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-[#818CF8]/5" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-rose-500/5" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Lock size={28} />
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Acesso Bloqueado</h2>
          <p className="text-[10px] font-bold text-[#7BA7FF] uppercase tracking-widest mt-2">Kyron OS // Segurança de Base de Dados</p>
          
          <p className="text-xs text-slate-450 mt-6 leading-relaxed font-semibold">
            Seu perfil de atleta foi classificado com estado <span className="text-amber-400 font-black uppercase">Suspenso</span> por um administrador do sistema.
          </p>
          <p className="text-xs text-slate-450 mt-3 leading-relaxed font-semibold">
            Suas preferências, treinos, e histórico de evolução permanecem <span className="text-emerald-400 font-black">protegidos e intactos</span> em nossos servidores, mas o acesso ativo aos recursos premium e rotinas está bloqueado temporariamente.
          </p>

          <div className="w-full pt-8 mt-8 border-t border-slate-800">
            <button 
              onClick={async () => {
                await authApi.signOut();
                window.location.reload();
              }}
              className="w-full h-12 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-98 cursor-pointer"
            >
              Entrar com Outro Usuário
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isImmersive = ['workout', 'preparation', 'onboarding', 'editor', 'landing', 'auth'].includes(navState.view);

  const streakValue = profile?.workout_streak || 0;
  const readiness = Math.min(98, 78 + Math.min(streakValue * 2, 12));
  let primaryGlow = "from-[#7BA7FF]/8"; 
  let secondaryGlow = "to-[#818CF8]/6"; 
  
  if (readiness >= 90) {
    primaryGlow = "from-[#FBBF24]/8";
    secondaryGlow = "to-[#7BA7FF]/6";
  } else if (readiness > 70 && readiness < 90) {
    primaryGlow = "from-[#60A5FA]/8";
    secondaryGlow = "to-[#A5C8FF]/6";
  } else {
    primaryGlow = "from-[#818CF8]/8";
    secondaryGlow = "to-[#C084FC]/6";
  }

  return (
    <ErrorProvider>
      <NavigationContext.Provider value={{ current: navState, navigate, goBack, theme, toggleTheme, profile }}>
        <ExercisePreviewProvider>
          <div className="h-screen flex flex-col lg:flex-row bg-[#F8FAFC] overflow-hidden text-slate-900 relative">
          
          {/* Dynamic Living Background Engine - Atmospheric subtle glows */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
            <div className={`absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[130px] mix-blend-multiply living-blur-1 bg-gradient-to-tr ${primaryGlow}`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen living-blur-2 bg-gradient-to-br ${secondaryGlow}`} />
          </div>

          {!isImmersive && session && (
            <aside className="hidden lg:flex w-24 bg-white/70 backdrop-blur-xl border-r border-slate-200/40 flex-col items-center shrink-0 justify-between py-10 shadow-[4px_0_30px_rgba(15,23,42,0.02)] z-30">
               <div className="w-10 h-10 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md border border-white/40 rounded-xl flex items-center justify-center overflow-hidden shadow-md p-0 shrink-0">
                 <img src={kyronLogo} alt="KYRON OS" className="w-full h-full object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
               </div>
               
               {profile?.workout_streak && profile.workout_streak > 0 && (
                 <div className="flex flex-col items-center gap-1.5 my-6">
                   <Flame size={20} className="text-[#818CF8] fill-[#818CF8]/20 animate-pulse" />
                   <span className="text-[10px] font-extrabold text-[#818CF8] tracking-widest uppercase">{profile.workout_streak}d</span>
                 </div>
               )}

                <div className="flex flex-col items-center gap-7 w-full py-4">
                  <NavItem 
                    id="dashboard"
                    icon={Home}
                    label="Feed"
                    showLabel={true}
                    isActive={navState.view === 'dashboard'}
                    onClick={() => navigate('dashboard')}
                    onMouseEnter={() => prefetch('dashboard_data', async () => {
                      const session = await authApi.getSession();
                      return session?.user ? workoutApi.getDashboardData(session.user.id) : null;
                    })}
                  />
                  
                  <NavItem 
                    id="library"
                    icon={Dumbbell}
                    label="Protocols"
                    showLabel={true}
                    isActive={navState.view === 'library'}
                    onClick={() => navigate('library')}
                    onMouseEnter={() => prefetch('exercise_library', async () => {
                      const user = await authApi.getUser();
                      if (!user) return null;
                      const [exercises, muscleGroups, favorites, isAdminUser] = await Promise.all([
                        exerciseApi.getExercises(),
                        exerciseApi.getMuscleGroups(),
                        exerciseApi.getFavorites(user.id),
                        exerciseApi.isAdmin(user.id)
                      ]);
                      return { exercises, muscleGroups, favorites: new Set(favorites), isAdmin: isAdminUser };
                    })}
                  />
                  
                  <NavItem 
                    id="dieta"
                    icon={Apple}
                    label="Nutrition"
                    showLabel={true}
                    isActive={navState.view === 'dieta'}
                    onClick={() => navigate('dieta')}
                  />
                  
                  <NavItem 
                    id="history"
                    icon={HistoryIcon}
                    label="Evolution"
                    showLabel={true}
                    isActive={navState.view === 'history'}
                    onClick={() => navigate('history')}
                    onMouseEnter={() => prefetch('history_data', async () => {
                      const user = await authApi.getUser();
                      return user ? workoutApi.getWorkoutHistory(user.id) : null;
                    })}
                  />

                  {isAdmin(profile) && (
                    <NavItem 
                      id="admin"
                      icon={Shield}
                      label="Admin"
                      showLabel={true}
                      isActive={navState.view === 'admin'}
                      onClick={() => navigate('admin')}
                      badge="Pro"
                    />
                  )}
                  
                  <NavItem 
                    id="profile"
                    icon={User}
                    label="Identity"
                    showLabel={true}
                    isActive={navState.view === 'profile'}
                    onClick={() => navigate('profile')}
                    onMouseEnter={() => prefetch('profile_data', async () => {
                      const user = await authApi.getUser();
                      return user ? profileApi.getProfile(user.id) : null;
                    })}
                  />
                </div>
              </aside>
            )}

          <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 bg-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={navState.view + (navState.params.id || '')}
                initial={{ opacity: 0, scale: 0.995, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.995, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-full"
              >
                {PROTECTED_VIEWS.includes(navState.view) && !session ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                    <div className="w-8 h-8 border-4 border-[#7BA7FF] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Sessão...</p>
                  </div>
                ) : (
                  <>
                    {navState.view === 'landing' && <LandingPage onStart={() => navigate('auth')} onLogin={() => navigate('auth')} />}
                    {navState.view === 'auth' && <Auth onBack={() => navigate('landing')} />}
                    {navState.view === 'onboarding' && <SmartOnboarding />}
                    {navState.view === 'dashboard' && <Dashboard initialFolderId={navState.params?.folderId} />}
                    {navState.view === 'workout' && <WorkoutPlayer workoutId={navState.params.id} />}
                    {navState.view === 'preparation' && <WorkoutPreparation workoutId={navState.params.id} />}
                    {navState.view === 'editor' && <WorkoutEditor workoutId={navState.params.id} />}
                    {navState.view === 'history' && <HistoryView />}
                    {navState.view === 'library' && <ExerciseLibrary />}
                    {navState.view === 'dieta' && <MinhaDieta />}
                    {navState.view === 'profile' && <ProfileViewV2 />}
                    {navState.view === 'admin' && (
                      isAdmin(profile) ? <AdminPanelV2 onBack={goBack} /> : <Dashboard initialFolderId={navState.params?.folderId} />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {!isImmersive && session && navState.view !== 'admin' && (
            <div className="lg:hidden fixed bottom-5 left-2 right-2 min-[370px]:left-4 min-[370px]:right-4 z-50">
              <nav className="h-[4.5rem] bg-white/75 backdrop-blur-xl border border-white/40 px-1 min-[370px]:px-3 flex items-center justify-around rounded-[1.80rem] shadow-[0_12px_45px_rgba(15,23,42,0.08)]">
                {[
                  { id: 'dashboard', icon: Home, label: 'Feed' },
                  { id: 'library', icon: Dumbbell, label: 'Library' },
                  { id: 'dieta', icon: Apple, label: 'Nutrition' },
                  { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true, badge: 'Pro' },
                  { id: 'history', icon: HistoryIcon, label: 'Evolution' },
                  { id: 'profile', icon: User, label: 'Identity' }
                ].filter(item => !item.adminOnly || isAdmin(profile)).map((item) => (
                  <NavItem 
                    key={item.id}
                    id={item.id}
                    icon={item.icon}
                    label={item.label}
                    showLabel={true}
                    isActive={navState.view === item.id}
                    onClick={() => navigate(item.id as View)}
                    badge={item.badge}
                    onMouseEnter={() => {
                      if (item.id === 'dashboard') prefetch('dashboard_data', async () => {
                        const sess = await authApi.getSession();
                        return sess?.user ? workoutApi.getDashboardData(sess.user.id) : null;
                      });
                      if (item.id === 'library') prefetch('exercise_library', async () => {
                        const user = await authApi.getUser();
                        if (!user) return null;
                        const [exercises, muscleGroups, favorites, isAdminUser] = await Promise.all([
                          exerciseApi.getExercises(),
                          exerciseApi.getMuscleGroups(),
                          exerciseApi.getFavorites(user.id),
                          exerciseApi.isAdmin(user.id)
                        ]);
                        return { exercises, muscleGroups, favorites: new Set(favorites), isAdmin: isAdminUser };
                      });
                      if (item.id === 'history') prefetch('history_data', async () => {
                        const user = await authApi.getUser();
                        return user ? workoutApi.getWorkoutHistory(user.id) : null;
                      });
                      if (item.id === 'profile') prefetch('profile_data', async () => {
                        const user = await authApi.getUser();
                        return user ? profileApi.getProfile(user.id) : null;
                      });
                    }}
                  />
                ))}
              </nav>
            </div>
          )}
        </div>
        <GlobalExercisePreviewModal />
      </ExercisePreviewProvider>
    </NavigationContext.Provider>
  </ErrorProvider>
  );
};

const GlobalExercisePreviewModal: React.FC = () => {
  const { previewExercise, closeExercisePreview } = useExercisePreview();

  return (
    <AnimatePresence>
      {previewExercise && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-6 px-4 select-none">
          {/* Background Blur Overlay with Fade Animation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeExercisePreview}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xl cursor-zoom-out"
          />

          {/* Header: Discreto no Canto Superior Direito */}
          <div className="w-full flex justify-end px-4 z-10 shrink-0">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={closeExercisePreview}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/35 backdrop-blur-2xl border border-white/10 text-white flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition active:scale-90"
            >
              <X size={18} strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Centralized Expanded Zoom Window with Drag Down Dismiss Gesture */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.85 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100) {
                closeExercisePreview();
              }
            }}
            className="relative w-full max-w-[90vw] h-[60vh] md:h-[65vh] flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="w-full h-full flex items-center justify-center rounded-[2rem] overflow-hidden"
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit={true}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <img
                    src={previewExercise.image}
                    alt={previewExercise.name}
                    className="max-w-[90vw] max-h-[60vh] md:max-h-[65vh] rounded-[2rem] object-contain shadow-[0_12px_44px_rgba(0,0,0,0.4)] pointer-events-auto select-none"
                    referrerPolicy="no-referrer"
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </motion.div>

          {/* Auxiliar Information Footer */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ delay: 0.08, duration: 0.22 }}
            className="text-center z-10 max-w-[420px] px-6 select-text shrink-0 pb-4 mt-2"
          >
            <h2 className="text-white text-lg font-black tracking-tight leading-snug drop-shadow-sm uppercase">
              {previewExercise.name}
            </h2>
            {previewExercise.muscleGroup && (
              <p className="text-slate-400 text-xs font-bold tracking-widest mt-1.5 uppercase opacity-85">
                {previewExercise.muscleGroup}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default App;
