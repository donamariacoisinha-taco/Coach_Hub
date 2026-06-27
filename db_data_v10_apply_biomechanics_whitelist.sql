-- ======================================================
-- KYRON OS — DATA MIGRATION — EXERCISE BIOMECHANICS 2.0
-- FASE 3D — REAL PERSISTENCE OF 81 APPROVED EXERCISES
-- Generated on 2026-06-27T08:34:55.602Z
-- ======================================================

BEGIN;

-- 1. Reset all biomechanics to NULL to ensure clean starting state
UPDATE public.exercises SET biomechanics = NULL;

-- 2. Applying Whitelisted Biomechanics Updates (Total: 81 Exercises)
-- Exercise: "Abdominal infra" (ID: 1948313d-69b4-43b1-8975-adbdc986eb07, Group: Abdômen)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen inferior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["flexion"]}'::jsonb
WHERE id = '1948313d-69b4-43b1-8975-adbdc986eb07';

-- Exercise: "Abdominal na máquina" (ID: 1048c8f1-b3ee-42b8-91d2-7065bdf5612f, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen superior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["maquina","flexion"]}'::jsonb
WHERE id = '1048c8f1-b3ee-42b8-91d2-7065bdf5612f';

-- Exercise: "Abdominal no cabo" (ID: 26f10166-e4e3-4eea-b6d1-a99d62758143, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen superior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Cabo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["cabo","flexion"]}'::jsonb
WHERE id = '26f10166-e4e3-4eea-b6d1-a99d62758143';

-- Exercise: "Abdominal supra" (ID: 151abd1e-8dc2-4de4-8cd8-b044cb7f2af9, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen superior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["flexion"]}'::jsonb
WHERE id = '151abd1e-8dc2-4de4-8cd8-b044cb7f2af9';

-- Exercise: "Afundo com barra" (ID: 53fb259e-85ea-468f-85a3-e3941bc0ac72, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["barra","squat"]}'::jsonb
WHERE id = '53fb259e-85ea-468f-85a3-e3941bc0ac72';

-- Exercise: "Afundo com halteres" (ID: e6ab00ef-c7a3-4a29-b832-618a78ca821a, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["halter","squat"]}'::jsonb
WHERE id = 'e6ab00ef-c7a3-4a29-b832-618a78ca821a';

-- Exercise: "Afundo no Smith" (ID: 251edb0e-4184-4338-86a9-b0e359b8704f, Group: Quadríceps )
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["maquina","squat"]}'::jsonb
WHERE id = '251edb0e-4184-4338-86a9-b0e359b8704f';

-- Exercise: "Agachamento búlgaro" (ID: 17f6fd9a-ed73-4c29-b8df-e99dc306680f, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["halter","squat"]}'::jsonb
WHERE id = '17f6fd9a-ed73-4c29-b8df-e99dc306680f';

-- Exercise: "Agachamento frontal" (ID: 27235ea0-9b14-4a6a-b6d6-33a0f3ba2ca5, Group: Quadríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["barra","squat"]}'::jsonb
WHERE id = '27235ea0-9b14-4a6a-b6d6-33a0f3ba2ca5';

-- Exercise: "Agachamento livre" (ID: ae8740d4-0ffb-4b91-9b40-1fb023f4e417, Group: Quadríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["barra","squat"]}'::jsonb
WHERE id = 'ae8740d4-0ffb-4b91-9b40-1fb023f4e417';

-- Exercise: "Apoio declinado" (ID: e5b8b745-2fe7-44f3-85c3-fc109fd3a086, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral inferior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = 'e5b8b745-2fe7-44f3-85c3-fc109fd3a086';

-- Exercise: "Apoio declinado (Fechado)" (ID: 5ef7ff26-97ea-469b-941d-7a25489df311, Group: Braço)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral inferior","Tríceps braquial"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = '5ef7ff26-97ea-469b-941d-7a25489df311';

-- Exercise: "apoio reto (fechado)" (ID: 7a496714-b081-4c0f-874a-aea5b126c7fe, Group: Tríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio","Tríceps braquial"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = '7a496714-b081-4c0f-874a-aea5b126c7fe';

-- Exercise: "Apoio reto (fechado)" (ID: 27a458a8-ae8c-4e6f-87cf-a46614cc7925, Group: Braço)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio","Tríceps braquial"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Serrátil anterior","Manguito rotador"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Peso corporal"],"primary_joint_actions":["Adução horizontal do ombro","Extensão de cotovelo","Flexão de ombro"],"tags":["apoio","flexão","peitoral","tríceps","peso corporal","push"]}'::jsonb
WHERE id = '27a458a8-ae8c-4e6f-87cf-a46614cc7925';

-- Exercise: "Arnold press" (ID: c634d336-c886-49a2-a1c7-62998986451f, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["halter","isolation"]}'::jsonb
WHERE id = 'c634d336-c886-49a2-a1c7-62998986451f';

-- Exercise: "Barra fixa" (ID: b47dd10b-ea60-461f-aba1-eb9ab65d22d2, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["barra","pull"]}'::jsonb
WHERE id = 'b47dd10b-ea60-461f-aba1-eb9ab65d22d2';

-- Exercise: "Barra fixa no gravitron" (ID: c9786d0c-f3bc-4404-9c03-56ac2fb4791f, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["maquina","barra","pull"]}'::jsonb
WHERE id = 'c9786d0c-f3bc-4404-9c03-56ac2fb4791f';

-- Exercise: "Cadeira abdutora" (ID: f22bbe15-8821-4309-af8e-96d0a6ba6c88, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Abdutores"],"synergist_muscles":["Tensor da fáscia lata","Glúteo médio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Adutores"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Abdução de quadril"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = 'f22bbe15-8821-4309-af8e-96d0a6ba6c88';

-- Exercise: "Coice de glúteo no Crossover" (ID: 996f4ef0-a36e-44d5-8c37-e12606f61c2f, Group: Glúteos)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Glúteos","agonist_muscles":["Glúteo médio","Glúteo mínimo"],"synergist_muscles":["Isquiotibiais","Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Iliopssoas","Reto femoral"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de quadril","Rotação externa de quadril"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '996f4ef0-a36e-44d5-8c37-e12606f61c2f';

-- Exercise: "Cross over alto" (ID: 0dfb45a6-7c73-4345-86f4-656b9087c0f0, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral inferior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Cabo"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["cabo","push"]}'::jsonb
WHERE id = '0dfb45a6-7c73-4345-86f4-656b9087c0f0';

-- Exercise: "Cross over baixo" (ID: d9740bb8-f519-48b7-a014-3d7692a07bbc, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Cabo"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["cabo","push"]}'::jsonb
WHERE id = 'd9740bb8-f519-48b7-a014-3d7692a07bbc';

-- Exercise: "Crucifixo invertido máquina" (ID: 48c4f499-8c90-4244-a0c5-6bc810fa7489, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '48c4f499-8c90-4244-a0c5-6bc810fa7489';

-- Exercise: "Crucifixo reto" (ID: c9a22db2-8565-41f6-bdc6-0cb703014e98, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Deltoide posterior"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["reto","halter","push"]}'::jsonb
WHERE id = 'c9a22db2-8565-41f6-bdc6-0cb703014e98';

-- Exercise: "Deadlift romeno" (ID: 23c77695-255b-4a3f-a7f2-0afac818cbca, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Eretores da espinha"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["barra","hinge"]}'::jsonb
WHERE id = '23c77695-255b-4a3f-a7f2-0afac818cbca';

-- Exercise: "Deadlift tradicional" (ID: a3ce80ca-ec2c-4110-80cf-bf1fdf886987, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Eretores da espinha"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["barra","hinge"]}'::jsonb
WHERE id = 'a3ce80ca-ec2c-4110-80cf-bf1fdf886987';

-- Exercise: "Desenvolvimento com barra" (ID: 3c691cac-b945-4d79-af37-327aa94fcfb1, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Barra"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["barra","push"]}'::jsonb
WHERE id = '3c691cac-b945-4d79-af37-327aa94fcfb1';

-- Exercise: "Desenvolvimento com halteres" (ID: ebc9f06f-b506-44d6-9a75-751a72f9b9a7, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["halter","push"]}'::jsonb
WHERE id = 'ebc9f06f-b506-44d6-9a75-751a72f9b9a7';

-- Exercise: "Desenvolvimento na máquina" (ID: 8acb4480-1b6c-47e2-91da-700ded7c7718, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Máquina"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["maquina","push"]}'::jsonb
WHERE id = '8acb4480-1b6c-47e2-91da-700ded7c7718';

-- Exercise: "Elevação de joelhos" (ID: a715e9c9-e49e-4d4e-842b-b2b7b032b60b, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen superior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["barra","flexion"]}'::jsonb
WHERE id = 'a715e9c9-e49e-4d4e-842b-b2b7b032b60b';

-- Exercise: "Elevação de pernas deitado" (ID: 2253b823-c2ce-459c-8a70-df56a2fb0258, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen inferior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["flexion"]}'::jsonb
WHERE id = '2253b823-c2ce-459c-8a70-df56a2fb0258';

-- Exercise: "Elevação de pernas na barra" (ID: eb204b04-7f70-4ca5-816f-a6180df8f271, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen inferior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["barra","flexion"]}'::jsonb
WHERE id = 'eb204b04-7f70-4ca5-816f-a6180df8f271';

-- Exercise: "Elevação frontal" (ID: 6437113d-d751-4244-8bd0-f2f71f06e577, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide anterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["halter","push"]}'::jsonb
WHERE id = '6437113d-d751-4244-8bd0-f2f71f06e577';

-- Exercise: "Elevação lateral inclinada" (ID: d42b7c6f-7817-4b27-876c-454bb42ca208, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Abdução do ombro"],"tags":["halter","isolation"]}'::jsonb
WHERE id = 'd42b7c6f-7817-4b27-876c-454bb42ca208';

-- Exercise: "Elevação pélvica" (ID: 738651ee-088c-49df-8f9f-8d80339a0fc4, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Banco"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["squat"]}'::jsonb
WHERE id = '738651ee-088c-49df-8f9f-8d80339a0fc4';

-- Exercise: "Elevação posterior no cabo" (ID: c1c8b6c2-ac45-4ff6-bedf-3a55fcfb58d8, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide posterior"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = 'c1c8b6c2-ac45-4ff6-bedf-3a55fcfb58d8';

-- Exercise: "Encolhimento com barra" (ID: 1edc32f5-eeeb-40b2-a5bd-dbd0de9c0924, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Trapézio médio","Trapézio inferior"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '1edc32f5-eeeb-40b2-a5bd-dbd0de9c0924';

-- Exercise: "Extensão de quadril no cabo" (ID: 285586c4-537a-4551-a929-4e767a002019, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["cabo","squat"]}'::jsonb
WHERE id = '285586c4-537a-4551-a929-4e767a002019';

-- Exercise: "Face pull" (ID: 58079297-3024-4e84-b344-1531826cf251, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pull"]}'::jsonb
WHERE id = '58079297-3024-4e84-b344-1531826cf251';

-- Exercise: "Flexora unilateral" (ID: eedce141-1744-4b60-8c7c-c2634e5df3dd, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa"],"synergist_muscles":["Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de joelho"],"tags":["posterior","isquiotibiais","flexora","máquina","isolamento"]}'::jsonb
WHERE id = 'eedce141-1744-4b60-8c7c-c2634e5df3dd';

-- Exercise: "Leg press 45°" (ID: c780e2c9-cb14-4f5a-a189-15b54e999f8d, Group: Quadríceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno","Panturrilhas"],"stabilizer_muscles":["Core profundo","Eretores da espinha","Isquiotibiais"],"antagonist_muscles":["Isquiotibiais","Glúteo máximo"],"movement_pattern":"squat","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["maquina","squat"]}'::jsonb
WHERE id = 'c780e2c9-cb14-4f5a-a189-15b54e999f8d';

-- Exercise: "Mergulho em paralelas" (ID: 7698a9ef-8375-4cd0-9463-5bb82921569c, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial","Tríceps braquial"],"synergist_muscles":[],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":[],"movement_pattern":"isolation","equipment_needed":["Paralelas"],"primary_joint_actions":["Flexão de cotovelo","Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = '7698a9ef-8375-4cd0-9463-5bb82921569c';

-- Exercise: "Mesa flexora" (ID: d61ec6c5-f1da-4bdd-b209-d466e73e2c89, Group: Posterior)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa"],"synergist_muscles":["Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de joelho"],"tags":["posterior","isquiotibiais","flexora","máquina","isolamento"]}'::jsonb
WHERE id = 'd61ec6c5-f1da-4bdd-b209-d466e73e2c89';

-- Exercise: "Panturrilha em pé" (ID: 499c1d9b-8ada-4655-8a43-94dd69345317, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Panturrilhas"],"synergist_muscles":["Sóleio","Gastrocnêmio"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Tibial anterior"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão plantar"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '499c1d9b-8ada-4655-8a43-94dd69345317';

-- Exercise: "Passada caminhando" (ID: 86585806-666f-4406-81bf-e322ef7b7238, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Quadríceps"],"synergist_muscles":["Glúteo máximo","Adutor magno"],"stabilizer_muscles":["Core profundo"],"antagonist_muscles":["Isquiotibiais"],"movement_pattern":"squat","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de joelho","Extensão de quadril"],"tags":["halter","squat"]}'::jsonb
WHERE id = '86585806-666f-4406-81bf-e322ef7b7238';

-- Exercise: "Prancha" (ID: 544248a4-9e2b-484a-81a3-95b20ffd7238, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Transverso abdominal","Core profundo"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"anti_rotation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["anti_rotation"]}'::jsonb
WHERE id = '544248a4-9e2b-484a-81a3-95b20ffd7238';

-- Exercise: "Prancha com elevação de perna" (ID: b11039ad-791c-47fe-a236-1c9a30c1e04d, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Abdômen inferior","Reto abdominal"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"flexion","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["flexion"]}'::jsonb
WHERE id = 'b11039ad-791c-47fe-a236-1c9a30c1e04d';

-- Exercise: "Prancha lateral" (ID: 2c395f6c-f716-48ee-be6b-9bbf206e55b3, Group: Core)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Core","agonist_muscles":["Oblíquos"],"synergist_muscles":["Iliopssoas","Oblíquos"],"stabilizer_muscles":["Transverso abdominal","Eretores da espinha","Multifídeos"],"antagonist_muscles":["Eretores da espinha"],"movement_pattern":"rotation","equipment_needed":["Solo"],"primary_joint_actions":["Flexão de tronco","Estabilização lombo-pélvica"],"tags":["rotation"]}'::jsonb
WHERE id = '2c395f6c-f716-48ee-be6b-9bbf206e55b3';

-- Exercise: "Pulldown (Puxada alta)" (ID: b9666933-2ca6-4662-938d-9c0c3c5e07ad, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["maquina","pull"]}'::jsonb
WHERE id = 'b9666933-2ca6-4662-938d-9c0c3c5e07ad';

-- Exercise: "Pullover no cabo" (ID: 5ffc1e83-1388-4256-906d-3dab25dca684, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pull"]}'::jsonb
WHERE id = '5ffc1e83-1388-4256-906d-3dab25dca684';

-- Exercise: "Puxada frontal aberta" (ID: 20dedb8e-81f9-49be-a171-c20ee3dcb69c, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pegada aberta","pull"]}'::jsonb
WHERE id = '20dedb8e-81f9-49be-a171-c20ee3dcb69c';

-- Exercise: "Puxada frontal fechada" (ID: 9227a25e-043d-4454-b110-09cb1c597305, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Latíssimo do dorso"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pegada fechada","pull"]}'::jsonb
WHERE id = '9227a25e-043d-4454-b110-09cb1c597305';

-- Exercise: "Remada alta" (ID: 73c192b9-bf49-4fa3-ae7a-11c431b71943, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pull"]}'::jsonb
WHERE id = '73c192b9-bf49-4fa3-ae7a-11c431b71943';

-- Exercise: "Remada alta com barra" (ID: 382554b7-21a4-400f-b739-ab8008a7eb7d, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '382554b7-21a4-400f-b739-ab8008a7eb7d';

-- Exercise: "Remada alta no cabo" (ID: dafdf337-da1b-489a-b6c8-2bd5d82b501b, Group: Ombros)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Ombros","agonist_muscles":["Deltoide lateral"],"synergist_muscles":["Tríceps braquial","Trapézio superior","Serrátil anterior"],"stabilizer_muscles":["Core profundo","Eretores da espinha"],"antagonist_muscles":["Latíssimo do dorso","Peitoral maior (fibras inferiores)"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Abdução do ombro","Flexão de ombro","Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = 'dafdf337-da1b-489a-b6c8-2bd5d82b501b';

-- Exercise: "Remada baixa" (ID: d5b30d65-aaca-4ea7-9554-98d09c882251, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["cabo","pull"]}'::jsonb
WHERE id = 'd5b30d65-aaca-4ea7-9554-98d09c882251';

-- Exercise: "Remada na máquina" (ID: 8d332cd5-1d53-44c0-8955-d3abc6df3573, Group: Costas)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Costas","agonist_muscles":["Romboides","Trapézio médio"],"synergist_muscles":["Bíceps braquial","Braquial","Deltoide posterior"],"stabilizer_muscles":["Eretores da espinha","Core profundo"],"antagonist_muscles":["Peitoral maior","Deltoide anterior","Tríceps braquial"],"movement_pattern":"pull","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de ombro","Adunção de ombro","Flexão de cotovelo"],"tags":["maquina","pull"]}'::jsonb
WHERE id = '8d332cd5-1d53-44c0-8955-d3abc6df3573';

-- Exercise: "Rosca alternada" (ID: 11c975fd-133a-4aa2-86e0-7a61c7d278a2, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '11c975fd-133a-4aa2-86e0-7a61c7d278a2';

-- Exercise: "Rosca concentrada" (ID: f24e1133-87f7-43bb-955a-65ab7d398085, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["halter","isolation"]}'::jsonb
WHERE id = 'f24e1133-87f7-43bb-955a-65ab7d398085';

-- Exercise: "Rosca direta com barra" (ID: 75dfd737-8273-4197-9f20-5f302e8ec459, Group: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '75dfd737-8273-4197-9f20-5f302e8ec459';

-- Exercise: "Rosca direta com halteres" (ID: 5cc14ea4-ff62-4a31-a621-6df727c6987f, Group: Bíceps)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '5cc14ea4-ff62-4a31-a621-6df727c6987f';

-- Exercise: "Rosca inversa" (ID: c5dee4b3-b382-4f2c-b5cb-5c4b7fc2dc6a, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Braquial","Braquiorradial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["barra","isolation"]}'::jsonb
WHERE id = 'c5dee4b3-b382-4f2c-b5cb-5c4b7fc2dc6a';

-- Exercise: "Rosca martelo" (ID: 07538c9e-3f99-45c0-979f-b7e90b311d24, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Braquial","Braquiorradial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '07538c9e-3f99-45c0-979f-b7e90b311d24';

-- Exercise: "Rosca no cabo" (ID: 250abcf4-b8f5-4dcb-8308-993993bdd9b5, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '250abcf4-b8f5-4dcb-8308-993993bdd9b5';

-- Exercise: "Rosca Scott" (ID: fc319314-3794-49a7-b4e7-c2f983059a69, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Banco"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["isolation"]}'::jsonb
WHERE id = 'fc319314-3794-49a7-b4e7-c2f983059a69';

-- Exercise: "Rosca Scott máquina" (ID: 892b14a0-00e3-418d-b6a7-2e83b4aa8ff8, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Bíceps braquial"],"synergist_muscles":["Braquial","Braquiorradial","Pronador redondo"],"stabilizer_muscles":["Core profundo","Deltoide posterior"],"antagonist_muscles":["Tríceps braquial"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Flexão de cotovelo","Supinação do antebraço"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '892b14a0-00e3-418d-b6a7-2e83b4aa8ff8';

-- Exercise: "Stiff com barra" (ID: 519f8414-c511-4fc0-ab6e-6baa60a3e002, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa","Glúteo máximo"],"synergist_muscles":["Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de quadril"],"tags":["barra","hinge"]}'::jsonb
WHERE id = '519f8414-c511-4fc0-ab6e-6baa60a3e002';

-- Exercise: "Stiff com halteres" (ID: 9580f19c-1d91-4fa7-b4b2-c2a73fb3b675, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa","Glúteo máximo"],"synergist_muscles":["Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"hinge","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de quadril"],"tags":["halter","hinge"]}'::jsonb
WHERE id = '9580f19c-1d91-4fa7-b4b2-c2a73fb3b675';

-- Exercise: "Supino inclinado com barra" (ID: 325fdd72-a76f-44e7-a82a-961582ea263f, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral superior"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Barra"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["inclinado","barra","push"]}'::jsonb
WHERE id = '325fdd72-a76f-44e7-a82a-961582ea263f';

-- Exercise: "Supino na máquina" (ID: dde9223e-9739-441f-ba7f-c355e3a61a65, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Máquina"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["maquina","push"]}'::jsonb
WHERE id = 'dde9223e-9739-441f-ba7f-c355e3a61a65';

-- Exercise: "Supino reto com barra" (ID: ef2e75bf-5e36-46bb-bba9-a758cb16cc68, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Barra"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["reto","barra","push"]}'::jsonb
WHERE id = 'ef2e75bf-5e36-46bb-bba9-a758cb16cc68';

-- Exercise: "Supino reto com halteres" (ID: a8c9e27e-44b0-4d3c-af8e-f4e3d4d46e0c, Group: Peito)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Peitoral","agonist_muscles":["Peitoral médio"],"synergist_muscles":["Deltoide anterior","Tríceps braquial"],"stabilizer_muscles":["Core profundo","Rotator cuff"],"antagonist_muscles":["Latíssimo do dorso","Romboides","Bíceps braquial"],"movement_pattern":"push","equipment_needed":["Halteres"],"primary_joint_actions":["Adução horizontal do ombro","Flexão do ombro","Extensão de cotovelo"],"tags":["reto","halter","push"]}'::jsonb
WHERE id = 'a8c9e27e-44b0-4d3c-af8e-f4e3d4d46e0c';

-- Exercise: "Terra romeno" (ID: 73b689ba-1136-4509-8210-67331373f0e7, Group: Perna)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Pernas","agonist_muscles":["Isquiotibiais","Posterior de coxa","Glúteo máximo"],"synergist_muscles":["Adutor magno","Eretores da espinha"],"stabilizer_muscles":["Core profundo","Quadríceps"],"antagonist_muscles":["Quadríceps"],"movement_pattern":"hinge","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de quadril"],"tags":["barra","hinge"]}'::jsonb
WHERE id = '73b689ba-1136-4509-8210-67331373f0e7';

-- Exercise: "Tríceps banco" (ID: a1e30233-e3cf-4228-9aac-14706e6aed4f, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Banco"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["isolation"]}'::jsonb
WHERE id = 'a1e30233-e3cf-4228-9aac-14706e6aed4f';

-- Exercise: "Tríceps corda" (ID: d6129686-8875-47ae-aab1-955801fa8d71, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = 'd6129686-8875-47ae-aab1-955801fa8d71';

-- Exercise: "Tríceps francês" (ID: 5059293b-7aa9-4ac4-a823-1024d725a917, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Halteres"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["halter","isolation"]}'::jsonb
WHERE id = '5059293b-7aa9-4ac4-a823-1024d725a917';

-- Exercise: "Tríceps francês no cabo" (ID: 5225d5aa-c50f-4103-9a22-bd32d7a85865, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '5225d5aa-c50f-4103-9a22-bd32d7a85865';

-- Exercise: "Tríceps na máquina" (ID: 1ab60434-c92b-4136-89c3-1642ad2d6845, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Máquina"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["maquina","isolation"]}'::jsonb
WHERE id = '1ab60434-c92b-4136-89c3-1642ad2d6845';

-- Exercise: "Tríceps pulley" (ID: 5e93235a-080f-457d-a97d-dd44bc04d480, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '5e93235a-080f-457d-a97d-dd44bc04d480';

-- Exercise: "Tríceps testa" (ID: 46838ad4-c6fa-4c28-b137-bd1a1dac567c, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Barra"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["barra","isolation"]}'::jsonb
WHERE id = '46838ad4-c6fa-4c28-b137-bd1a1dac567c';

-- Exercise: "Tríceps testa no cabo" (ID: 8ba57796-d5d5-4382-994e-c8eed2fb0e9e, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","isolation"]}'::jsonb
WHERE id = '8ba57796-d5d5-4382-994e-c8eed2fb0e9e';

-- Exercise: "Tríceps unilateral no cabo" (ID: 0aaab0b1-0ac3-4f4a-ace6-8ce2cd6ec6a4, Group: Braços)
UPDATE public.exercises
SET biomechanics = '{"primary_group":"Braços","agonist_muscles":["Tríceps braquial"],"synergist_muscles":["Ancôneo"],"stabilizer_muscles":["Core profundo","Deltoide anterior"],"antagonist_muscles":["Bíceps braquial","Braquial"],"movement_pattern":"isolation","equipment_needed":["Cabo"],"primary_joint_actions":["Extensão de cotovelo"],"tags":["cabo","unilateral","isolation"]}'::jsonb
WHERE id = '0aaab0b1-0ac3-4f4a-ace6-8ce2cd6ec6a4';

-- ======================================================
-- 3. VERIFICATION AND AUDITING QUERIES
-- ======================================================

-- Query 1: Total exercises count (Expected: 149)
SELECT COUNT(*) AS total_exercises FROM public.exercises;

-- Query 2: Exercises with biomechanics prefilled (Expected: 81)
SELECT COUNT(*) AS with_biomechanics FROM public.exercises WHERE biomechanics IS NOT NULL;

-- Query 3: Exercises remaining pending/NULL (Expected: 68)
SELECT COUNT(*) AS without_biomechanics FROM public.exercises WHERE biomechanics IS NULL;

-- Query 4: Detailed validation of the 4 critical corrected exercises
SELECT id, name, muscle_group, subgroup, equipment,
       biomechanics->>'primary_group' AS bio_primary_group,
       biomechanics->>'movement_pattern' AS bio_movement_pattern,
       biomechanics->'equipment_needed' AS bio_equipment,
       biomechanics->'agonist_muscles' AS bio_agonists
FROM public.exercises
WHERE id IN (
  '5ef7ff26-97ea-469b-941d-7a25489df311', -- Apoio declinado (Fechado)
  '7a496714-b081-4c0f-874a-aea5b126c7fe', -- apoio reto (fechado)
  '27a458a8-ae8c-4e6f-87cf-a46614cc7925', -- Apoio reto (fechado)
  'd61ec6c5-f1da-4bdd-b209-d466e73e2c89'  -- Mesa flexora
);

-- Query 5: Confirming Mesa flexora properties explicitly
SELECT 
  name,
  (biomechanics->>'primary_group' = 'Pernas') AS primary_group_ok,
  (biomechanics->>'movement_pattern' = 'isolation') AS movement_pattern_ok,
  (biomechanics->'equipment_needed' @> '["Máquina"]') AS equipment_needed_ok,
  (biomechanics->'agonist_muscles' @> '["Isquiotibiais"]' OR biomechanics->'agonist_muscles' @> '["Posterior de coxa"]') AS agonist_muscles_ok
FROM public.exercises
WHERE id = 'd61ec6c5-f1da-4bdd-b209-d466e73e2c89';

-- Query 6: Sample of other non-critical whitelisted exercises
SELECT id, name, muscle_group, biomechanics->>'primary_group' AS bio_group
FROM public.exercises
WHERE biomechanics IS NOT NULL
LIMIT 5;

COMMIT;
