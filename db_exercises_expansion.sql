
-- EXPANSÃO DA BIBLIOTECA DE EXERCÍCIOS - COACH DIGITAL PRO
-- 5 Novos exercícios por grupo muscular (65 total)

INSERT INTO public.exercises (name, muscle_group, muscle_group_id, type, difficulty_level, technical_prompt, is_active) VALUES
-- PEITO (Chest)
('Supino Inclinado com Halteres', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Incline dumbbell bench press, upper pectoralis focus, white background', true),
('Crucifixo Reto com Halteres', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Dumbbell flyes, chest stretch focus, white background', true),
('Chest Press Articulado', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito'), 'machine', 'beginner', 'Professional 3D anatomy: Seated lever chest press machine, pectoralis focus, white background', true),
('Crossover Polia Alta', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito'), 'machine', 'advanced', 'Professional 3D anatomy: High cable crossover, lower chest focus, white background', true),
('Paralelas (Foco Peitoral)', 'Peito', (SELECT id FROM muscle_groups WHERE name = 'Peito'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Chest dips, leaning forward, lower pectoralis focus, white background', true),

-- COSTAS (Back)
('Barra Fixa (Pull-up)', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Wide grip pull-up, latissimus dorsi focus, white background', true),
('Remada Unilateral (Serrote)', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'free_weight', 'intermediate', 'Professional 3D anatomy: One arm dumbbell row, back thickness focus, white background', true),
('Pulldown com Corda', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'machine', 'intermediate', 'Professional 3D anatomy: Straight arm cable pulldown, lats isolation, white background', true),
('Remada Cavalinho', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'machine', 'intermediate', 'Professional 3D anatomy: T-bar row, mid-back focus, white background', true),
('Levantamento Terra Convencional', 'Costas', (SELECT id FROM muscle_groups WHERE name = 'Costas'), 'free_weight', 'advanced', 'Professional 3D anatomy: Barbell deadlift, posterior chain and back focus, white background', true),

-- PERNAS (Legs)
('Agachamento Búlgaro', 'Pernas', (SELECT id FROM muscle_groups WHERE name = 'Pernas'), 'free_weight', 'advanced', 'Professional 3D anatomy: Bulgarian split squat, quads and glute focus, white background', true),
('Cadeira Flexora Unilateral', 'Pernas', (SELECT id FROM muscle_groups WHERE name = 'Pernas'), 'machine', 'intermediate', 'Professional 3D anatomy: Single leg seated curl, hamstrings focus, white background', true),
('Stiff com Barra', 'Pernas', (SELECT id FROM muscle_groups WHERE name = 'Pernas'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Barbell stiff-legged deadlift, hamstrings focus, white background', true),
('Afundo Caminhada', 'Pernas', (SELECT id FROM muscle_groups WHERE name = 'Pernas'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Walking lunges, full leg development, white background', true),
('Leg Press Pés Altos (Foco Isquios)', 'Pernas', (SELECT id FROM muscle_groups WHERE name = 'Pernas'), 'machine', 'intermediate', 'Professional 3D anatomy: High foot placement leg press, hamstrings and glute focus, white background', true),

-- OMBROS (Shoulders)
('Desenvolvimento Arnold', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'free_weight', 'advanced', 'Professional 3D anatomy: Arnold press, full deltoid focus, white background', true),
('Elevação Lateral na Polia', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'machine', 'intermediate', 'Professional 3D anatomy: Cable lateral raise, medial deltoid isolation, white background', true),
('Elevação Frontal com Corda', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'machine', 'beginner', 'Professional 3D anatomy: Cable front raise, anterior deltoid focus, white background', true),
('Face Pull', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'machine', 'intermediate', 'Professional 3D anatomy: Rope face pull, rear deltoid and rotator cuff focus, white background', true),
('Crucifixo Inverso com Halteres', 'Ombros', (SELECT id FROM muscle_groups WHERE name = 'Ombros'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Rear delt dumbbell flyes, posterior deltoid focus, white background', true),

-- BÍCEPS
('Rosca Scott na Máquina', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'machine', 'intermediate', 'Professional 3D anatomy: Machine preacher curl, biceps brachii isolation, white background', true),
('Rosca Martelo com Halteres', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'free_weight', 'beginner', 'Professional 3D anatomy: Hammer dumbbell curl, brachialis and brachioradialis focus, white background', true),
('Rosca Concentrada', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Concentration curl, biceps peak focus, white background', true),
('Rosca 21 (Barra EZ)', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'free_weight', 'advanced', 'Professional 3D anatomy: 21s bicep curl set, high intensity, white background', true),
('Rosca Spider (Banco Inclinado)', 'Bíceps', (SELECT id FROM muscle_groups WHERE name = 'Bíceps'), 'free_weight', 'advanced', 'Professional 3D anatomy: Spider curl, short head biceps focus, white background', true),

-- TRÍCEPS
('Tríceps Testa (Barra W)', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Skull crushers EZ bar, long head triceps focus, white background', true),
('Tríceps Francês com Halter', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Overhead dumbbell triceps extension, long head focus, white background', true),
('Mergulho no Gravitron', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'machine', 'beginner', 'Professional 3D anatomy: Assisted dip machine, triceps focus, white background', true),
('Tríceps Coice na Polia', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'machine', 'intermediate', 'Professional 3D anatomy: Cable triceps kickback, lateral head focus, white background', true),
('Tríceps Supinado (Barra)', 'Tríceps', (SELECT id FROM muscle_groups WHERE name = 'Tríceps'), 'free_weight', 'advanced', 'Professional 3D anatomy: Close grip bench press, triceps power focus, white background', true),

-- ABDOMINAIS
('Prancha Abdominal com Peso', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Weighted plank, core stability, white background', true),
('Abdominal Infra na Barra Fixa', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Hanging leg raises, lower abs focus, white background', true),
('Abdominal Canivete', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: V-up exercise, rectus abdominis focus, white background', true),
('Roll-out (Roda Abdominal)', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'free_weight', 'advanced', 'Professional 3D anatomy: Ab wheel rollout, deep core focus, white background', true),
('Dragon Flag', 'Abdominais', (SELECT id FROM muscle_groups WHERE name = 'Abdominais'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Dragon flag exercise, extreme core strength, white background', true),

-- GLÚTEOS
('Elevação Pélvica com Barra', 'Glúteos', (SELECT id FROM muscle_groups WHERE name = 'Glúteos'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Barbell hip thrust, gluteus maximus focus, white background', true),
('Abdução de Quadril na Polia', 'Glúteos', (SELECT id FROM muscle_groups WHERE name = 'Glúteos'), 'machine', 'beginner', 'Professional 3D anatomy: Cable hip abduction, gluteus medius focus, white background', true),
('Agachamento Sumô com Halter', 'Glúteos', (SELECT id FROM muscle_groups WHERE name = 'Glúteos'), 'free_weight', 'beginner', 'Professional 3D anatomy: Sumo squat with dumbbell, inner thigh and glute focus, white background', true),
('Coice de Glúteo no Cabo', 'Glúteos', (SELECT id FROM muscle_groups WHERE name = 'Glúteos'), 'machine', 'intermediate', 'Professional 3D anatomy: Cable glute kickback, isolation focus, white background', true),
('Step-up na Caixa', 'Glúteos', (SELECT id FROM muscle_groups WHERE name = 'Glúteos'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Weighted box step up, glute and quad focus, white background', true),

-- TRAPÉZIO
('Encolhimento com Halteres', 'Trapézio', (SELECT id FROM muscle_groups WHERE name = 'Trapézio'), 'free_weight', 'beginner', 'Professional 3D anatomy: Dumbbell shrug, upper trapezius focus, white background', true),
('Encolhimento com Barra por Trás', 'Trapézio', (SELECT id FROM muscle_groups WHERE name = 'Trapézio'), 'free_weight', 'advanced', 'Professional 3D anatomy: Behind the back barbell shrug, mid-trap focus, white background', true),
('Remada Alta (Barra EZ)', 'Trapézio', (SELECT id FROM muscle_groups WHERE name = 'Trapézio'), 'free_weight', 'intermediate', 'Professional 3D anatomy: EZ bar upright row, trapezius and lateral delt, white background', true),
('Farmers Walk', 'Trapézio', (SELECT id FROM muscle_groups WHERE name = 'Trapézio'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Farmers carry, traps and grip strength, white background', true),
('Encolhimento no Smith', 'Trapézio', (SELECT id FROM muscle_groups WHERE name = 'Trapézio'), 'machine', 'beginner', 'Professional 3D anatomy: Smith machine shrug, trapezius focus, white background', true),

-- ANTEBRAÇO
('Rosca Inversa com Barra', 'Antebraço', (SELECT id FROM muscle_groups WHERE name = 'Antebraço'), 'free_weight', 'beginner', 'Professional 3D anatomy: Reverse barbell curl, brachioradialis focus, white background', true),
('Rosca de Punho com Barra', 'Antebraço', (SELECT id FROM muscle_groups WHERE name = 'Antebraço'), 'free_weight', 'beginner', 'Professional 3D anatomy: Wrist curl, forearm flexors focus, white background', true),
('Rosca de Punho Inversa', 'Antebraço', (SELECT id FROM muscle_groups WHERE name = 'Antebraço'), 'free_weight', 'beginner', 'Professional 3D anatomy: Reverse wrist curl, forearm extensors focus, white background', true),
('Hang Hold (Pendurado)', 'Antebraço', (SELECT id FROM muscle_groups WHERE name = 'Antebraço'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Static bar hang, grip endurance focus, white background', true),
('Wrist Roller', 'Antebraço', (SELECT id FROM muscle_groups WHERE name = 'Antebraço'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Wrist roller exercise, full forearm pump, white background', true),

-- OBLÍQUOS
('Woodchopper na Polia', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'machine', 'intermediate', 'Professional 3D anatomy: Cable woodchopper, oblique rotation focus, white background', true),
('Prancha Lateral Dinâmica', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Side plank dips, obliques isolation, white background', true),
('Windmill com Kettlebell', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'free_weight', 'advanced', 'Professional 3D anatomy: Kettlebell windmill, core and oblique stability, white background', true),
('Side Bend com Halter', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'free_weight', 'beginner', 'Professional 3D anatomy: Dumbbell side bend, obliques focus, white background', true),
('Abdominal Bicicleta Controlado', 'Oblíquos', (SELECT id FROM muscle_groups WHERE name = 'Oblíquos'), 'bodyweight', 'intermediate', 'Professional 3D anatomy: Slow bicycle crunch, oblique focus, white background', true),

-- ADUTORES
('Adutor no Cabo (Pé)', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'machine', 'beginner', 'Professional 3D anatomy: Standing cable adduction, inner thigh focus, white background', true),
('Agachamento Cossaco', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Cossack squat, inner thigh mobility and strength, white background', true),
('Prancha Copenhagen', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'bodyweight', 'advanced', 'Professional 3D anatomy: Copenhagen side plank, adductor isolation, white background', true),
('Agachamento Lateral com Halter', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Dumbbell side lunge, inner thigh focus, white background', true),
('Cadeira Adutora (Pausa Isométrica)', 'Adutores', (SELECT id FROM muscle_groups WHERE name = 'Adutores'), 'machine', 'intermediate', 'Professional 3D anatomy: Adductor machine with pause, high intensity, white background', true),

-- PANTURRILHAS
('Gêmeos Sentado na Máquina', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'machine', 'beginner', 'Professional 3D anatomy: Seated calf raise machine, soleus focus, white background', true),
('Panturrilha no Leg Press', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'machine', 'beginner', 'Professional 3D anatomy: Leg press calf raise, gastrocnemius focus, white background', true),
('Gêmeos em Pé no Smith', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'machine', 'intermediate', 'Professional 3D anatomy: Smith machine standing calf raise, white background', true),
('Calf Raise Unilateral (Halter)', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'free_weight', 'intermediate', 'Professional 3D anatomy: Single leg standing calf raise, white background', true),
('Donkey Calf Raise', 'Panturrilhas', (SELECT id FROM muscle_groups WHERE name = 'Panturrilhas'), 'machine', 'advanced', 'Professional 3D anatomy: Donkey calf raise machine, high stretch focus, white background', true)
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  muscle_group_id = EXCLUDED.muscle_group_id,
  type = EXCLUDED.type,
  difficulty_level = EXCLUDED.difficulty_level,
  technical_prompt = EXCLUDED.technical_prompt;
