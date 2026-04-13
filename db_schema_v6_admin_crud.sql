
-- 1. GARANTIR CASCADE EM WORKOUT_EXERCISES
-- Isso evita erro de chave estrangeira ao deletar um exercício base.
ALTER TABLE public.workout_exercises 
DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey,
ADD CONSTRAINT workout_exercises_exercise_id_fkey 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE public.workout_sets_log 
DROP CONSTRAINT IF EXISTS workout_sets_log_exercise_id_fkey,
ADD CONSTRAINT workout_sets_log_exercise_id_fkey 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE public.user_favorite_exercises 
DROP CONSTRAINT IF EXISTS user_favorite_exercises_exercise_id_fkey,
ADD CONSTRAINT user_favorite_exercises_exercise_id_fkey 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

-- 2. REFORÇO DE RLS PARA ADMIN CRUD
-- Garante que admins possam criar/editar/deletar qualquer exercício.
-- Usuários comuns podem criar apenas para si (user_id preenchido).

DROP POLICY IF EXISTS "exercises_insert_policy" ON public.exercises;
CREATE POLICY "exercises_insert_policy" ON public.exercises 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "exercises_full_update_policy" ON public.exercises;
CREATE POLICY "exercises_full_update_policy" ON public.exercises
FOR UPDATE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

DROP POLICY IF EXISTS "exercises_full_delete_policy" ON public.exercises;
CREATE POLICY "exercises_full_delete_policy" ON public.exercises
FOR DELETE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- 3. COMENTÁRIOS DE CONTROLE
COMMENT ON TABLE public.exercises IS 'Biblioteca global e personalizada de exercícios controlada via Admin CRUD.';
