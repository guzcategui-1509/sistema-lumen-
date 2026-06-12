-- Lumen Workspace: quitar a Laura Lopez del sistema operativo.
-- Ejecutar una vez en Supabase SQL Editor.
--
-- No borra el usuario de auth.users ni elimina historial de actividad.
-- Desactiva el perfil y lo quita de accesos, destinatarios fijos y responsables activos.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

WITH target_user AS (
  SELECT id
  FROM public.profiles
  WHERE lower(email) IN ('llopez@grupolumen.com', 'laura@grupolumen.com')
     OR full_name ILIKE 'Laura L%pez'
)
UPDATE public.profiles p
SET
  is_active = false,
  updated_at = now()
FROM target_user target
WHERE p.id = target.id;

WITH target_user AS (
  SELECT id
  FROM public.profiles
  WHERE lower(email) IN ('llopez@grupolumen.com', 'laura@grupolumen.com')
     OR full_name ILIKE 'Laura L%pez'
)
DELETE FROM public.brand_notification_recipients recipients
USING target_user target
WHERE recipients.user_id = target.id;

WITH target_user AS (
  SELECT id
  FROM public.profiles
  WHERE lower(email) IN ('llopez@grupolumen.com', 'laura@grupolumen.com')
     OR full_name ILIKE 'Laura L%pez'
)
DELETE FROM public.brand_memberships memberships
USING target_user target
WHERE memberships.user_id = target.id;

WITH target_user AS (
  SELECT id
  FROM public.profiles
  WHERE lower(email) IN ('llopez@grupolumen.com', 'laura@grupolumen.com')
     OR full_name ILIKE 'Laura L%pez'
)
DELETE FROM public.work_order_assignees assignees
USING target_user target
WHERE assignees.user_id = target.id;
