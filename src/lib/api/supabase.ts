import { createClient } from '@supabase/supabase-js';

const isDev = typeof import.meta !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

const getEnvVar = (name: string): string => {
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
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Silent connection check in development only. Production errors are handled by the application flow.
if (isDev) {
  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        const errMsg = (error.message || '').toLowerCase();
        const isBenign = errMsg.includes('refresh') || errMsg.includes('token');
        if (isBenign) {
          console.warn('[Supabase] Session check returned benign auth error:', error.message);
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
          console.warn('[Supabase] Session check encountered error:', error.message);
        }
        return;
      }
      if (data?.session) {
        console.log('[Supabase] Active session found');
      } else {
        console.log('[Supabase] No active session');
      }
    })
    .catch(err => {
      const errMsg = (err?.message || '').toLowerCase();
      const isBenign = errMsg.includes('refresh') || errMsg.includes('token');
      if (isBenign) {
        console.warn('[Supabase] Session check promise rejected with benign auth error:', err.message);
      } else {
        console.error('Supabase connection error (Failed to fetch?):', err);
      }
    });
}