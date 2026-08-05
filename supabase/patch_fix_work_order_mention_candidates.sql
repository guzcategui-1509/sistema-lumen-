begin;

-- Normalize only semantic aliases. This does not grant a role any permission;
-- the access predicate below remains the authority for each work order.
create or replace function public.normalize_work_order_conversation_role(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $function$
  select case translate(lower(btrim(coalesce(value, ''))), 'áéíóúüñ', 'aeiouun')
    when 'administrador' then 'admin'
    when 'director' then 'directora'
    when 'direccion' then 'directora'
    when 'cuenta' then 'cuentas'
    when 'disenador' then 'disenador'
    when 'coordinador' then 'coordinacion'
    when 'coordinadora' then 'coordinacion'
    else translate(lower(btrim(coalesce(value, ''))), 'áéíóúüñ', 'aeiouun')
  end;
$function$;

-- Profile-scoped equivalent of can_access_work_order_conversation(). It is
-- private to server functions so candidate discovery and publish validation
-- use the same rule without relying on the caller's auth.uid().
create or replace function public.can_profile_access_work_order_conversation(
  target_profile_id uuid,
  target_work_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(exists (
    select 1
    from public.profiles profile
    join public.work_orders orders on orders.id = target_work_order_id
    where profile.id = target_profile_id
      and profile.is_active is true
      and public.normalize_work_order_conversation_role(profile.role::text) <> 'cliente'
      and (
        orders.created_by = profile.id
        or exists (
          select 1
          from public.work_order_assignees assignee
          where assignee.work_order_id = orders.id
            and assignee.user_id = profile.id
        )
        or exists (
          select 1
          from public.work_order_phases phase
          where phase.work_order_id = orders.id
            and phase.assigned_to = profile.id
        )
        or (
          public.normalize_work_order_conversation_role(profile.role::text)
            in ('admin', 'directora', 'cuentas', 'jefe', 'jefatura', 'coordinacion', 'ejecutivo')
          and (
            public.normalize_work_order_conversation_role(profile.role::text)
              in ('admin', 'directora')
            or exists (
              select 1
              from public.brand_memberships membership
              where membership.user_id = profile.id
                and membership.brand_id = orders.brand_id
            )
          )
        )
      )
  ), false);
$function$;

create or replace function public.can_access_work_order_conversation(
  target_work_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    auth.uid() is not null
    and public.can_profile_access_work_order_conversation(auth.uid(), target_work_order_id),
    false
  );
$function$;

create or replace function public.work_order_comment_mention_candidates_for(
  target_work_order_id uuid,
  target_actor_id uuid
)
returns table (
  id uuid,
  full_name text,
  role text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $function$
  with eligible_profiles as (
    select
      profile.id,
      profile.full_name,
      public.normalize_work_order_conversation_role(profile.role::text) as role,
      lower(btrim(profile.email)) as email,
      row_number() over (
        partition by lower(btrim(profile.email))
        order by profile.id
      ) as email_rank
    from public.profiles profile
    where profile.id <> target_actor_id
      and profile.is_active is true
      and public.normalize_work_order_conversation_role(profile.role::text) <> 'cliente'
      and profile.email is not null
      and btrim(profile.email) <> ''
      and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      and public.can_profile_access_work_order_conversation(profile.id, target_work_order_id)
  )
  select candidate.id, candidate.full_name, candidate.role, candidate.email
  from eligible_profiles candidate
  where candidate.email_rank = 1
  order by
    translate(lower(coalesce(candidate.full_name, '')), 'áéíóúüñ', 'aeiouun'),
    candidate.email,
    candidate.id;
$function$;

revoke all on function public.normalize_work_order_conversation_role(text)
  from public, anon, authenticated;
revoke all on function public.can_profile_access_work_order_conversation(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.work_order_comment_mention_candidates_for(uuid, uuid)
  from public, anon, authenticated;

-- Public entry points keep their existing authenticated-only grants.
revoke all on function public.can_access_work_order_conversation(uuid) from public, anon;
grant execute on function public.can_access_work_order_conversation(uuid) to authenticated;
revoke all on function public.list_work_order_comment_mention_candidates(uuid) from public, anon;
grant execute on function public.list_work_order_comment_mention_candidates(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
