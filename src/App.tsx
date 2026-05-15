
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UserProfile } from './types';
import Auth from './components/Auth';
import SmartOnboarding from './features/onboarding/SmartOnboarding';
import Dashboard from './features/dashboard/Dashboard';
import WorkoutPlayer from './features/workout/WorkoutPlayer';
import WorkoutEditor from './components/WorkoutEditor';
import AdminPanelV2 from './features/admin/AdminPanelV2';
import HistoryView from './components/HistoryView';
import ProfileViewV2 from './features/user/ProfileViewV2';
import ExerciseLibrary from './components/ExerciseLibrary';
import LandingPage from './components/LandingPage';
import { useSync } from './hooks/useSync';
import { useUserStore } from './store/userStore';
import { useAuthStore } from './store/authStore';
import { ErrorProvider } from './hooks/useErrorHandler';
import { authApi } from './lib/api/authApi';
import { workoutApi } from './lib/api/workoutApi';
import { profileApi } from './lib/api/profileApi';
import { exerciseApi } from './lib/api/exerciseApi';
import { usePrefetch } from './hooks/usePrefetch';
import { imagePrefetcher } from './lib/utils/imagePrefetcher';
import { cacheStore } from './lib/cache/cacheStore';
import { useWorkoutStore } from './app/store/workoutStore';
import { Home, Dumbbell, History as HistoryIcon, User, Shield, Bolt, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavItem } from './components/ui/NavItem';
import { isAdmin } from './lib/utils/auth';
import { ekeService } from './domain/eke/ekeService';

type View = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'workout' | 'editor' | 'history' | 'admin' | 'profile' | 'library';
type Theme = 'classic' | 'light' | 'aggressive' | 'bloom' | 'neon-strike';

interface NavigationState { view: View; params: any; }
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
    case 'editor': return params.id ? `/editor/${params.id}` : '/editor';
    case 'profile': return '/profile';
    case 'history': return '/history';
    case 'library': return '/library';
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
  const validViews: View[] = ['auth', 'onboarding', 'dashboard', 'workout', 'editor', 'history', 'admin', 'profile', 'library'];
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
      // Se estiver logado e na tela de entrada/auth, decide para onde ir
      if (urlState.view === 'landing' || urlState.view === 'auth' || urlState.view === 'onboarding') {
        const partial = await workoutApi.getPartialSession(userId);

        if (partial && profileData.onboarding_completed) {
          console.log("[APP] Resuming partial session");
          navigate('workout', { id: partial.workout_id });
        } else if (!profileData.onboarding_completed) {
          console.log("[APP] Onboarding incompleto, redirecionando...");
          navigate('onboarding');
        } else {
          console.log("[APP] Tudo ok, indo para Dashboard");
          navigate('dashboard');
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
        const protectedViews: View[] = ['dashboard', 'workout', 'editor', 'history', 'admin', 'profile', 'library'];
        if (protectedViews.includes(getStateFromUrl().view)) {
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
    <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Carregando...</p>
    </div>
  );

  const isImmersive = ['workout', 'onboarding', 'editor', 'landing', 'auth'].includes(navState.view);

  return (
    <ErrorProvider>
      <NavigationContext.Provider value={{ current: navState, navigate, goBack, theme, toggleTheme, profile }}>
        <div className="h-screen flex flex-col lg:flex-row bg-white overflow-hidden text-gray-900">
          {!isImmersive && session && (
            <aside className="hidden lg:flex w-20 bg-white border-r border-gray-100 flex-col items-center shrink-0">
               <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white mt-8 mb-12 shadow-lg shadow-black/20"><Bolt size={20} /></div>
               
               {profile?.workout_streak && profile.workout_streak > 0 && (
                 <div className="flex flex-col items-center gap-1 mb-10">
                   <Flame size={20} className="text-orange-500 fill-orange-500" />
                   <span className="text-[10px] font-black text-orange-600 tabular-nums">{profile.workout_streak}</span>
                 </div>
               )}

                <div className="flex flex-col items-center gap-6 w-full py-4">
                  <NavItem 
                    id="dashboard"
                    icon={Home}
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
                    id="history"
                    icon={HistoryIcon}
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
                      isActive={navState.view === 'admin'}
                      onClick={() => navigate('admin')}
                      badge="Pro"
                    />
                  )}
                  
                  <NavItem 
                    id="profile"
                    icon={User}
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

          <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence>
              <motion.div
                key={navState.view + (navState.params.id || '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="min-h-full"
              >
                {navState.view === 'landing' && <LandingPage onStart={() => navigate('auth')} onLogin={() => navigate('auth')} />}
                {navState.view === 'auth' && <Auth onBack={() => navigate('landing')} />}
                {navState.view === 'onboarding' && <SmartOnboarding />}
                {navState.view === 'dashboard' && <Dashboard />}
                {navState.view === 'workout' && <WorkoutPlayer workoutId={navState.params.id} />}
                {navState.view === 'editor' && <WorkoutEditor workoutId={navState.params.id} />}
                {navState.view === 'history' && <HistoryView />}
                {navState.view === 'library' && <ExerciseLibrary />}
                {navState.view === 'profile' && <ProfileViewV2 />}
                {navState.view === 'admin' && (
                  isAdmin(profile) ? <AdminPanelV2 onBack={goBack} /> : <Dashboard />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {!isImmersive && session && navState.view !== 'admin' && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-slate-50 px-6 flex items-center justify-around z-50 pb-safe">
              {[
                { id: 'dashboard', icon: Home, label: 'Início' },
                { id: 'library', icon: Dumbbell, label: 'Biblioteca' },
                { id: 'admin', icon: Shield, label: 'Admin', adminOnly: true, badge: 'Pro' },
                { id: 'history', icon: HistoryIcon, label: 'Histórico' },
                { id: 'profile', icon: User, label: 'Perfil' }
              ].filter(item => !item.adminOnly || isAdmin(profile)).map((item) => (
                <NavItem 
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
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
          )}
        </div>
      </NavigationContext.Provider>
    </ErrorProvider>
  );
};

export default App;
