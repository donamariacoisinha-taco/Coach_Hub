
-- 1. GARANTIA DA TABELA DE LOGS DE SÉRIES (Sem exercise_name redundante)
CREATE TABLE IF NOT EXISTS public.workout_sets_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    history_id UUID REFERENCES public.workout_history(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    set_number INTEGER NOT NULL,
    weight_achieved DECIMAL DEFAULT 0,
    reps_achieved INTEGER DEFAULT 0,
    rpe DECIMAL DEFAULT 8,
    set_type TEXT DEFAULT 'Trabalho',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. ATIVAÇÃO DE RLS
ALTER TABLE public.workout_sets_log ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO (CRUD TOTAL PARA O DONO)
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.workout_sets_log;
CREATE POLICY "Users can insert their own logs" ON public.workout_sets_log 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.workout_sets_log;
CREATE POLICY "Users can view their own logs" ON public.workout_sets_log 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own logs" ON public.workout_sets_log;
CREATE POLICY "Users can update their own logs" ON public.workout_sets_log 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own logs" ON public.workout_sets_log;
CREATE POLICY "Users can delete their own logs" ON public.workout_sets_log 
FOR DELETE USING (auth.uid() = user_id);

-- 4. ÍNDICE DE BUSCA PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_workout_sets_log_history ON public.workout_sets_log(history_id);
