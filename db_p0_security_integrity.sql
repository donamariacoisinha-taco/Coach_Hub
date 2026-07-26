-- =========================================================================
-- KYRON OS P0 — Validação e hardening da arquitetura user_access
-- =========================================================================
-- IMPORTANTE
--
-- A produção já possui a fundação P0 oficial:
--   public.user_access
--   public.user_access_audit
--   public.admin_update_user_access(uuid, text, text, text, text)
--   private.current_user_is_admin()
--   private.current_user_is_active()
--
-- Este arquivo NÃO cria account_status/subscription_status em profiles,
-- NÃO cria uma segunda auditoria, NÃO cria soft delete e NÃO apaga sessões.
-- Ele falha de forma segura se a fundação oficial não estiver presente.
--
-- Não executar automaticamente. Revisar antes no SQL Editor.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Preflight fail-closed: confirmar a arquitetura oficial já existente
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_access') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: public.user_access is missing';
  END IF;

  IF to_regclass('public.user_access_audit') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: public.user_access_audit is missing';
  END IF;

  IF to_regprocedure('public.admin_update_user_access(uuid,text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: public.admin_update_user_access(uuid,text,text,text,text) is missing';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: public.is_admin() is missing';
  END IF;

  IF to_regprocedure('private.current_user_is_admin()') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: private.current_user_is_admin() is missing';
  END IF;

  IF to_regprocedure('private.current_user_is_active()') IS NULL THEN
    RAISE EXCEPTION 'P0 preflight failed: private.current_user_is_active() is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'profiles'
      AND trigger_name = 'ensure_user_access_after_profile_insert'
  ) THEN
    RAISE EXCEPTION 'P0 preflight failed: ensure_user_access_after_profile_insert trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'profiles'
      AND trigger_name = 'guard_profile_authorization_columns_before_update'
  ) THEN
    RAISE EXCEPTION 'P0 preflight failed: guard_profile_authorization_columns_before_update trigger is missing';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2. user_access: leitura autenticada; mutação somente pela RPC auditada
-- -------------------------------------------------------------------------
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_audit ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_access FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_access_audit FROM anon, authenticated;

GRANT SELECT ON TABLE public.user_access TO authenticated;
GRANT SELECT ON TABLE public.user_access_audit TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_access(uuid, text, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -------------------------------------------------------------------------
-- 3. Exercises: consolidar apenas as policies de mutação
-- -------------------------------------------------------------------------
-- Policies SELECT existentes são preservadas. As policies permissivas abaixo
-- também concediam INSERT/UPDATE/DELETE e poderiam contornar a propriedade.

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to exercises" ON public.exercises;
DROP POLICY IF EXISTS exercises_admin_manage ON public.exercises;
DROP POLICY IF EXISTS exercises_insert_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_update_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_delete_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_master_update_policy ON public.exercises;
DROP POLICY IF EXISTS exercises_master_delete_policy ON public.exercises;
DROP POLICY IF EXISTS master_admin_policy ON public.exercises;

DROP POLICY IF EXISTS exercises_insert_owner_or_admin ON public.exercises;
CREATE POLICY exercises_insert_owner_or_admin
ON public.exercises
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS exercises_update_owner_or_admin ON public.exercises;
CREATE POLICY exercises_update_owner_or_admin
ON public.exercises
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS exercises_delete_owner_or_admin ON public.exercises;
CREATE POLICY exercises_delete_owner_or_admin
ON public.exercises
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

-- -------------------------------------------------------------------------
-- 4. Integridade mínima antes do COMMIT
-- -------------------------------------------------------------------------
DO $$
DECLARE
  profiles_without_access BIGINT;
  active_admins BIGINT;
BEGIN
  SELECT count(*)
  INTO profiles_without_access
  FROM public.profiles p
  LEFT JOIN public.user_access ua ON ua.user_id = p.id
  WHERE ua.user_id IS NULL;

  IF profiles_without_access > 0 THEN
    RAISE EXCEPTION 'P0 integrity failed: % profiles do not have user_access', profiles_without_access;
  END IF;

  SELECT count(*)
  INTO active_admins
  FROM public.user_access
  WHERE role = 'admin' AND status = 'active';

  IF active_admins < 1 THEN
    RAISE EXCEPTION 'P0 integrity failed: no active administrator exists';
  END IF;
END $$;

COMMIT;

-- -------------------------------------------------------------------------
-- 5. Relatório pós-migration (somente leitura)
-- -------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM public.profiles) AS profiles_count,
  (SELECT count(*) FROM public.user_access) AS user_access_count,
  (SELECT count(*) FROM public.user_access WHERE role = 'admin' AND status = 'active') AS active_admins,
  (SELECT count(*) FROM public.user_access WHERE plan = 'premium') AS premium_users,
  (SELECT count(*) FROM public.user_access WHERE status = 'suspended') AS suspended_users;

SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_access', 'user_access_audit', 'exercises')
ORDER BY tablename, policyname;
