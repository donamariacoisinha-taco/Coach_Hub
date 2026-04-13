
-- 1. Criação da tabela de Pastas de Treino (já existente, garantindo integridade)
CREATE TABLE IF NOT EXISTS public.workout_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adição de colunas para periodização nos logs
ALTER TABLE public.workout_sets_log 
ADD COLUMN IF NOT EXISTS set_type TEXT DEFAULT 'Trabalho',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Adição de coluna de instruções nos exercícios da ficha
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 4. Ampliação do Perfil (Garantindo colunas de biometria)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weight DECIMAL,
ADD COLUMN IF NOT EXISTS height DECIMAL,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS target_weight DECIMAL;
