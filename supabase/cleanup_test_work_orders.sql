-- Limpieza total de OTs de prueba.
-- Borra TODAS las ordenes de trabajo actuales y sus registros relacionados.
-- Conserva clientes, marcas, usuarios, roles, permisos y configuracion.
-- Si quedan archivos fisicos, limpiarlos desde Storage > work-order-files.
-- Ejecutar solo cuando estes segura de reiniciar el tablero operativo.

BEGIN;

DELETE FROM email_notifications;
DELETE FROM weekly_digest_runs;
DELETE FROM work_orders;

COMMIT;
