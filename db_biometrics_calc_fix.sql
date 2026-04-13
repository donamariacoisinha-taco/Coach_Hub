
-- Adição da coluna body_fat_kg para armazenar o valor absoluto da gordura
ALTER TABLE public.body_measurements 
ADD COLUMN IF NOT EXISTS body_fat_kg DECIMAL;

COMMENT ON COLUMN public.body_measurements.body_fat_kg IS 'Massa gorda absoluta calculada em KG';
