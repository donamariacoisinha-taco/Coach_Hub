
-- TABELA DE FOTOS DE PROGRESSO (REFINADA)
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    tag TEXT DEFAULT 'frente', -- 'frente', 'lado', 'costas'
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Fotos de Progresso
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their progress photos" ON public.progress_photos;
CREATE POLICY "Users can manage their progress photos" ON public.progress_photos 
FOR ALL USING (auth.uid() = user_id);

-- Índices para performance de busca cronológica
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_tag ON public.progress_photos(user_id, tag);
CREATE INDEX IF NOT EXISTS idx_progress_photos_created_at ON public.progress_photos(created_at DESC);
