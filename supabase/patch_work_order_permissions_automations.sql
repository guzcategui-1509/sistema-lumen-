-- Lumen Workspace: permisos de OTs + responsables por marca + automatizaciones mensuales
-- Ejecutar en Supabase SQL Editor antes de desplegar monthly-work-orders.

CREATE TABLE IF NOT EXISTS brand_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responsibility_role TEXT NOT NULL CHECK (
    responsibility_role IN (
      'direccion',
      'directora',
      'cuentas',
      'generador',
      'creativo',
      'medios',
      'pauta',
      'operaciones',
      'editor',
      'ejecutivo'
    )
  ),
  receives_digest BOOLEAN DEFAULT true,
  receives_auto_orders BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, user_id, responsibility_role)
);

CREATE INDEX IF NOT EXISTS idx_brand_responsibilities_brand ON brand_responsibilities(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_responsibilities_user ON brand_responsibilities(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_responsibilities_role ON brand_responsibilities(responsibility_role);

DROP TRIGGER IF EXISTS trg_brand_responsibilities_updated_at ON brand_responsibilities;
CREATE TRIGGER trg_brand_responsibilities_updated_at
BEFORE UPDATE ON brand_responsibilities
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION can_manage_work_orders()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT current_app_role() IN ('admin', 'directora', 'cuentas');
$$;

ALTER TABLE brand_responsibilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_responsibilities_select_internal" ON brand_responsibilities;
DROP POLICY IF EXISTS "brand_responsibilities_manage_direction_cuentas" ON brand_responsibilities;

CREATE POLICY "brand_responsibilities_select_internal"
ON brand_responsibilities FOR SELECT
TO authenticated
USING (is_internal_user() AND can_access_brand(brand_id));

CREATE POLICY "brand_responsibilities_manage_direction_cuentas"
ON brand_responsibilities FOR ALL
TO authenticated
USING (can_manage_work_orders() AND can_access_brand(brand_id))
WITH CHECK (can_manage_work_orders() AND can_access_brand(brand_id));

INSERT INTO brand_responsibilities (brand_id, user_id, responsibility_role)
SELECT brand_id, user_id, role::text
FROM brand_memberships
WHERE role::text IN ('directora', 'cuentas', 'generador', 'creativo', 'medios', 'pauta', 'operaciones', 'editor', 'ejecutivo')
ON CONFLICT (brand_id, user_id, responsibility_role) DO NOTHING;

DROP POLICY IF EXISTS "work_orders_manage_internal" ON work_orders;
DROP POLICY IF EXISTS "work_orders_manage_direction_cuentas" ON work_orders;

CREATE POLICY "work_orders_manage_direction_cuentas"
ON work_orders FOR ALL
TO authenticated
USING (can_manage_work_orders() AND can_access_brand(brand_id))
WITH CHECK (can_manage_work_orders() AND can_access_brand(brand_id));

DROP POLICY IF EXISTS "work_order_assignees_manage_internal" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_manage_direction_cuentas" ON work_order_assignees;

CREATE POLICY "work_order_assignees_manage_direction_cuentas"
ON work_order_assignees FOR ALL
TO authenticated
USING (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

DROP POLICY IF EXISTS "work_order_files_manage_internal" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_manage_direction_cuentas" ON work_order_files;

CREATE POLICY "work_order_files_manage_direction_cuentas"
ON work_order_files FOR ALL
TO authenticated
USING (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
)
WITH CHECK (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

DROP POLICY IF EXISTS "work_order_activity_insert_internal" ON work_order_activity;
DROP POLICY IF EXISTS "work_order_activity_insert_direction_cuentas" ON work_order_activity;

CREATE POLICY "work_order_activity_insert_direction_cuentas"
ON work_order_activity FOR INSERT
TO authenticated
WITH CHECK (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

DROP POLICY IF EXISTS "notification_rules_manage_admin_directora" ON notification_rules;
DROP POLICY IF EXISTS "notification_rules_manage_direction_cuentas" ON notification_rules;

CREATE POLICY "notification_rules_manage_direction_cuentas"
ON notification_rules FOR ALL
TO authenticated
USING (can_manage_work_orders())
WITH CHECK (can_manage_work_orders());

DROP POLICY IF EXISTS "email_notifications_manage_admin_directora" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_manage_direction_cuentas" ON email_notifications;

CREATE POLICY "email_notifications_manage_direction_cuentas"
ON email_notifications FOR ALL
TO authenticated
USING (can_manage_work_orders())
WITH CHECK (can_manage_work_orders());

DROP POLICY IF EXISTS "weekly_digest_runs_manage_admin_directora" ON weekly_digest_runs;
DROP POLICY IF EXISTS "weekly_digest_runs_manage_direction_cuentas" ON weekly_digest_runs;

CREATE POLICY "weekly_digest_runs_manage_direction_cuentas"
ON weekly_digest_runs FOR ALL
TO authenticated
USING (can_manage_work_orders())
WITH CHECK (can_manage_work_orders());

DROP POLICY IF EXISTS "work_order_files_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_delete" ON storage.objects;

CREATE POLICY "work_order_files_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.can_manage_work_orders()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "work_order_files_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.can_manage_work_orders()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.can_manage_work_orders()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "work_order_files_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.can_manage_work_orders()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);

INSERT INTO notification_rules (rule_key, title, channel, recipients, is_enabled)
VALUES
  ('weekly_digest_accounts', 'Digest semanal de tareas pendientes', 'email', 'direccion_cuentas_by_brand_scope', true),
  ('monthly_content_matrix', 'Matriz mensual de contenido', 'work_order_email', 'cuentas_generador_creativo_by_brand', false),
  ('monthly_paid_placement', 'Colocacion mensual de pauta', 'work_order_email', 'cuentas_medios_pauta_by_brand', false)
ON CONFLICT (rule_key) DO UPDATE SET
  title = EXCLUDED.title,
  channel = EXCLUDED.channel,
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();
