
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqnkuqkadtywgfsoilpe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ufX-voHVkHsMwKxN7mlWMA_vfh1rSIB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Silent connection check
supabase.auth.getSession().catch(err => console.error("Supabase connection error:", err));
