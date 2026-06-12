-- =========================================================================
-- MIGRATION: CORREÇÃO DEFINITIVA DE PERMISSÕES E GESTÃO DE ATLETAS (RLS)
-- Execute este arquivo no SQL Editor do seu painel do Supabase.
-- =========================================================================

-- 0. GARANTIR QUE AS COLUNAS EXISTEM NA TABELA PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 1. GARANTIR A EXISTÊNCIA DA FUNÇÃO IS_ADMIN
-- Esta função verifica se o usuário autenticado atual é um administrador na tabela profiles.
-- Definida como SECURITY DEFINER para poder ler a própria tabela public.profiles ignorando o RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Tenta obter o status is_admin do usuário logado
  SELECT is_admin INTO is_admin_user
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.is_admin IS 'Verifica se o usuário logado possui privilégios de administrador.';

-- 2. RECRIAR POLÍTICAS DE CONTROLE E VISIBILIDADE (RLS) PARA A TABELA PROFILES
-- O RLS anterior impedia que os administradores visualizassem ou atualizassem dados de outros atletas.

-- Desativa RLS temporariamente para remover políticas antigas com segurança
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover políticas restritivas antigas e novas para garantir idempotência em reexecuções
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile or admins insert all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_policy" ON public.profiles;

-- Reativar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- [POLÍTICA DE LEITURA / SELECT]
-- Regra: Um usuário comum só pode ler seu próprio perfil (auth.uid() = id).
-- Regra Especial: Um administrador (public.is_admin() = true) pode ver TODOS os perfis do sistema.
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
);

-- [POLÍTICA DE ATUALIZAÇÃO / UPDATE]
-- Regra: Um usuário comum só pode atualizar seu próprio perfil.
-- Regra Especial: Um administrador pode atualizar o perfil de qualquer atleta (como marcar Premium, alterar status, etc).
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id 
  OR public.is_admin()
);

-- [POLÍTICA DE INSERÇÃO / INSERT]
-- Regra: Qualquer usuário autenticado ou administrador pode registrar perfis.
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = id 
  OR public.is_admin()
);

-- [POLÍTICA DE EXCLUSÃO / DELETE]
-- Regra: Apenas administradores podem remover perfis de atletas do sistema.
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated
USING (
  public.is_admin()
);

-- [POLÍTICA DE CONTROLE TOTAL DO SERVICE ROLE]
-- Regra: O service_role administrativo interno do próprio Supabase possui super-acesso irrestrito.
CREATE POLICY "profiles_service_role_policy" ON public.profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


-- 3. FORÇAR A ELEVAÇÃO/CRIAÇÃO DAS CONTAS DE ADMINISTRADORES DIRETAMENTE NO BANCO de DADOS
-- Isso garante que as contas cadastradas tenham acesso absoluto ao sistema antes mesmo de fazer login.

INSERT INTO public.profiles (id, email, is_admin, onboarding_completed, created_at)
SELECT id, email, true, true, now()
FROM auth.users
WHERE LOWER(email) IN ('donamariacoisinha@gmail.com', 'marivaldotorres@gmail.com')
ON CONFLICT (id) DO UPDATE
SET is_admin = true, email = EXCLUDED.email;

-- 4. CONCEDER TODAS AS PERMISSÕES DE TABELA PARA USUÁRIOS AUTENTICADOS & SERVICE_ROLE
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 5. TRIGGER ON auth.users PARA CRIAR PERFIS AUTOMATICAMENTE NA TABELA public.profiles
-- Isto garante que qualquer usuário novo cadastrado tenha seu perfil criado na hora,
-- e se torne visível imediatamente na lista do painel administrativo.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin, onboarding_completed, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    false, 
    false, 
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo se houver, e recriar
DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- 6. FAZER BACKFILL DOS USUÁRIOS EXISTENTES DE auth.users QUE NÃO POSSUEM PERFIL EM public.profiles
-- Rodar este script fará com que usuários como veraluciafreitas@gmail.com e lucassaraivatorres@gmail.com
-- apareçam imediatamente na tabela profiles e no seu painel administrativo.
INSERT INTO public.profiles (id, email, is_admin, onboarding_completed, created_at)
SELECT id, email, false, false, COALESCE(created_at, now())
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Log de confirmação de sucesso
SELECT 'Políticas RLS e Trigger de Criação criados e sincronizados com sucesso!' AS status;
