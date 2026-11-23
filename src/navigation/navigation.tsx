import { createContext, useContext } from 'react';
import { UserProfile } from '../types';

export type View = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'workout' | 'preparation' | 'editor' | 'history' | 'admin' | 'profile' | 'library' | 'dieta';
export type Theme = 'classic' | 'light' | 'aggressive' | 'bloom' | 'neon-strike';

export interface NavigationState { view: View; params: any; }

export interface NavigationContextType {
  current: NavigationState;
  navigate: (view: View, params?: any) => void;
  goBack: () => void;
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
  profile: UserProfile | null;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within Provider');
  return context;
};
