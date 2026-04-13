
import React, { useState, useEffect, createContext, useContext } from 'react';
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
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within Provider");
  return context;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('coach_theme') as Theme) || 'classic');
  const [navState, setNavState] = useState<NavigationState>({ view: 'landing', params: {} });

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else { 
        setProfile(null); 
        setLoading(false); 
        setNavState({ view: 'landing', params: {} }); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (data) {
        setProfile(data);
        
        // --- LÓGICA DE RESILIÊNCIA: VERIFICAR TREINO EM ANDAMENTO ---
        const { data: partial } = await supabase
          .from('partial_workout_sessions')
          .select('workout_id')
          .eq('user_id', id)
          .maybeSingle();

        if (partial) {
          setNavState({ view: 'workout', params: { id: partial.workout_id } });
        } else if (!data.onboarding_completed) {
          setNavState({ view: 'onboarding', params: {} });
        } else if (navState.view === 'landing' || navState.view === 'auth') {
          setNavState({ view: 'dashboard', params: {} });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar perfil/sessão:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (view: View, params: any = {}) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setHistory(prev => [...prev, navState]);
    setNavState({ view, params });
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(s => s.slice(0, -1));
      setNavState(prev);
    } else navigate('dashboard');
  };

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('coach_theme', newTheme);
  };

  if (loading) return <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Restaurando Ambiente...</p>
  </div>;

  const isImmersive = ['workout', 'onboarding', 'editor', 'landing', 'auth'].includes(navState.view);

  const NavContent = () => (
    <div className="flex lg:flex-col items-center justify-around lg:justify-start lg:gap-8 w-full h-full lg:pt-12">
      <button onClick={() => navigate('dashboard')} className={`flex flex-col items-center transition-all ${navState.view === 'dashboard' ? 'text-blue-500' : 'text-slate-500 opacity-60'}`}>
         <i className="fas fa-house text-xl mb-1"></i>
         <span className="text-[7px] font-black uppercase tracking-widest lg:hidden">Home</span>
      </button>
      <button onClick={() => navigate('library')} className={`flex flex-col items-center transition-all ${navState.view === 'library' ? 'text-blue-500' : 'text-slate-500 opacity-60'}`}>
         <i className="fas fa-book-open text-xl mb-1"></i>
         <span className="text-[7px] font-black uppercase tracking-widest lg:hidden">Bio</span>
      </button>
      <button onClick={() => navigate('history')} className={`flex flex-col items-center transition-all ${navState.view === 'history' ? 'text-blue-500' : 'text-slate-500 opacity-60'}`}>
         <i className="fas fa-chart-line text-xl mb-1"></i>
         <span className="text-[7px] font-black uppercase tracking-widest lg:hidden">Evolução</span>
      </button>
      <button onClick={() => navigate('profile')} className={`flex flex-col items-center transition-all ${navState.view === 'profile' ? 'text-blue-500' : 'text-slate-500 opacity-60'}`}>
         <i className="fas fa-user text-xl mb-1"></i>
         <span className="text-[7px] font-black uppercase tracking-widest lg:hidden">Perfil</span>
      </button>
    </div>
  );

  return (
    <NavigationContext.Provider value={{ current: navState, navigate, goBack, theme, toggleTheme }}>
      <div className="h-screen flex flex-col lg:flex-row bg-slate-950 overflow-hidden">
        {!isImmersive && session && (
          <aside className="hidden lg:flex w-24 bg-slate-900 border-r border-white/5 flex-col items-center shrink-0">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mt-8 mb-12 shadow-xl"><i className="fas fa-gem"></i></div>
             <NavContent />
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
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 px-6 pb-safe z-50">
             <NavContent />
          </nav>
        )}
      </div>
    </NavigationContext.Provider>
  );
};

export default App;
