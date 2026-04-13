
-- Tabela para armazenar exercícios favoritos por usuário
CREATE TABLE IF NOT EXISTS public.user_favorite_exercises (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, exercise_id)
);

-- Habilitar RLS
ALTER TABLE public.user_favorite_exercises ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorite_exercises 
FOR ALL USING (auth.uid() = user_id);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorite_exercises(user_id);
