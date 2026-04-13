
-- 1. OTIMIZAÇÃO DE CÁLCULO DE FORÇA (1RM)
-- Este índice cobre a View 'view_strength_progression' e acelera o carregamento de gráficos de evolução.
CREATE INDEX IF NOT EXISTS idx_sets_log_1rm_optimization 
ON public.workout_sets_log (exercise_id, user_id) 
INCLUDE (weight_achieved, reps_achieved, created_at);

-- 2. OTIMIZAÇÃO DE DASHBOARD E HISTÓRICO
-- Garante que a listagem de treinos seja instantânea, mesmo com milhares de registros.
CREATE INDEX IF NOT EXISTS idx_workout_history_user_recent 
ON public.workout_history (user_id, completed_at DESC);

-- 3. OTIMIZAÇÃO DO PLAYER (RESILIÊNCIA)
-- Acelera a verificação de "Treino em Andamento" ao abrir o App.
CREATE INDEX IF NOT EXISTS idx_partial_sessions_user_sync 
ON public.partial_workout_sessions (user_id) 
INCLUDE (workout_id, current_index, current_set);

-- 4. OTIMIZAÇÃO DA BIBLIOTECA DE EXERCÍCIOS
-- Melhora a performance de filtros por grupo muscular e busca por nome (case-insensitive).
CREATE INDEX IF NOT EXISTS idx_exercises_lookup_v2 
ON public.exercises (muscle_group_id, is_active) 
WHERE is_active = true;

-- 5. OTIMIZAÇÃO DE BIOMETRIA
-- Acelera o carregamento dos gráficos de peso e bioimpedância.
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_chronological 
ON public.body_measurements (user_id, measured_at DESC);

-- 6. INTEGRIDADE DE SÉRIES NA FICHA
-- Otimiza a ordenação dos exercícios dentro do Player de treino.
CREATE INDEX IF NOT EXISTS idx_workout_exercises_category_sort 
ON public.workout_exercises (category_id, sort_order ASC);

-- COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON INDEX public.idx_sets_log_1rm_optimization IS 'Otimiza o cálculo dinâmico de 1RM evitando leituras completas de tabela.';
COMMENT ON INDEX public.idx_partial_sessions_user_sync IS 'Garante que a retomada de treino ocorra em milissegundos no carregamento do App.';
