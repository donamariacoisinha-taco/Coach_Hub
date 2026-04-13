
-- Expansão da tabela de medidas para suporte total a bioimpedância (Estilo Fitdays)
-- Atualizado: Mudança de INTEGER para DECIMAL para evitar erro de sintaxe com valores quebrados
ALTER TABLE public.body_measurements 
ADD COLUMN IF NOT EXISTS body_fat_pct DECIMAL,
ADD COLUMN IF NOT EXISTS muscle_rate_pct DECIMAL,
ADD COLUMN IF NOT EXISTS fat_free_mass_kg DECIMAL,
ADD COLUMN IF NOT EXISTS subcutaneous_fat_pct DECIMAL,
ADD COLUMN IF NOT EXISTS visceral_fat_index DECIMAL, -- Corrigido de INTEGER para DECIMAL
ADD COLUMN IF NOT EXISTS body_water_pct DECIMAL,
ADD COLUMN IF NOT EXISTS skeletal_muscle_pct DECIMAL,
ADD COLUMN IF NOT EXISTS muscle_mass_kg DECIMAL,
ADD COLUMN IF NOT EXISTS bone_mass_kg DECIMAL,
ADD COLUMN IF NOT EXISTS protein_pct DECIMAL,
ADD COLUMN IF NOT EXISTS bmr_kcal DECIMAL, -- Corrigido de INTEGER para DECIMAL
ADD COLUMN IF NOT EXISTS metabolic_age DECIMAL; -- Corrigido de INTEGER para DECIMAL

-- Se as colunas já existirem como INTEGER, tentamos converter para DECIMAL
DO $$ 
BEGIN 
    ALTER TABLE public.body_measurements ALTER COLUMN visceral_fat_index TYPE DECIMAL USING visceral_fat_index::DECIMAL;
    ALTER TABLE public.body_measurements ALTER COLUMN bmr_kcal TYPE DECIMAL USING bmr_kcal::DECIMAL;
    ALTER TABLE public.body_measurements ALTER COLUMN metabolic_age TYPE DECIMAL USING metabolic_age::DECIMAL;
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Ajuste de tipo ignorado ou colunas ainda não criadas.';
END $$;

COMMENT ON COLUMN public.body_measurements.visceral_fat_index IS 'Índice de gordura visceral (Suporta decimais ex: 13.7)';
COMMENT ON COLUMN public.body_measurements.bmr_kcal IS 'Taxa Metabólica Basal em kcal';
