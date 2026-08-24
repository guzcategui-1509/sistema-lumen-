-- Lumen Workspace: reordenamiento transaccional de fases existentes.
-- Ejecutar despues de supabase/patch_work_order_phase_safe_save.sql.

CREATE OR REPLACE FUNCTION public.reorder_work_order_phases(
  target_work_order_id UUID,
  phases_payload JSONB
)
RETURNS SETOF public.work_order_phases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  target_order public.work_orders%ROWTYPE;
  phase_item JSONB;
  existing_phase public.work_order_phases%ROWTYPE;
  next_phase_id UUID;
  expected_updated_at TIMESTAMPTZ;
  ordered_phase_ids UUID[] := ARRAY[]::UUID[];
  payload_phase_count INTEGER;
  current_phase_count INTEGER;
  next_sort_order INTEGER;
BEGIN
  IF phases_payload IS NULL OR jsonb_typeof(phases_payload) <> 'array' THEN
    RAISE EXCEPTION 'invalid_work_order_phase_order_payload';
  END IF;

  payload_phase_count := jsonb_array_length(phases_payload);
  IF payload_phase_count < 2 THEN
    RAISE EXCEPTION 'invalid_work_order_phase_order_payload';
  END IF;

  SELECT *
  INTO target_order
  FROM public.work_orders
  WHERE id = target_work_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_not_found';
  END IF;

  IF target_order.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'archived_work_order_is_read_only';
  END IF;

  IF NOT public.can_access_brand(target_order.brand_id) THEN
    RAISE EXCEPTION 'not_allowed_to_access_work_order';
  END IF;

  IF NOT (
    public.can_manage_work_orders()
    OR (
      public.can_create_work_orders()
      AND target_order.created_by = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'not_allowed_to_reorder_work_order_phases';
  END IF;

  -- Lock in a deterministic order so concurrent reorders cannot partially interleave.
  PERFORM id
  FROM public.work_order_phases
  WHERE work_order_id = target_work_order_id
  ORDER BY id
  FOR UPDATE;

  SELECT count(*)
  INTO current_phase_count
  FROM public.work_order_phases
  WHERE work_order_id = target_work_order_id;

  IF current_phase_count <> payload_phase_count THEN
    RAISE EXCEPTION 'work_order_phases_changed_concurrently';
  END IF;

  FOR phase_item, next_sort_order IN
    SELECT item.value, (item.ordinality - 1)::INTEGER
    FROM jsonb_array_elements(phases_payload) WITH ORDINALITY AS item(value, ordinality)
  LOOP
    IF COALESCE(NULLIF(phase_item->>'id', ''), '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR NULLIF(phase_item->>'updated_at', '') IS NULL THEN
      RAISE EXCEPTION 'invalid_work_order_phase_order_payload';
    END IF;

    next_phase_id := (phase_item->>'id')::UUID;
    IF next_phase_id = ANY(ordered_phase_ids) THEN
      RAISE EXCEPTION 'invalid_work_order_phase_order_payload';
    END IF;

    SELECT *
    INTO existing_phase
    FROM public.work_order_phases
    WHERE id = next_phase_id
      AND work_order_id = target_work_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'work_order_phases_changed_concurrently';
    END IF;

    expected_updated_at := (phase_item->>'updated_at')::TIMESTAMPTZ;
    IF existing_phase.updated_at IS DISTINCT FROM expected_updated_at THEN
      RAISE EXCEPTION 'work_order_phases_changed_concurrently';
    END IF;

    ordered_phase_ids := array_append(ordered_phase_ids, next_phase_id);
  END LOOP;

  FOR phase_item, next_sort_order IN
    SELECT item.value, (item.ordinality - 1)::INTEGER
    FROM jsonb_array_elements(phases_payload) WITH ORDINALITY AS item(value, ordinality)
  LOOP
    UPDATE public.work_order_phases
    SET sort_order = next_sort_order
    WHERE id = (phase_item->>'id')::UUID
      AND work_order_id = target_work_order_id
      AND sort_order IS DISTINCT FROM next_sort_order;
  END LOOP;

  INSERT INTO public.work_order_activity (work_order_id, actor_id, action, details)
  VALUES (
    target_work_order_id,
    auth.uid(),
    'phases_reordered',
    jsonb_build_object(
      'phase_count', payload_phase_count,
      'phase_ids', to_jsonb(ordered_phase_ids)
    )
  );

  RETURN QUERY
  SELECT *
  FROM public.work_order_phases
  WHERE work_order_id = target_work_order_id
  ORDER BY sort_order, created_at, id;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_work_order_phases(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_work_order_phases(UUID, JSONB) TO authenticated;
