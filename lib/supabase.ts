
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqnkuqkadtywgfsoilpe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ufX-voHVkHsMwKxN7mlWMA_vfh1rSIB';

console.log("Iniciando conexão com Supabase...");

if (!supabaseUrl || supabaseUrl.includes('YOUR_')) {
  console.error("Configuração do Supabase URL ausente ou inválida!");
}

if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_')) {
  console.error("Configuração do Supabase Anon Key ausente ou inválida!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste de conexão silencioso com tratamento de erro aprimorado
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Falha ao validar conexão Supabase:", error.message);
    if (error.message.includes('Failed to fetch')) {
      console.warn("DICA: O erro 'Failed to fetch' geralmente indica que o projeto Supabase está pausado ou a URL está incorreta/bloqueada.");
    }
  } else {
    console.log("Conexão Supabase OK");
  }
}).catch(err => {
  console.error("Erro inesperado ao conectar ao Supabase:", err);
});
