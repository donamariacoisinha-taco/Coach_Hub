-- ====================================================================
-- KYRON OS - AUDITORIA DE SEGURANÇA E DIAGNÓSTICO (SOMENTE LEITURA)
-- INCIDENTE: Desaparecimento de Fichas de Treino
-- ALVO: marivaldotorres@gmail.com
-- ====================================================================
-- ESTE SCRIPT CONTÉM APENAS COMANDOS "SELECT" DE CONSULTA.
-- NENHUM DADO DO BANCO, RLS OU POLÍTICA SERÁ ALTERADO POR ESTA AUDITORIA.

-- --------------------------------------------------------------------
-- ETAPA 1: LOCALIZAR O USUÁRIO REAL NO BANCO DE DADOS
-- --------------------------------------------------------------------
-- Descrição: Identifica as credenciais e estado do perfil do usuário na tabela de autenticação e perfis.
-- Isso revelará o id interno (UUID) do usuário, data de criação e estado da conta.

-- 1.1. Buscar ID e status do usuário na tabela interna do Supabase Auth (se acessível pelo admin)
SELECT id AS auth_id, email, created_at, last_sign_in_at, is_anonymous
FROM auth.users
WHERE LOWER(email) = 'marivaldotorres@gmail.com';

-- 1.2. Buscar perfil público do usuário na tabela public.profiles
SELECT id AS profile_id, email, name, role, is_admin, onboarding_completed, workout_streak, active_plan_id, created_at
FROM public.profiles
WHERE LOWER(email) = 'marivaldotorres@gmail.com'
   OR id IN (SELECT id FROM auth.users WHERE LOWER(email) = 'marivaldotorres@gmail.com');

-- 1.3. Verificar se há duplicidade de perfil ou múltiplos IDs com o mesmo e-mail
SELECT id, email, name, created_at, count(*) OVER() as total_matches
FROM public.profiles
WHERE LOWER(email) = 'marivaldotorres@gmail.com';


-- --------------------------------------------------------------------
-- ETAPA 2: DIAGNÓSTICO DE PASTAS, TREINOS E HISTÓRICO
-- --------------------------------------------------------------------
-- Descrição: Verifica se existem registros ativos ou ocultos nas tabelas principais para o ID do usuário.

-- 2.1. Pastas de Treinos (Workout Folders)
SELECT *
FROM public.workout_folders
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
);

-- 2.2. Categorias/Fichas de Treinos (Workout Categories)
-- Nota: Aqui ficam as fichas de treino que o usuário monta ou clona.
SELECT id, user_id, folder_id, name, description, created_at
FROM public.workout_categories
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
);

-- 2.3. Exercícios das Fichas de Treino (Workout Exercises)
-- Nota: Verifica se existem exercícios associados às categorias das fichas do usuário.
SELECT we.*
FROM public.workout_exercises we
JOIN public.workout_categories wc ON we.category_id = wc.id
WHERE wc.user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
);

-- 2.4. Histórico de Treinos Concluídos (Workout History)
-- Nota: Indica se o usuário já executou e concluiu sessões de treino.
SELECT id, user_id, workout_name, completed_at, exercises_count, duration, score
FROM public.workout_history
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
)
ORDER BY completed_at DESC;

-- 2.5. Logs de Séries executadas (Workout Sets Log)
-- Nota: Detalhamento de cada série feita no histórico de treinos.
SELECT l.*
FROM public.workout_sets_log l
JOIN public.workout_history h ON l.history_id = h.id
WHERE h.user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
);

-- 2.6. Sessões parciais ou em andamento (Partial Workout Sessions)
SELECT *
FROM public.partial_workout_sessions
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com'
);


-- --------------------------------------------------------------------
-- ETAPA 3: AUDITORIA DE SOFT DELETE / ARQUIVADOS / ESTADOS
-- --------------------------------------------------------------------
-- Descrição: Verifica se os registros existem mas foram ocultados por algum flag de deleção ou inativação.

-- 3.1. Verificar se a tabela de categorias possui campos de deleção (ex: is_deleted, status, archived)
-- Esta query tenta listar as colunas existentes para ver se a arquitetura suporta soft delete.
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'workout_categories';

-- 3.2. Se colunas de status/deleção existirem, consultar registros deletados/arquivados do usuário
SELECT *
FROM public.workout_categories
WHERE user_id IN (SELECT id FROM public.profiles WHERE LOWER(email) = 'marivaldotorres@gmail.com');


-- --------------------------------------------------------------------
-- ETAPA 4: INVESTIGAÇÃO DE REGISTROS ÓRFÃOS OU OUTROS USUÁRIOS
-- --------------------------------------------------------------------
-- Descrição: Analisa se há indícios de problemas sistêmicos ou de arquitetura.

-- 4.1. Contar fichas/categorias de treino associadas a usuários inexistentes (órfãs)
SELECT count(*) AS orphan_categories_count
FROM public.workout_categories wc
LEFT JOIN public.profiles p ON wc.user_id = p.id
WHERE p.id IS NULL;

-- 4.2. Contar pastas de treino órfãs
SELECT count(*) AS orphan_folders_count
FROM public.workout_folders wf
LEFT JOIN public.profiles p ON wf.user_id = p.id
WHERE p.id IS NULL;

-- 4.3. Verificar se há usuários com histórico de treinos concluídos (workout_history), mas que atualmente têm 0 fichas ativas (workout_categories)
SELECT p.id, p.email, p.name, 
       (SELECT COUNT(*) FROM public.workout_history h WHERE h.user_id = p.id) as history_count,
       (SELECT COUNT(*) FROM public.workout_categories c WHERE c.user_id = p.id) as current_categories_count
FROM public.profiles p
WHERE (SELECT COUNT(*) FROM public.workout_history h WHERE h.user_id = p.id) > 0
  AND (SELECT COUNT(*) FROM public.workout_categories c WHERE c.user_id = p.id) = 0
ORDER BY history_count DESC;

-- 4.4. Resumo geral do banco de dados (Volumetria global)
SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.workout_folders) as total_folders,
    (SELECT COUNT(*) FROM public.workout_categories) as total_categories,
    (SELECT COUNT(*) FROM public.workout_history) as total_history_records,
    (SELECT COUNT(*) FROM public.workout_exercises) as total_exercises_in_workouts;
