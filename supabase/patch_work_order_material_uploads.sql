-- Lumen Workspace: materiales en OTs por roles operativos
-- Ejecutar en Supabase SQL Editor despues de patch_ot_workflow_creators.sql.

CREATE OR REPLACE FUNCTION can_upload_work_order_materials()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT current_app_role() IN ('admin', 'directora', 'cuentas', 'generador', 'creativo', 'disenador', 'editor');
$$;

-- Permite que Diseno/Editor/Creativo/Generador adjunten materiales a OTs de sus marcas.
DROP POLICY IF EXISTS "work_order_files_insert_material_uploaders" ON work_order_files;

CREATE POLICY "work_order_files_insert_material_uploaders"
ON work_order_files FOR INSERT
TO authenticated
WITH CHECK (
  can_upload_work_order_materials()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_files.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

-- Permite dejar bitacora cuando alguien sube materiales.
DROP POLICY IF EXISTS "work_order_activity_insert_material_uploaders" ON work_order_activity;

CREATE POLICY "work_order_activity_insert_material_uploaders"
ON work_order_activity FOR INSERT
TO authenticated
WITH CHECK (
  can_upload_work_order_materials()
  AND EXISTS (
    SELECT 1 FROM work_orders wo
    WHERE wo.id = work_order_activity.work_order_id
    AND can_access_brand(wo.brand_id)
  )
);

-- Permite preparar correos por cambios/materiales desde roles operativos.
DROP POLICY IF EXISTS "email_notifications_insert_material_uploaders" ON email_notifications;

CREATE POLICY "email_notifications_insert_material_uploaders"
ON email_notifications FOR INSERT
TO authenticated
WITH CHECK (
  can_upload_work_order_materials()
  AND (brand_id IS NULL OR can_access_brand(brand_id))
);

-- Storage: subir archivos al bucket privado work-order-files.
DROP POLICY IF EXISTS "work_order_files_storage_insert_material_uploaders" ON storage.objects;

CREATE POLICY "work_order_files_storage_insert_material_uploaders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-files'
  AND public.can_upload_work_order_materials()
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
);
