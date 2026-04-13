
-- 1. REFORÇO DA FUNÇÃO DE VERIFICAÇÃO DE ADMIN (SECURITY DEFINER para ignorar RLS na checagem)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS (Evita o erro 42710)
DROP POLICY IF EXISTS "exercises_delete_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_delete_access" ON public.exercises;
DROP POLICY IF EXISTS "exercises_full_delete_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_admin_delete_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_select_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_update_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_full_update_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_insert_policy" ON public.exercises;

-- 3. CRIAÇÃO DAS NOVAS POLÍTICAS ROBUSTAS

-- LEITURA: Qualquer um vê ativos, dono vê os seus, Admin vê todos
CREATE POLICY "exercises_select_policy" ON public.exercises 
FOR SELECT USING (
  is_active = true 
  OR auth.uid() = user_id 
  OR public.is_admin()
);

-- INSERÇÃO: Usuário logado pode criar
CREATE POLICY "exercises_insert_policy" ON public.exercises 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- ATUALIZAÇÃO: Dono ou Admin
CREATE POLICY "exercises_update_policy" ON public.exercises
FOR UPDATE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- DELEÇÃO: Dono ou Admin (O ponto que estava gerando o erro)
CREATE POLICY "exercises_delete_policy" ON public.exercises
FOR DELETE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- 4. GARANTIA DE INTEGRIDADE REFERENCIAL (Cascata)
-- Permite deletar o exercício do catálogo e remover automaticamente das fichas existentes
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

COMMENT ON POLICY "exercises_delete_policy" ON public.exercises IS 'Permissão total de exclusão para administradores e donos de registros.';
