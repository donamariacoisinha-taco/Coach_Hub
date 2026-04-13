
-- 1. CRIAÇÃO/AJUSTE DA TABELA DE EXERCÍCIOS NA FICHA
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.workout_categories(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '12',
    weight DECIMAL DEFAULT 0,
    rest_time INTEGER DEFAULT 60,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    sets_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GARANTIA DE COLUNAS (Caso a tabela já existisse mas estivesse incompleta)
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS sets_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can manage their workout exercises" ON public.workout_exercises
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM workout_categories
        WHERE workout_categories.id = workout_exercises.category_id
        AND workout_categories.user_id = auth.uid()
    )
);

-- 4. ÍNDICE DE ORDENAÇÃO
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(category_id, sort_order);
