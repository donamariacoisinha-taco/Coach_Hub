-- PROPOSTA. NÃO EXECUTAR neste deploy e não aplicar como migration.
-- O aplicativo já lê sets_json antes das colunas, então a tela fica certa
-- sem este SQL. Ele só corrige linhas antigas em que reps ficou '12' e
-- rest_time ficou 60 enquanto sets_json tem o valor real.
--
-- Rode manualmente no SQL Editor, uma vez, depois de conferir o SELECT.

-- SELECT id, exercise_name_snapshot, reps, rest_time, sets, weight,
--        sets_json -> 0
-- FROM public.workout_exercises
-- WHERE sets_json IS NOT NULL
--   AND jsonb_typeof(sets_json::jsonb) = 'array'
--   AND jsonb_array_length(sets_json::jsonb) > 0
--   AND (
--     reps IS DISTINCT FROM (sets_json::jsonb -> 0 ->> 'reps')
--     OR rest_time IS DISTINCT FROM NULLIF(sets_json::jsonb -> 0 ->> 'rest_time', '')::integer
--   );

UPDATE public.workout_exercises AS row
SET
  sets = jsonb_array_length(row.sets_json::jsonb),
  reps = COALESCE(NULLIF(row.sets_json::jsonb -> 0 ->> 'reps', ''), row.reps),
  weight = COALESCE(NULLIF(row.sets_json::jsonb -> 0 ->> 'weight', '')::numeric, row.weight),
  rest_time = COALESCE(NULLIF(row.sets_json::jsonb -> 0 ->> 'rest_time', '')::integer, row.rest_time)
WHERE row.sets_json IS NOT NULL
  AND jsonb_typeof(row.sets_json::jsonb) = 'array'
  AND jsonb_array_length(row.sets_json::jsonb) > 0
  AND (
    row.reps IS DISTINCT FROM (row.sets_json::jsonb -> 0 ->> 'reps')
    OR row.rest_time IS DISTINCT FROM NULLIF(row.sets_json::jsonb -> 0 ->> 'rest_time', '')::integer
    OR row.sets IS DISTINCT FROM jsonb_array_length(row.sets_json::jsonb)
    OR row.weight IS DISTINCT FROM NULLIF(row.sets_json::jsonb -> 0 ->> 'weight', '')::numeric
  );
