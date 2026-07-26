-- =========================================================================
-- KYRON OS P0.2 — Supabase Security Advisor hardening
-- =========================================================================
-- ESCOPO
--   1. Corrigir a view exercise_progress para SECURITY INVOKER.
--   2. Fixar search_path de funções apontadas pelo Advisor.
--   3. Alinhar o trigger de exercises às policies owner/admin.
--   4. Remover execução direta de funções que existem apenas como triggers.
--   5. Restringir RPCs de leitura do atleta a usuários autenticados.
--   6. Corrigir a policy pública irrestrita de admin_preferences.
--
-- FORA DO ESCOPO
--   - Não altera dados.
--   - Não altera auth.users.
--   - Não cria usuários de homologação.
--   - Não altera buckets públicos nesta migration.
--   - Não altera rooms/update_room_state_atomic, pois o projeto Supabase é
--     compartilhado e esse módulo pode pertencer a outro produto.
--   - Não remove índices nem consolida policies de performance.
--
-- NÃO EXECUTAR AUTOMATICAMENTE EM PRODUÇÃO.
-- Revisar e homologar antes da aplicação.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Preflight fail-closed
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.exercise_progress') IS NULL THEN
    RAISE EXCEPTION 'P0.2 preflight failed: public.exercise_progress is missing';
  END IF;

  IF to_regclass('public.admin_preferences') IS NULL THEN
    RAISE EXCEPTION 'P0.2 preflight failed: public.admin_preferences is missing';
  END IF;

  IF to_regprocedure('private.current_user_is_active()') IS NULL THEN
    RAISE EXCEPTION 'P0.2 preflight failed: private.current_user_is_active() is missing';
  END IF;

  IF to_regprocedure('public.fn_process_achievements()') IS NULL
     OR to_regprocedure('public.check_admin_privileges()') IS NULL
     OR to_regprocedure('public.log_protocol_changes()') IS NULL THEN
    RAISE EXCEPTION 'P0.2 preflight failed: one or more audited functions are missing';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2. SECURITY INVOKER view
-- -------------------------------------------------------------------------
ALTER VIEW public.exercise_progress SET (security_invoker = true);

-- -------------------------------------------------------------------------
-- 3. Trigger de exercises e search_path imutável
-- -------------------------------------------------------------------------
-- O trigger anterior exigia administrador para QUALQUER UPDATE/DELETE, mesmo
-- em exercícios pertencentes ao próprio usuário. A função abaixo preserva a
-- biblioteca global e exercícios de terceiros, mas permite ao proprietário
-- editar/excluir seus próprios registros sem transferir ownership.
CREATE OR REPLACE FUNCTION public.check_admin_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
BEGIN
  IF public.is_admin() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticação obrigatória.' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id IS NOT NULL
       AND OLD.user_id = auth.uid()
       AND NEW.user_id = OLD.user_id THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.user_id IS NOT NULL AND OLD.user_id = auth.uid() THEN
      RETURN OLD;
    END IF;
  END IF;

  RAISE EXCEPTION 'Acesso negado: somente administradores podem modificar a biblioteca global ou exercícios de terceiros.'
    USING ERRCODE = '42501';
END;
$function$;

ALTER FUNCTION public.fn_process_achievements()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.log_protocol_changes()
  SET search_path = public, pg_temp;

-- -------------------------------------------------------------------------
-- 4. Funções usadas apenas por triggers/manutenção
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.check_workout_achievements()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_process_achievements()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.sync_user_weight_from_bio()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.trigger_admin_email_webhook()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_personal_best()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_admin_privileges()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_protocol_changes()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cleanup_stale_sessions()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO service_role;

-- -------------------------------------------------------------------------
-- 5. RPCs legítimas do atleta
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_last_exercise_log(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_last_exercise_log(uuid, uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_recommended_exercises(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recommended_exercises(uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_streak(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_streak(uuid)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text)
  TO authenticated;

-- -------------------------------------------------------------------------
-- 6. admin_preferences: remover acesso público irrestrito
-- -------------------------------------------------------------------------
ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for users on their own preferences"
  ON public.admin_preferences;

DROP POLICY IF EXISTS admin_preferences_owner_manage
  ON public.admin_preferences;

CREATE POLICY admin_preferences_owner_manage
ON public.admin_preferences
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- A policy RESTRICTIVE account_must_be_active já existente continua aplicada.

-- -------------------------------------------------------------------------
-- 7. Validação fail-closed antes do COMMIT
-- -------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_preferences_policy_count integer;
  v_trigger_security_definer boolean;
BEGIN
  IF has_function_privilege('anon', 'public.check_workout_achievements()', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0.2 validation failed: anon can execute check_workout_achievements';
  END IF;

  IF has_function_privilege('anon', 'public.cleanup_stale_sessions()', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0.2 validation failed: anon can execute cleanup_stale_sessions';
  END IF;

  IF has_function_privilege('anon', 'public.get_last_exercise_log(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0.2 validation failed: anon can execute get_last_exercise_log';
  END IF;

  SELECT p.prosecdef
  INTO v_trigger_security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'check_admin_privileges'
    AND pg_get_function_identity_arguments(p.oid) = '';

  IF v_trigger_security_definer IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'P0.2 validation failed: check_admin_privileges must be SECURITY INVOKER';
  END IF;

  SELECT count(*)
  INTO v_admin_preferences_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'admin_preferences'
    AND policyname = 'admin_preferences_owner_manage'
    AND roles = ARRAY['authenticated']::name[];

  IF v_admin_preferences_policy_count <> 1 THEN
    RAISE EXCEPTION 'P0.2 validation failed: admin_preferences owner policy missing';
  END IF;
END $$;

COMMIT;

-- -------------------------------------------------------------------------
-- 8. Relatório pós-migration (somente leitura)
-- -------------------------------------------------------------------------
SELECT
  c.relname AS view_name,
  c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'exercise_progress';

SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS function_config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'admin_update_user_access',
    'check_admin_privileges',
    'check_workout_achievements',
    'cleanup_stale_sessions',
    'fn_process_achievements',
    'get_last_exercise_log',
    'get_recommended_exercises',
    'get_user_streak',
    'sync_user_weight_from_bio',
    'trigger_admin_email_webhook',
    'update_personal_best'
  )
ORDER BY p.proname, arguments;

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'admin_preferences'
ORDER BY policyname;
