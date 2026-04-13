
-- 1. SUPORTE A SÉRIES CONJUGADAS (SUPERSETS)
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS superset_id UUID;

-- 2. TABELA DE CONQUISTAS DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    threshold DECIMAL,
    badge_type TEXT -- 'tonnage', 'streak', 'workouts'
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- Seed de Badges Iniciais
INSERT INTO public.badges (id, name, description, icon, color, threshold, badge_type) VALUES
('titan_1', 'Titã de Ferro', 'Moveu 1.000kg em uma sessão', 'fa-dumbbell', 'from-orange-400 to-orange-600', 1000, 'tonnage'),
('streak_1', 'Inquebrável', '7 dias de consistência', 'fa-fire-alt', 'from-red-500 to-red-700', 7, 'streak'),
('master_1', 'Veterano', '50 treinos concluídos', 'fa-trophy', 'from-amber-400 to-amber-600', 50, 'workouts')
ON CONFLICT (id) DO NOTHING;

-- 3. TRIGGER PARA VERIFICAÇÃO AUTOMÁTICA DE CONQUISTAS
CREATE OR REPLACE FUNCTION public.check_workout_achievements()
RETURNS TRIGGER AS $$
DECLARE
    total_tonnage DECIMAL;
    workout_count INTEGER;
BEGIN
    -- Cálculo de Tonelagem da sessão atual
    SELECT SUM(weight_achieved * reps_achieved) INTO total_tonnage
    FROM public.workout_sets_log
    WHERE history_id = NEW.id;

    -- 1. Check Tonnage Badge
    IF total_tonnage >= 1000 THEN
        INSERT INTO public.user_badges (user_id, badge_id) 
        VALUES (NEW.user_id, 'titan_1') 
        ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Check Workout Count Badge
    SELECT COUNT(*) INTO workout_count FROM public.workout_history WHERE user_id = NEW.user_id;
    IF workout_count >= 50 THEN
        INSERT INTO public.user_badges (user_id, badge_id) 
        VALUES (NEW.user_id, 'master_1') 
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_achievements ON public.workout_history;
CREATE TRIGGER tr_achievements
AFTER UPDATE OF duration_minutes ON public.workout_history
FOR EACH ROW EXECUTE PROCEDURE public.check_workout_achievements();

COMMENT ON COLUMN public.workout_exercises.superset_id IS 'UUID compartilhado para exercícios realizados sem descanso entre eles.';
