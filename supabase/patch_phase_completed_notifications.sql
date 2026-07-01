-- Lumen Workspace: correos trazables cuando una fase se marca como terminada.
-- Ejecutar una vez en Supabase SQL Editor despues de launch_mvp.sql y patch_work_order_phase_completion.sql.
-- Este patch no envia correos; solo permite encolar registros phase_completed en email_notifications.

DO $$
BEGIN
  ALTER TYPE public.email_notification_type ADD VALUE IF NOT EXISTS 'phase_completed';
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
    'deadline_24h',
    'overdue',
    'weekly_digest',
    'daily_digest'
  )
);

DROP POLICY IF EXISTS "email_notifications_insert_phase_completed" ON public.email_notifications;

CREATE POLICY "email_notifications_insert_phase_completed"
ON public.email_notifications FOR INSERT
TO authenticated
WITH CHECK (
  notification_type::text = 'phase_completed'
  AND work_order_id IS NOT NULL
  AND recipient_user_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = email_notifications.work_order_id
      AND wo.brand_id = email_notifications.brand_id
      AND public.can_access_brand(wo.brand_id)
      AND (
        public.can_manage_work_orders()
        OR EXISTS (
          SELECT 1
          FROM public.work_order_phases phase
          WHERE phase.work_order_id = wo.id
            AND phase.assigned_to = auth.uid()
        )
      )
      AND (
        email_notifications.recipient_user_id = auth.uid()
        OR
        email_notifications.recipient_user_id = wo.created_by
        OR EXISTS (
          SELECT 1
          FROM public.work_order_assignees assignee
          WHERE assignee.work_order_id = wo.id
            AND assignee.user_id = email_notifications.recipient_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.work_order_phases recipient_phase
          WHERE recipient_phase.work_order_id = wo.id
            AND recipient_phase.assigned_to = email_notifications.recipient_user_id
        )
      )
  )
);
