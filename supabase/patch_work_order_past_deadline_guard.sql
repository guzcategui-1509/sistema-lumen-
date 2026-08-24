-- Lumen Workspace: prevent new work-order and phase deadlines in the past.
-- Historical deadlines remain valid until their due_date is explicitly changed.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.work_orders') IS NULL THEN
    RAISE EXCEPTION 'missing_table: public.work_orders';
  END IF;

  IF to_regclass('public.work_order_phases') IS NULL THEN
    RAISE EXCEPTION 'missing_table: public.work_order_phases';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_orders'
      AND column_name = 'due_date'
      AND data_type = 'date'
  ) THEN
    RAISE EXCEPTION 'missing_or_invalid_column: public.work_orders.due_date date';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_order_phases'
      AND column_name = 'due_date'
      AND data_type = 'date'
  ) THEN
    RAISE EXCEPTION 'missing_or_invalid_column: public.work_order_phases.due_date date';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_work_order_due_date_not_past()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
    RAISE EXCEPTION USING
      ERRCODE = '22007',
      MESSAGE = 'La fecha de entrega no puede estar en el pasado.',
      DETAIL = 'work_order_due_date_in_past';
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.due_date IS DISTINCT FROM OLD.due_date
    AND NEW.due_date IS NOT NULL
    AND NEW.due_date < CURRENT_DATE
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22007',
      MESSAGE = 'La fecha de entrega no puede estar en el pasado.',
      DETAIL = 'work_order_due_date_in_past';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_work_order_phase_due_date_not_past()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
    RAISE EXCEPTION USING
      ERRCODE = '22007',
      MESSAGE = 'La fecha de entrega no puede estar en el pasado.',
      DETAIL = 'work_order_phase_due_date_in_past';
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.due_date IS DISTINCT FROM OLD.due_date
    AND NEW.due_date IS NOT NULL
    AND NEW.due_date < CURRENT_DATE
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22007',
      MESSAGE = 'La fecha de entrega no puede estar en el pasado.',
      DETAIL = 'work_order_phase_due_date_in_past';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_work_order_due_date_not_past() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_work_order_due_date_not_past() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_work_order_due_date_not_past() FROM authenticated;
REVOKE ALL ON FUNCTION public.enforce_work_order_phase_due_date_not_past() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_work_order_phase_due_date_not_past() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_work_order_phase_due_date_not_past() FROM authenticated;

DROP TRIGGER IF EXISTS work_orders_due_date_not_past ON public.work_orders;
CREATE TRIGGER work_orders_due_date_not_past
BEFORE INSERT OR UPDATE OF due_date ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_work_order_due_date_not_past();

DROP TRIGGER IF EXISTS work_order_phases_due_date_not_past ON public.work_order_phases;
CREATE TRIGGER work_order_phases_due_date_not_past
BEFORE INSERT OR UPDATE OF due_date ON public.work_order_phases
FOR EACH ROW
EXECUTE FUNCTION public.enforce_work_order_phase_due_date_not_past();

COMMIT;
