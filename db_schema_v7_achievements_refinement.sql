
-- db_schema_v7_achievements_refinement.sql

-- 1. ADICIONAR E ATUALIZAR BADGES NO SEED COM EMOJIS PARA COMPATIBILIDADE UI
INSERT INTO public.badges (id, name, description, icon, color, threshold, badge_type) VALUES
('titan_1', 'Titã de Ferro', 'Moveu 1.000kg em uma sessão', '🏋️', 'from-orange-400 to-orange-600', 1000, 'tonnage'),
('streak_1', 'Inquebrável', '7 dias de consistência', '🔥', 'from-red-500 to-red-700', 7, 'streak'),
('master_1', 'Veterano', '50 treinos concluídos', '🏆', 'from-amber-400 to-amber-600', 50, 'workouts'),
('first_1', 'Ponto de Partida', 'Completou o seu primeiro treino', '🎯', 'from-emerald-400 to-emerald-600', 1, 'workouts'),
('titan_2', 'Colosso', 'Moveu 2.500kg em uma sessão', '💪', 'from-blue-400 to-blue-600', 2500, 'tonnage'),
('titan_3', 'Imortal', 'Moveu 5.000kg em uma sessão', '👑', 'from-purple-500 to-purple-700', 5000, 'tonnage'),
('master_2', 'Lenda', '100 treinos concluídos', '🎖️', 'from-zinc-400 to-zinc-600', 100, 'workouts'),
('streak_2', 'Fanático', '30 dias de consistência', '📅', 'from-blue-500 to-blue-700', 30, 'streak')
ON CONFLICT (id) DO UPDATE SET 
  icon = EXCLUDED.icon,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. IMPLEMENTAR A FUNÇÃO DE PROCESSAMENTO DE CONQUISTAS SOLICITADA (Renomeada e Refinada)
-- Esta função é robusta contra erros para não impedir a finalização do treino
CREATE OR REPLACE FUNCTION public.fn_process_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_total_tonnage DECIMAL;
    v_workout_count INTEGER;
    v_current_streak INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := NEW.user_id;

    -- 1. Cálculo de Tonelagem da sessão atual
    -- Multiplicamos peso por repetições de todos os logs vinculados a este histórico
    SELECT COALESCE(SUM(weight_achieved * reps_achieved), 0) INTO v_total_tonnage
    FROM public.workout_sets_log
    WHERE history_id = NEW.id;

    -- Tonnage Badges
    IF v_total_tonnage >= 5000 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'titan_3') ON CONFLICT DO NOTHING;
    ELSIF v_total_tonnage >= 2500 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'titan_2') ON CONFLICT DO NOTHING;
    ELSIF v_total_tonnage >= 1000 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'titan_1') ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Workout Count Badges
    -- Contagem total de treinos concluídos pelo usuário
    SELECT COUNT(*) INTO v_workout_count 
    FROM public.workout_history 
    WHERE user_id = v_user_id AND completed_at IS NOT NULL;
    
    IF v_workout_count >= 100 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'master_2') ON CONFLICT DO NOTHING;
    ELSIF v_workout_count >= 50 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'master_1') ON CONFLICT DO NOTHING;
    ELSIF v_workout_count >= 1 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'first_1') ON CONFLICT DO NOTHING;
    END IF;

    -- 3. Streak Check (7 and 30 days)
    -- Contagem de dias distintos nos últimos 7/30 dias calendários
    
    -- 7 Days
    SELECT COUNT(DISTINCT (completed_at AT TIME ZONE 'UTC')::date) INTO v_current_streak
    FROM public.workout_history
    WHERE user_id = v_user_id
      AND completed_at >= (CURRENT_DATE - INTERVAL '6 days');
      
    IF v_current_streak >= 7 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'streak_1') ON CONFLICT DO NOTHING;
    END IF;

    -- 30 Days
    SELECT COUNT(DISTINCT (completed_at AT TIME ZONE 'UTC')::date) INTO v_current_streak
    FROM public.workout_history
    WHERE user_id = v_user_id
      AND completed_at >= (CURRENT_DATE - INTERVAL '29 days');
      
    IF v_current_streak >= 30 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (v_user_id, 'streak_2') ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log warning mas permite que o fluxo de salvamento do treino continue
    -- Isso evita o erro "Algo deu errado" se o cálculo de badges falhar por algum motivo imprevisto
    RAISE WARNING 'Achievement processing failed for history %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-VINCULAR O TRIGGER PARA UTILIZAR A NOVA FUNÇÃO
DROP TRIGGER IF EXISTS tr_achievements ON public.workout_history;
CREATE TRIGGER tr_achievements
AFTER UPDATE OF duration_minutes ON public.workout_history
FOR EACH ROW EXECUTE PROCEDURE public.fn_process_achievements();

COMMENT ON FUNCTION public.fn_process_achievements() IS 'Lógica central para premiar badges baseada em tonelagem, volume de treinos e consistência (streaks).';
