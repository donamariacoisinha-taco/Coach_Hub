
-- 1. TABELA DE RECORDES PESSOAIS (PB) PARA ACESSO RÁPIDO
CREATE TABLE IF NOT EXISTS public.user_personal_bests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    max_weight DECIMAL,
    max_reps INTEGER,
    calculated_1rm DECIMAL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, exercise_id)
);

-- 2. TRIGGER PARA ATUALIZAR RECORDES AUTOMATICAMENTE APÓS CADA SÉRIE (INSERT OU UPDATE)
CREATE OR REPLACE FUNCTION public.update_personal_best()
RETURNS TRIGGER AS $$
DECLARE
    current_1rm DECIMAL;
    best_1rm DECIMAL;
BEGIN
    -- Cálculo de 1RM usando a fórmula de Brzycki
    current_1rm := NEW.weight_achieved / (1.0278 - (0.0278 * NEW.reps_achieved));
    
    -- Busca o melhor 1RM atual para o exercício para decidir se atualiza a data de conquista
    SELECT calculated_1rm INTO best_1rm 
    FROM public.user_personal_bests 
    WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id;

    INSERT INTO public.user_personal_bests (user_id, exercise_id, max_weight, max_reps, calculated_1rm, achieved_at)
    VALUES (NEW.user_id, NEW.exercise_id, NEW.weight_achieved, NEW.reps_achieved, current_1rm, now())
    ON CONFLICT (user_id, exercise_id) DO UPDATE
    SET 
        -- GREATEST garante que só atualizamos para valores maiores
        max_weight = GREATEST(public.user_personal_bests.max_weight, EXCLUDED.max_weight),
        calculated_1rm = GREATEST(public.user_personal_bests.calculated_1rm, EXCLUDED.calculated_1rm),
        achieved_at = CASE 
            WHEN EXCLUDED.calculated_1rm > COALESCE(best_1rm, 0) THEN now() 
            ELSE public.user_personal_bests.achieved_at 
        END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizado para AFTER INSERT OR UPDATE para suportar correções de erros de input
DROP TRIGGER IF EXISTS tr_update_pb ON public.workout_sets_log;
CREATE TRIGGER tr_update_pb
AFTER INSERT OR UPDATE ON public.workout_sets_log
FOR EACH ROW EXECUTE PROCEDURE public.update_personal_best();

-- 3. VIEW PARA DASHBOARD DO COACH (GESTÃO DE ALUNOS)
CREATE OR REPLACE VIEW public.view_coach_students AS
SELECT 
    p.id as student_id,
    p.full_name,
    p.avatar_url,
    p.goal,
    (SELECT COUNT(*) FROM workout_history h WHERE h.user_id = p.id) as total_sessions,
    (SELECT MAX(completed_at) FROM workout_history h WHERE h.user_id = p.id) as last_seen
FROM public.profiles p
WHERE p.is_admin = false OR p.is_admin IS NULL;

-- 4. ÍNDICE DE PERFORMANCE PARA BUSCA DE SESSÕES ATIVAS
CREATE INDEX IF NOT EXISTS idx_partial_sessions_user ON public.partial_workout_sessions(user_id);
