-- ======================================================
-- KYRON OS — DATA MIGRATION — EXERCISE BIOMECHANICS 2.0
-- FASE 3E — PATCH BIOMECÂNICO PARA EXERCÍCIOS PENDENTES DE ALTA CONFIANÇA
-- Generated on 2026-06-27T09:12:22.601Z
-- ======================================================

BEGIN;

-- Aplicando Biomechanics para os 57 exercícios classificados como ALTA CONFIANÇA
-- Exercício: "Abdominal Supra" (ID: dab903cd-7b57-4ae7-9101-c6c908a0b594, Grupo Legado: Abdominais)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen superior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["flexion"]}'::jsonb
WHERE id = 'dab903cd-7b57-4ae7-9101-c6c908a0b594';

-- Exercício: "Agachamento Hacker" (ID: 4cb9a5c6-c12f-4ccf-b400-dbd3b77a8ed7, Grupo Legado: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["squat"]}'::jsonb
WHERE id = '4cb9a5c6-c12f-4ccf-b400-dbd3b77a8ed7';

-- Exercício: "Apoio inclinado " (ID: 5fc52e22-bad9-4742-bb41-925db73f18ca, Grupo Legado: Peitoral inferior)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral superior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = '5fc52e22-bad9-4742-bb41-925db73f18ca';

-- Exercício: "Apoio reto" (ID: 9164f005-d63b-40c4-9025-43f6bfe754c1, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = '9164f005-d63b-40c4-9025-43f6bfe754c1';

-- Exercício: "Cadeira Adutora" (ID: 857f39b2-9401-4b05-90c9-20d721445e05, Grupo Legado: Adutores)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Adutores"],"synergist_muscles":["Pectíneo","Grácil"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Abdutores"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Adução de quadril"],"tags":["isolation"]}'::jsonb
WHERE id = '857f39b2-9401-4b05-90c9-20d721445e05';

-- Exercício: "Cadeira Extensora" (ID: c6ca893d-7d0f-4aca-9a09-e733839dc717, Grupo Legado: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["isolation"]}'::jsonb
WHERE id = 'c6ca893d-7d0f-4aca-9a09-e733839dc717';

-- Exercício: "Cadeira Flexora" (ID: 1f250d2f-dde2-4a9b-a215-b9388999e21b, Grupo Legado: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa"],"synergist_muscles":["Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de joelho"],"tags":["posterior","isquiotibiais","flexora","máquina","isolamento"]}'::jsonb
WHERE id = '1f250d2f-dde2-4a9b-a215-b9388999e21b';

-- Exercício: "Coice de Glúteo no Cabo" (ID: 06396d90-e0a4-4a61-b8fb-902813250d6e, Grupo Legado: Glúteos)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Glúteos","agonist_muscles":["Glúteo médio","Glúteo mínimo"],"synergist_muscles":["Isquiotibiais","Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Iliopssoas","Reto femoral"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de quadril","Rotação externa de quadril"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '06396d90-e0a4-4a61-b8fb-902813250d6e';

-- Exercício: "Crossover Polia Alta" (ID: d4ff7500-7f80-47e6-b70c-dc3765baa2e7, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Cabo"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["cabo","push"]}'::jsonb
WHERE id = 'd4ff7500-7f80-47e6-b70c-dc3765baa2e7';

-- Exercício: "Crucifixo em pé (polia)" (ID: b65aa86b-221d-4991-9b16-905a6d6612e4, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Cabo"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["cabo","push"]}'::jsonb
WHERE id = 'b65aa86b-221d-4991-9b16-905a6d6612e4';

-- Exercício: "Crucifixo Inverso com Halteres" (ID: 24bcc926-c307-431a-a91f-055797852e4a, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide posterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '24bcc926-c307-431a-a91f-055797852e4a';

-- Exercício: "Crucifixo Máquina (Peck Deck) - Voador" (ID: 023d35e6-3266-4576-a398-881fe7ad3a17, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Máquina"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["maquina","push"]}'::jsonb
WHERE id = '023d35e6-3266-4576-a398-881fe7ad3a17';

-- Exercício: "Crucifixo Reto com Halteres" (ID: 50c80ad1-9a82-4646-9e7b-93ed247a4ed2, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["reto","halter","push"]}'::jsonb
WHERE id = '50c80ad1-9a82-4646-9e7b-93ed247a4ed2';

-- Exercício: "Desenvolvimento Halteres" (ID: 69c00e63-5bf3-4c7f-96a0-68997f94e3c4, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["halter","push"]}'::jsonb
WHERE id = '69c00e63-5bf3-4c7f-96a0-68997f94e3c4';

-- Exercício: "Elevação Frontal com Corda" (ID: b53d4652-2eef-4d03-a588-db8c6a069ca1, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Solo"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["push"]}'::jsonb
WHERE id = 'b53d4652-2eef-4d03-a588-db8c6a069ca1';

-- Exercício: "Elevação lateral com halteres" (ID: ba6090bf-0142-483b-8c42-88642a85c27b, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro"],"tags":["halter","isolation"]}'::jsonb
WHERE id = 'ba6090bf-0142-483b-8c42-88642a85c27b';

-- Exercício: "Elevação Lateral na Polia" (ID: 1c4d0d3f-de4f-482a-ada8-b6e4c7c89600, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Abdução do ombro"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '1c4d0d3f-de4f-482a-ada8-b6e4c7c89600';

-- Exercício: "Elevação lateral sentado" (ID: d707178e-2fd3-4830-a8ac-0fd4a9270d61, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro"],"tags":["isolation"]}'::jsonb
WHERE id = 'd707178e-2fd3-4830-a8ac-0fd4a9270d61';

-- Exercício: "Elevação Pélvica com Barra" (ID: 6fa70f6f-5228-4d93-8c83-de76cdc0f7e1, Grupo Legado: Glúteos)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Glúteos","agonist_muscles":["Glúteo máximo"],"synergist_muscles":["Isquiotibiais","Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Iliopssoas","Reto femoral"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de quadril","Rotação externa de quadril"],"tags":["barra","hinge"]}'::jsonb
WHERE id = '6fa70f6f-5228-4d93-8c83-de76cdc0f7e1';

-- Exercício: "Encolhimento com Halteres" (ID: 7b1bbe23-0b38-440a-bc22-573ea9984577, Grupo Legado: Trapézio)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Trapézio médio","Trapézio inferior"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '7b1bbe23-0b38-440a-bc22-573ea9984577';

-- Exercício: "Encolhimento no Smith" (ID: f1a15992-6d0c-4bcb-a41a-156d16831892, Grupo Legado: Trapézio)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Trapézio médio","Trapézio inferior"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = 'f1a15992-6d0c-4bcb-a41a-156d16831892';

-- Exercício: "Face Pull" (ID: 2751f094-fad0-4eba-8263-df9b5f9201fb, Grupo Legado: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = '2751f094-fad0-4eba-8263-df9b5f9201fb';

-- Exercício: "Gêmeos em Pé" (ID: 926357fb-1e13-4eef-8a27-8d4b34f426fc, Grupo Legado: Panturrilhas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Panturrilhas"],"synergist_muscles":["Sóleio","Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Tibial anterior"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão plantar"],"tags":["isolation"]}'::jsonb
WHERE id = '926357fb-1e13-4eef-8a27-8d4b34f426fc';

-- Exercício: "Gêmeos em Pé no Smith" (ID: e39c8b41-8aa3-4395-a5fd-b68726349bb4, Grupo Legado: Panturrilhas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Panturrilhas"],"synergist_muscles":["Sóleio","Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Tibial anterior"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão plantar"],"tags":["isolation"]}'::jsonb
WHERE id = 'e39c8b41-8aa3-4395-a5fd-b68726349bb4';

-- Exercício: "Gêmeos Sentado na Máquina" (ID: 3ada3223-ed6a-4c51-8314-0414a26cc426, Grupo Legado: Panturrilhas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Panturrilhas"],"synergist_muscles":["Sóleio","Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Tibial anterior"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão plantar"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '3ada3223-ed6a-4c51-8314-0414a26cc426';

-- Exercício: "Leg Press 45" (ID: 61a4e898-62e7-4814-8dd7-1979ae310da3, Grupo Legado: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["squat"]}'::jsonb
WHERE id = '61a4e898-62e7-4814-8dd7-1979ae310da3';

-- Exercício: "Prancha Copenhagen" (ID: 66e37fc9-3b43-48f0-bcc0-e689e02b2aaa, Grupo Legado: Adutores)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Adutores"],"synergist_muscles":["Pectíneo","Grácil"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Abdutores"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Adução de quadril"],"tags":["isolation"]}'::jsonb
WHERE id = '66e37fc9-3b43-48f0-bcc0-e689e02b2aaa';

-- Exercício: "Prancha Lateral Dinâmica" (ID: ec6cea67-c9c2-431d-883d-423ee7c54e56, Grupo Legado: Oblíquos)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Oblíquos"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"rotation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["rotation"]}'::jsonb
WHERE id = 'ec6cea67-c9c2-431d-883d-423ee7c54e56';

-- Exercício: "Pulldown com Corda" (ID: 2e61e945-1243-4a83-85fb-a2d07ddda9af, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["pull"]}'::jsonb
WHERE id = '2e61e945-1243-4a83-85fb-a2d07ddda9af';

-- Exercício: "Puxada com triângulo" (ID: 0be65941-ce48-4650-8b79-01c56ce97348, Grupo Legado: Dorsais)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["pull"]}'::jsonb
WHERE id = '0be65941-ce48-4650-8b79-01c56ce97348';

-- Exercício: "Puxada Frente" (ID: 855ce97f-f4d2-40d9-a65a-62b1dc74ee65, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["pull"]}'::jsonb
WHERE id = '855ce97f-f4d2-40d9-a65a-62b1dc74ee65';

-- Exercício: "Remada Cavalinho" (ID: d207d225-d53b-4c14-a424-9aeeaa452436, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["pull"]}'::jsonb
WHERE id = 'd207d225-d53b-4c14-a424-9aeeaa452436';

-- Exercício: "Remada Curvada" (ID: 73a7c8d6-7ffb-45e4-b955-021a4e40f7de, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["pull"]}'::jsonb
WHERE id = '73a7c8d6-7ffb-45e4-b955-021a4e40f7de';

-- Exercício: "Remada Sentada (Máquina)" (ID: 250762bc-eb3c-41e8-91b6-cd57028bd6e3, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["maquina","pull"]}'::jsonb
WHERE id = '250762bc-eb3c-41e8-91b6-cd57028bd6e3';

-- Exercício: "Remada Unilateral (Serrote)" (ID: 81351c44-6495-4e73-a2ae-a0925882c181, Grupo Legado: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["unilateral","pull"]}'::jsonb
WHERE id = '81351c44-6495-4e73-a2ae-a0925882c181';

-- Exercício: "Rosca 21 (Barra EZ)" (ID: 45c779f2-c5e5-45c0-8c1f-a307dc139367, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '45c779f2-c5e5-45c0-8c1f-a307dc139367';

-- Exercício: "Rosca Concentrada" (ID: 66e0ea56-0b91-4e89-9903-506210acc568, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["isolation"]}'::jsonb
WHERE id = '66e0ea56-0b91-4e89-9903-506210acc568';

-- Exercício: "Rosca de Punho com Barra" (ID: dd9b93e9-a866-4c4f-8ad0-ed43b578f8f4, Grupo Legado: Antebraço)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = 'dd9b93e9-a866-4c4f-8ad0-ed43b578f8f4';

-- Exercício: "Rosca de Punho Inversa" (ID: f37f232d-55b5-4ec3-bea8-f05bfddb9aee, Grupo Legado: Antebraço)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Braquial","Braquiorradial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["isolation"]}'::jsonb
WHERE id = 'f37f232d-55b5-4ec3-bea8-f05bfddb9aee';

-- Exercício: "Rosca Direta" (ID: 5ca05f61-9c00-4944-9fbd-7b7db6471bf5, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["isolation"]}'::jsonb
WHERE id = '5ca05f61-9c00-4944-9fbd-7b7db6471bf5';

-- Exercício: "Rosca Direta (Barra EZ)" (ID: b8549a51-b191-4e11-b49a-ca7d133ed50c, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = 'b8549a51-b191-4e11-b49a-ca7d133ed50c';

-- Exercício: "Rosca Direta (Barra W)" (ID: 4c270bed-9cdb-4bbc-af40-404bdf9469ba, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '4c270bed-9cdb-4bbc-af40-404bdf9469ba';

-- Exercício: "Rosca Inversa com Barra" (ID: 423dd5b1-7056-4cb4-b010-bb02b2a9534d, Grupo Legado: Antebraço)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Braquial","Braquiorradial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '423dd5b1-7056-4cb4-b010-bb02b2a9534d';

-- Exercício: "Rosca Martelo com Halteres" (ID: 93c6839c-79c1-4a80-8729-ff56730b163f, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Braquial","Braquiorradial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '93c6839c-79c1-4a80-8729-ff56730b163f';

-- Exercício: "Rosca Scott na Máquina" (ID: a2473b19-f22f-4090-8bbe-f89416557eaf, Grupo Legado: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = 'a2473b19-f22f-4090-8bbe-f89416557eaf';

-- Exercício: "Russian Twist" (ID: 29051486-a738-453b-8591-e3be6a958597, Grupo Legado: Oblíquos)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Oblíquos"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"rotation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["rotation"]}'::jsonb
WHERE id = '29051486-a738-453b-8591-e3be6a958597';

-- Exercício: "Stiff com Barra" (ID: 823393f4-e7de-4a1f-bf77-b5e4ef120083, Grupo Legado: Posteriores)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa","Glúteo máximo"],"synergist_muscles":["Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de quadril"],"tags":["barra","hinge"]}'::jsonb
WHERE id = '823393f4-e7de-4a1f-bf77-b5e4ef120083';

-- Exercício: "Supino inclinado (Barra)" (ID: 2fa49f78-9484-4834-9cc4-5a31568a6539, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral superior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Barra"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["inclinado","barra","push"]}'::jsonb
WHERE id = '2fa49f78-9484-4834-9cc4-5a31568a6539';

-- Exercício: "Supino Inclinado (Máquina)" (ID: 92bea305-3b2d-4e81-9b13-a4d1e26c9a10, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral superior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Máquina"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["inclinado","maquina","push"]}'::jsonb
WHERE id = '92bea305-3b2d-4e81-9b13-a4d1e26c9a10';

-- Exercício: "Supino Inclinado com Halteres" (ID: 60988dbc-c573-4417-b664-23959abd3aa9, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral superior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["inclinado","halter","push"]}'::jsonb
WHERE id = '60988dbc-c573-4417-b664-23959abd3aa9';

-- Exercício: "Supino Reto com Halteres" (ID: 735e355b-4f74-4b1e-bf88-2f3996b2fc17, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["reto","halter","push"]}'::jsonb
WHERE id = '735e355b-4f74-4b1e-bf88-2f3996b2fc17';

-- Exercício: "Tríceps Corda (Extensão)" (ID: 118061da-b9d6-4c04-bd6e-5b917ee9d44f, Grupo Legado: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = '118061da-b9d6-4c04-bd6e-5b917ee9d44f';

-- Exercício: "Tríceps corda (Francês)" (ID: 56702c06-3ec2-4758-91ad-5481822e91c0, Grupo Legado: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = '56702c06-3ec2-4758-91ad-5481822e91c0';

-- Exercício: "Tríceps corda (Polia alta)" (ID: ace44ddb-b9f1-4fee-944b-233573d55d7a, Grupo Legado: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = 'ace44ddb-b9f1-4fee-944b-233573d55d7a';

-- Exercício: "Tríceps Pulley" (ID: 3c34bbd6-4e54-4023-8c50-18c8bf7d0efb, Grupo Legado: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Solo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = '3c34bbd6-4e54-4023-8c50-18c8bf7d0efb';

-- Exercício: "Tríceps Testa (Barra W)" (ID: 2f15f565-87cf-4521-bc08-2e79c6d49173, Grupo Legado: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '2f15f565-87cf-4521-bc08-2e79c6d49173';

-- Exercício: "Voador (Máquina)" (ID: a872d83b-e465-4841-9f8c-2280401449de, Grupo Legado: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Máquina"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["maquina","push"]}'::jsonb
WHERE id = 'a872d83b-e465-4841-9f8c-2280401449de';

-- ======================================================
-- QUERIES DE VALIDAÇÃO PÓS-PATCH
-- ======================================================

-- Query 1: Total de exercícios na base (Esperado: 149)
SELECT COUNT(*) AS total_exercises FROM public.exercises;

-- Query 2: Total com biomechanics preenchido (Esperado: 81 anteriores + 57 deste patch)
SELECT COUNT(*) AS with_biomechanics FROM public.exercises WHERE biomechanics IS NOT NULL;

-- Query 3: Total que continuam pendentes/nulos (Esperado: 11)
SELECT COUNT(*) AS without_biomechanics FROM public.exercises WHERE biomechanics IS NULL;

-- Query 4: Listar os exercícios que continuam sem biomechanics após este patch
SELECT id, name, muscle_group, subgroup, equipment
FROM public.exercises
WHERE biomechanics IS NULL
ORDER BY name;

COMMIT;
