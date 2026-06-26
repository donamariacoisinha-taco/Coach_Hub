
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return import.meta.env[name];
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] as string;
    }
  } catch (e) {}
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://eqnkuqkadtywgfsoilpe.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_ufX-voHVkHsMwKxN7mlWMA_vfh1rSIB');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Silent connection check
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      const errMsg = (error.message || '').toLowerCase();
      const isBenign = errMsg.includes('refresh') || errMsg.includes('token');
      if (isBenign) {
        console.warn("[Supabase] Session check returned benign auth error:", error.message);
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}
      } else {
        console.warn("[Supabase] Session check encountered error:", error.message);
      }
      return;
    }
    if (data?.session) {
      console.log("[Supabase] Active session found");
    } else {
      console.log("[Supabase] No active session");
    }
  })
  .catch(err => {
    const errMsg = (err?.message || '').toLowerCase();
    const isBenign = errMsg.includes('refresh') || errMsg.includes('token');
    if (isBenign) {
      console.warn("[Supabase] Session check promise rejected with benign auth error:", err.message);
    } else {
      console.error("Supabase connection error (Failed to fetch?):", err);
      if (err.message?.includes('Failed to fetch')) {
        console.error("CRITICAL: The browser cannot reach Supabase. Check VITE_SUPABASE_URL and network settings.");
      }
    }
  });
