
-- LIMPEZA DE CATALOGO: EXCLUSÃO DE EXERCÍCIOS INATIVOS
-- Este comando remove exercícios que foram marcados como inativos (is_active = false)
-- Graças ao ON DELETE CASCADE configurado nas tabelas vinculadas, 
-- referências em fichas e logs também serão limpas automaticamente.

DELETE FROM public.exercises 
WHERE is_active = false;

-- Verificação pós-exclusão (Opcional: Execute separadamente para conferir)
-- SELECT count(*) FROM public.exercises WHERE is_active = false;

COMMENT ON TABLE public.exercises IS 'Catálogo de exercícios otimizado após limpeza de registros inativos.';
