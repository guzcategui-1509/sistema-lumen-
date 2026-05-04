DROP POLICY IF EXISTS "brand_memberships_select_related" ON brand_memberships;

CREATE POLICY "brand_memberships_select_related"
ON brand_memberships FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.current_app_role() IN ('admin', 'directora')
  OR (public.is_internal_user() AND public.can_access_brand(brand_id))
);
