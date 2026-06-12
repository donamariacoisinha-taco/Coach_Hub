console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL || 'not set');
console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY || 'not set');
console.log("VITE keys:", Object.keys(process.env).filter(k => k.toLowerCase().includes('vite') || k.toLowerCase().includes('supabase')));
