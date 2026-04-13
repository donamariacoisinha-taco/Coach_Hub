
-- 1. TABELA DE TEMPLATES GLOBAIS (Treinos sugeridos pelo sistema)
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    goal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Exercícios do Template
CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '12',
    rest_time INTEGER DEFAULT 60,
    sort_order INTEGER DEFAULT 0
);

-- 2. SISTEMA DE NOTIFICAÇÕES (Para engajamento)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'achievement', 'reminder', 'system'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS PARA AS NOVAS TABELAS
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone" ON public.workout_templates FOR SELECT USING (true);
CREATE POLICY "Users can manage their own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.user_notifications(user_id) WHERE is_read = false;

COMMENT ON TABLE public.workout_templates IS 'Treinos pré-definidos disponíveis para todos os usuários clonarem.';
