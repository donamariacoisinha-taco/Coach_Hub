
-- Índices para otimizar queries por usuário (Foreign Keys e Filtros)
CREATE INDEX IF NOT EXISTS idx_workout_categories_user_id ON public.workout_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_folders_user_id ON public.workout_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON public.workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- Índice para ordenação cronológica padrão no Dashboard
CREATE INDEX IF NOT EXISTS idx_workout_categories_created_at_desc ON public.workout_categories(created_at DESC);

COMMENT ON INDEX idx_workout_categories_user_id IS 'Melhora a performance de carregamento das fichas do Dashboard.';
