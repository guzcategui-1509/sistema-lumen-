-- Lumen Workspace: responsables y notificaciones del Planificador de producción.
-- Ejecutar despues de supabase/patch_production_planner.sql.
-- No modifica work_orders ni work_order_phases.

alter table public.production_planner_items
add column if not exists additional_responsible_ids uuid[] not null default '{}';

create index if not exists idx_production_planner_items_additional_responsibles
on public.production_planner_items using gin (additional_responsible_ids);

DO $$
BEGIN
  ALTER TYPE public.email_notification_type ADD VALUE IF NOT EXISTS 'production_assigned';
EXCEPTION
  WHEN undefined_object THEN
    -- Algunos entornos antiguos usan TEXT + CHECK en lugar del enum.
    NULL;
END $$;

ALTER TABLE public.email_notifications
DROP CONSTRAINT IF EXISTS email_notifications_notification_type_check;

ALTER TABLE public.email_notifications
ADD CONSTRAINT email_notifications_notification_type_check CHECK (
  notification_type::text IN (
    'assignment',
    'comment',
    'status_change',
    'phase_completed',
    'production_assigned',
    'deadline_24h',
    'overdue',
    'weekly_digest',
    'daily_digest'
  )
);

DROP POLICY IF EXISTS "email_notifications_insert_production_assigned" ON public.email_notifications;

CREATE POLICY "email_notifications_insert_production_assigned"
ON public.email_notifications FOR INSERT
TO authenticated
WITH CHECK (
  notification_type::text = 'production_assigned'
  AND work_order_id IS NULL
  AND brand_id IS NULL
  AND recipient_user_id IS NOT NULL
  AND public.can_access_production_planner()
);
