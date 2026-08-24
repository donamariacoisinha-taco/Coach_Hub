-- Remove the redundant SELECT policy that calls is_admin() for anon users.
-- exercises_select_v2 already preserves:
--   * public reads of active global exercises;
--   * owner reads of personal exercises;
--   * authenticated admin reads.
-- Keeping this policy made every anonymous SELECT fail with SQLSTATE 42501
-- before Postgres could combine it with the other permissive policies.
drop policy if exists exercises_select_policy on public.exercises;

-- Remove the second redundant permissive policy as well. Unlike
-- exercises_select_v2, it did not require user_id IS NULL for public rows and
-- could expose active personal exercises to anonymous clients.
drop policy if exists exercises_visibility_policy on public.exercises;
