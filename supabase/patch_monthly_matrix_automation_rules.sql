-- Lumen Workspace: ajuste de matrices automaticas.
-- Ejecutar una vez en Supabase SQL Editor si ya existen OTs AUTO-MATRIZ previas.

UPDATE public.work_orders
SET
  category = 'matriz',
  updated_at = now()
WHERE code LIKE 'AUTO-MATRIZ-%'
  AND category <> 'matriz';

UPDATE public.work_orders wo
SET
  archived_at = COALESCE(wo.archived_at, now()),
  updated_at = now()
FROM public.brands b
WHERE wo.brand_id = b.id
  AND wo.code LIKE 'AUTO-MATRIZ-%'
  AND b.slug IN ('bonafont-gt', 'lumen-podcast');
