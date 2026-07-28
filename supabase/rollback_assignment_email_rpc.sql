-- Rollback for supabase/patch_assignment_email_rpc.sql.
-- This removes only the assignment notification RPC. It does not modify data or policies.

BEGIN;

REVOKE ALL
ON FUNCTION public.queue_work_order_assignment_notifications(uuid)
FROM authenticated;

DROP FUNCTION IF EXISTS public.queue_work_order_assignment_notifications(uuid);

COMMIT;
