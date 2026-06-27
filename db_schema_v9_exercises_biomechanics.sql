-- ====================================================
-- KYRON OS - DATABASE SCHEMA UPGRADE V9 (EXERCÍCIOS 2.0)
-- INCLUSÃO DE TAXONOMIA BIOMECÂNICA AVANÇADA EM JSONB
-- ====================================================

-- 1. Add biomechanics JSONB column if it doesn't exist
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS biomechanics JSONB DEFAULT NULL;

-- 2. Create high-performance GIN index for deep querying inside JSONB
CREATE INDEX IF NOT EXISTS idx_exercises_biomechanics 
ON exercises USING gin (biomechanics);

-- 3. Document table upgrades and audit details
COMMENT ON COLUMN exercises.biomechanics IS 'Mapeamento biomecânico completo (primary_group, agonist_muscles, synergist_muscles, stabilizer_muscles, antagonist_muscles, movement_pattern, equipment_needed, tags)';
