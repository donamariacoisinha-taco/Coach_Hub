-- NOVA MODELAGEM DO BANCO - KYRON OS 4.0

-- Para evitar incompatibilidade de tipos (a tabela antiga usava id TEXT, e a nova modelagem relacional exige UUID),
-- nós limpamos as tabelas antigas antes de criar a nova estrutura limpa e relacional.
DROP TABLE IF EXISTS public.premium_protocol_exercises CASCADE;
DROP TABLE IF EXISTS public.premium_protocol_days CASCADE;
DROP TABLE IF EXISTS public.premium_protocol_versions CASCADE;
DROP TABLE IF EXISTS public.premium_protocols CASCADE;
DROP TABLE IF EXISTS public.protocol_images CASCADE;

-- 1. premium_protocols
CREATE TABLE IF NOT EXISTS public.premium_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT CHECK (category IN ('public', 'premium')),
    goal TEXT,
    difficulty TEXT,
    environment TEXT,
    training_days INT,
    duration_weeks INT,
    estimated_duration INT,
    status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    version INT DEFAULT 1,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- 2. premium_protocol_days
CREATE TABLE IF NOT EXISTS public.premium_protocol_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID REFERENCES public.premium_protocols(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. premium_protocol_exercises
CREATE TABLE IF NOT EXISTS public.premium_protocol_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID REFERENCES public.premium_protocol_days(id) ON DELETE CASCADE,
    exercise_id UUID, -- Referência à biblioteca de exercícios
    exercise_order INT,
    sets INT,
    reps TEXT,
    rest_seconds INT,
    load_type TEXT,
    rpe TEXT,
    tempo TEXT,
    cadence TEXT,
    notes TEXT,
    drop_set BOOLEAN DEFAULT false,
    rest_pause BOOLEAN DEFAULT false,
    superset BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. premium_protocol_versions
CREATE TABLE IF NOT EXISTS public.premium_protocol_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID REFERENCES public.premium_protocols(id) ON DELETE CASCADE,
    version INT NOT NULL,
    modified_by UUID REFERENCES auth.users(id),
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. protocol_images
CREATE TABLE IF NOT EXISTS public.protocol_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    image_url TEXT,
    goal TEXT,
    difficulty TEXT,
    muscle_group TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.premium_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_protocol_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_protocol_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_protocol_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_images ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES FOR premium_protocols
CREATE POLICY "Permitir leitura de protocolos premium para todos" 
ON public.premium_protocols FOR SELECT USING (true);

CREATE POLICY "Permitir gerenciamento de protocolos premium apenas para administradores" 
ON public.premium_protocols FOR ALL TO authenticated USING (public.is_admin());

-- 7. POLICIES FOR premium_protocol_days
CREATE POLICY "Permitir leitura de dias para todos" 
ON public.premium_protocol_days FOR SELECT USING (true);

CREATE POLICY "Permitir gerenciamento de dias apenas para administradores" 
ON public.premium_protocol_days FOR ALL TO authenticated USING (public.is_admin());

-- 8. POLICIES FOR premium_protocol_exercises
CREATE POLICY "Permitir leitura de exercicios para todos" 
ON public.premium_protocol_exercises FOR SELECT USING (true);

CREATE POLICY "Permitir gerenciamento de exercicios apenas para administradores" 
ON public.premium_protocol_exercises FOR ALL TO authenticated USING (public.is_admin());

-- 9. POLICIES FOR premium_protocol_versions
CREATE POLICY "Permitir leitura de versoes apenas para administradores" 
ON public.premium_protocol_versions FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Permitir gerenciamento de versoes apenas para administradores" 
ON public.premium_protocol_versions FOR ALL TO authenticated USING (public.is_admin());

-- 10. POLICIES FOR protocol_images
CREATE POLICY "Permitir leitura de imagens para todos" 
ON public.protocol_images FOR SELECT USING (true);

CREATE POLICY "Permitir gerenciamento de imagens apenas para administradores" 
ON public.protocol_images FOR ALL TO authenticated USING (public.is_admin());

