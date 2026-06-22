-- Lumen Workspace — permisos seguros para completar fases internas
-- Ejecutar en Supabase SQL Editor después de patch_work_order_phases.sql.
-- Objetivo: una persona asignada puede completar solo SU fase sin completar la OT.

CREATE OR REPLACE FUNCTION public.can_create_work_orders()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() IN ('admin', 'directora', 'cuentas', 'generador', 'creativo');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_work_orders()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() IN ('admin', 'directora', 'cuentas');
$$;

ALTER TABLE public.work_order_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_order_phases_select_brand_access" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_manage_internal" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_brand_access" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_internal_manage" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_insert_creators" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_update_managers" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_delete_managers" ON public.work_order_phases;

CREATE POLICY "work_order_phases_select_brand_access"
ON public.work_order_phases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
      AND public.can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_phases_insert_creators"
ON public.work_order_phases FOR INSERT
TO authenticated
WITH CHECK (
  public.can_create_work_orders()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
      AND public.can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_phases_update_managers"
ON public.work_order_phases FOR UPDATE
TO authenticated
USING (
  public.can_manage_work_orders()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
      AND public.can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  public.can_manage_work_orders()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
      AND public.can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_phases_delete_managers"
ON public.work_order_phases FOR DELETE
TO authenticated
USING (
  public.can_manage_work_orders()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
      AND public.can_access_brand(wo.brand_id)
  )
);

CREATE OR REPLACE FUNCTION public.complete_work_order_phase(target_phase_id uuid)
RETURNS public.work_order_phases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phase_row public.work_order_phases%ROWTYPE;
  phase_brand_id uuid;
BEGIN
  SELECT * INTO phase_row
  FROM public.work_order_phases
  WHERE id = target_phase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_phase_not_found';
  END IF;

  SELECT wo.brand_id INTO phase_brand_id
  FROM public.work_orders wo
  WHERE wo.id = phase_row.work_order_id;

  IF phase_brand_id IS NULL OR NOT public.can_access_brand(phase_brand_id) THEN
    RAISE EXCEPTION 'not_allowed_to_access_phase';
  END IF;

  IF NOT (
    public.can_manage_work_orders()
    OR phase_row.assigned_to = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_allowed_to_complete_phase';
  END IF;

  UPDATE public.work_order_phases
  SET
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = target_phase_id
  RETURNING * INTO phase_row;

  INSERT INTO public.work_order_activity (work_order_id, actor_id, action, details)
  VALUES (
    phase_row.work_order_id,
    auth.uid(),
    'phase_completed',
    jsonb_build_object(
      'phase_id', phase_row.id,
      'phase_key', phase_row.phase_key,
      'title', phase_row.title,
      'status', phase_row.status
    )
  );

  RETURN phase_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_work_order_phase(uuid) TO authenticated;
