
-- 1. REFORÇO DA FUNÇÃO DE VERIFICAÇÃO DE ADMIN (SECURITY DEFINER para ignorar RLS na checagem)
-- Adicionando explicitamente o search_path para evitar ataques de search-path e erros de contexto.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT is_admin INTO is_admin_user
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. RESET TOTAL DE POLÍTICAS NA TABELA EXERCISES
DROP POLICY IF EXISTS "exercises_delete_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_select_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_update_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_insert_policy" ON public.exercises;

-- 3. CRIAÇÃO DAS POLÍTICAS ROBUSTAS

-- LEITURA: Qualquer autenticado vê ativos, dono vê os seus, Admin vê absolutamente tudo.
CREATE POLICY "exercises_select_policy" ON public.exercises 
FOR SELECT TO authenticated
USING (
  is_active = true 
  OR auth.uid() = user_id 
  OR public.is_admin()
);

-- INSERÇÃO: Usuário logado pode criar seu próprio exercício.
CREATE POLICY "exercises_insert_policy" ON public.exercises 
FOR INSERT TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
);

-- ATUALIZAÇÃO: Dono ou Admin.
CREATE POLICY "exercises_update_policy" ON public.exercises
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- DELEÇÃO: Apenas Admin ou o Dono criador.
CREATE POLICY "exercises_delete_policy" ON public.exercises
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- 4. GARANTIA DE PERMISSÕES NA TABELA PROFILES
-- O RLS na tabela profiles às vezes impede que o admin se "reconheça" se não houver policy de select para si mesmo.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

COMMENT ON FUNCTION public.is_admin IS 'Verifica se o usuário atual possui privilégios administrativos ignorando o RLS da tabela profiles.';
