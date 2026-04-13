
-- 1. REFORÇO DE SEGURANÇA NO PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, onboarding_completed, is_admin)
  VALUES (NEW.id, false, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HISTÓRICO DE PESO UNIFICADO (CORRIGIDO)
CREATE OR REPLACE VIEW public.view_weight_history AS
SELECT 
    user_id,
    measured_at,
    weight
FROM public.body_measurements
WHERE weight IS NOT NULL
UNION
SELECT 
    id as user_id,
    updated_at::DATE as measured_at,
    weight
FROM public.profiles
WHERE weight IS NOT NULL
ORDER BY measured_at ASC;

-- 3. TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA DE SESSÃO
CREATE OR REPLACE FUNCTION public.sync_partial_session()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_partial_session ON public.partial_workout_sessions;
CREATE TRIGGER tr_sync_partial_session
BEFORE UPDATE ON public.partial_workout_sessions
FOR EACH ROW EXECUTE PROCEDURE public.sync_partial_session();

-- 4. VIEW DE ADMIN: MONITORAMENTO DE ALUNOS
CREATE OR REPLACE VIEW public.admin_view_users AS
SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.goal,
    p.experience_level,
    (SELECT COUNT(*) FROM workout_history h WHERE h.user_id = p.id) as total_workouts,
    (SELECT MAX(completed_at) FROM workout_history h WHERE h.user_id = p.id) as last_training
FROM public.profiles p;

ALTER VIEW public.admin_view_users OWNER TO postgres;
GRANT SELECT ON public.admin_view_users TO authenticated;
