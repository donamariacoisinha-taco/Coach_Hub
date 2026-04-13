
-- Garantir catálogo de exercícios antes da migração
INSERT INTO public.muscle_groups (name) VALUES ('Ombros'), ('Bíceps'), ('Tríceps'), ('Costas'), ('Peito') ON CONFLICT DO NOTHING;

INSERT INTO public.exercises (name, muscle_group, muscle_group_id, type, difficulty_level, is_active)
VALUES 
('Chest Press Articulado', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito' LIMIT 1), 'machine', 'beginner', true),
('Remada Sentada (Máquina)', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas' LIMIT 1), 'machine', 'beginner', true),
('Rosca Direta (Barra EZ)', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps' LIMIT 1), 'free_weight', 'beginner', true),
('Tríceps Corda (Polia)', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps' LIMIT 1), 'machine', 'beginner', true),
('Desenvolvimento Halteres', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros' LIMIT 1), 'free_weight', 'beginner', true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

DO $$
DECLARE
    row_record RECORD;
    ex_supino UUID := (SELECT id FROM exercises WHERE name = 'Chest Press Articulado' LIMIT 1);
    ex_remada UUID := (SELECT id FROM exercises WHERE name = 'Remada Sentada (Máquina)' LIMIT 1);
    ex_rosca  UUID := (SELECT id FROM exercises WHERE name = 'Rosca Direta (Barra EZ)' LIMIT 1);
    ex_triceps UUID := (SELECT id FROM exercises WHERE name = 'Tríceps Corda (Polia)' LIMIT 1);
    ex_desenv UUID := (SELECT id FROM exercises WHERE name = 'Desenvolvimento Halteres' LIMIT 1);
BEGIN
    FOR row_record IN 
        SELECT id FROM workout_categories 
        WHERE name = 'Full Body A' 
        AND folder_id IN (SELECT id FROM workout_folders WHERE name = 'Iniciantes')
    LOOP
        -- Limpa exercícios antigos da ficha
        DELETE FROM workout_exercises WHERE category_id = row_record.id;

        -- Insere a nova lista apenas se os IDs foram encontrados
        IF ex_supino IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_supino, 3, '10', 60, 1, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_remada IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_remada, 3, '10', 60, 2, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_rosca IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_rosca, 3, '12', 60, 3, '[{"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_triceps IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_triceps, 3, '8', 60, 4, '[{"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_desenv IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_desenv, 3, '10', 60, 5, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;
    END LOOP;
END $$;
