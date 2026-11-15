-- Exercício "bônus": marcado na edição da ficha para casos condicionais
-- (ex.: só é feito se a academia estiver livre). Não conta para a sessão
-- ser considerada completa no WorkoutPlayer.
--
-- Aplicar manualmente no Supabase (não há supabase/migrations/ neste repo).
-- O app tolera a coluna ausente: o erro do PostgREST
-- "Could not find the 'is_optional' column" tira só essa coluna e tenta de novo.
-- A versão que vale para aplicar, junto com a troca transacional da lista, está em
-- supabase/migrations/20261115140000_workout_exercise_optional_and_replace.sql.
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;
