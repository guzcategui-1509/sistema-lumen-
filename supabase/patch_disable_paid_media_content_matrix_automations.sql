-- Disable the two legacy monthly work-order automations without deleting history.
-- This patch does not modify existing work orders or any other cron job.

BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('cron') IS NULL OR to_regclass('cron.job') IS NULL THEN
    RAISE EXCEPTION 'pg_cron is not installed or cron.job is unavailable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure_definition
    JOIN pg_catalog.pg_namespace procedure_namespace
      ON procedure_namespace.oid = procedure_definition.pronamespace
    WHERE procedure_namespace.nspname = 'cron'
      AND procedure_definition.proname = 'unschedule'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc procedure_definition
    JOIN pg_catalog.pg_namespace procedure_namespace
      ON procedure_namespace.oid = procedure_definition.pronamespace
    WHERE procedure_namespace.nspname = 'cron'
      AND procedure_definition.proname = 'schedule'
  ) THEN
    RAISE EXCEPTION 'cron.schedule or cron.unschedule is unavailable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cron'
      AND table_name = 'job'
      AND column_name = 'jobid'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cron'
      AND table_name = 'job'
      AND column_name = 'jobname'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cron'
      AND table_name = 'job'
      AND column_name = 'schedule'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'cron'
      AND table_name = 'job'
      AND column_name = 'active'
  ) THEN
    RAISE EXCEPTION 'cron.job is missing jobid, jobname, schedule, or active';
  END IF;

  IF to_regclass('public.notification_rules') IS NULL THEN
    RAISE EXCEPTION 'public.notification_rules does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_rules'
      AND column_name = 'rule_key'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_rules'
      AND column_name = 'is_enabled'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notification_rules'
      AND column_name = 'updated_at'
  ) THEN
    RAISE EXCEPTION 'public.notification_rules is missing rule_key, is_enabled, or updated_at';
  END IF;
END
$preflight$;

DO $disable_jobs$
DECLARE
  scheduled_job RECORD;
BEGIN
  FOR scheduled_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'lumen-monthly-content-matrix',
      'lumen-monthly-paid-placement'
    )
  LOOP
    PERFORM cron.unschedule(scheduled_job.jobid);
  END LOOP;
END
$disable_jobs$;

UPDATE public.notification_rules
SET
  is_enabled = false,
  updated_at = now()
WHERE rule_key IN (
  'monthly_content_matrix',
  'monthly_paid_placement'
);

COMMIT;

SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'lumen-monthly-content-matrix',
  'lumen-monthly-paid-placement'
)
ORDER BY jobname;

SELECT rule_key, is_enabled
FROM public.notification_rules
WHERE rule_key IN (
  'monthly_content_matrix',
  'monthly_paid_placement'
)
ORDER BY rule_key;
