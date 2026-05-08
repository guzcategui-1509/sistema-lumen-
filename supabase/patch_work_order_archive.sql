-- Lumen Workspace: archivar OTs sin tocar el enum de estados

ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_archived_at
ON public.work_orders(archived_at);

INSERT INTO public.notification_rules (rule_key, title, channel, recipients, is_enabled)
VALUES
  ('work_order_archived', 'OT archivada/restaurada', 'email', 'responsables_de_la_ot', true)
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();
