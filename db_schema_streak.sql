
-- Adição de workout_streak ao perfil do usuário
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_streak INT DEFAULT 0;

-- Garantir que o campo seja atualizável
GRANT UPDATE ON public.profiles TO authenticated;
