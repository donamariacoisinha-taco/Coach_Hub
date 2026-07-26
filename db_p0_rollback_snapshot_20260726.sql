-- =========================================================================
-- KYRON OS — Rollback lógico do hardening P0/P0.2
-- Snapshot capturado antes da aplicação em produção em 2026-07-26.
--
-- Escopo:
--   - restaura policies anteriores de exercises e admin_preferences;
--   - restaura execução pública das funções que estavam expostas;
--   - remove security_invoker da view exercise_progress;
--   - restaura search_path mutável das três funções apontadas pelo Advisor.
--
-- Não altera dados de usuários, auth.users, treinos ou histórico.
-- Executar somente em caso de regressão confirmada.
-- =========================================================================

BEGIN;

-- 1. View
ALTER VIEW public.exercise_progress RESET (security_invoker);

-- 2. Search path anterior
ALTER FUNCTION public.fn_process_achievements() RESET search_path;
ALTER FUNCTION public.check_admin_privileges() RESET search_path;
ALTER FUNCTION public.log_protocol_changes() RESET search_path;

-- 3. Permissões anteriores das funções
GRANT EXECUTE ON FUNCTION public.check_workout_achievements() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_process_achievements() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_last_exercise_log(uuid, uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recommended_exercises(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_user_weight_from_bio() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_admin_email_webhook() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_personal_best() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_admin_privileges() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_protocol_changes() TO PUBLIC;

REVOKE ALL ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4. admin_preferences
DROP POLICY IF EXISTS admin_preferences_owner_manage ON public.admin_preferences;
DROP POLICY IF EXISTS "Allow all operations for users on their own preferences" ON public.admin_preferences;
CREATE POLICY "Allow all operations for users on their own preferences"
ON public.admin_preferences
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- A policy RESTRICTIVE account_must_be_active é preservada.

-- 5. exercises: remover policies P0 e restaurar snapshot anterior
DROP POLICY IF EXISTS exercises_insert_owner_or_admin ON public.exercises;
DROP POLICY IF EXISTS exercises_update_owner_or_admin ON public.exercises;
DROP POLICY IF EXISTS exercises_delete_owner_or_admin ON public.exercises;

DROP POLICY IF EXISTS "Admin full access to exercises" ON public.exercises;
CREATE POLICY "Admin full access to exercises"
ON public.exercises
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING ((SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = auth.uid()) = true)
WITH CHECK ((SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = auth.uid()) = true);

DROP POLICY IF EXISTS exercises_admin_manage ON public.exercises;
CREATE POLICY exercises_admin_manage
ON public.exercises
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS exercises_delete_policy ON public.exercises;
CREATE POLICY exercises_delete_policy
ON public.exercises
AS PERMISSIVE
FOR DELETE
TO PUBLIC
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS exercises_insert_policy ON public.exercises;
CREATE POLICY exercises_insert_policy
ON public.exercises
AS PERMISSIVE
FOR INSERT
TO PUBLIC
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS exercises_master_delete_policy ON public.exercises;
CREATE POLICY exercises_master_delete_policy
ON public.exercises
AS PERMISSIVE
FOR DELETE
TO PUBLIC
USING (
  (SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = auth.uid()) = true
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS exercises_master_update_policy ON public.exercises;
CREATE POLICY exercises_master_update_policy
ON public.exercises
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (public.is_admin());

DROP POLICY IF EXISTS exercises_update_policy ON public.exercises;
CREATE POLICY exercises_update_policy
ON public.exercises
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS master_admin_policy ON public.exercises;
CREATE POLICY master_admin_policy
ON public.exercises
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (
  (SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = auth.uid()) = true
  OR auth.uid() = user_id
);

-- Policies SELECT do snapshot anterior não foram removidas pelas migrations P0/P0.2.

COMMIT;
