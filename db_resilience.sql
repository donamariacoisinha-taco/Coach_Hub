
-- 1. TABELA PARA SESSÕES PARCIAIS (CLOUD SYNC DO PLAYER)
CREATE TABLE IF NOT EXISTS public.partial_workout_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workout_categories(id) ON DELETE CASCADE,
    current_index INTEGER DEFAULT 0,
    current_set INTEGER DEFAULT 1,
    history_id UUID,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para Partial Sessions
ALTER TABLE public.partial_workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their partial sessions" ON public.partial_workout_sessions 
FOR ALL USING (auth.uid() = user_id);

-- 2. TABELA PARA MEDIDAS CORPORAIS (ANTROPOMETRIA)
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    measured_at DATE DEFAULT CURRENT_DATE,
    weight DECIMAL,
    chest DECIMAL,
    waist DECIMAL,
    biceps_r DECIMAL,
    biceps_l DECIMAL,
    thigh_r DECIMAL,
    thigh_l DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para Medidas
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their measurements" ON public.body_measurements 
FOR ALL USING (auth.uid() = user_id);

-- 3. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_partial_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_partial_session
BEFORE UPDATE ON public.partial_workout_sessions
FOR EACH ROW EXECUTE PROCEDURE update_partial_session_timestamp();
