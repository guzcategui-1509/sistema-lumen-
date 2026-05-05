-- Paso 1: ampliar roles disponibles.
-- Ejecutar este archivo primero en Supabase SQL Editor.
-- Luego ejecutar patch_roles_brands_step2.sql.

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cuentas';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'medios';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'generador';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'operaciones';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ejecutivo';
