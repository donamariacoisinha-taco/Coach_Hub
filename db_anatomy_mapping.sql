
-- 1. ADIÇÃO DA COLUNA DE LADO ANATÔMICO
ALTER TABLE public.muscle_groups 
ADD COLUMN IF NOT EXISTS body_side TEXT CHECK (body_side IN ('front', 'back')) DEFAULT 'front';

-- 2. MAPEAMENTO DOS GRUPOS EXISTENTES PARA CADEIAS CINÉTICAS
-- CADEIA ANTERIOR (FRENTE)
UPDATE public.muscle_groups SET body_side = 'front' WHERE name IN (
  'Peito', 'Bíceps', 'Abdominais', 'Ombros', 'Adutores', 'Oblíquos'
);

-- CADEIA POSTERIOR (COSTAS)
UPDATE public.muscle_groups SET body_side = 'back' WHERE name IN (
  'Costas', 'Tríceps', 'Glúteos', 'Trapézio', 'Antebraço', 'Panturrilhas'
);

-- 3. CRIAÇÃO DE GRUPOS ESPECÍFICOS PARA REFINAMENTO DE PERNAS
-- O grupo 'Pernas' genérico é subdividido para permitir filtros front/back precisos
INSERT INTO public.muscle_groups (name, body_side) 
VALUES ('Quadríceps', 'front'), ('Posteriores', 'back')
ON CONFLICT (name) DO UPDATE SET body_side = EXCLUDED.body_side;

-- 4. MIGRAÇÃO DE EXERCÍCIOS PARA OS NOVOS GRUPOS ANATÔMICOS
-- Quadríceps (Frente)
UPDATE public.exercises 
SET muscle_group = 'Quadríceps', 
    muscle_group_id = (SELECT id FROM muscle_groups WHERE name = 'Quadríceps')
WHERE (muscle_group = 'Pernas' OR muscle_group IS NULL) 
  AND (name ILIKE '%Agachamento%' OR name ILIKE '%Leg Press%' OR name ILIKE '%Extensora%' OR name ILIKE '%Hacker%');

-- Posteriores (Costa)
UPDATE public.exercises 
SET muscle_group = 'Posteriores', 
    muscle_group_id = (SELECT id FROM muscle_groups WHERE name = 'Posteriores')
WHERE (muscle_group = 'Pernas' OR muscle_group IS NULL) 
  AND (name ILIKE '%Flexora%' OR name ILIKE '%Stiff%' OR name ILIKE '%Mesa Flexora%' OR name ILIKE '%Cadeira Flexora%');

-- Glúteos (Costa)
UPDATE public.exercises 
SET muscle_group = 'Glúteos', 
    muscle_group_id = (SELECT id FROM muscle_groups WHERE name = 'Glúteos')
WHERE muscle_group = 'Pernas' AND (name ILIKE '%Elevação Pélvica%' OR name ILIKE '%Coice%');

-- Garantir que não existam mais exercícios vinculados ao grupo genérico 'Pernas' se possível
DELETE FROM public.muscle_groups WHERE name = 'Pernas' AND NOT EXISTS (SELECT 1 FROM exercises WHERE muscle_group_id = muscle_groups.id);

COMMENT ON COLUMN public.muscle_groups.body_side IS 'Define a localização anatômica: front (Anterior) ou back (Posterior).';
