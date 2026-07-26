-- KYRON OS P1.3 — Privacy-safe operational telemetry
-- Stores aggregated counters only. No user ids, e-mails, tokens, payloads,
-- error messages, workout content or device fingerprints are persisted.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.user_access') IS NULL THEN
    RAISE EXCEPTION 'P1.3 preflight failed: public.user_access is missing';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'P1.3 preflight failed: public.is_admin() is missing';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.operational_telemetry_daily (
  day date NOT NULL DEFAULT CURRENT_DATE,
  event_name text NOT NULL,
  route_group text NOT NULL,
  build text NOT NULL,
  event_count bigint NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, event_name, route_group, build),
  CONSTRAINT operational_telemetry_event_allowlist CHECK (
    event_name IN (
      'app_runtime_error',
      'app_recovery_retry',
      'app_recovery_reload',
      'connectivity_online',
      'connectivity_offline',
      'sync_storage_unavailable',
      'sync_storage_restored',
      'sync_manual_started',
      'sync_manual_succeeded',
      'sync_manual_failed',
      'sync_retry_one_started',
      'sync_retry_one_succeeded',
      'sync_retry_one_failed',
      'sync_retry_all_started',
      'sync_retry_all_succeeded',
      'sync_retry_all_failed',
      'diagnostic_copied'
    )
  ),
  CONSTRAINT operational_telemetry_route_allowlist CHECK (
    route_group IN (
      'landing',
      'auth',
      'onboarding',
      'dashboard',
      'workout',
      'preparation',
      'editor',
      'history',
      'admin',
      'profile',
      'library',
      'dieta',
      'unknown'
    )
  ),
  CONSTRAINT operational_telemetry_build_length CHECK (char_length(build) BETWEEN 1 AND 40)
);

ALTER TABLE public.operational_telemetry_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_telemetry_admin_read ON public.operational_telemetry_daily;
CREATE POLICY operational_telemetry_admin_read
ON public.operational_telemetry_daily
FOR SELECT
TO authenticated
USING (public.is_admin());

REVOKE ALL ON TABLE public.operational_telemetry_daily FROM PUBLIC;
REVOKE ALL ON TABLE public.operational_telemetry_daily FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.operational_telemetry_daily FROM authenticated;
GRANT SELECT ON TABLE public.operational_telemetry_daily TO authenticated;

CREATE OR REPLACE FUNCTION public.record_operational_telemetry(events jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  accepted integer := 0;
  v_event_name text;
  v_route_group text;
  v_build text;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_access ua
    WHERE ua.user_id = auth.uid()
      AND ua.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active account required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(events) <> 'array' THEN
    RAISE EXCEPTION 'events must be a JSON array' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(events) > 25 THEN
    RAISE EXCEPTION 'events batch exceeds 25 entries' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(events)
  LOOP
    v_event_name := item->>'event_name';
    v_route_group := item->>'route_group';
    v_build := left(coalesce(nullif(item->>'build', ''), 'unknown'), 40);
    v_count := greatest(1, least(coalesce((item->>'count')::integer, 1), 100));

    IF v_event_name NOT IN (
      'app_runtime_error',
      'app_recovery_retry',
      'app_recovery_reload',
      'connectivity_online',
      'connectivity_offline',
      'sync_storage_unavailable',
      'sync_storage_restored',
      'sync_manual_started',
      'sync_manual_succeeded',
      'sync_manual_failed',
      'sync_retry_one_started',
      'sync_retry_one_succeeded',
      'sync_retry_one_failed',
      'sync_retry_all_started',
      'sync_retry_all_succeeded',
      'sync_retry_all_failed',
      'diagnostic_copied'
    ) THEN
      CONTINUE;
    END IF;

    IF v_route_group NOT IN (
      'landing',
      'auth',
      'onboarding',
      'dashboard',
      'workout',
      'preparation',
      'editor',
      'history',
      'admin',
      'profile',
      'library',
      'dieta',
      'unknown'
    ) THEN
      v_route_group := 'unknown';
    END IF;

    INSERT INTO public.operational_telemetry_daily (
      day,
      event_name,
      route_group,
      build,
      event_count,
      first_seen_at,
      last_seen_at
    ) VALUES (
      CURRENT_DATE,
      v_event_name,
      v_route_group,
      v_build,
      v_count,
      now(),
      now()
    )
    ON CONFLICT (day, event_name, route_group, build)
    DO UPDATE SET
      event_count = public.operational_telemetry_daily.event_count + EXCLUDED.event_count,
      last_seen_at = now();

    accepted := accepted + 1;
  END LOOP;

  RETURN accepted;
END;
$$;

REVOKE ALL ON FUNCTION public.record_operational_telemetry(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_operational_telemetry(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_operational_telemetry(jsonb) TO authenticated;

CREATE OR REPLACE VIEW public.operational_telemetry_summary
WITH (security_invoker = true)
AS
SELECT
  day,
  event_name,
  route_group,
  build,
  event_count,
  first_seen_at,
  last_seen_at
FROM public.operational_telemetry_daily;

REVOKE ALL ON TABLE public.operational_telemetry_summary FROM PUBLIC;
REVOKE ALL ON TABLE public.operational_telemetry_summary FROM anon;
GRANT SELECT ON TABLE public.operational_telemetry_summary TO authenticated;

COMMENT ON TABLE public.operational_telemetry_daily IS
'Aggregated operational counters only. Deliberately excludes user identifiers and application payloads.';

COMMENT ON FUNCTION public.record_operational_telemetry(jsonb) IS
'Accepts allowlisted aggregated operational counters from active authenticated users.';

COMMIT;
