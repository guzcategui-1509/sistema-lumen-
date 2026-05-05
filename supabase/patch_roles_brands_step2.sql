-- Paso 2: agregar marcas nuevas, ajustar permisos base y textos.
-- Ejecutar despues de patch_roles_brands_step1.sql.

UPDATE brands
SET name = 'Repuestos',
    updated_at = now()
WHERE slug = 'repuestos-continental';

INSERT INTO brands (client_id, name, slug, color_primary, platforms, services, is_active)
VALUES
  (
    (SELECT id FROM clients WHERE slug = 'continental'),
    'Talleres',
    'talleres-continental',
    '#49ee8c',
    ARRAY['Facebook','Instagram'],
    ARRAY['Publicacion','Comunidad','Reporteria','Pauta Meta'],
    true
  ),
  (
    (SELECT id FROM clients WHERE slug = 'continental'),
    'Usados',
    'usados-continental',
    '#5d5d56',
    ARRAY['Facebook','Instagram'],
    ARRAY['Pauta Meta'],
    true
  ),
  (
    (SELECT id FROM clients WHERE slug = 'danone'),
    'Bonafont',
    'bonafont-gt',
    '#166274',
    ARRAY['Facebook','Instagram'],
    ARRAY['Publicacion','Comunidad','Reporteria','Pauta Meta'],
    true
  ),
  (
    (SELECT id FROM clients WHERE slug = 'lumen'),
    'Constructivos',
    'constructivos',
    '#49ee8c',
    ARRAY['Facebook','Instagram'],
    ARRAY['Publicacion','Comunidad','Reporteria'],
    true
  ),
  (
    (SELECT id FROM clients WHERE slug = 'lumen'),
    'Proyectos',
    'lumen-proyectos',
    '#7356a6',
    ARRAY['Facebook','Instagram'],
    ARRAY['Publicacion','Produccion','Reporteria'],
    true
  ),
  (
    (SELECT id FROM clients WHERE slug = 'lumen'),
    'Pitch',
    'lumen-pitch',
    '#2d2d2d',
    ARRAY['Facebook','Instagram'],
    ARRAY['Publicacion','Produccion','Desarrollo'],
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  name = EXCLUDED.name,
  color_primary = EXCLUDED.color_primary,
  platforms = EXCLUDED.platforms,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active,
  updated_at = now();

UPDATE notification_rules
SET recipients = REPLACE(recipients, 'directora', 'direccion'),
    updated_at = now()
WHERE recipients ILIKE '%directora%';

DO $$
BEGIN
  IF to_regclass('public.module_permissions') IS NOT NULL THEN
    INSERT INTO module_permissions (role, module_key, can_view, can_manage) VALUES
      ('cuentas', 'dashboard', true, false),
      ('cuentas', 'brand-config', true, false),
      ('cuentas', 'work-orders', true, true),
      ('cuentas', 'notifications', true, false),
      ('cuentas', 'team', true, false),
      ('cuentas', 'content', true, false),
      ('cuentas', 'reports', true, false),

      ('medios', 'dashboard', true, false),
      ('medios', 'brand-config', true, false),
      ('medios', 'work-orders', true, true),
      ('medios', 'notifications', true, false),
      ('medios', 'reports', true, true),
      ('medios', 'content', true, false),

      ('editor', 'dashboard', true, false),
      ('editor', 'brand-config', true, false),
      ('editor', 'work-orders', true, true),
      ('editor', 'content', true, true),
      ('editor', 'assets', true, true),
      ('editor', 'copywriting', true, false),
      ('editor', 'creativity', true, false),

      ('generador', 'dashboard', true, false),
      ('generador', 'brand-config', true, false),
      ('generador', 'work-orders', true, true),
      ('generador', 'copywriting', true, true),
      ('generador', 'creativity', true, true),
      ('generador', 'content', true, true),

      ('operaciones', 'dashboard', true, true),
      ('operaciones', 'brand-config', true, false),
      ('operaciones', 'work-orders', true, true),
      ('operaciones', 'notifications', true, true),
      ('operaciones', 'team', true, false),
      ('operaciones', 'productions', true, true),

      ('ejecutivo', 'dashboard', true, false),
      ('ejecutivo', 'brand-config', true, false),
      ('ejecutivo', 'work-orders', true, true),
      ('ejecutivo', 'notifications', true, false),
      ('ejecutivo', 'team', true, false),
      ('ejecutivo', 'reports', true, false)
    ON CONFLICT (role, module_key) DO UPDATE SET
      can_view = EXCLUDED.can_view,
      can_manage = EXCLUDED.can_manage;
  END IF;
END $$;
