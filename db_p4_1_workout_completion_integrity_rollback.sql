-- KYRON P4.1 rollback — removes completion guards only.

drop trigger if exists tr_kyron_validate_workout_completion on public.workout_history;
drop trigger if exists tr_kyron_cleanup_partial_session_after_completion on public.workout_history;
drop function if exists public.kyron_validate_workout_completion();
drop function if exists public.kyron_cleanup_partial_session_after_completion();

drop index if exists public.idx_partial_workout_sessions_history_id;
drop index if exists public.idx_partial_workout_sessions_workout_id;

alter table public.workout_history
  drop constraint if exists workout_history_duration_nonnegative;
alter table public.workout_history
  drop constraint if exists workout_history_exercises_count_nonnegative;

-- Restore legacy achievements behavior for compatibility.
drop trigger if exists tr_achievements on public.workout_history;
create trigger tr_achievements
after update on public.workout_history
for each row
execute function public.fn_process_achievements();
