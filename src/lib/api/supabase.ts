
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqnkuqkadtywgfsoilpe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ufX-voHVkHsMwKxN7mlWMA_vfh1rSIB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Silent connection check
supabase.auth.getSession()
  .then(({ data }) => {
    if (data.session) {
      console.log("[Supabase] Active session found");
    } else {
      console.log("[Supabase] No active session");
    }
  })
  .catch(err => {
    console.error("Supabase connection error (Failed to fetch?):", err);
    if (err.message?.includes('Failed to fetch')) {
      console.error("CRITICAL: The browser cannot reach Supabase. Check VITE_SUPABASE_URL and network settings.");
    }
  });
