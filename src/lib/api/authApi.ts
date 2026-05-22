
import { supabase } from './supabase';
import { fetchWithRetry } from '../utils';

export const authApi = {
  async getUser() {
    try {
      const { data: { user }, error } = await fetchWithRetry(() => supabase.auth.getUser());
      if (error) {
        if (
          error.message?.includes('session') || 
          error.message?.includes('missing') || 
          error.status === 401
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
        err.status === 401
      ) {
        return null;
      }
      throw err;
    }
  },

  async getSession() {
    const { data: { session }, error } = await fetchWithRetry(() => supabase.auth.getSession());
    if (error) throw error;
    return session;
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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};
