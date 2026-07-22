-- Lumen Workspace: agregar/normalizar marcas 212, Wuling, Rijk Zwaan e IOOI.
-- Seguro/idempotente: no borra datos, no toca ordenes, fases, usuarios ni memberships.
-- 212 y Wuling pertenecen a Continental Motores.
-- Rijk Zwaan e IOOI pertenecen al grupo/cliente Lumen.
--
-- Importante: este patch resuelve marcas existentes por upper(abbreviation)
-- y por slug. No usa solo ON CONFLICT (slug), porque produccion tiene
-- brands_abbreviation_unique_idx sobre upper(abbreviation).

alter table public.brands
add column if not exists abbreviation text;

alter table public.brands
add column if not exists posts_per_month integer default 10;

alter table public.brands
add column if not exists canva_folder_url text;

do $$
declare
  brand record;
  target_client_id uuid;
  existing_brand_id uuid;
begin
  for brand in
    select *
    from (
      values
        (
          'continental',
          '212',
          '212-continental',
          '212',
          '#2d2d2d',
          ARRAY['Facebook','Instagram']::text[],
          ARRAY['Publicacion','Comunidad','Reporteria','Pauta Meta']::text[],
          10,
          'Continental / 212'
        ),
        (
          'continental',
          'Wuling',
          'wuling-continental',
          'WLG',
          '#166274',
          ARRAY['Facebook','Instagram','TikTok']::text[],
          ARRAY['Publicacion','Comunidad','Reporteria','Pauta Meta']::text[],
          10,
          'Continental / Wuling'
        ),
        (
          'lumen',
          'Rijk Zwaan',
          'rijk-zwaan',
          'RJZ',
          '#3f7060',
          ARRAY['Facebook','Instagram']::text[],
          ARRAY['Publicacion','Comunidad','Reporteria']::text[],
          10,
          'Lumen / Rijk Zwaan'
        ),
        (
          'lumen',
          'IOOI',
          'iooi',
          'IOOI',
          '#7356a6',
          ARRAY['Facebook','Instagram']::text[],
          ARRAY['Publicacion','Comunidad','Reporteria']::text[],
          10,
          'Lumen / IOOI'
        )
    ) as b(
      client_slug,
      name,
      slug,
      abbreviation,
      color_primary,
      platforms,
      services,
      posts_per_month,
      canva_folder_url
    )
  loop
    select c.id
      into target_client_id
    from public.clients c
    where c.slug = brand.client_slug
    limit 1;

    if target_client_id is null then
      raise notice 'Cliente % no existe; se omite marca %', brand.client_slug, brand.name;
      continue;
    end if;

    -- Prioridad: si ya existe la abreviacion, esa es la fila canonica.
    -- Si no existe por abreviacion, usar slug. Esto evita el choque con
    -- brands_abbreviation_unique_idx en marcas como 212.
    select b.id
      into existing_brand_id
    from public.brands b
    where upper(coalesce(b.abbreviation, '')) = upper(brand.abbreviation)
    limit 1;

    if existing_brand_id is null then
      select b.id
        into existing_brand_id
      from public.brands b
      where b.slug = brand.slug
      limit 1;
    end if;

    if existing_brand_id is not null then
      update public.brands b
      set
        client_id = target_client_id,
        name = brand.name,
        slug = case
          when exists (
            select 1
            from public.brands other
            where other.slug = brand.slug
              and other.id <> existing_brand_id
          ) then b.slug
          else brand.slug
        end,
        abbreviation = case
          when exists (
            select 1
            from public.brands other
            where upper(coalesce(other.abbreviation, '')) = upper(brand.abbreviation)
              and other.id <> existing_brand_id
          ) then b.abbreviation
          else brand.abbreviation
        end,
        color_primary = brand.color_primary,
        platforms = brand.platforms,
        services = brand.services,
        posts_per_month = brand.posts_per_month,
        canva_folder_url = brand.canva_folder_url,
        is_active = true,
        updated_at = now()
      where b.id = existing_brand_id;
    else
      insert into public.brands (
        client_id,
        name,
        slug,
        abbreviation,
        color_primary,
        platforms,
        services,
        posts_per_month,
        canva_folder_url,
        is_active
      )
      values (
        target_client_id,
        brand.name,
        brand.slug,
        brand.abbreviation,
        brand.color_primary,
        brand.platforms,
        brand.services,
        brand.posts_per_month,
        brand.canva_folder_url,
        true
      );
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.work_order_brand_counters') is not null then
    insert into public.work_order_brand_counters (brand_id, last_number, updated_at)
    select b.id, 0, now()
    from public.brands b
    where b.slug in ('212-continental', 'wuling-continental', 'rijk-zwaan', 'iooi')
       or upper(coalesce(b.abbreviation, '')) in ('212', 'WLG', 'RJZ', 'IOOI')
    on conflict (brand_id) do nothing;
  else
    raise notice 'public.work_order_brand_counters no existe; se omite inicializacion de contadores.';
  end if;
end $$;

-- Verificacion:
-- select c.name as cliente, b.name, b.slug, b.abbreviation, b.is_active
-- from public.brands b
-- join public.clients c on c.id = b.client_id
-- where b.slug in ('212-continental', 'wuling-continental', 'rijk-zwaan', 'iooi')
--    or upper(coalesce(b.abbreviation, '')) in ('212', 'WLG', 'RJZ', 'IOOI')
-- order by c.name, b.name;
