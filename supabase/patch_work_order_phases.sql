-- Lumen Workspace: fases internas por orden de trabajo
-- Mantiene la OT como unidad principal y agrega seguimiento por fase.

DO $$
BEGIN
  CREATE TYPE public.work_order_phase_status AS ENUM (
    'pending',
    'in_progress',
    'blocked',
    'in_review',
    'changes_requested',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.work_order_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  phase_key TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.work_order_phase_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT work_order_phases_phase_key_check CHECK (
    phase_key IN ('brief', 'creatividad', 'produccion', 'revision', 'ajustes', 'entrega', 'custom')
    OR phase_key ~ '^[a-z0-9_-]+$'
  )
);

CREATE INDEX IF NOT EXISTS idx_work_order_phases_order
ON public.work_order_phases(work_order_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_work_order_phases_assigned_to
ON public.work_order_phases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_work_order_phases_status
ON public.work_order_phases(status);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_order_phases_updated_at ON public.work_order_phases;
CREATE TRIGGER trg_work_order_phases_updated_at
BEFORE UPDATE ON public.work_order_phases
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.work_order_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_order_phases_select_brand_access" ON public.work_order_phases;
DROP POLICY IF EXISTS "work_order_phases_manage_internal" ON public.work_order_phases;

CREATE POLICY "work_order_phases_select_brand_access"
ON public.work_order_phases FOR SELECT
TO authenticated
USING (
  public.is_internal_user()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
    AND public.can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_phases_manage_internal"
ON public.work_order_phases FOR ALL
TO authenticated
USING (
  public.is_internal_user()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
    AND public.can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  public.is_internal_user()
  AND EXISTS (
    SELECT 1
    FROM public.work_orders wo
    WHERE wo.id = work_order_phases.work_order_id
    AND public.can_access_brand(wo.brand_id)
  )
);
