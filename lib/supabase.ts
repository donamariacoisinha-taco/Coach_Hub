
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const supabaseUrl = 'https://eqnkuqkadtywgfsoilpe.supabase.co';
const supabaseAnonKey = 'sb_publishable_ufX-voHVkHsMwKxN7mlWMA_vfh1rSIB';

console.log("Iniciando conexão com Supabase...");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Configurações do Supabase ausentes!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste de conexão silencioso
supabase.auth.getSession().then(({ data, error }) => {
  if (error) console.error("Falha ao validar conexão Supabase:", error.message);
  else console.log("Conexão Supabase OK");
});
