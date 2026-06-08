-- Lumen Workspace: destinatarios editables de notificaciones por marca.
-- Ejecutar una vez en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.brand_notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_notification_recipients_brand
ON public.brand_notification_recipients(brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_notification_recipients_user
ON public.brand_notification_recipients(user_id);

ALTER TABLE public.brand_notification_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_notification_recipients_select_internal"
ON public.brand_notification_recipients;

DROP POLICY IF EXISTS "brand_notification_recipients_manage"
ON public.brand_notification_recipients;

CREATE POLICY "brand_notification_recipients_select_internal"
ON public.brand_notification_recipients FOR SELECT
TO authenticated
USING (public.current_app_role() <> 'cliente' AND public.can_access_brand(brand_id));

CREATE POLICY "brand_notification_recipients_manage"
ON public.brand_notification_recipients FOR ALL
TO authenticated
USING (
  public.current_app_role() IN ('admin', 'directora', 'cuentas')
  AND public.can_access_brand(brand_id)
)
WITH CHECK (
  public.current_app_role() IN ('admin', 'directora', 'cuentas')
  AND public.can_access_brand(brand_id)
);

UPDATE public.notification_rules
SET
  title = CASE
    WHEN rule_key = 'assignment' THEN 'Nueva OT creada'
    ELSE title
  END,
  recipients = 'brand_notification_recipients,fallback_work_order_assignees',
  updated_at = now()
WHERE rule_key IN ('assignment', 'daily_activity_digest');
