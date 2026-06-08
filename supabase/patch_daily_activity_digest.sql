-- Lumen Workspace: reducir correos individuales y activar resumen diario.
-- Ejecutar una vez en Supabase SQL Editor antes de usar daily-activity-digest.

ALTER TYPE public.email_notification_type ADD VALUE IF NOT EXISTS 'daily_digest';

INSERT INTO public.notification_rules (rule_key, title, channel, recipients, is_enabled)
VALUES
  (
    'daily_activity_digest',
    'Resumen diario de actividad',
    'email',
    'work_order_assignees,created_by',
    true
  )
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

UPDATE public.notification_rules
SET
  title = 'Cambios de OT incluidos en resumen diario',
  channel = 'daily_digest',
  recipients = 'work_order_assignees,created_by',
  updated_at = now()
WHERE rule_key IN ('status_change', 'work_order_edits', 'subtask_updates');

UPDATE public.email_notifications
SET
  status = 'cancelled',
  error_message = 'Reemplazado por resumen diario de actividad'
WHERE notification_type = 'status_change'
  AND status = 'queued';
