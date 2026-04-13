
-- 1. OTIMIZAÇÃO DE PROGRESSÃO DE FORÇA E 1RM
-- Melhora drasticamente a View: view_strength_progression
CREATE INDEX IF NOT EXISTS idx_sets_log_intelligence 
ON public.workout_sets_log (user_id, exercise_id, weight_achieved, reps_achieved);

-- 2. OTIMIZAÇÃO DE DASHBOARD E FILTROS DE HISTÓRICO
-- Melhora a ordenação cronológica de treinos por usuário
CREATE INDEX IF NOT EXISTS idx_workout_history_performance 
ON public.workout_history (user_id, completed_at DESC) 
INCLUDE (category_id, duration_minutes);

-- 3. OTIMIZAÇÃO DA BIBLIOTECA DE EXERCÍCIOS
-- Acelera filtros por Grupo Muscular e busca textual (ILike)
CREATE INDEX IF NOT EXISTS idx_exercises_library_filter 
ON public.exercises (muscle_group_id, is_active) 
WHERE is_active = true;

-- Índice para busca textual rápida no nome do exercício
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm 
ON public.exercises USING gin (name gin_trgm_ops) 
WHERE is_active = true;

-- 4. OTIMIZAÇÃO DE BIOMETRIA E EVOLUÇÃO
-- Acelera a geração de gráficos de peso e bioimpedância
CREATE INDEX IF NOT EXISTS idx_body_measurements_trend 
ON public.body_measurements (user_id, measured_at DESC);

-- 5. OTIMIZAÇÃO DE SESSÕES PARCIAIS (RESILIÊNCIA)
-- Melhora a performance do "Retomar Treino" no Dashboard
CREATE INDEX IF NOT EXISTS idx_partial_sessions_lookup 
ON public.partial_workout_sessions (user_id, updated_at DESC);

-- 6. OTIMIZAÇÃO DE FAVORITOS
-- Acelera o carregamento da biblioteca personalizada
CREATE INDEX IF NOT EXISTS idx_user_favorites_composite 
ON public.user_favorite_exercises (user_id, exercise_id);

-- 7. OTIMIZAÇÃO DE NOTIFICAÇÕES ADMIN
-- Filtra rapidamente mensagens não lidas para o administrador
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
ON public.admin_notifications (is_read) 
WHERE is_read = false;

-- COMENTÁRIOS TÉCNICOS
COMMENT ON INDEX public.idx_sets_log_intelligence IS 'Otimiza cálculos de 1RM e agrupamentos de inteligência de exercício.';
COMMENT ON INDEX public.idx_exercises_name_trgm IS 'Habilita busca textual ultra-rápida por similaridade na biblioteca.';
