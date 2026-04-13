
-- 1. TABELA DE CATEGORIAS (FICHAS)
CREATE TABLE IF NOT EXISTS public.workout_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES public.workout_folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE EXERCÍCIOS DA FICHA
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.workout_categories(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '12',
    weight DECIMAL DEFAULT 0,
    rest_time INTEGER DEFAULT 60,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    sets_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HABILITAR RLS
ALTER TABLE public.workout_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA CATEGORIAS
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.workout_categories;
CREATE POLICY "Users can manage their own categories" ON public.workout_categories
FOR ALL USING (auth.uid() = user_id);

-- 5. POLÍTICAS PARA EXERCÍCIOS
DROP POLICY IF EXISTS "Users can manage their own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can manage their own workout exercises" ON public.workout_exercises
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM workout_categories
        WHERE workout_categories.id = workout_exercises.category_id
        AND workout_categories.user_id = auth.uid()
    )
);

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_workout_categories_user ON public.workout_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_cat ON public.workout_exercises(category_id);
