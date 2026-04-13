
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { UserProfile } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import WorkoutPlayer from './components/WorkoutPlayer';
import WorkoutEditor from './components/WorkoutEditor';
import AdminPanel from './components/AdminPanel';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import ExerciseLibrary from './components/ExerciseLibrary';
import LandingPage from './components/LandingPage';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('coach_theme') as Theme) || 'classic');
  const [navState, setNavState] = useState<NavigationState>(getStateFromUrl);
  const isInitializing = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchProfile = async (userId: string) => {
    console.log(`[APP][DEBUG] Buscando perfil do usuário: ${userId}`);
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

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
        const { data: partial } = await supabase
          .from('partial_workout_sessions')
          .select('workout_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (partial) {
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
    if (isInitializing.current) return;
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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
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
  }, []);

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
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Protocolo Rubi...</p>
    </div>
  );

  const isImmersive = ['workout', 'onboarding', 'editor', 'landing', 'auth'].includes(navState.view);

  return (
    <NavigationContext.Provider value={{ current: navState, navigate, goBack, theme, toggleTheme, profile }}>
      <div className="h-screen flex flex-col lg:flex-row bg-slate-950 overflow-hidden">
        {!isImmersive && session && (
          <aside className="hidden lg:flex w-24 bg-slate-900 border-r border-white/5 flex-col items-center shrink-0">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mt-8 mb-12 shadow-xl shadow-blue-600/20"><i className="fas fa-gem"></i></div>
             <div className="flex flex-col items-center gap-8 w-full">
                <button onClick={() => navigate('dashboard')} className={`flex flex-col items-center transition-all ${navState.view === 'dashboard' ? 'text-blue-500' : 'text-slate-600 hover:text-white'}`}><i className="fas fa-house text-xl"></i></button>
                <button onClick={() => navigate('library')} className={`flex flex-col items-center transition-all ${navState.view === 'library' ? 'text-blue-500' : 'text-slate-600 hover:text-white'}`}><i className="fas fa-book-open text-xl"></i></button>
                <button onClick={() => navigate('history')} className={`flex flex-col items-center transition-all ${navState.view === 'history' ? 'text-blue-500' : 'text-slate-600 hover:text-white'}`}><i className="fas fa-chart-line text-xl"></i></button>
                <button onClick={() => navigate('profile')} className={`flex flex-col items-center transition-all ${navState.view === 'profile' ? 'text-blue-500' : 'text-slate-600 hover:text-white'}`}><i className="fas fa-user text-xl"></i></button>
             </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto no-scrollbar relative">
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
        </main>

        {!isImmersive && session && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-around z-50">
            <button onClick={() => navigate('dashboard')} className={navState.view === 'dashboard' ? 'text-blue-500' : 'text-slate-600'}><i className="fas fa-house text-xl"></i></button>
            <button onClick={() => navigate('library')} className={navState.view === 'library' ? 'text-blue-500' : 'text-slate-600'}><i className="fas fa-book-open text-xl"></i></button>
            <button onClick={() => navigate('history')} className={navState.view === 'history' ? 'text-blue-500' : 'text-slate-600'}><i className="fas fa-chart-line text-xl"></i></button>
            <button onClick={() => navigate('profile')} className={navState.view === 'profile' ? 'text-blue-500' : 'text-slate-600'}><i className="fas fa-user text-xl"></i></button>
          </nav>
        )}
      </div>
    </NavigationContext.Provider>
  );
};

export default App;
