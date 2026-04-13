
-- 1. SINCRONIZAÇÃO DE ESTRUTURA DE NOTAS
-- Garante que as notas existam tanto na definição do exercício quanto na instância do treino
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. MELHORIA NA VIEW DE RECORDES PESSOAIS (PB)
-- Adiciona o cálculo de Volume por Exercício para análise de tonelagem total
CREATE OR REPLACE VIEW public.view_exercise_volume_analysis AS
SELECT 
    user_id,
    exercise_id,
    date_trunc('day', created_at) as workout_day,
    SUM(weight_achieved * reps_achieved) as daily_tonnage
FROM public.workout_sets_log
GROUP BY user_id, exercise_id, workout_day;

-- 3. TRIGGER DE SEGURANÇA PARA ADMIN
-- Garante que apenas perfis marcados como admin possam alterar a biblioteca global
CREATE OR REPLACE FUNCTION public.check_admin_privileges()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem modificar a biblioteca global.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela de exercícios para proteger a base oficial
DROP TRIGGER IF EXISTS tr_protect_global_library ON public.exercises;
CREATE TRIGGER tr_protect_global_library
BEFORE UPDATE OR DELETE ON public.exercises
FOR EACH ROW
WHEN (OLD.user_id IS NULL) -- Protege apenas exercícios "oficiais" do sistema
EXECUTE PROCEDURE public.check_admin_privileges();

-- 4. ÍNDICE DE PERFORMANCE PARA BUSCA DE NOTAS
CREATE INDEX IF NOT EXISTS idx_workout_exercises_notes ON public.workout_exercises (category_id) WHERE notes IS NOT NULL;

COMMENT ON COLUMN public.workout_exercises.notes IS 'Instruções customizadas do usuário para este exercício específico nesta ficha.';
