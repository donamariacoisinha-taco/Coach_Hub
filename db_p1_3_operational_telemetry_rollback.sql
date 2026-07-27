-- KYRON OS P1.3 — Operational telemetry rollback
-- WARNING: this removes the aggregated telemetry objects and their counters.
-- It does not alter profiles, user_access, workouts, exercises or auth users.

BEGIN;

DROP VIEW IF EXISTS public.operational_telemetry_summary;
DROP FUNCTION IF EXISTS public.record_operational_telemetry(jsonb);
DROP TABLE IF EXISTS public.operational_telemetry_daily;

COMMIT;
