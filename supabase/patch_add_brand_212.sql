-- Agrega la marca 212 como parte de Continental Motores.
-- Ejecutar una vez en Supabase SQL Editor.

INSERT INTO public.brands (
  client_id,
  name,
  slug,
  color_primary,
  platforms,
  services,
  posts_per_month,
  canva_folder_url,
  is_active
)
SELECT
  c.id,
  '212',
  '212-continental',
  '#2d2d2d',
  ARRAY['Facebook','Instagram'],
  ARRAY['Publicacion','Comunidad','Reporteria','Pauta Meta'],
  10,
  'Continental / 212',
  true
FROM public.clients c
WHERE c.slug = 'continental'
ON CONFLICT (slug) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  name = EXCLUDED.name,
  color_primary = EXCLUDED.color_primary,
  platforms = EXCLUDED.platforms,
  services = EXCLUDED.services,
  posts_per_month = EXCLUDED.posts_per_month,
  canva_folder_url = EXCLUDED.canva_folder_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();
