
-- 1. PREPARAÇÃO DE ESTRUTURA
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'muscle_groups_name_key') THEN
    ALTER TABLE muscle_groups ADD CONSTRAINT muscle_groups_name_key UNIQUE (name);
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exercises_name_key') THEN
    ALTER TABLE exercises ADD CONSTRAINT exercises_name_key UNIQUE (name);
  END IF;
END $$;

-- Adição da coluna de usuário para rastrear propriedade (Dono do exercício)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. SINCRONIZAÇÃO DE GRUPOS MUSCULARES
-- 'Perna' adicionada como categoria principal
INSERT INTO muscle_groups (name, body_side, parent_id) VALUES 
('Peito', 'front', NULL), 
('Costas', 'back', NULL), 
('Perna', 'front', NULL), 
('Ombros', 'front', NULL), 
('Bíceps', 'front', NULL), 
('Tríceps', 'back', NULL), 
('Abdominais', 'front', NULL), 
('Glúteos', 'back', NULL), 
('Trapézio', 'back', NULL), 
('Antebraço', 'back', NULL), 
('Oblíquos', 'front', NULL), 
('Adutores', 'front', NULL), 
('Panturrilhas', 'back', NULL)
ON CONFLICT (name) DO UPDATE SET 
  parent_id = EXCLUDED.parent_id,
  body_side = EXCLUDED.body_side;

-- 3. EXPANSÃO DA BIBLIOTECA DE EXERCÍCIOS (SEED DATA)
INSERT INTO exercises (name, muscle_group, muscle_group_id, type, difficulty_level, technical_prompt, is_active) VALUES
('Agachamento Livre', 'Perna', (SELECT id FROM muscle_groups WHERE name = 'Perna'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Barbell back squat, quadriceps focus, white background', true),
('Leg Press 45', 'Perna', (SELECT id FROM muscle_groups WHERE name = 'Perna'), 'machine', 'beginner', 'Professional 3D anatomy: Leg press machine, quadriceps focus, white background', true),
('Agachamento Hacker', 'Perna', (SELECT id FROM muscle_groups WHERE name = 'Perna'), 'machine', 'intermediate', 'Professional 3D anatomy: Hack squat machine, quadriceps focus, white background', true),
('Cadeira Extensora', 'Perna', (SELECT id FROM muscle_groups WHERE name = 'Perna'), 'machine', 'beginner', 'Professional 3D anatomy: Leg extension machine, quadriceps isolation focus, white background', true),
('Cadeira Flexora', 'Perna', (SELECT id FROM muscle_groups WHERE name = 'Perna'), 'machine', 'beginner', 'Professional 3D anatomy: Seated leg curl machine, hamstrings isolation focus, white background', true),
('Gêmeos em Pé', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'machine', 'beginner', 'Professional 3D anatomy: Standing calf raise, gastrocnemius focus, white background', true),
('Cadeira Adutora', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'machine', 'beginner', 'Professional 3D anatomy: Adductor machine exercise, inner thigh focus, white background', true),
('Abdominal Supra', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'bodyweight', 'beginner', 'Professional 3D anatomy: Crunch exercise, rectus abdominis focus, white background', true),
('Russian Twist', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Russian twist exercise, obliques focus, white background', true),
('Puxada Frente', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'machine', 'beginner', 'Professional 3D anatomy: Lat pulldown, latissimus dorsi focus, white background', true),
('Remada Curvada', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'free_weight', 'advanced', 'Professional 3D anatomy: Bent over barbell row, back focus, white background', true),
('Rosca Direta (Barra EZ)', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'free_weight', 'beginner', 'Professional 3D anatomy: EZ bar bicep curl, biceps brachii focus, white background', true),
('Tríceps Pulley', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'machine', 'beginner', 'Professional 3D anatomy: Cable triceps pushdown, triceps focus, white background', true),
('Desenvolvimento Halteres', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Dumbbell shoulder press, deltoids focus, white background', true)
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  muscle_group_id = EXCLUDED.muscle_group_id,
  type = EXCLUDED.type,
  technical_prompt = EXCLUDED.technical_prompt,
  is_active = EXCLUDED.is_active;

-- 4. OTIMIZAÇÃO DE PERFORMANCE (ÍNDICES)
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_date ON workout_history(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_category ON workout_exercises(category_id, sort_order);

-- 5. REVISÃO DE RLS (SEGURANÇA GRANULAR)

-- Função auxiliar para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS na tabela
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Usuário vê exercícios ativos (biblioteca) ou exercícios criados por ele mesmo, ou é admin
DROP POLICY IF EXISTS "exercises_read_access" ON exercises;
DROP POLICY IF EXISTS "exercises_select_policy" ON exercises;
CREATE POLICY "exercises_select_policy" ON public.exercises 
FOR SELECT USING (
  is_active = true 
  OR auth.uid() = user_id 
  OR public.is_admin()
);

-- Política de Inserção: Qualquer usuário autenticado pode criar exercícios
DROP POLICY IF EXISTS "exercises_insert_access" ON exercises;
DROP POLICY IF EXISTS "exercises_insert_policy" ON exercises;
CREATE POLICY "exercises_insert_policy" ON public.exercises 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Política de Atualização: Apenas o dono do exercício ou um administrador pode editar
DROP POLICY IF EXISTS "exercises_update_access" ON exercises;
DROP POLICY IF EXISTS "exercises_update_policy" ON exercises;
CREATE POLICY "exercises_update_policy" ON public.exercises 
FOR UPDATE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- Política de Deleção: Apenas o dono do exercício ou um administrador pode excluir
DROP POLICY IF EXISTS "exercises_delete_access" ON exercises;
DROP POLICY IF EXISTS "exercises_delete_policy" ON exercises;
CREATE POLICY "exercises_delete_policy" ON public.exercises 
FOR DELETE USING (
  auth.uid() = user_id 
  OR public.is_admin()
);
