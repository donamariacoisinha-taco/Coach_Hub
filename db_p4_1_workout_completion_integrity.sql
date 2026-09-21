-- KYRON P4.1 — Athlete journey and workout completion integrity
-- Prevents invalid/duplicate completion transitions while preserving legacy audit rows.

alter table public.workout_history
  drop constraint if exists workout_history_duration_nonnegative;

alter table public.workout_history
  add constraint workout_history_duration_nonnegative
  check (duration_minutes is null or duration_minutes >= 0)
  not valid;

alter table public.workout_history
  validate constraint workout_history_duration_nonnegative;

alter table public.workout_history
  drop constraint if exists workout_history_exercises_count_nonnegative;

alter table public.workout_history
  add constraint workout_history_exercises_count_nonnegative
  check (exercises_count is null or exercises_count >= 0)
  not valid;

alter table public.workout_history
  validate constraint workout_history_exercises_count_nonnegative;

create index if not exists idx_partial_workout_sessions_workout_id
  on public.partial_workout_sessions (workout_id)
  where workout_id is not null;

create index if not exists idx_partial_workout_sessions_history_id
  on public.partial_workout_sessions (history_id)
  where history_id is not null;

create or replace function public.kyron_validate_workout_completion()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_saved_set_count bigint;
begin
  -- Once completed, the canonical completion timestamp cannot be moved by a
  -- duplicate client request. Other non-critical fields remain correctable.
  if tg_op = 'UPDATE' and old.completed_at is not null then
    if new.completed_at is distinct from old.completed_at then
      new.completed_at := old.completed_at;
    end if;
    return new;
  end if;

  -- Starting or editing an incomplete session remains unchanged.
  if new.completed_at is null then
    return new;
  end if;

  if coalesce(new.exercises_count, 0) <= 0 then
    raise exception using
      errcode = '23514',
      message = 'workout_completion_requires_exercises',
      detail = 'A workout can only be completed after at least one exercise is recorded.';
  end if;

  if coalesce(new.duration_minutes, 0) < 0 then
    raise exception using
      errcode = '23514',
      message = 'workout_completion_requires_valid_duration',
      detail = 'Workout duration cannot be negative.';
  end if;

  select count(*)
    into v_saved_set_count
  from public.workout_sets_log
  where history_id = new.id;

  if v_saved_set_count = 0 then
    raise exception using
      errcode = '23514',
      message = 'workout_completion_requires_saved_sets',
      detail = 'A workout can only be completed after its set logs are persisted.';
  end if;

  return new;
end;
$$;

revoke execute on function public.kyron_validate_workout_completion()
  from public, anon, authenticated;

drop trigger if exists tr_kyron_validate_workout_completion
  on public.workout_history;

create trigger tr_kyron_validate_workout_completion
before insert or update of completed_at
on public.workout_history
for each row
execute function public.kyron_validate_workout_completion();

create or replace function public.kyron_cleanup_partial_session_after_completion()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.completed_at is not null
     and (tg_op = 'INSERT' or old.completed_at is null) then
    delete from public.partial_workout_sessions
    where user_id = new.user_id
      and (
        history_id = new.id
        or (history_id is null and workout_id is not distinct from new.category_id)
      );
  end if;

  return new;
end;
$$;

revoke execute on function public.kyron_cleanup_partial_session_after_completion()
  from public, anon, authenticated;

drop trigger if exists tr_kyron_cleanup_partial_session_after_completion
  on public.workout_history;

create trigger tr_kyron_cleanup_partial_session_after_completion
after insert or update of completed_at
on public.workout_history
for each row
execute function public.kyron_cleanup_partial_session_after_completion();

-- Achievements must be calculated once: only on the first successful
-- incomplete -> completed transition.
drop trigger if exists tr_achievements on public.workout_history;

create trigger tr_achievements
after update of completed_at
on public.workout_history
for each row
when (old.completed_at is null and new.completed_at is not null)
execute function public.fn_process_achievements();

-- Trigger functions are internal implementation details, not public RPCs.
revoke execute on function public.fn_process_achievements()
  from public, anon, authenticated;

-- Remove only stale resumable sessions already linked to a completed history.
delete from public.partial_workout_sessions p
using public.workout_history h
where p.history_id = h.id
  and h.completed_at is not null;
