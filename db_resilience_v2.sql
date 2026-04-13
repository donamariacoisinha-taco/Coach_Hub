
-- 1. TABELA PARA SESSÕES PARCIAIS (CLOUD SYNC DO PLAYER)
-- Permite que o usuário feche o app e volte exatamente para a série/exercício atual
CREATE TABLE IF NOT EXISTS public.partial_workout_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workout_categories(id) ON DELETE CASCADE,
    current_index INTEGER DEFAULT 0,
    current_set INTEGER DEFAULT 1,
    history_id UUID REFERENCES public.workout_history(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. ADIÇÃO DE COLUNA DE INTENSIDADE/RPE NO LOG (Se não existir)
ALTER TABLE public.workout_sets_log 
ADD COLUMN IF NOT EXISTS rpe DECIMAL DEFAULT 8;

-- RLS para Partial Sessions
ALTER TABLE public.partial_workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their partial sessions" ON public.partial_workout_sessions;
CREATE POLICY "Users can manage their partial sessions" ON public.partial_workout_sessions 
FOR ALL USING (auth.uid() = user_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_partial_sessions_lookup ON public.partial_workout_sessions (user_id, workout_id);
