-- Limpieza total de OTs de prueba.
-- Borra TODAS las ordenes de trabajo actuales y sus registros relacionados.
-- Conserva clientes, marcas, usuarios, roles, permisos, reglas y configuracion.
-- Ejecutar en Supabase SQL Editor cuando quieras reiniciar el tablero operativo.

BEGIN;

-- Archivos fisicos guardados en Supabase Storage para adjuntos de OTs.
DELETE FROM storage.objects
WHERE bucket_id = 'work-order-files';

-- Datos operativos relacionados con OTs.
TRUNCATE TABLE
  public.email_notifications,
  public.weekly_digest_runs,
  public.work_order_activity,
  public.work_order_files,
  public.work_order_comments,
  public.work_order_assignees,
  public.work_orders
RESTART IDENTITY CASCADE;

COMMIT;

-- Verificacion: todos estos conteos deben quedar en 0.
SELECT
  (SELECT count(*) FROM public.work_orders) AS work_orders,
  (SELECT count(*) FROM public.work_order_assignees) AS assignees,
  (SELECT count(*) FROM public.work_order_files) AS files,
  (SELECT count(*) FROM public.work_order_comments) AS comments,
  (SELECT count(*) FROM public.work_order_activity) AS activity,
  (SELECT count(*) FROM public.email_notifications) AS email_notifications,
  (SELECT count(*) FROM public.weekly_digest_runs) AS weekly_digest_runs,
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'work-order-files') AS storage_objects;
