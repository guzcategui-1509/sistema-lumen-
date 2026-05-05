-- Lumen Workspace: automatizacion de correos
-- Ejecutar despues de desplegar las Edge Functions y guardar CRON_SECRET.
--
-- Que hace:
-- 1. Lunes 08:00 Guatemala/Mexico (14:00 UTC): prepara el digest semanal.
-- 2. Lunes 08:02 Guatemala/Mexico (14:02 UTC): envia el digest preparado.
-- 3. Cada 10 minutos: envia otros correos preparados, como asignaciones de OTs.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- Guarda secretos en Supabase Vault. Reemplaza valores antes de ejecutar.
-- Si un secreto ya existe, puedes borrarlo/recrearlo desde Vault UI o usar un nombre nuevo.
SELECT vault.create_secret('https://gxvvamripgwtzrmhmaiz.supabase.co', 'lumen_project_url');
SELECT vault.create_secret('REPLACE_WITH_YOUR_CRON_SECRET', 'lumen_cron_secret');

-- Evita schedules duplicados si vuelves a ejecutar este archivo.
SELECT cron.unschedule('lumen-prepare-weekly-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lumen-prepare-weekly-digest');

SELECT cron.unschedule('lumen-send-weekly-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lumen-send-weekly-digest');

SELECT cron.unschedule('lumen-send-prepared-emails')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lumen-send-prepared-emails');

SELECT cron.schedule(
  'lumen-prepare-weekly-digest',
  '0 14 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_project_url') || '/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_cron_secret')
    ),
    body := '{"source":"pg_cron","job":"weekly-digest"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'lumen-send-weekly-digest',
  '2 14 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_project_url') || '/functions/v1/email-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_cron_secret')
    ),
    body := '{"source":"pg_cron","job":"send-weekly-digest"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'lumen-send-prepared-emails',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_project_url') || '/functions/v1/email-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'lumen_cron_secret')
    ),
    body := '{"source":"pg_cron","job":"send-prepared-emails"}'::jsonb
  );
  $$
);
