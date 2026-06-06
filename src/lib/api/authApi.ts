
import { supabase } from './supabase';
import { fetchWithRetry } from '../utils';

// Helper to wipe Supabase-related keys from local storage if corrupt / expired
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
    console.error("[Auth Cleanup] Error cleaning up auth local storage:", err);
  }
}

// Check if the error represents a refresh token failure or a general fetch/network failure
function isGracefulError(err: any): boolean {
  if (!err) return false;
  const errMsg = (err.message || '').toLowerCase();
  
  const isRefreshTokenError = 
    errMsg.includes('refresh token') || 
    errMsg.includes('refresh_token') || 
    (errMsg.includes('not found') && errMsg.includes('token')) ||
    err.status === 400 && errMsg.includes('grant_type') ||
    err.status === 401 && errMsg.includes('token');

  const isFetchError = 
    errMsg.includes('failed to fetch') || 
    errMsg.includes('fetch') || 
    errMsg.includes('network') ||
    err.status === 0 ||
    err.status === 503 ||
    err.status === 504;

  if (isRefreshTokenError) {
    console.warn("[Auth API] Invalid or missing refresh token detected. Clearing cache to fix issue.", errMsg);
    clearSupabaseLocalStorage();
    return true;
  }

  if (isFetchError) {
    console.warn("[Auth API] Network connection failed (Failed to fetch). Operating in guest/offline mode.", errMsg);
    return true;
  }

  return false;
}

export const authApi = {
  async getUser() {
    const hasGuest = localStorage.getItem('kyron_guest_session');
    if (hasGuest) {
      try {
        const sess = JSON.parse(hasGuest);
        return sess?.user || null;
      } catch (e) {
        console.warn('Error reading guest user from local state', e);
      }
    }
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
    const hasGuest = localStorage.getItem('kyron_guest_session');
    if (hasGuest) {
      try {
        return JSON.parse(hasGuest);
      } catch (e) {
        console.warn('Error reading guest session from local state', e);
      }
    }
    try {
      const { data: { session }, error } = await fetchWithRetry(() => supabase.auth.getSession());
      if (error) {
        if (isGracefulError(error)) {
          return null;
        }
        throw error;
      }
      return session;
    } catch (err: any) {
      if (isGracefulError(err)) {
        return null;
      }
      throw err;
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  async signInAsGuest() {
    const guestUser = {
      id: "guest-user-id",
      email: "guest@kyron.os",
      role: "authenticated",
      user_metadata: { name: "Atleta Convidado" }
    };
    const guestSession = {
      access_token: "guest-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "guest-refresh",
      user: guestUser
    };
    localStorage.setItem('kyron_guest_session', JSON.stringify(guestSession));
    localStorage.setItem('coach_rubi_user_id', 'guest-user-id');
    // Ensure standard user ID item is set too
    return guestSession;
  },

  async signOut() {
    localStorage.removeItem('kyron_guest_session');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("[Auth API] Sign out error or session already cleared:", error.message);
        clearSupabaseLocalStorage();
      }
    } catch (err) {
      console.warn("[Auth API] Sign out exception thrown, clearing client storage:", err);
      clearSupabaseLocalStorage();
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};
