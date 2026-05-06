-- Lumen Workspace: workflow extendido de OTs + creacion por Generador/Creativo
-- Ejecutar en Supabase SQL Editor despues de patch_work_order_permissions_automations.sql.

ALTER TYPE work_order_status ADD VALUE IF NOT EXISTS 'client_approved';
ALTER TYPE work_order_status ADD VALUE IF NOT EXISTS 'scheduled';

CREATE OR REPLACE FUNCTION can_create_work_orders()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT current_app_role() IN ('admin', 'directora', 'cuentas', 'generador', 'creativo');
$$;

-- work_orders: creadores pueden insertar; Direccion/Cuentas administran cambios.
DROP POLICY IF EXISTS "work_orders_manage_internal" ON work_orders;
DROP POLICY IF EXISTS "work_orders_manage_direction_cuentas" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert_creators" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update_direction_cuentas" ON work_orders;
DROP POLICY IF EXISTS "work_orders_delete_direction_cuentas" ON work_orders;

CREATE POLICY "work_orders_insert_creators"
ON work_orders FOR INSERT
TO authenticated
WITH CHECK (can_create_work_orders() AND can_access_brand(brand_id));

CREATE POLICY "work_orders_update_direction_cuentas"
ON work_orders FOR UPDATE
TO authenticated
USING (can_manage_work_orders() AND can_access_brand(brand_id))
WITH CHECK (can_manage_work_orders() AND can_access_brand(brand_id));

CREATE POLICY "work_orders_delete_direction_cuentas"
ON work_orders FOR DELETE
TO authenticated
USING (can_manage_work_orders() AND can_access_brand(brand_id));

-- Responsables: quien crea puede asignar; Direccion/Cuentas pueden corregir.
DROP POLICY IF EXISTS "work_order_assignees_manage_internal" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_manage_direction_cuentas" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_insert_creators" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_update_direction_cuentas" ON work_order_assignees;
DROP POLICY IF EXISTS "work_order_assignees_delete_direction_cuentas" ON work_order_assignees;

CREATE POLICY "work_order_assignees_insert_creators"
ON work_order_assignees FOR INSERT
TO authenticated
WITH CHECK (
  can_create_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_assignees_update_direction_cuentas"
ON work_order_assignees FOR UPDATE
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

CREATE POLICY "work_order_assignees_delete_direction_cuentas"
ON work_order_assignees FOR DELETE
TO authenticated
USING (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_assignees.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

-- Adjuntos: quien crea puede subir; Direccion/Cuentas pueden administrar.
DROP POLICY IF EXISTS "work_order_files_manage_internal" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_manage_direction_cuentas" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_insert_creators" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_update_direction_cuentas" ON work_order_files;
DROP POLICY IF EXISTS "work_order_files_delete_direction_cuentas" ON work_order_files;

CREATE POLICY "work_order_files_insert_creators"
ON work_order_files FOR INSERT
TO authenticated
WITH CHECK (
  can_create_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

CREATE POLICY "work_order_files_update_direction_cuentas"
ON work_order_files FOR UPDATE
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

CREATE POLICY "work_order_files_delete_direction_cuentas"
ON work_order_files FOR DELETE
TO authenticated
USING (
  can_manage_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

-- Actividad y emails: la creacion de OT debe poder dejar bitacora y correo en cola.
DROP POLICY IF EXISTS "work_order_activity_insert_internal" ON work_order_activity;
DROP POLICY IF EXISTS "work_order_activity_insert_direction_cuentas" ON work_order_activity;
DROP POLICY IF EXISTS "work_order_activity_insert_creators" ON work_order_activity;

CREATE POLICY "work_order_activity_insert_creators"
ON work_order_activity FOR INSERT
TO authenticated
WITH CHECK (
  can_create_work_orders()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

DROP POLICY IF EXISTS "email_notifications_manage_admin_directora" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_manage_direction_cuentas" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_insert_creators" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_update_direction_cuentas" ON email_notifications;
DROP POLICY IF EXISTS "email_notifications_delete_direction_cuentas" ON email_notifications;

CREATE POLICY "email_notifications_insert_creators"
ON email_notifications FOR INSERT
TO authenticated
WITH CHECK (
  can_create_work_orders()
  AND (brand_id IS NULL OR can_access_brand(brand_id))
);

CREATE POLICY "email_notifications_update_direction_cuentas"
ON email_notifications FOR UPDATE
TO authenticated
USING (can_manage_work_orders())
WITH CHECK (can_manage_work_orders());

CREATE POLICY "email_notifications_delete_direction_cuentas"
ON email_notifications FOR DELETE
TO authenticated
USING (can_manage_work_orders());

-- Storage: permite subir adjuntos al crear una OT.
DROP POLICY IF EXISTS "work_order_files_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "work_order_files_storage_delete" ON storage.objects;

CREATE POLICY "work_order_files_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.can_create_work_orders()
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
