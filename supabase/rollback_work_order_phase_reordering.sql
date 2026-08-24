-- Removes phase reordering without changing phases or their saved order.

REVOKE ALL ON FUNCTION public.reorder_work_order_phases(UUID, JSONB) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.reorder_work_order_phases(UUID, JSONB);
