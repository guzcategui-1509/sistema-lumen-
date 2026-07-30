-- Controlled one-time backfill for the existing SLK-002 / Produccion event.
-- Execute only after patch_phase_completed_server_trigger.sql.
-- It identifies the five existing sent rows, then queues only missing recipients.

BEGIN;

UPDATE public.email_notifications
SET
  work_order_phase_id = '385e1d4f-6ef9-40bc-9f0d-49ffe573ea76',
  event_occurred_at =
    '2026-07-29 15:42:28.577927+00'::timestamptz,
  event_actor_user_id =
    '39ba8225-6820-46bd-a85f-07e3f82c169f'
WHERE work_order_id =
    '1b5686de-f999-4f3b-89a2-a0978e12d3e9'
  AND notification_type::text = 'phase_completed'
  AND subject = 'Fase completada: Producción · SLK-002'
  AND status = 'sent'
  AND created_at >=
    '2026-07-29 15:42:28.577927+00'::timestamptz
  AND created_at <
    '2026-07-29 15:43:28.577927+00'::timestamptz
  AND work_order_phase_id IS NULL
  AND event_occurred_at IS NULL
  AND event_actor_user_id IS NULL;

DO $function$
DECLARE
  tagged_existing_count integer;
BEGIN
  SELECT count(*)::integer
  INTO tagged_existing_count
  FROM public.email_notifications
  WHERE work_order_phase_id =
      '385e1d4f-6ef9-40bc-9f0d-49ffe573ea76'
    AND event_occurred_at =
      '2026-07-29 15:42:28.577927+00'::timestamptz
    AND event_actor_user_id =
      '39ba8225-6820-46bd-a85f-07e3f82c169f'
    AND notification_type::text = 'phase_completed'
    AND status = 'sent';

  IF tagged_existing_count <> 5 THEN
    RAISE EXCEPTION
      'slk002_expected_five_existing_sent_rows_found_%',
      tagged_existing_count;
  END IF;
END;
$function$;

SELECT *
FROM public.enqueue_phase_completed_notification_event(
  '385e1d4f-6ef9-40bc-9f0d-49ffe573ea76',
  '2026-07-29 15:42:28.577927+00'::timestamptz,
  '39ba8225-6820-46bd-a85f-07e3f82c169f'
);

COMMIT;

-- Expected:
-- eligible_recipient_count = 8
-- queued_count = 3
-- already_queued_count = 5
