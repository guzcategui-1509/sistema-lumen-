begin;

do $preflight$
begin
  if to_regclass('public.brands') is null
    or to_regclass('public.clients') is null
    or to_regclass('public.profiles') is null
    or to_regclass('public.brand_memberships') is null then
    raise exception 'Faltan tablas requeridas para crear marcas.';
  end if;

  if to_regprocedure('public.normalize_work_order_conversation_role(text)') is null then
    raise exception 'Falta el normalizador canónico de roles.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brands'
      and column_name = 'abbreviation'
  ) then
    raise exception 'Falta public.brands.abbreviation.';
  end if;
end;
$preflight$;

create or replace function public.create_brand(
  target_name text,
  target_client_id uuid,
  target_abbreviation text
)
returns table (
  id uuid,
  client_id uuid,
  name text,
  slug text,
  abbreviation text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  membership_created boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  normalized_name text;
  comparable_name text;
  normalized_abbreviation text;
  generated_slug text;
  created_brand public.brands%rowtype;
  created_membership boolean := false;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para crear una marca.';
  end if;

  select public.normalize_work_order_conversation_role(profile.role::text)
  into actor_role
  from public.profiles profile
  where profile.id = actor_id
    and profile.is_active is true
  for share;

  if actor_role is null then
    raise exception 'Tu perfil no está activo o no existe.';
  end if;

  if actor_role not in ('admin', 'directora', 'cuentas', 'ejecutivo') then
    raise exception 'No tienes permiso para crear marcas.';
  end if;

  normalized_name := pg_catalog.regexp_replace(
    pg_catalog.btrim(coalesce(target_name, '')),
    '[[:space:]]+',
    ' ',
    'g'
  );
  comparable_name := pg_catalog.translate(
    pg_catalog.lower(normalized_name),
    'áéíóúüñ',
    'aeiouun'
  );
  normalized_abbreviation := pg_catalog.upper(pg_catalog.btrim(coalesce(target_abbreviation, '')));
  generated_slug := pg_catalog.btrim(
    pg_catalog.regexp_replace(comparable_name, '[^a-z0-9]+', '-', 'g'),
    '-'
  );

  if normalized_name = '' or pg_catalog.char_length(normalized_name) > 120 then
    raise exception 'Escribe un nombre de marca válido.';
  end if;

  if normalized_abbreviation !~ '^[A-Z0-9]{2,4}$' then
    raise exception 'El código debe contener de 2 a 4 letras o números.';
  end if;

  if generated_slug = '' then
    raise exception 'No se pudo generar un slug válido para la marca.';
  end if;

  if target_client_id is null or not exists (
    select 1
    from public.clients client
    where client.id = target_client_id
  ) then
    raise exception 'El cliente seleccionado no existe.';
  end if;

  -- Brand creation is infrequent. This transaction lock makes the normalized
  -- name, slug, and abbreviation checks atomic across concurrent creators.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('public.create_brand'));

  if exists (
    select 1
    from public.brands brand
    where pg_catalog.translate(
      pg_catalog.lower(
        pg_catalog.regexp_replace(pg_catalog.btrim(brand.name), '[[:space:]]+', ' ', 'g')
      ),
      'áéíóúüñ',
      'aeiouun'
    ) = comparable_name
  ) then
    raise exception 'Ya existe una marca con ese nombre.';
  end if;

  if exists (
    select 1
    from public.brands brand
    where pg_catalog.lower(pg_catalog.btrim(brand.slug)) = generated_slug
  ) then
    raise exception 'El slug generado ya existe.';
  end if;

  if exists (
    select 1
    from public.brands brand
    where pg_catalog.upper(pg_catalog.btrim(brand.abbreviation)) = normalized_abbreviation
  ) then
    raise exception 'El código % ya está en uso.', normalized_abbreviation;
  end if;

  insert into public.brands (
    client_id,
    name,
    slug,
    abbreviation,
    is_active
  )
  values (
    target_client_id,
    normalized_name,
    generated_slug,
    normalized_abbreviation,
    true
  )
  returning * into created_brand;

  if actor_role in ('cuentas', 'ejecutivo') then
    insert into public.brand_memberships (user_id, brand_id, role)
    values (actor_id, created_brand.id, actor_role::public.app_role);
    created_membership := true;
  end if;

  return query
  select
    created_brand.id,
    created_brand.client_id,
    created_brand.name,
    created_brand.slug,
    created_brand.abbreviation,
    created_brand.is_active,
    created_brand.created_at,
    created_brand.updated_at,
    created_membership;
end;
$function$;

revoke all on function public.create_brand(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_brand(text, uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
