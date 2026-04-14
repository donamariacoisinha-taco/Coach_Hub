
-- View para progresso de exercícios
CREATE OR REPLACE VIEW public.exercise_progress AS
SELECT
  exercise_id,
  DATE(created_at) as date,
  MAX(weight_achieved) as max_weight,
  MAX(reps_achieved) as max_reps,
  SUM(weight_achieved * reps_achieved) as volume
FROM public.workout_sets_log
GROUP BY exercise_id, DATE(created_at)
ORDER BY date;

-- Permissões para a view
ALTER VIEW public.exercise_progress OWNER TO postgres;
GRANT SELECT ON public.exercise_progress TO anon;
GRANT SELECT ON public.exercise_progress TO authenticated;
GRANT SELECT ON public.exercise_progress TO service_role;
