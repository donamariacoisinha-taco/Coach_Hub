
-- 1. GARANTIA DE DELEÇÃO EM CASCATA PARA TODAS AS RELAÇÕES CRÍTICAS
-- Isso evita erros ao tentar excluir um treino que possui logs ou exercícios vinculados

ALTER TABLE public.workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_category_id_fkey,
ADD CONSTRAINT workout_exercises_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.workout_categories(id) ON DELETE CASCADE;

ALTER TABLE public.workout_sets_log 
DROP CONSTRAINT IF EXISTS workout_sets_log_history_id_fkey,
ADD CONSTRAINT workout_sets_log_history_id_fkey 
    FOREIGN KEY (history_id) REFERENCES public.workout_history(id) ON DELETE CASCADE;

-- 2. FUNÇÃO PARA ATUALIZAR O PERFIL DO USUÁRIO AUTOMATICAMENTE
-- Sincroniza o peso mais recente da tabela de biometria para o perfil principal
CREATE OR REPLACE FUNCTION public.sync_user_weight_from_bio()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET weight = NEW.weight
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_weight ON public.body_measurements;
CREATE TRIGGER tr_sync_weight
AFTER INSERT OR UPDATE ON public.body_measurements
FOR EACH ROW EXECUTE PROCEDURE public.sync_user_weight_from_bio();

-- 3. VIEW DE RECORDES PESSOAIS POR GRUPO MUSCULAR
-- Otimiza o Dashboard para mostrar onde o usuário está evoluindo mais rápido
CREATE OR REPLACE VIEW public.view_muscle_evolution_status AS
SELECT 
    l.user_id,
    e.muscle_group,
    COUNT(l.id) as sets_performed,
    MAX(l.weight_achieved) as max_weight,
    MAX(l.weight_achieved / (1.0278 - (0.0278 * l.reps_achieved))) as group_1rm_peak
FROM public.workout_sets_log l
JOIN public.exercises e ON l.exercise_id = e.id
GROUP BY l.user_id, e.muscle_group;

-- 4. POLÍTICA DE SEGURANÇA PARA A VIEW DE ADMIN (Garantindo que o Admin veja tudo)
GRANT SELECT ON public.admin_view_users TO authenticated;
GRANT SELECT ON public.view_muscle_evolution_status TO authenticated;

-- 5. ÍNDICE PARA VELOCIDADE DE CARREGAMENTO DA PLAYLIST DE TREINO
CREATE INDEX IF NOT EXISTS idx_workout_exercises_composite 
ON public.workout_exercises (category_id, sort_order);

COMMENT ON VIEW public.view_muscle_evolution_status IS 'Analisa o progresso de força agrupado por grupamento muscular.';
