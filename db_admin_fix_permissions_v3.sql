-- Adiciona políticas para permitir que administradores vejam e editem dados de todos os usuários
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

-- Adiciona políticas para workout_categories
DROP POLICY IF EXISTS "Admins can view and edit all categories" ON public.workout_categories;
CREATE POLICY "Admins can view and edit all categories" ON public.workout_categories
  FOR ALL TO authenticated
  USING (public.is_admin());

-- Adiciona políticas para workout_folders
DROP POLICY IF EXISTS "Admins can view and edit all folders" ON public.workout_folders;
CREATE POLICY "Admins can view and edit all folders" ON public.workout_folders
  FOR ALL TO authenticated
  USING (public.is_admin());

-- Adiciona políticas para workout_history
DROP POLICY IF EXISTS "Admins can view and edit all history" ON public.workout_history;
CREATE POLICY "Admins can view and edit all history" ON public.workout_history
  FOR ALL TO authenticated
  USING (public.is_admin());
