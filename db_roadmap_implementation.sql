
-- 1. CORREÇÃO DE INTEGRIDADE: DELEÇÃO EM CASCATA
-- Permite excluir exercícios e grupos musculares limpando as dependências automaticamente
ALTER TABLE public.workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey,
ADD CONSTRAINT workout_exercises_exercise_id_fkey 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE public.exercises 
DROP CONSTRAINT IF EXISTS exercises_muscle_group_id_fkey,
ADD CONSTRAINT exercises_muscle_group_id_fkey 
    FOREIGN KEY (muscle_group_id) REFERENCES public.muscle_groups(id) ON DELETE SET NULL;

ALTER TABLE public.workout_sets_log 
DROP CONSTRAINT IF EXISTS workout_sets_log_exercise_id_fkey,
ADD CONSTRAINT workout_sets_log_exercise_id_fkey 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

-- 2. FUNÇÃO PARA LIMPEZA DE SESSÕES PARCIAIS ÓRFÃS
-- Remove sessões que não foram atualizadas em mais de 48h para economizar storage
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.partial_workout_sessions 
    WHERE updated_at < now() - interval '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MELHORIA NA VIEW DE PROGRESSÃO (ESTABILIDADE)
-- Recalcula o potencial de 1RM usando a fórmula de Brzycki com maior precisão decimal
CREATE OR REPLACE VIEW public.view_strength_progression AS
SELECT 
    l.user_id,
    l.exercise_id,
    e.name as exercise_name,
    h.completed_at::DATE as workout_date,
    MAX(CASE 
        WHEN l.reps_achieved = 1 THEN l.weight_achieved
        ELSE l.weight_achieved / (1.0278 - (0.0278 * l.reps_achieved))
    END) as daily_max_1rm
FROM public.workout_sets_log l
JOIN public.workout_history h ON l.history_id = h.id
JOIN public.exercises e ON l.exercise_id = e.id
GROUP BY l.user_id, l.exercise_id, e.name, h.completed_at::DATE;
