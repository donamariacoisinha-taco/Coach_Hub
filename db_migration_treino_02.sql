
-- Sincronização para usuários antigos
DO $$
DECLARE
    row_record RECORD;
    ex_crucifixo UUID := (SELECT id FROM exercises WHERE name = 'Crucifixo Máquina' LIMIT 1);
    ex_puxada    UUID := (SELECT id FROM exercises WHERE name = 'Puxada com triângulo' LIMIT 1);
    ex_inclinado UUID := (SELECT id FROM exercises WHERE name = 'Supino Inclinado com Halteres' LIMIT 1);
    ex_triceps   UUID := (SELECT id FROM exercises WHERE name = 'Tríceps francês no cabo' LIMIT 1);
    ex_lateral   UUID := (SELECT id FROM exercises WHERE name = 'Elevação lateral' LIMIT 1);
BEGIN
    -- Localiza a ficha "Full body B" em pastas chamadas "Iniciantes"
    FOR row_record IN 
        SELECT c.id 
        FROM workout_categories c
        JOIN workout_folders f ON c.folder_id = f.id
        WHERE c.name = 'Full body B' AND f.name = 'Iniciantes'
    LOOP
        -- 1. Renomeia a Ficha
        UPDATE workout_categories SET name = 'Treino 02' WHERE id = row_record.id;

        -- 2. Remove exercícios antigos
        DELETE FROM workout_exercises WHERE category_id = row_record.id;

        -- 3. Insere a nova lista (Garantindo que IDs existam)
        IF ex_crucifixo IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_crucifixo, 3, '10', 60, 1, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_puxada IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_puxada, 3, '10', 60, 2, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_inclinado IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_inclinado, 3, '12', 60, 3, '[{"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}, {"reps": "12", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_triceps IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_triceps, 3, '8', 60, 4, '[{"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}, {"reps": "8", "weight": 0, "rest_time": 60}]');
        END IF;

        IF ex_lateral IS NOT NULL THEN
            INSERT INTO workout_exercises (category_id, exercise_id, sets, reps, rest_time, sort_order, sets_json)
            VALUES (row_record.id, ex_lateral, 3, '10', 60, 5, '[{"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}, {"reps": "10", "weight": 0, "rest_time": 60}]');
        END IF;
    END LOOP;
END $$;
