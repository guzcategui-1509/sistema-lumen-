-- Lumen Workspace: author-only comment editing and structured phase mentions.
-- Apply after patch_work_order_comment_email_notifications.sql.

begin;

do $preflight$
declare
  missing_relation text;
begin
  foreach missing_relation in array array[
    'work_orders',
    'work_order_assignees',
    'work_order_phases',
    'work_order_comments',
    'work_order_comment_mentions',
    'work_order_phase_comments',
    'profiles',
    'brands',
    'email_notifications'
  ] loop
    if to_regclass('public.' || missing_relation) is null then
      raise exception 'required_relation_missing: public.%', missing_relation;
    end if;
  end loop;

  if to_regprocedure('public.can_access_work_order_conversation(uuid)') is null then
    raise exception 'can_access_work_order_conversation_required';
  end if;
  if to_regprocedure('public.work_order_comment_mention_candidates_for(uuid,uuid)') is null then
    raise exception 'work_order_comment_mention_candidates_for_required';
  end if;
  if to_regprocedure('public.resolve_work_order_notification_recipients(uuid)') is null then
    raise exception 'resolve_work_order_notification_recipients_required';
  end if;
  if to_regprocedure('public.render_work_order_comment_notification_email(text,text,text,text,text,timestamptz,text,text)') is null then
    raise exception 'render_work_order_comment_notification_email_required';
  end if;
  if to_regprocedure('public.add_work_order_phase_comment(uuid,text)') is null then
    raise exception 'add_work_order_phase_comment_v2_required';
  end if;
  if to_regprocedure('public.normalize_work_order_conversation_role(text)') is null then
    raise exception 'normalize_work_order_conversation_role_required';
  end if;
  if to_regprocedure('public.is_internal_user()') is null then
    raise exception 'is_internal_user_required';
  end if;
  if to_regprocedure('public.can_access_brand(uuid)') is null then
    raise exception 'can_access_brand_required';
  end if;
  if to_regprocedure('public.can_manage_work_orders()') is null then
    raise exception 'can_manage_work_orders_required';
  end if;
  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.email_notifications'::regclass
      and constraint_row.conname = 'email_notifications_event_key_key'
      and constraint_row.contype = 'u'
  ) then
    raise exception 'email_notifications_event_key_unique_required';
  end if;
  if not exists (
    select 1
    from pg_type type_row
    join pg_enum enum_row on enum_row.enumtypid = type_row.oid
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'public'
      and type_row.typname = 'email_notification_type'
      and enum_row.enumlabel = 'comment'
  ) then
    raise exception 'email_notification_type_comment_required';
  end if;
end;
$preflight$;

alter table public.work_order_comments
  add column if not exists edited_at timestamptz;

alter table public.work_order_phase_comments
  add column if not exists edited_at timestamptz;

create table if not exists public.work_order_phase_comment_mentions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null
    references public.work_order_phase_comments(id) on delete cascade,
  mentioned_user_id uuid not null
    references public.profiles(id) on delete restrict,
  mentioned_by_user_id uuid not null
    references public.profiles(id) on delete restrict,
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint work_order_phase_comment_mentions_comment_user_key
    unique (comment_id, mentioned_user_id),
  constraint work_order_phase_comment_mentions_event_key_key
    unique (event_key),
  constraint work_order_phase_comment_mentions_event_key_check
    check (
      event_key = 'work_order_phase_comment_mention:' || comment_id::text || ':' || mentioned_user_id::text
    )
);

create index if not exists work_order_phase_comment_mentions_inbox_idx
  on public.work_order_phase_comment_mentions(mentioned_user_id, read_at, created_at desc);

create index if not exists work_order_phase_comment_mentions_comment_idx
  on public.work_order_phase_comment_mentions(comment_id);

alter table public.work_order_phase_comment_mentions enable row level security;

drop policy if exists work_order_phase_comment_mentions_select_related
  on public.work_order_phase_comment_mentions;

create policy work_order_phase_comment_mentions_select_related
on public.work_order_phase_comment_mentions for select to authenticated
using (
  mentioned_user_id = auth.uid()
  or exists (
    select 1
    from public.work_order_phase_comments phase_comment
    where phase_comment.id = work_order_phase_comment_mentions.comment_id
      and public.can_access_work_order_conversation(phase_comment.work_order_id)
  )
);

revoke all privileges on table public.work_order_phase_comment_mentions
  from public, anon, authenticated;
grant select on table public.work_order_phase_comment_mentions to authenticated;

create or replace function public.queue_work_order_comment_mention_email(
  target_event_key text,
  target_work_order_id uuid,
  target_recipient_user_id uuid,
  target_actor_user_id uuid,
  target_message text,
  target_created_at timestamptz,
  target_comment_id uuid default null,
  target_phase_id uuid default null,
  target_phase_comment_id uuid default null,
  target_phase_name text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  order_row public.work_orders%rowtype;
  recipient_email text;
  actor_name text;
  brand_name text;
  work_order_url text;
  email_subject text;
  email_html_body text;
  inserted_count integer := 0;
begin
  select orders.* into order_row
  from public.work_orders orders
  where orders.id = target_work_order_id;
  if not found then
    raise exception 'work_order_not_found';
  end if;

  select lower(btrim(profile.email)) into recipient_email
  from public.profiles profile
  where profile.id = target_recipient_user_id
    and profile.is_active is true
    and public.normalize_work_order_conversation_role(profile.role::text) is distinct from 'cliente'
    and profile.email is not null
    and btrim(profile.email) <> ''
    and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';
  if recipient_email is null then
    return 0;
  end if;

  select profile.full_name into actor_name
  from public.profiles profile
  where profile.id = target_actor_user_id;

  select brand.name into brand_name
  from public.brands brand
  where brand.id = order_row.brand_id;

  work_order_url := 'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') || '&ot=' || coalesce(order_row.code, '');
  if target_phase_id is not null then
    work_order_url := work_order_url || '&phase=' || target_phase_id::text;
  end if;
  if target_phase_comment_id is not null then
    work_order_url := work_order_url || '&phase_comment=' || target_phase_comment_id::text;
  elsif target_comment_id is not null then
    work_order_url := work_order_url || '&comment=' || target_comment_id::text;
  end if;

  email_subject := regexp_replace(
    'Te mencionaron en ' || coalesce(order_row.code, '') ||
      case when nullif(btrim(target_phase_name), '') is null then '' else ' · ' || target_phase_name end,
    E'[\r\n]+', ' ', 'g'
  );
  email_html_body := public.render_work_order_comment_notification_email(
    order_row.code,
    order_row.title,
    brand_name,
    actor_name,
    target_message,
    target_created_at,
    work_order_url,
    target_phase_name
  );

  insert into public.email_notifications (
    brand_id,
    work_order_id,
    recipient_user_id,
    recipient_email,
    notification_type,
    subject,
    html_body,
    status,
    scheduled_for,
    error_message,
    event_key
  ) values (
    order_row.brand_id,
    order_row.id,
    target_recipient_user_id,
    recipient_email,
    'comment'::public.email_notification_type,
    email_subject,
    email_html_body,
    'queued',
    now(),
    null,
    target_event_key
  )
  on conflict (event_key) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$;

revoke all on function public.queue_work_order_comment_mention_email(
  text,uuid,uuid,uuid,text,timestamptz,uuid,uuid,uuid,text
) from public, anon, authenticated;

create or replace function public.update_work_order_comment(
  target_comment_id uuid,
  target_body text,
  target_mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns table (
  comment_id uuid,
  message text,
  created_at timestamptz,
  updated_at timestamptz,
  edited_at timestamptz,
  mentioned_user_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  cleaned_body text := btrim(coalesce(target_body, ''));
  comment_row public.work_order_comments%rowtype;
  order_row public.work_orders%rowtype;
  normalized_mention_ids uuid[] := '{}'::uuid[];
  validated_mention_ids uuid[] := '{}'::uuid[];
  inserted_mention record;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para editar un comentario.' using errcode = '42501';
  end if;
  if cleaned_body = '' or char_length(cleaned_body) > 4000 then
    raise exception 'El comentario debe contener entre 1 y 4000 caracteres.' using errcode = '22023';
  end if;

  select comment.* into comment_row
  from public.work_order_comments comment
  where comment.id = target_comment_id;
  if not found then
    raise exception 'No se encontró el comentario.' using errcode = 'P0002';
  end if;
  if comment_row.author_user_id <> actor_id then
    raise exception 'Solo el autor puede editar este comentario.' using errcode = '42501';
  end if;

  select orders.* into order_row
  from public.work_orders orders
  where orders.id = comment_row.work_order_id
    and public.can_access_work_order_conversation(orders.id)
  for share;
  if not found then
    raise exception 'No tienes acceso a esta conversación.' using errcode = '42501';
  end if;
  if order_row.archived_at is not null then
    raise exception 'La conversación de una orden archivada es de solo lectura.' using errcode = '55000';
  end if;

  select comment.* into comment_row
  from public.work_order_comments comment
  where comment.id = target_comment_id
    and comment.work_order_id = order_row.id
    and comment.author_user_id = actor_id
  for update;
  if not found then
    raise exception 'El comentario cambió mientras intentabas editarlo.' using errcode = '40001';
  end if;

  select coalesce(array_agg(distinct requested.user_id order by requested.user_id), '{}'::uuid[])
  into normalized_mention_ids
  from unnest(coalesce(target_mentioned_user_ids, '{}'::uuid[])) requested(user_id)
  where requested.user_id is not null and requested.user_id <> actor_id;

  select coalesce(array_agg(requested.user_id order by requested.user_id), '{}'::uuid[])
  into validated_mention_ids
  from unnest(normalized_mention_ids) requested(user_id)
  where exists (
      select 1
      from public.work_order_comment_mention_candidates_for(comment_row.work_order_id, actor_id) candidate
      where candidate.id = requested.user_id
    )
    or exists (
      select 1
      from public.work_order_comment_mentions existing
      where existing.comment_id = comment_row.id
        and existing.mentioned_user_id = requested.user_id
    );
  if cardinality(validated_mention_ids) <> cardinality(normalized_mention_ids) then
    raise exception 'Una o más menciones no están autorizadas para esta orden.' using errcode = '42501';
  end if;

  update public.work_order_comments comment
  set message = cleaned_body,
      updated_at = now(),
      edited_at = now()
  where comment.id = comment_row.id
  returning * into comment_row;

  delete from public.work_order_comment_mentions mention
  where mention.comment_id = comment_row.id
    and not (mention.mentioned_user_id = any(validated_mention_ids));

  for inserted_mention in
    insert into public.work_order_comment_mentions (
      comment_id, mentioned_user_id, mentioned_by_user_id, event_key
    )
    select comment_row.id, mention_id, actor_id,
      'work_order_comment_mention:' || comment_row.id::text || ':' || mention_id::text
    from unnest(validated_mention_ids) mention_id
    on conflict on constraint work_order_comment_mentions_comment_user_key do nothing
    returning mentioned_user_id, event_key
  loop
    perform public.queue_work_order_comment_mention_email(
      inserted_mention.event_key,
      comment_row.work_order_id,
      inserted_mention.mentioned_user_id,
      actor_id,
      comment_row.message,
      comment_row.updated_at,
      comment_row.id,
      null,
      null,
      null
    );
  end loop;

  return query
  select comment_row.id, comment_row.message, comment_row.created_at, comment_row.updated_at,
    comment_row.edited_at,
    validated_mention_ids;
end;
$function$;

create or replace function public.update_work_order_phase_comment(
  target_comment_id uuid,
  target_body text,
  target_mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns table (
  comment_id uuid,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  edited_at timestamptz,
  mentioned_user_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  cleaned_body text := btrim(coalesce(target_body, ''));
  comment_row public.work_order_phase_comments%rowtype;
  order_row public.work_orders%rowtype;
  phase_row public.work_order_phases%rowtype;
  normalized_mention_ids uuid[] := '{}'::uuid[];
  validated_mention_ids uuid[] := '{}'::uuid[];
  inserted_mention record;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para editar un comentario.' using errcode = '42501';
  end if;
  if cleaned_body = '' or char_length(cleaned_body) > 2000 then
    raise exception 'El comentario debe contener entre 1 y 2000 caracteres.' using errcode = '22023';
  end if;

  select comment.* into comment_row
  from public.work_order_phase_comments comment
  where comment.id = target_comment_id;
  if not found then
    raise exception 'No se encontró el comentario de fase.' using errcode = 'P0002';
  end if;
  if comment_row.author_id <> actor_id then
    raise exception 'Solo el autor puede editar este comentario.' using errcode = '42501';
  end if;

  select orders.* into order_row
  from public.work_orders orders
  where orders.id = comment_row.work_order_id
    and public.can_access_work_order_conversation(orders.id)
  for share;
  if not found then
    raise exception 'No tienes acceso a esta orden.' using errcode = '42501';
  end if;
  if order_row.archived_at is not null then
    raise exception 'Los comentarios de una orden archivada son de solo lectura.' using errcode = '55000';
  end if;

  select comment.* into comment_row
  from public.work_order_phase_comments comment
  where comment.id = target_comment_id
    and comment.work_order_id = order_row.id
    and comment.author_id = actor_id
  for update;
  if not found then
    raise exception 'El comentario cambió mientras intentabas editarlo.' using errcode = '40001';
  end if;

  select phase.* into phase_row
  from public.work_order_phases phase
  where phase.id = comment_row.phase_id
    and phase.work_order_id = comment_row.work_order_id;
  if not found then
    raise exception 'No se encontró la fase del comentario.' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct requested.user_id order by requested.user_id), '{}'::uuid[])
  into normalized_mention_ids
  from unnest(coalesce(target_mentioned_user_ids, '{}'::uuid[])) requested(user_id)
  where requested.user_id is not null and requested.user_id <> actor_id;

  select coalesce(array_agg(requested.user_id order by requested.user_id), '{}'::uuid[])
  into validated_mention_ids
  from unnest(normalized_mention_ids) requested(user_id)
  where exists (
      select 1
      from public.work_order_comment_mention_candidates_for(comment_row.work_order_id, actor_id) candidate
      where candidate.id = requested.user_id
    )
    or exists (
      select 1
      from public.work_order_phase_comment_mentions existing
      where existing.comment_id = comment_row.id
        and existing.mentioned_user_id = requested.user_id
    );
  if cardinality(validated_mention_ids) <> cardinality(normalized_mention_ids) then
    raise exception 'Una o más menciones no están autorizadas para esta orden.' using errcode = '42501';
  end if;

  update public.work_order_phase_comments comment
  set body = cleaned_body,
      updated_at = now(),
      edited_at = now()
  where comment.id = comment_row.id
  returning * into comment_row;

  delete from public.work_order_phase_comment_mentions mention
  where mention.comment_id = comment_row.id
    and not (mention.mentioned_user_id = any(validated_mention_ids));

  for inserted_mention in
    insert into public.work_order_phase_comment_mentions (
      comment_id, mentioned_user_id, mentioned_by_user_id, event_key
    )
    select comment_row.id, mention_id, actor_id,
      'work_order_phase_comment_mention:' || comment_row.id::text || ':' || mention_id::text
    from unnest(validated_mention_ids) mention_id
    on conflict on constraint work_order_phase_comment_mentions_comment_user_key do nothing
    returning mentioned_user_id, event_key
  loop
    perform public.queue_work_order_comment_mention_email(
      inserted_mention.event_key,
      comment_row.work_order_id,
      inserted_mention.mentioned_user_id,
      actor_id,
      comment_row.body,
      comment_row.updated_at,
      null,
      phase_row.id,
      comment_row.id,
      phase_row.title
    );
  end loop;

  return query
  select comment_row.id, comment_row.body, comment_row.created_at, comment_row.updated_at,
    comment_row.edited_at,
    validated_mention_ids;
end;
$function$;

create or replace function public.add_work_order_phase_comment(
  target_phase_id uuid,
  comment_body text,
  mentioned_user_ids uuid[]
)
returns table (
  id uuid,
  work_order_id uuid,
  phase_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  created_mention_user_ids uuid[]
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  phase_row public.work_order_phases%rowtype;
  order_row public.work_orders%rowtype;
  comment_row public.work_order_phase_comments%rowtype;
  cleaned_body text := btrim(coalesce(comment_body, ''));
  normalized_mention_ids uuid[] := '{}'::uuid[];
  validated_mention_ids uuid[] := '{}'::uuid[];
  actor_name text;
  brand_name text;
  email_subject text;
  email_html_body text;
  work_order_url text;
  queued_count integer := 0;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para comentar una fase.' using errcode = '42501';
  end if;
  if cleaned_body = '' or char_length(cleaned_body) > 2000 then
    raise exception 'El comentario debe contener entre 1 y 2000 caracteres.' using errcode = '22023';
  end if;

  select phase.* into phase_row
  from public.work_order_phases phase
  where phase.id = target_phase_id
  for share;
  if not found then
    raise exception 'work_order_phase_not_found';
  end if;

  select orders.* into order_row
  from public.work_orders orders
  where orders.id = phase_row.work_order_id
  for update;
  if not found or not public.can_access_brand(order_row.brand_id) then
    raise exception 'not_allowed_to_access_phase' using errcode = '42501';
  end if;
  if order_row.archived_at is not null then
    raise exception 'not_allowed_to_comment_archived_order_phase' using errcode = '55000';
  end if;
  if not (public.can_manage_work_orders() or phase_row.assigned_to = actor_id) then
    raise exception 'not_allowed_to_comment_phase' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct requested.user_id order by requested.user_id), '{}'::uuid[])
  into normalized_mention_ids
  from unnest(coalesce(mentioned_user_ids, '{}'::uuid[])) requested(user_id)
  where requested.user_id is not null and requested.user_id <> actor_id;

  select coalesce(array_agg(candidate.id order by candidate.id), '{}'::uuid[])
  into validated_mention_ids
  from public.work_order_comment_mention_candidates_for(order_row.id, actor_id) candidate
  where candidate.id = any(normalized_mention_ids);
  if cardinality(validated_mention_ids) <> cardinality(normalized_mention_ids) then
    raise exception 'Una o más menciones no están autorizadas para esta orden.' using errcode = '42501';
  end if;

  insert into public.work_order_phase_comments (
    work_order_id, phase_id, author_id, body
  ) values (
    phase_row.work_order_id, phase_row.id, actor_id, cleaned_body
  ) returning * into comment_row;

  insert into public.work_order_phase_comment_mentions (
    comment_id, mentioned_user_id, mentioned_by_user_id, event_key
  )
  select comment_row.id, mention_id, actor_id,
    'work_order_phase_comment_mention:' || comment_row.id::text || ':' || mention_id::text
  from unnest(validated_mention_ids) mention_id
  on conflict on constraint work_order_phase_comment_mentions_comment_user_key do nothing;

  select profile.full_name into actor_name
  from public.profiles profile where profile.id = actor_id;
  select brand.name into brand_name
  from public.brands brand where brand.id = order_row.brand_id;

  work_order_url := 'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') || '&ot=' || coalesce(order_row.code, '') ||
    '&phase=' || phase_row.id::text || '&phase_comment=' || comment_row.id::text;
  email_subject := regexp_replace(
    'Nuevo comentario en ' || coalesce(order_row.code, '') || ' · ' || coalesce(phase_row.title, ''),
    E'[\r\n]+', ' ', 'g'
  );
  email_html_body := public.render_work_order_comment_notification_email(
    order_row.code, order_row.title, brand_name, actor_name, cleaned_body,
    comment_row.created_at, work_order_url, phase_row.title
  );

  with candidates as (
    select recipient.recipient_user_id, recipient.recipient_email,
      recipient.recipient_name, recipient.source_priority
    from public.resolve_work_order_notification_recipients(order_row.id) recipient
    union all
    select profile.id, lower(btrim(profile.email)), profile.full_name, 1
    from unnest(validated_mention_ids) mention_id
    join public.profiles profile on profile.id = mention_id
    where profile.is_active is true
      and public.normalize_work_order_conversation_role(profile.role::text) is distinct from 'cliente'
      and profile.email is not null
      and btrim(profile.email) <> ''
      and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ), ranked as (
    select candidate.*,
      row_number() over (
        partition by candidate.recipient_email
        order by candidate.source_priority, candidate.recipient_user_id
      ) as email_rank
    from candidates candidate
  ), inserted as (
    insert into public.email_notifications (
      brand_id, work_order_id, recipient_user_id, recipient_email,
      notification_type, subject, html_body, status, scheduled_for,
      error_message, event_key
    )
    select order_row.brand_id, order_row.id, recipient.recipient_user_id,
      recipient.recipient_email, 'comment'::public.email_notification_type,
      email_subject, email_html_body, 'queued', now(), null,
      'work_order_phase_comment:' || comment_row.id::text || ':' || recipient.recipient_user_id::text
    from ranked recipient
    where recipient.email_rank = 1
    on conflict (event_key) do nothing
    returning id
  )
  select count(*) into queued_count from inserted;

  insert into public.work_order_activity (work_order_id, actor_id, action, details)
  values (
    phase_row.work_order_id,
    actor_id,
    'phase_comment_added',
    jsonb_build_object(
      'phase_id', phase_row.id,
      'phase_key', phase_row.phase_key,
      'title', phase_row.title,
      'comment_id', comment_row.id,
      'mentioned_user_ids', to_jsonb(validated_mention_ids),
      'queued_notification_count', queued_count
    )
  );

  return query
  select comment_row.id, comment_row.work_order_id, comment_row.phase_id,
    comment_row.author_id, comment_row.body, comment_row.created_at,
    comment_row.updated_at, validated_mention_ids;
end;
$function$;

create or replace function public.list_my_work_order_mentions(
  page_size integer default 30,
  before_created_at timestamptz default null
)
returns table (
  mention_id uuid,
  mention_kind text,
  comment_id uuid,
  work_order_id uuid,
  work_order_code text,
  work_order_title text,
  brand_id uuid,
  phase_id uuid,
  phase_title text,
  author_user_id uuid,
  author_name text,
  author_role text,
  message_excerpt text,
  created_at timestamptz,
  read_at timestamptz,
  archived_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null or not public.is_internal_user() then
    raise exception 'No tienes acceso a menciones.' using errcode = '42501';
  end if;

  return query
  with mention_rows (
    mention_id,
    mention_kind,
    comment_id,
    work_order_id,
    work_order_code,
    work_order_title,
    brand_id,
    phase_id,
    phase_title,
    author_user_id,
    author_name,
    author_role,
    message_excerpt,
    created_at,
    read_at,
    archived_at
  ) as (
    select mention.id, 'conversation'::text, comment.id,
      orders.id, orders.code, orders.title, orders.brand_id,
      null::uuid, null::text,
      author.id, author.full_name, author.role::text,
      left(comment.message, 220), mention.created_at, mention.read_at, orders.archived_at
    from public.work_order_comment_mentions mention
    join public.work_order_comments comment on comment.id = mention.comment_id
    join public.work_orders orders on orders.id = comment.work_order_id
    join public.profiles author on author.id = mention.mentioned_by_user_id
    where mention.mentioned_user_id = actor_id

    union all

    select mention.id, 'phase'::text, comment.id,
      orders.id, orders.code, orders.title, orders.brand_id,
      phase.id, phase.title,
      author.id, author.full_name, author.role::text,
      left(comment.body, 220), mention.created_at, mention.read_at, orders.archived_at
    from public.work_order_phase_comment_mentions mention
    join public.work_order_phase_comments comment on comment.id = mention.comment_id
    join public.work_order_phases phase on phase.id = comment.phase_id
    join public.work_orders orders on orders.id = comment.work_order_id
    join public.profiles author on author.id = mention.mentioned_by_user_id
    where mention.mentioned_user_id = actor_id
  )
  select rows.*
  from mention_rows rows
  where before_created_at is null or rows.created_at < before_created_at
  order by rows.created_at desc, rows.mention_id desc
  limit greatest(1, least(coalesce(page_size, 30), 100));
end;
$function$;

create or replace function public.mark_work_order_mention_read(
  target_mention_id uuid,
  target_mention_kind text
)
returns table (mention_id uuid, read_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  normalized_kind text := lower(btrim(coalesce(target_mention_kind, '')));
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;

  if normalized_kind = 'phase' then
    return query
    update public.work_order_phase_comment_mentions mention
    set read_at = coalesce(mention.read_at, now())
    where mention.id = target_mention_id
      and mention.mentioned_user_id = actor_id
    returning mention.id, mention.read_at;
  elsif normalized_kind = 'conversation' then
    return query
    update public.work_order_comment_mentions mention
    set read_at = coalesce(mention.read_at, now())
    where mention.id = target_mention_id
      and mention.mentioned_user_id = actor_id
    returning mention.id, mention.read_at;
  else
    raise exception 'Tipo de mención inválido.' using errcode = '22023';
  end if;

  if not found then
    raise exception 'La mención no existe o no te pertenece.' using errcode = '42501';
  end if;
end;
$function$;

revoke all on function public.update_work_order_comment(uuid,text,uuid[]) from public, anon;
revoke all on function public.update_work_order_phase_comment(uuid,text,uuid[]) from public, anon;
revoke all on function public.add_work_order_phase_comment(uuid,text,uuid[]) from public, anon;
revoke all on function public.list_my_work_order_mentions(integer,timestamptz) from public, anon;
revoke all on function public.mark_work_order_mention_read(uuid,text) from public, anon;

grant execute on function public.update_work_order_comment(uuid,text,uuid[]) to authenticated;
grant execute on function public.update_work_order_phase_comment(uuid,text,uuid[]) to authenticated;
grant execute on function public.add_work_order_phase_comment(uuid,text,uuid[]) to authenticated;
grant execute on function public.list_my_work_order_mentions(integer,timestamptz) to authenticated;
grant execute on function public.mark_work_order_mention_read(uuid,text) to authenticated;

notify pgrst, 'reload schema';

commit;
