
-- ADIÇÃO DE IDENTIDADE VISUAL AO PERFIL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo ou de exibição preferido pelo atleta.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da imagem de perfil (Cloudinary ou externa).';
