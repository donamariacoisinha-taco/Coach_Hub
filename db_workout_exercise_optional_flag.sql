-- Exercício "bônus": marcado na edição da ficha para casos condicionais
-- (ex.: só é feito se a academia estiver livre). Não conta para a sessão
-- ser considerada completa no WorkoutPlayer.
--
-- Aplicar manualmente no Supabase (não há supabase/migrations/ neste repo).
-- O código já tolera a coluna ausente: insertWorkoutExercises detecta o erro
-- de coluna desconhecida e reenvia sem ela, então nada quebra antes deste
-- SQL ser aplicado — o campo só fica indisponível para usuários autenticados
-- até então (o modo convidado não depende de coluna nenhuma).
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;
