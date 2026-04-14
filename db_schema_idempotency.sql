
-- Adição de client_id para idempotência
ALTER TABLE public.workout_sets_log ADD COLUMN IF NOT EXISTS client_id UUID DEFAULT gen_random_uuid();

-- Garantir que o client_id seja único para evitar duplicações
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_client_id') THEN
    ALTER TABLE public.workout_sets_log ADD CONSTRAINT unique_client_id UNIQUE (client_id);
  END IF;
END $$;
