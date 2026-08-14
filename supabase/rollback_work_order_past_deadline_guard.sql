-- Roll back only the deadline guards added by patch_work_order_past_deadline_guard.sql.
-- No work-order or phase data is changed.

BEGIN;

DROP TRIGGER IF EXISTS work_orders_due_date_not_past ON public.work_orders;
DROP TRIGGER IF EXISTS work_order_phases_due_date_not_past ON public.work_order_phases;

DROP FUNCTION IF EXISTS public.enforce_work_order_due_date_not_past();
DROP FUNCTION IF EXISTS public.enforce_work_order_phase_due_date_not_past();

COMMIT;
