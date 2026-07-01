-- Lumen Workspace - limpieza pre-piloto de OTs de prueba
-- Fecha: 2026-07-01
--
-- IMPORTANTE:
-- 1. Ejecuta primero SOLO la consulta de revision.
-- 2. Revisa la lista con Giuliana.
-- 3. Descomenta el bloque de archivado unicamente si confirmas que esas OTs deben salir del panel activo.
-- 4. Este patch archiva con archived_at; no borra OTs, fases, comentarios, archivos ni actividad.

-- 1) Revision: OTs candidatas a archivar antes del piloto.
select
  id,
  code,
  title,
  created_at,
  archived_at
from public.work_orders
where archived_at is null
  and (
    code ilike 'AUTO-%'
    or title ilike '%prueba%'
  )
order by created_at desc;

-- 2) Archivado opcional despues de revisar.
-- Descomenta SOLO despues de confirmar la lista anterior.
--
-- begin;
--
-- update public.work_orders
-- set
--   archived_at = now(),
--   updated_at = now()
-- where archived_at is null
--   and (
--     code ilike 'AUTO-%'
--     or title ilike '%prueba%'
--   );
--
-- commit;

