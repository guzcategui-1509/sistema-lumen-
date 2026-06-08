-- Lumen Workspace: resumen diario de actividad.
-- Requiere los secretos existentes lumen_project_url y lumen_cron_secret en Supabase Vault.
-- Se prepara todos los días a las 23:00 Guatemala/Mexico (05:00 UTC).
-- El cron existente lumen-send-prepared-emails lo enviará dentro de los siguientes 10 minutos.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('lumen-prepare-daily-activity-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lumen-prepare-daily-activity-digest');

SELECT cron.schedule(
  'lumen-prepare-daily-activity-digest',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_project_url') || '/functions/v1/daily-activity-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_cron_secret')
    ),
    body := '{"source":"pg_cron","job":"daily-activity-digest"}'::jsonb
  );
  $$
);
