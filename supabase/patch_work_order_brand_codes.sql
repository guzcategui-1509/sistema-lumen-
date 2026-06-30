-- Lumen Workspace — codigos cortos por marca para ordenes nuevas
-- Ejecutar en Supabase SQL Editor despues de los patches base del piloto.
-- No modifica codigos historicos de work_orders.

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS abbreviation text;

CREATE UNIQUE INDEX IF NOT EXISTS brands_abbreviation_unique_idx
ON public.brands (upper(abbreviation))
WHERE abbreviation IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.work_order_brand_counters (
  brand_id uuid PRIMARY KEY REFERENCES public.brands(id) ON DELETE CASCADE,
  last_number integer NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_order_brand_counters_updated_at
ON public.work_order_brand_counters (updated_at);

UPDATE public.brands
SET abbreviation = CASE
  WHEN slug IN ('volkswagen-gt', 'volkswagen') OR lower(name) IN ('volkswagen', 'volkswagen gt') THEN 'VW'
  WHEN slug IN ('camiones-vw-gt', 'volkswagen-camiones', 'camiones-vw') OR lower(name) IN ('volkswagen camiones', 'camiones vw', 'camiones vw gt') THEN 'CVW'
  WHEN slug IN ('bestune-gt', 'bestune') OR lower(name) IN ('bestune', 'bestune gt') THEN 'BTN'
  WHEN slug IN ('jim-gt', 'jim') OR lower(name) IN ('jim', 'jim gt') THEN 'JIM'
  WHEN slug IN ('leap-gt', 'leap-motors', 'leap') OR lower(name) IN ('leap motors', 'leap gt', 'leap') THEN 'LPM'
  WHEN slug IN ('talleres-continental', 'talleres') OR lower(name) IN ('talleres continental motores', 'talleres') THEN 'TCM'
  WHEN slug IN ('repuestos-continental', 'repuestos') OR lower(name) IN ('repuestos continental motores', 'repuestos') THEN 'RCM'
  WHEN slug IN ('usados-continental', 'usados') OR lower(name) IN ('usados continental motores', 'usados') THEN 'USM'
  WHEN slug IN ('seguros-continental', 'seguros') OR lower(name) IN ('seguros continental motores', 'seguros y fianzas continental', 'seguros') THEN 'SCM'
  WHEN slug IN ('danone-gt', 'danone') OR lower(name) IN ('danone', 'danone gt') THEN 'DNE'
  WHEN slug IN ('danonino-gt', 'danonino') OR lower(name) IN ('danonino', 'danonino gt') THEN 'DNO'
  WHEN slug IN ('silk-gt', 'silk') OR lower(name) IN ('silk', 'silk gt') THEN 'SLK'
  WHEN slug IN ('bonafont-gt', 'bonafont') OR lower(name) IN ('bonafont', 'bonafont gt') THEN 'BNF'
  WHEN slug IN ('fundacion-listo', 'fundacion-listo-gt') OR lower(name) IN ('fundacion listo', 'fundación listo') THEN 'LST'
  WHEN slug IN ('solarsa-gt', 'solarsa') OR lower(name) IN ('solarsa', 'solarsa gt') THEN 'SLS'
  WHEN slug IN ('wash-and-go-gt', 'wash-go', 'wash-and-go') OR lower(name) IN ('wash&go', 'wash and go', 'wash and go gt') THEN 'WNG'
  WHEN slug IN ('rijk-zwaan', 'rijk-zwaan-gt') OR lower(name) IN ('rijk zwaan', 'rijk zwaan gt') THEN 'RJZ'
  WHEN slug = 'constructivos' OR lower(name) = 'constructivos' THEN 'CST'
  ELSE abbreviation
END
WHERE abbreviation IS NULL
  OR abbreviation = ''
  OR slug IN (
    'volkswagen-gt',
    'camiones-vw-gt',
    'bestune-gt',
    'jim-gt',
    'leap-gt',
    'talleres-continental',
    'repuestos-continental',
    'usados-continental',
    'seguros-continental',
    'danone-gt',
    'danonino-gt',
    'silk-gt',
    'bonafont-gt',
    'fundacion-listo',
    'solarsa-gt',
    'wash-and-go-gt',
    'wash-go',
    'rijk-zwaan',
    'constructivos'
  );

CREATE OR REPLACE FUNCTION public.brand_code_fallback(brand_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
  word text;
  initials text := '';
BEGIN
  cleaned := upper(regexp_replace(coalesce(brand_name, ''), '[^A-Za-z0-9 ]', ' ', 'g'));
  cleaned := regexp_replace(cleaned, '[[:space:]]+', ' ', 'g');
  cleaned := trim(cleaned);

  IF cleaned = '' THEN
    RETURN 'GEN';
  END IF;

  FOREACH word IN ARRAY regexp_split_to_array(cleaned, ' ')
  LOOP
    IF word <> '' THEN
      initials := initials || substr(word, 1, 1);
    END IF;
    EXIT WHEN length(initials) >= 3;
  END LOOP;

  IF initials = '' THEN
    RETURN 'GEN';
  END IF;

  RETURN substr(initials, 1, 3);
END;
$$;

WITH brand_prefixes AS (
  SELECT
    id,
    regexp_replace(
      upper(coalesce(nullif(trim(abbreviation), ''), public.brand_code_fallback(name))),
      '[^A-Z0-9]',
      '',
      'g'
    ) AS prefix
  FROM public.brands
),
existing_numbers AS (
  SELECT
    wo.brand_id,
    substring(wo.code from ('^' || bp.prefix || '-([0-9]+)$'))::integer AS code_number
  FROM public.work_orders wo
  JOIN brand_prefixes bp ON bp.id = wo.brand_id
  WHERE substring(wo.code from ('^' || bp.prefix || '-([0-9]+)$')) IS NOT NULL
)
INSERT INTO public.work_order_brand_counters (brand_id, last_number, updated_at)
SELECT brand_id, max(code_number), now()
FROM existing_numbers
GROUP BY brand_id
ON CONFLICT (brand_id)
DO UPDATE SET
  last_number = greatest(public.work_order_brand_counters.last_number, excluded.last_number),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.generate_work_order_code_for_brand(target_brand_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_row public.brands%ROWTYPE;
  next_number integer;
  prefix text;
BEGIN
  SELECT * INTO brand_row
  FROM public.brands
  WHERE id = target_brand_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'brand_not_found';
  END IF;

  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF NOT public.can_create_work_orders() OR NOT public.can_access_brand(target_brand_id) THEN
      RAISE EXCEPTION 'not_allowed_to_generate_work_order_code';
    END IF;
  END IF;

  prefix := upper(nullif(trim(brand_row.abbreviation), ''));
  IF prefix IS NULL THEN
    prefix := public.brand_code_fallback(brand_row.name);
  END IF;
  prefix := regexp_replace(prefix, '[^A-Z0-9]', '', 'g');
  IF prefix = '' THEN
    prefix := 'GEN';
  END IF;

  INSERT INTO public.work_order_brand_counters (brand_id, last_number, updated_at)
  VALUES (target_brand_id, 1, now())
  ON CONFLICT (brand_id)
  DO UPDATE SET
    last_number = public.work_order_brand_counters.last_number + 1,
    updated_at = now()
  RETURNING last_number INTO next_number;

  RETURN prefix || '-' || lpad(next_number::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_work_order_code_for_brand(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_work_order_code_for_brand(uuid) TO service_role;
