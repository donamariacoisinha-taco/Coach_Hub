
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UserProfile } from './types';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './features/dashboard/Dashboard';
import WorkoutPlayer from './features/workout/WorkoutPlayer';
import WorkoutEditor from './components/WorkoutEditor';
import AdminPanel from './components/AdminPanel';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import ExerciseLibrary from './components/ExerciseLibrary';
import LandingPage from './components/LandingPage';
import { useSync } from './hooks/useSync';
import { ErrorProvider } from './hooks/useErrorHandler';
import { authApi } from './lib/api/authApi';
import { workoutApi } from './lib/api/workoutApi';
import { profileApi } from './lib/api/profileApi';
import { exerciseApi } from './lib/api/exerciseApi';
import { usePrefetch } from './hooks/usePrefetch';
import { imagePrefetcher } from './lib/utils/imagePrefetcher';
import { DebugOverlay } from './components/DebugOverlay';
import { cacheStore } from './lib/cache/cacheStore';
import { useWorkoutStore } from './app/store/workoutStore';

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

import { Home, Dumbbell, History as HistoryIcon, User, Shield, Bolt, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('coach_theme') as Theme) || 'light');
  const [navState, setNavState] = useState<NavigationState>(getStateFromUrl);
  const prefetch = usePrefetch();

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
  const isInitializing = useRef(false);

  // Inicializa o sistema de sincronização offline
  useSync();

  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cacheStore.cleanup();
    }, 600000); // Every 10 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const { isHydrated } = useWorkoutStore();

  const fetchProfile = async (userId: string) => {
    console.log(`[APP][DEBUG] Buscando perfil do usuário: ${userId}`);
    try {
      // Garantir hidratação antes de decidir navegação baseada no store
      if (!isHydrated) {
        console.log("[APP] Aguardando hidratação do store...");
        return; 
      }

      const profileData = await profileApi.getProfile(userId);

      if (!profileData) {
        console.log(`[APP] Perfil inexistente, iniciando onboarding.`);
        setProfile(null);
        navigate('onboarding');
        return;
      }

      setProfile(profileData);
      
      const urlState = getStateFromUrl();
      // Se estiver logado e na tela de entrada, decide para onde ir
      if (urlState.view === 'landing' || urlState.view === 'auth') {
        const partial = await workoutApi.getPartialSession(userId);

        if (partial) {
          const currentStoreHistoryId = useWorkoutStore.getState().historyId;
          const currentStoreWorkoutId = useWorkoutStore.getState().currentWorkoutId;
          
          if (currentStoreHistoryId !== partial.history_id || currentStoreWorkoutId !== partial.workout_id) {
            console.log("[App] New partial session detected or store mismatch, resetting workout state");
            useWorkoutStore.getState().resetWorkout();
          } else {
            console.log("[App] Resuming existing session matched in store");
          }
          navigate('workout', { id: partial.workout_id });
        } else if (!profileData.onboarding_completed) {
          navigate('onboarding');
        } else {
          navigate('dashboard');
        }
      }
    } catch (err) {
      console.error("[APP] Erro crítico ao carregar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing.current) {
      if (isHydrated && session && !profile) {
        fetchProfile(session.user.id);
      }
      return;
    }
    isInitializing.current = true;

    // Timeout de segurança para evitar loading infinito caso o Supabase não responda
    const safetyTimeout = setTimeout(() => {
      setLoading(curr => {
        if (curr) console.warn("[APP] Inicialização demorando demais. Forçando desbloqueio.");
        return false;
      });
    }, 15000);

    const initApp = async () => {
      try {
        const currentSession = await authApi.getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[APP] Erro na inicialização do auth:", err);
        setLoading(false);
      }
    };

    initApp();

    const subscription = authApi.onAuthStateChange((event, s) => {
      console.log(`[AUTH] Evento detectado: ${event}`);
      setSession(s);
      
      if (s) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
        
        const protectedViews: View[] = ['dashboard', 'workout', 'editor', 'history', 'admin', 'profile', 'library'];
        const currentView = getStateFromUrl().view;
        if (protectedViews.includes(currentView)) {
          navigate('landing');
        }
      }
    });

    const handlePopState = (event: PopStateEvent) => {
      setNavState(event.state || getStateFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isHydrated, session]);

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
    if (window.history.length > 1) window.history.back();
    else navigate('dashboard');
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

                <div className="flex flex-col items-center gap-8 w-full">
                  <button 
                    onClick={() => navigate('dashboard')} 
                    onMouseEnter={() => prefetch('dashboard_data', async () => {
                      const session = await authApi.getSession();
                      return session?.user ? workoutApi.getDashboardData(session.user.id) : null;
                    })}
                    className={`flex flex-col items-center transition-all active:scale-90 ${navState.view === 'dashboard' ? 'text-black' : 'text-gray-300 hover:text-black'}`}
                  ><Home size={24} /></button>
                  
                  <button 
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
                    className={`flex flex-col items-center transition-all active:scale-90 ${navState.view === 'library' ? 'text-black' : 'text-gray-300 hover:text-black'}`}
                  ><Dumbbell size={24} /></button>
                  
                  <button 
                    onClick={() => navigate('history')} 
                    onMouseEnter={() => prefetch('history_data', async () => {
                      const user = await authApi.getUser();
                      return user ? workoutApi.getWorkoutHistory(user.id) : null;
                    })}
                    className={`flex flex-col items-center transition-all active:scale-90 ${navState.view === 'history' ? 'text-black' : 'text-gray-300 hover:text-black'}`}
                  ><HistoryIcon size={24} /></button>
                  
                  <button 
                    onClick={() => navigate('profile')} 
                    onMouseEnter={() => prefetch('profile_data', async () => {
                      const user = await authApi.getUser();
                      return user ? profileApi.getProfile(user.id) : null;
                    })}
                    className={`flex flex-col items-center transition-all active:scale-90 ${navState.view === 'profile' ? 'text-black' : 'text-gray-300 hover:text-black'}`}
                  ><User size={24} /></button>
                </div>
            </aside>
          )}

          <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait">
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
                {navState.view === 'onboarding' && <Onboarding onComplete={() => navigate('dashboard')} />}
                {navState.view === 'dashboard' && <Dashboard />}
                {navState.view === 'workout' && <WorkoutPlayer workoutId={navState.params.id} />}
                {navState.view === 'editor' && <WorkoutEditor workoutId={navState.params.id} />}
                {navState.view === 'history' && <HistoryView />}
                {navState.view === 'library' && <ExerciseLibrary />}
                {navState.view === 'profile' && profile && <ProfileView profile={profile} onUpdate={() => fetchProfile(session.user.id)} />}
                {navState.view === 'admin' && <AdminPanel onBack={goBack} />}
              </motion.div>
            </AnimatePresence>
            <DebugOverlay />
          </main>

          {!isImmersive && session && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-slate-50 px-8 flex items-center justify-around z-50 pb-safe">
              {[
                { id: 'dashboard', icon: Home },
                { id: 'library', icon: Dumbbell },
                { id: 'history', icon: HistoryIcon },
                { id: 'profile', icon: User }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = navState.view === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => navigate(item.id as View)} 
                    onMouseEnter={() => {
                      if (item.id === 'dashboard') prefetch('dashboard_data', async () => {
                        const session = await authApi.getSession();
                        return session?.user ? workoutApi.getDashboardData(session.user.id) : null;
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
                    className="relative p-4 group"
                  >
                    <Icon 
                      size={24} 
                      className={`transition-all duration-300 ${isActive ? 'text-slate-900 scale-110' : 'text-slate-300 group-active:scale-90'}`} 
                    />
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-900 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </NavigationContext.Provider>
    </ErrorProvider>
  );
};

export default App;
