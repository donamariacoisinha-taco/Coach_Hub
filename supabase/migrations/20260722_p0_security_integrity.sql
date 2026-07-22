-- KYRON OS — P0 Security & Integrity Foundation
-- Run manually in Supabase SQL Editor after reviewing in staging.
-- This migration does not delete user data.

BEGIN;

-- ---------------------------------------------------------------------------
-- Profiles: server-side source of truth for account status and subscription.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

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
      CHECK (subscription_status IN ('free', 'premium', 'trial', 'cancelled', 'past_due'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- ---------------------------------------------------------------------------
-- Admin audit log: immutable administrative trail.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_user_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_logs_select_admin ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_select_admin ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS admin_audit_logs_insert_admin ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_insert_admin ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() AND actor_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER functions for controlled account mutations.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  target_user_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF new_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'invalid_account_status';
  END IF;

  UPDATE public.profiles
  SET
    account_status = new_status,
    suspended_at = CASE WHEN new_status = 'suspended' THEN timezone('utc'::text, now()) ELSE suspended_at END,
    suspended_by = CASE WHEN new_status = 'suspended' THEN auth.uid() ELSE suspended_by END,
    deleted_at = CASE WHEN new_status = 'deleted' THEN timezone('utc'::text, now()) ELSE deleted_at END,
    deleted_by = CASE WHEN new_status = 'deleted' THEN auth.uid() ELSE deleted_by END
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;

  IF updated_profile.id IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  INSERT INTO public.admin_audit_logs(actor_user_id, target_user_id, action, reason, metadata)
  VALUES (auth.uid(), target_user_id, 'account_status_changed', reason, jsonb_build_object('new_status', new_status));

  RETURN updated_profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(
  target_user_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF new_status NOT IN ('free', 'premium', 'trial', 'cancelled', 'past_due') THEN
    RAISE EXCEPTION 'invalid_subscription_status';
  END IF;

  UPDATE public.profiles
  SET subscription_status = new_status,
      is_premium = new_status IN ('premium', 'trial')
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;

  IF updated_profile.id IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  INSERT INTO public.admin_audit_logs(actor_user_id, target_user_id, action, reason, metadata)
  VALUES (auth.uid(), target_user_id, 'subscription_status_changed', reason, jsonb_build_object('new_status', new_status));

  RETURN updated_profile;
END;
$$;

-- ---------------------------------------------------------------------------
-- Exercise ownership hardening.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS exercises_insert_policy ON public.exercises;
CREATE POLICY exercises_insert_policy ON public.exercises
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS exercises_update_policy ON public.exercises;
CREATE POLICY exercises_update_policy ON public.exercises
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

COMMIT;
