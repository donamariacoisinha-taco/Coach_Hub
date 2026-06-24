-- SQL MIGRATION TO CREATE THE PREMIUM PROTOCOLS TABLE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. TABELA DE PROTOCOLOS PREMIUM DE ELITE
CREATE TABLE IF NOT EXISTS public.premium_protocols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    premium BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    goal TEXT,
    difficulty TEXT,
    duration_weeks INTEGER,
    frequency INTEGER,
    created_by TEXT,
    rating DECIMAL,
    featured BOOLEAN DEFAULT false,
    athletes_count INTEGER DEFAULT 0,
    completion_rate INTEGER,
    strength_increase_pct INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by TEXT,
    workouts JSONB DEFAULT '[]'::jsonb,
    version_history JSONB DEFAULT '[]'::jsonb
);

-- 2. HABILITAR RLS (ROW LEVEL SECURITY)
ALTER TABLE public.premium_protocols ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO
-- Qualquer pessoa (incluindo usuários anônimos e atletas comuns) pode visualizar os protocolos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'premium_protocols' AND policyname = 'Permitir leitura de protocolos premium para todos'
    ) THEN
        CREATE POLICY "Permitir leitura de protocolos premium para todos" ON public.premium_protocols
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'premium_protocols' AND policyname = 'Permitir alteração de protocolos premium apenas para administradores'
    ) THEN
        CREATE POLICY "Permitir alteração de protocolos premium apenas para administradores" ON public.premium_protocols
            FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- 4. COMENTÁRIO EXPLICATIVO
COMMENT ON TABLE public.premium_protocols IS 'Tabela que armazena os protocolos premium e públicos da biblioteca de elite monitorados pelo KYRON OS.';
