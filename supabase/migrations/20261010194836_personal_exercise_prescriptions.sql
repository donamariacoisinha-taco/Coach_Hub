create table public.exercise_prescriptions (
 user_id uuid not null references auth.users(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id) on delete cascade,
 sets_json jsonb not null check (jsonb_typeof(sets_json) = 'array' and jsonb_array_length(sets_json) > 0),
 updated_at timestamptz not null default now(),
 primary key (user_id, exercise_id)
);
alter table public.exercise_prescriptions enable row level security;
create policy personal_prescriptions_select on public.exercise_prescriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy personal_prescriptions_insert on public.exercise_prescriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy personal_prescriptions_update on public.exercise_prescriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy personal_prescriptions_delete on public.exercise_prescriptions for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.exercise_prescriptions to authenticated;
