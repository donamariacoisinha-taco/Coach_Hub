
-- 1. PERSISTÊNCIA DE NOTAS TÉCNICAS NAS FICHAS
-- Garante que o usuário possa salvar notas específicas por exercício dentro de uma ficha (Ex: "Ajuste do banco 3")
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. PRIVILÉGIOS ADMINISTRATIVOS
-- Garante que o campo de admin existe no perfil para liberar o Coach Hub
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 3. MÉTRICAS DE HISTÓRICO
-- Garante que o histórico suporte a duração do treino e contagem de exercícios
ALTER TABLE public.workout_history 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercises_count INTEGER DEFAULT 0;

-- 4. INSTRUÇÕES NA BIBLIOTECA GLOBAL
-- Adiciona o campo de instruções à biblioteca base de exercícios (para que o admin possa editar)
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS technical_prompt TEXT;

-- 5. SEGURANÇA (RLS) PARA NOTAS
-- Garante que apenas o dono do treino possa ler/editar suas próprias notas parciais
ALTER TABLE public.partial_workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their partial sessions" ON public.partial_workout_sessions;
CREATE POLICY "Users can manage their partial sessions" ON public.partial_workout_sessions 
FOR ALL USING (auth.uid() = user_id);

-- 6. COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON COLUMN public.workout_exercises.notes IS 'Notas persistentes do usuário para um exercício específico nesta ficha.';
COMMENT ON COLUMN public.profiles.is_admin IS 'Flag para acesso ao AdminPanel/Coach Hub.';
