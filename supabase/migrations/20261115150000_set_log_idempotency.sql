-- NÃO APLICAR automaticamente. O app funciona sem este arquivo.
-- Sem o índice único, a gravação da série procura a linha por
-- history_id + exercise_id + set_number e atualiza; se não achar, insere.
-- Sem rest_time, esse campo é omitido e o descanso real continua em
-- rest_time_actual quando a coluna já existe.
-- Não altera RLS.

ALTER TABLE public.workout_sets_log
  ADD COLUMN IF NOT EXISTS client_id uuid;

ALTER TABLE public.workout_sets_log
  ADD COLUMN IF NOT EXISTS rest_time integer;

ALTER TABLE public.workout_sets_log
  ADD COLUMN IF NOT EXISTS rest_time_actual integer;

CREATE UNIQUE INDEX IF NOT EXISTS workout_sets_log_client_id_key
  ON public.workout_sets_log (client_id);
