
-- LIMPEZA DE VIEWS PARA EVITAR CONFLITO DE ESTRUTURA (Erro 42P16)
DROP VIEW IF EXISTS public.view_strength_progression CASCADE;
DROP VIEW IF EXISTS public.view_workout_volume CASCADE;
DROP VIEW IF EXISTS public.view_exercise_intelligence CASCADE;
DROP VIEW IF EXISTS public.view_strength_score CASCADE;

-- 1. ÍNDICES DE PERFORMANCE (COBERTURA)
CREATE INDEX IF NOT EXISTS idx_sets_log_covering 
ON public.workout_sets_log (user_id, exercise_id) 
INCLUDE (weight_achieved, reps_achieved, created_at);

-- 2. VIEW PARA INTELIGÊNCIA DE EXERCÍCIO
CREATE VIEW public.view_exercise_intelligence AS
SELECT 
    user_id,
    exercise_id,
    MAX(weight_achieved) as max_absolute_weight,
    MAX(weight_achieved / (1.0278 - (0.0278 * reps_achieved))) as estimated_1rm
FROM public.workout_sets_log
GROUP BY user_id, exercise_id;

-- 3. VIEW PARA VOLUME DE TREINO
CREATE VIEW public.view_workout_volume AS
SELECT 
    user_id,
    completed_at,
    id as history_id,
    (SELECT COALESCE(SUM(weight_achieved * reps_achieved), 0) 
     FROM workout_sets_log 
     WHERE history_id = workout_history.id) as total_volume
FROM public.workout_history;

-- 4. VIEW PARA PROGRESSÃO DE FORÇA
CREATE VIEW public.view_strength_progression AS
SELECT 
    l.user_id,
    l.exercise_id,
    e.name as exercise_name,
    h.completed_at::DATE as workout_date,
    MAX(l.weight_achieved / (1.0278 - (0.0278 * l.reps_achieved))) as daily_max_1rm
FROM public.workout_sets_log l
JOIN public.workout_history h ON l.history_id = h.id
JOIN public.exercises e ON l.exercise_id = e.id
GROUP BY l.user_id, l.exercise_id, e.name, h.completed_at::DATE;

-- 5. VIEW DE SCORE DE FORÇA (MÉTRICA DE GAMIFICAÇÃO)
CREATE VIEW public.view_strength_score AS
SELECT 
    user_id,
    ROUND(SUM(estimated_1rm)) as total_strength_potential
FROM public.view_exercise_intelligence
GROUP BY user_id;

-- COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON VIEW public.view_strength_score IS 'Métrica agregada para ranking de potencial de força do usuário.';
