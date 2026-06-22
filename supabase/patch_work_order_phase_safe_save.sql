-- Lumen Workspace: guardado seguro/transaccional de fases internas.
-- Ejecutar después de:
-- 1. supabase/patch_work_order_phases.sql
-- 2. supabase/patch_work_order_phase_completion.sql
--
-- Objetivo:
-- - Reemplazar el patrón riesgoso del frontend de DELETE + INSERT.
-- - Permitir guardar la lista editada de fases en una sola transacción.
-- - Conservar completed_at cuando una fase ya estaba completada y sigue completada.
-- - No cambiar work_orders.status ni otras fases fuera de la orden indicada.

CREATE OR REPLACE FUNCTION public.save_work_order_phases(
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
  next_phase_id UUID;
  existing_phase public.work_order_phases%ROWTYPE;
  existing_found BOOLEAN;
  next_status public.work_order_phase_status;
  next_completed_at TIMESTAMPTZ;
  kept_phase_ids UUID[] := ARRAY[]::UUID[];
  next_sort_order INTEGER;
BEGIN
  IF phases_payload IS NULL OR jsonb_typeof(phases_payload) <> 'array' THEN
    RAISE EXCEPTION 'invalid_work_order_phases_payload';
  END IF;

  SELECT *
  INTO target_order
  FROM public.work_orders
  WHERE id = target_work_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_not_found';
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
    RAISE EXCEPTION 'not_allowed_to_save_work_order_phases';
  END IF;

  FOR phase_item IN SELECT value FROM jsonb_array_elements(phases_payload)
  LOOP
    existing_found := false;

    IF COALESCE(NULLIF(phase_item->>'id', ''), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      next_phase_id := (phase_item->>'id')::UUID;
    ELSE
      next_phase_id := NULL;
    END IF;

    next_status := COALESCE(NULLIF(phase_item->>'status', ''), 'pending')::public.work_order_phase_status;
    next_sort_order := COALESCE((phase_item->>'sort_order')::INTEGER, 0);

    existing_phase := NULL;
    IF next_phase_id IS NOT NULL THEN
      SELECT *
      INTO existing_phase
      FROM public.work_order_phases
      WHERE id = next_phase_id
        AND work_order_id = target_work_order_id;

      existing_found := FOUND;
    END IF;

    next_completed_at := CASE
      WHEN next_status = 'completed' THEN COALESCE(
        CASE WHEN existing_found THEN existing_phase.completed_at ELSE NULL END,
        NULLIF(phase_item->>'completed_at', '')::TIMESTAMPTZ,
        now()
      )
      ELSE NULL
    END;

    IF existing_found THEN
      UPDATE public.work_order_phases
      SET
        phase_key = COALESCE(NULLIF(phase_item->>'phase_key', ''), 'custom'),
        title = COALESCE(NULLIF(phase_item->>'title', ''), existing_phase.title),
        description = NULLIF(phase_item->>'description', ''),
        assigned_to = NULLIF(phase_item->>'assigned_to', '')::UUID,
        status = next_status,
        due_date = NULLIF(phase_item->>'due_date', '')::DATE,
        completed_at = next_completed_at,
        sort_order = next_sort_order,
        updated_at = now()
      WHERE id = existing_phase.id
      RETURNING id INTO next_phase_id;
    ELSE
      INSERT INTO public.work_order_phases (
        work_order_id,
        phase_key,
        title,
        description,
        assigned_to,
        status,
        due_date,
        completed_at,
        sort_order
      )
      VALUES (
        target_work_order_id,
        COALESCE(NULLIF(phase_item->>'phase_key', ''), 'custom'),
        COALESCE(NULLIF(phase_item->>'title', ''), 'Fase'),
        NULLIF(phase_item->>'description', ''),
        NULLIF(phase_item->>'assigned_to', '')::UUID,
        next_status,
        NULLIF(phase_item->>'due_date', '')::DATE,
        next_completed_at,
        next_sort_order
      )
      RETURNING id INTO next_phase_id;
    END IF;

    kept_phase_ids := array_append(kept_phase_ids, next_phase_id);
  END LOOP;

  DELETE FROM public.work_order_phases
  WHERE work_order_id = target_work_order_id
    AND NOT (id = ANY(kept_phase_ids));

  INSERT INTO public.work_order_activity (work_order_id, actor_id, action, details)
  VALUES (
    target_work_order_id,
    auth.uid(),
    'phases_saved',
    jsonb_build_object('phase_count', COALESCE(array_length(kept_phase_ids, 1), 0))
  );

  RETURN QUERY
  SELECT *
  FROM public.work_order_phases
  WHERE work_order_id = target_work_order_id
  ORDER BY sort_order, created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_work_order_phases(UUID, JSONB) TO authenticated;
