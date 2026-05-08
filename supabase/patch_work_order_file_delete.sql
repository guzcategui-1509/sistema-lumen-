-- Lumen Workspace: permitir eliminar archivos de OTs desde la app
-- Reglas:
-- - Admin, Direccion y Cuentas pueden eliminar archivos de marcas a las que tienen acceso.
-- - Quien subio un archivo tambien puede eliminarlo si pertenece a una marca visible para su usuario.

DROP POLICY IF EXISTS "work_order_files_storage_delete" ON storage.objects;

CREATE POLICY "work_order_files_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-order-files'
  AND public.can_access_brand(((storage.foldername(name))[1])::uuid)
  AND (
    public.current_app_role() IN ('admin', 'directora', 'cuentas')
    OR EXISTS (
      SELECT 1
      FROM public.work_order_files wof
      JOIN public.work_orders wo ON wo.id = wof.work_order_id
      WHERE wof.storage_path = name
      AND wo.brand_id = ((storage.foldername(name))[1])::uuid
      AND wof.uploaded_by = auth.uid()
    )
  )
);
