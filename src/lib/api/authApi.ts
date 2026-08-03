import { supabase } from './supabase';
import { fetchWithRetry } from '../utils';

export const GUEST_USER_ID = 'guest-user-id';
export const GUEST_SESSION_KEY = 'kyron_guest_session';
export const GUEST_PROFILE_KEY = 'kyron_guest_profile';

const GUEST_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function clearSupabaseLocalStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.warn(`[Auth Cleanup] Cleared invalid local auth key: ${key}`);
    });
  } catch (err) {
    console.error('[Auth Cleanup] Error cleaning up auth local storage:', err);
  }
}

function clearGuestSession() {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_PROFILE_KEY);
    localStorage.removeItem('coach_rubi_user_id');
    localStorage.removeItem(`kyron_onboarding_v21_${GUEST_USER_ID}`);
    localStorage.removeItem(`rubi_dashboard_cache_${GUEST_USER_ID}`);
  } catch (err) {
    console.warn('[Auth API] Failed to clear guest session data:', err);
  }
}

function readGuestSession() {
  const rawGuestSession = localStorage.getItem(GUEST_SESSION_KEY);
  if (!rawGuestSession) return null;

  try {
    const session = JSON.parse(rawGuestSession);
    const expiresAt = Number(session?.expires_at || 0);

    if (!session?.user?.id || session.user.id !== GUEST_USER_ID || expiresAt <= Date.now()) {
      clearGuestSession();
      return null;
    }

    return session;
  } catch (err) {
    console.warn('[Auth API] Invalid guest session found. Resetting local demo.', err);
    clearGuestSession();
    return null;
  }
}

function isGracefulError(err: any): boolean {
  if (!err) return false;
  const errMsg = (err.message || '').toLowerCase();

  const isRefreshTokenError =
    errMsg.includes('refresh token') ||
    errMsg.includes('refresh_token') ||
    (errMsg.includes('not found') && errMsg.includes('token')) ||
    (err.status === 400 && errMsg.includes('grant_type')) ||
    (err.status === 401 && errMsg.includes('token'));

  const isFetchError =
    errMsg.includes('failed to fetch') ||
    errMsg.includes('fetch') ||
    errMsg.includes('network') ||
    err.status === 0 ||
    err.status === 503 ||
    err.status === 504;

  if (isRefreshTokenError) {
    console.warn('[Auth API] Invalid or missing refresh token detected. Clearing cache.', errMsg);
    clearSupabaseLocalStorage();
    return true;
  }

  if (isFetchError) {
    console.warn('[Auth API] Network connection failed. Continuing without an online session.', errMsg);
    return true;
  }

  return false;
}

export const authApi = {
  isGuestSession() {
    return Boolean(readGuestSession());
  },

  async getUser() {
    const guestSession = readGuestSession();
    if (guestSession) return guestSession.user;

    try {
      const { data: { user }, error } = await fetchWithRetry(() => supabase.auth.getUser());
      if (error) {
        if (
          error.message?.includes('session') ||
          error.message?.includes('missing') ||
          error.status === 401 ||
          isGracefulError(error)
        ) {
          return null;
        }
        throw error;
      }
      return user;
    } catch (err: any) {
      if (
        err.message?.includes('session') ||
        err.message?.includes('missing') ||
        err.status === 401 ||
        isGracefulError(err)
      ) {
        return null;
      }
      throw err;
    }
  },

  async getSession() {
    const guestSession = readGuestSession();
    if (guestSession) return guestSession;

    try {
      const { data: { session }, error } = await fetchWithRetry(() => supabase.auth.getSession());
      if (error) {
        if (isGracefulError(error)) return null;
        throw error;
      }
      return session;
    } catch (err: any) {
      if (isGracefulError(err)) return null;
      throw err;
    }
  },

  async signIn(email: string, password: string) {
    clearGuestSession();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    clearGuestSession();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) throw error;
  },

  async signInAsGuest() {
    clearGuestSession();

    const now = Date.now();
    const guestUser = {
      id: GUEST_USER_ID,
      email: 'guest@kyron.os',
      role: 'authenticated',
      aud: 'authenticated',
      is_anonymous: true,
      app_metadata: { provider: 'guest', providers: ['guest'] },
      user_metadata: { name: 'Atleta Convidado', full_name: 'Atleta Convidado' },
      created_at: new Date(now).toISOString(),
    };

    const guestSession = {
      access_token: 'kyron-local-guest',
      token_type: 'bearer',
      expires_in: GUEST_SESSION_DURATION_MS / 1000,
      expires_at: now + GUEST_SESSION_DURATION_MS,
      refresh_token: 'kyron-local-guest-refresh',
      provider_token: null,
      provider_refresh_token: null,
      user: guestUser,
      mode: 'local-demo',
    };

    const guestProfile = {
      id: GUEST_USER_ID,
      email: guestUser.email,
      name: 'Atleta Convidado',
      full_name: 'Atleta Convidado',
      onboarding_completed: true,
      onboarding_version: 'guest-demo-v1',
      workout_streak: 0,
      primary_goal: 'performance',
      training_experience: 'beginner',
      weekly_availability: 3,
      training_environment: 'gym_full',
      restrictions: ['Nenhuma'],
      exercise_dislikes: [],
      weight: 75,
      height: 175,
      age: 28,
      role: 'user',
      plan: 'free',
      account_status: 'active',
      is_admin: false,
      is_premium: false,
      user_access: {
        user_id: GUEST_USER_ID,
        role: 'user',
        plan: 'free',
        status: 'active',
      },
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    };

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(guestProfile));
    localStorage.setItem('coach_rubi_user_id', GUEST_USER_ID);

    return guestSession;
  },

  async signOut() {
    const wasGuest = Boolean(readGuestSession());
    clearGuestSession();

    if (wasGuest) return;

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.warn('[Auth API] Sign out error or session already cleared:', error.message);
        clearSupabaseLocalStorage();
      }
    } catch (err) {
      console.warn('[Auth API] Sign out exception thrown, clearing client storage:', err);
      clearSupabaseLocalStorage();
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};
