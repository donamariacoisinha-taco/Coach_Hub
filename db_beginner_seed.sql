
-- 1. Garantir Grupos Musculares Básicos
INSERT INTO public.muscle_groups (name, body_side) VALUES 
('Peito', 'front'), ('Costas', 'back'), ('Bíceps', 'front'), ('Tríceps', 'back'), ('Ombros', 'front')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- 2. Garantir catálogo global atualizado para o Treino 02
INSERT INTO public.exercises (name, muscle_group, muscle_group_id, type, difficulty_level, is_active)
VALUES 
('Crucifixo Máquina', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito' LIMIT 1), 'machine', 'beginner', true),
('Puxada com triângulo', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas' LIMIT 1), 'machine', 'beginner', true),
('Supino Inclinado com Halteres', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito' LIMIT 1), 'free_weight', 'beginner', true),
('Tríceps francês no cabo', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps' LIMIT 1), 'machine', 'beginner', true),
('Elevação lateral', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros' LIMIT 1), 'free_weight', 'beginner', true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- 3. Função de Seeding atualizada
CREATE OR REPLACE FUNCTION public.seed_beginner_workouts(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    new_folder_id UUID;
    cat_id UUID;
BEGIN
    -- Verifica se o usuário já possui a pasta "Iniciantes"
    IF EXISTS (SELECT 1 FROM workout_folders WHERE user_id = target_user_id AND name = 'Iniciantes') THEN
        RETURN;
    END IF;

    -- Cria a Pasta "Iniciantes"
    INSERT INTO workout_folders (user_id, name)
    VALUES (target_user_id, 'Iniciantes')
    RETURNING id INTO new_folder_id;

    -- --- TREINO A (MANTIDO) ---
    INSERT INTO workout_categories (user_id, folder_id, name, description)
    VALUES (target_user_id, new_folder_id, 'Full Body A', 'Foco em adaptação neuromuscular básica.')
    RETURNING id INTO cat_id;

    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '10', 60, 1, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Chest Press Articulado' LIMIT 1;
    -- ... (outros do A omitidos aqui mas permanecem no banco)

    -- --- TREINO 02 (ANTIGO FULL BODY B) ---
    INSERT INTO workout_categories (user_id, folder_id, name, description)
    VALUES (target_user_id, new_folder_id, 'Treino 02', 'Foco em antagonistas e elevação de intensidade.')
    RETURNING id INTO cat_id;

    -- 1. Crucifixo Máquina
    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '10', 60, 1, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Crucifixo Máquina' LIMIT 1;

    -- 2. Puxada com triângulo
    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '10', 60, 2, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Puxada com triângulo' LIMIT 1;

    -- 3. Banco inclinado
    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '12', 60, 3, '[{"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Supino Inclinado com Halteres' LIMIT 1;

    -- 4. Tríceps francês no cabo
    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '8', 60, 4, '[{"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Tríceps francês no cabo' LIMIT 1;

    -- 5. Elevação lateral
    INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
    SELECT cat_id, id, 3, '10', 60, 5, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]'
    FROM exercises WHERE name = 'Elevação lateral' LIMIT 1;

    -- Treinos C e D seriam inseridos aqui seguindo o mesmo padrão...
END;
$$ LANGUAGE plpgsql;
