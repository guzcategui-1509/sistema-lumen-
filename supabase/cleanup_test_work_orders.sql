-- Limpieza de OTs de prueba.
-- Esto borra TODAS las ordenes de trabajo actuales y sus registros relacionados en tablas.
-- Supabase no permite borrar storage.objects directo por SQL; si quedan archivos fisicos,
-- limpiarlos desde Storage > work-order-files.
-- Ejecutar solo cuando estes segura de reiniciar el tablero operativo.

DELETE FROM email_notifications;
DELETE FROM weekly_digest_runs;
DELETE FROM work_orders;
