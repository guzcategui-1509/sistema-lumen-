-- Coordinated rollback:
-- 1. Restore the frontend producer first.
-- 2. Then execute this SQL. Existing notification rows remain intact.

BEGIN;

DROP TRIGGER IF EXISTS trg_enforce_phase_completed_server_producer
  ON public.email_notifications;

DROP TRIGGER IF EXISTS trg_queue_phase_completed_after_update
  ON public.work_order_phases;

DROP FUNCTION IF EXISTS
  public.enforce_phase_completed_server_producer();

DROP FUNCTION IF EXISTS
  public.queue_phase_completed_after_update();

DROP FUNCTION IF EXISTS
  public.enqueue_phase_completed_notification_event(
    uuid,
    timestamptz,
    uuid
  );

DROP FUNCTION IF EXISTS
  public.escape_phase_completed_email_html(text);

DROP INDEX IF EXISTS
  public.email_notifications_phase_completed_event_recipient_active_uidx;

DROP INDEX IF EXISTS
  public.idx_email_notifications_work_order_phase;

ALTER TABLE public.email_notifications
  DROP COLUMN IF EXISTS event_actor_user_id;

ALTER TABLE public.email_notifications
  DROP COLUMN IF EXISTS event_occurred_at;

ALTER TABLE public.email_notifications
  DROP COLUMN IF EXISTS work_order_phase_id;

COMMIT;
