-- Lumen Workspace: archivar OTs sin tocar el enum de estados
-- Seguro/reversible: usa archived_at, no borra OTs ni altera fases, archivos o comentarios.

ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_archived_at
ON public.work_orders(archived_at);

CREATE OR REPLACE FUNCTION public.can_archive_work_orders()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_app_role() IN ('admin', 'directora', 'cuentas', 'generador', 'creativo');
$$;

CREATE OR REPLACE FUNCTION public.archive_work_order(
  target_work_order_id UUID,
  should_archive BOOLEAN
)
RETURNS TABLE (
  id UUID,
  archived_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  target_brand_id UUID;
  next_archived_at TIMESTAMPTZ;
BEGIN
  SELECT wo.brand_id
  INTO target_brand_id
  FROM public.work_orders wo
  WHERE wo.id = target_work_order_id;

  IF target_brand_id IS NULL THEN
    RAISE EXCEPTION 'work_order_not_found';
  END IF;

  IF NOT (public.can_archive_work_orders() AND public.can_access_brand(target_brand_id)) THEN
    RAISE EXCEPTION 'not_allowed_to_archive_work_order';
  END IF;

  next_archived_at := CASE WHEN should_archive THEN now() ELSE NULL END;

  UPDATE public.work_orders wo
  SET archived_at = next_archived_at,
      updated_at = now()
  WHERE wo.id = target_work_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_archive_update_failed';
  END IF;

  INSERT INTO public.work_order_activity (work_order_id, actor_id, action, details)
  VALUES (
    target_work_order_id,
    auth.uid(),
    CASE WHEN should_archive THEN 'archived' ELSE 'unarchived' END,
    jsonb_build_object('archived_at', next_archived_at)
  );

  RETURN QUERY
  SELECT wo.id, wo.archived_at, wo.updated_at
  FROM public.work_orders wo
  WHERE wo.id = target_work_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_archive_work_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_work_order(UUID, BOOLEAN) TO authenticated;

INSERT INTO public.notification_rules (rule_key, title, channel, recipients, is_enabled)
VALUES
  ('work_order_archived', 'OT archivada/restaurada', 'email', 'responsables_de_la_ot', true)
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();
