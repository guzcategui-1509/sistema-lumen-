-- Lumen Workspace: fase oficial Diseno.
-- Ejecutar una vez en Supabase SQL Editor despues de patch_work_order_phases.sql.
-- No inserta fases masivamente en OTs existentes; solo actualiza la lista oficial del check.

ALTER TABLE public.work_order_phases
DROP CONSTRAINT IF EXISTS work_order_phases_phase_key_check;

ALTER TABLE public.work_order_phases
ADD CONSTRAINT work_order_phases_phase_key_check CHECK (
  phase_key IN ('brief', 'creatividad', 'diseno', 'produccion', 'revision', 'ajustes', 'entrega', 'custom')
  OR phase_key ~ '^[a-z0-9_-]+$'
);
