-- NÃO APLICAR automaticamente. O dono revisa e roda este arquivo no SQL Editor.
-- Não altera RLS, políticas nem GRANTs de tabela.
--
-- 1. Coluna aditiva. O app grava sem ela enquanto o PostgREST responder
--    que a coluna não existe, e passa a persistir o bônus depois deste ALTER.
-- 2. Troca a lista da ficha numa transação: insere, confirma todos os ids
--    e só então apaga as linhas antigas. SECURITY INVOKER, então as policies
--    atuais de workout_exercises continuam valendo.

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.replace_workout_exercises(
  p_category_id uuid,
  p_rows jsonb
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  inserted_ids uuid[];
  expected_count integer;
BEGIN
  IF p_category_id IS NULL THEN
    RAISE EXCEPTION 'category_id is required';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'replacement rows are required';
  END IF;

  expected_count := jsonb_array_length(p_rows);
  IF expected_count < 1 THEN
    RAISE EXCEPTION 'replacement rows are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workout_categories WHERE id = p_category_id
  ) THEN
    RAISE EXCEPTION 'workout category not found or not accessible';
  END IF;

  WITH inserted AS (
    INSERT INTO public.workout_exercises (
      category_id,
      exercise_id,
      exercise_name_snapshot,
      sets,
      sets_json,
      sort_order,
      superset_id,
      is_optional
    )
    SELECT
      p_category_id,
      (item.row->>'exercise_id')::uuid,
      NULLIF(item.row->>'exercise_name_snapshot', ''),
      COALESCE((item.row->>'sets')::integer, 3),
      COALESCE(item.row->'sets_json', '[]'::jsonb),
      COALESCE((item.row->>'sort_order')::integer, item.ordinality::integer),
      NULLIF(item.row->>'superset_id', '')::uuid,
      COALESCE((item.row->>'is_optional')::boolean, false)
    FROM jsonb_array_elements(p_rows) WITH ORDINALITY AS item(row, ordinality)
    RETURNING id
  )
  SELECT array_agg(id) INTO inserted_ids FROM inserted;

  IF inserted_ids IS NULL OR cardinality(inserted_ids) <> expected_count THEN
    RAISE EXCEPTION 'insert did not return every exercise row';
  END IF;

  DELETE FROM public.workout_exercises
  WHERE category_id = p_category_id
    AND NOT (id = ANY (inserted_ids));

  RETURN inserted_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_workout_exercises(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_workout_exercises(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.replace_workout_exercises(uuid, jsonb) TO authenticated;
