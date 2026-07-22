-- =========================================================================
-- KYRON OS P0 — Segurança e Integridade
-- Execute manualmente no SQL Editor do Supabase após revisar em staging.
-- Objetivos:
-- 1. Tornar status de conta, premium e admin fonte oficial no banco.
-- 2. Criar trilha de auditoria administrativa.
-- 3. Endurecer RLS de exercícios.
-- 4. Criar função transacional para soft delete/desativação de usuários.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Profiles: campos oficiais de segurança e assinatura
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_account_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_status_check
      CHECK (account_status IN ('active', 'suspended', 'deleted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('free', 'premium', 'trial', 'past_due', 'cancelled'));
  END IF;
END $$;

-- Backfill a partir de campos legados sem removê-los ainda.
UPDATE public.profiles
SET subscription_status = CASE
  WHEN COALESCE(is_premium, false) = true THEN 'premium'
  ELSE COALESCE(subscription_status, 'free')
END;

-- -------------------------------------------------------------------------
-- 2. Função admin segura
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_flag BOOLEAN;
BEGIN
  SELECT COALESCE(is_admin, false) OR role = 'admin'
  INTO admin_flag
  FROM public.profiles
  WHERE id = auth.uid()
    AND account_status = 'active';

  RETURN COALESCE(admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -------------------------------------------------------------------------
-- 3. Auditoria administrativa imutável
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_logs_select_policy ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_select_policy ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS admin_audit_logs_insert_policy ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_insert_policy ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() AND actor_user_id = auth.uid());

DROP POLICY IF EXISTS admin_audit_logs_no_update ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_no_update ON public.admin_audit_logs
FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS admin_audit_logs_no_delete ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_no_delete ON public.admin_audit_logs
FOR DELETE TO authenticated
USING (false);

-- -------------------------------------------------------------------------
-- 4. RLS de profiles
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;
CREATE POLICY profiles_delete_policy ON public.profiles
FOR DELETE TO authenticated
USING (public.is_admin());

-- -------------------------------------------------------------------------
-- 5. Endurecimento de RLS em exercises
-- -------------------------------------------------------------------------
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercises_insert_policy ON public.exercises;
CREATE POLICY exercises_insert_policy ON public.exercises
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

DROP POLICY IF EXISTS exercises_update_policy ON public.exercises;
CREATE POLICY exercises_update_policy ON public.exercises
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

DROP POLICY IF EXISTS exercises_delete_policy ON public.exercises;
CREATE POLICY exercises_delete_policy ON public.exercises
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- -------------------------------------------------------------------------
-- 6. Funções administrativas transacionais
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  target_user_id UUID,
  next_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF next_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'invalid account status: %', next_status;
  END IF;

  UPDATE public.profiles
  SET account_status = next_status,
      suspended_at = CASE WHEN next_status = 'suspended' THEN now() ELSE suspended_at END,
      suspended_by = CASE WHEN next_status = 'suspended' THEN auth.uid() ELSE suspended_by END,
      deleted_at = CASE WHEN next_status = 'deleted' THEN now() ELSE deleted_at END,
      deleted_by = CASE WHEN next_status = 'deleted' THEN auth.uid() ELSE deleted_by END,
      updated_at = now()
  WHERE id = target_user_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'target profile not found';
  END IF;

  INSERT INTO public.admin_audit_logs(actor_user_id, target_user_id, action, reason, metadata)
  VALUES (auth.uid(), target_user_id, 'account_status_changed', reason, jsonb_build_object('status', next_status));

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_set_account_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(
  target_user_id UUID,
  next_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF next_status NOT IN ('free', 'premium', 'trial', 'past_due', 'cancelled') THEN
    RAISE EXCEPTION 'invalid subscription status: %', next_status;
  END IF;

  UPDATE public.profiles
  SET subscription_status = next_status,
      is_premium = next_status IN ('premium', 'trial'),
      updated_at = now()
  WHERE id = target_user_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'target profile not found';
  END IF;

  INSERT INTO public.admin_audit_logs(actor_user_id, target_user_id, action, reason, metadata)
  VALUES (auth.uid(), target_user_id, 'subscription_status_changed', reason, jsonb_build_object('status', next_status));

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_set_subscription_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_status(UUID, TEXT, TEXT) TO authenticated;

-- Soft delete: não apaga dados físicos. A recuperação permanece possível.
CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  result public.profiles;
BEGIN
  result := public.admin_set_account_status(target_user_id, 'deleted', reason);

  DELETE FROM public.partial_workout_sessions
  WHERE user_id = target_user_id;

  INSERT INTO public.admin_audit_logs(actor_user_id, target_user_id, action, reason, metadata)
  VALUES (auth.uid(), target_user_id, 'user_soft_deleted', reason, '{}'::jsonb);

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_soft_delete_user(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(UUID, TEXT) TO authenticated;

-- -------------------------------------------------------------------------
-- 7. Índices de suporte
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created ON public.admin_audit_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_created ON public.admin_audit_logs(actor_user_id, created_at DESC);

COMMIT;

SELECT 'KYRON OS P0 security integrity migration ready' AS status;
