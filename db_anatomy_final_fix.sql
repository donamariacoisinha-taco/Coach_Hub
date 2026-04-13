
-- 1. Adiciona a coluna se não existir
ALTER TABLE public.muscle_groups 
ADD COLUMN IF NOT EXISTS body_side TEXT CHECK (body_side IN ('front', 'back')) DEFAULT 'front';

-- 2. Mapeamento de Lado Anterior (Frente)
UPDATE public.muscle_groups 
SET body_side = 'front' 
WHERE name IN ('Peito', 'Bíceps', 'Abdominais', 'Ombros', 'Adutores', 'Oblíquos', 'Quadríceps', 'Perna');

-- 3. Mapeamento de Lado Posterior (Costas)
UPDATE public.muscle_groups 
SET body_side = 'back' 
WHERE name IN ('Costas', 'Tríceps', 'Glúteos', 'Trapézio', 'Antebraço', 'Panturrilhas', 'Posteriores');

COMMENT ON COLUMN public.muscle_groups.body_side IS 'Lado anatômico: front (Anterior) ou back (Posterior).';
