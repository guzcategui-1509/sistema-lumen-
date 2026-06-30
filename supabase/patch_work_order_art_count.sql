-- Lumen Workspace: cantidad informativa de artes por orden.
-- Ejecutar una vez en Supabase SQL Editor antes de usar el campo "Cantidad de artes".
-- No crea subtareas, piezas ni entregables; solo agrega un dato opcional a work_orders.

ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS art_count integer
CHECK (art_count IS NULL OR art_count >= 0);
