-- Lumen Workspace: structured mentions for work-order conversations.
-- Adds a personal in-app inbox and queues one server-generated email per mention.

begin;

do $preflight$
declare
  notification_udt text;
begin
  if to_regclass('public.work_order_comments') is null then
    raise exception 'work_order_comments_required';
  end if;
  if to_regclass('public.email_notifications') is null then
    raise exception 'email_notifications_required';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_active'
  ) then
    raise exception 'profiles_is_active_required';
  end if;
  if to_regprocedure('public.create_work_order_comment(uuid,text,text,boolean,uuid)') is null
     and to_regprocedure('public.create_work_order_comment(uuid,text,text,boolean,uuid,uuid[])') is null then
    raise exception 'create_work_order_comment_v1_required';
  end if;
  if to_regprocedure('public.can_access_work_order_conversation(uuid)') is null then
    raise exception 'conversation_access_function_required';
  end if;

  select schema_column.udt_name
  into notification_udt
  from information_schema.columns schema_column
  where schema_column.table_schema = 'public'
    and schema_column.table_name = 'email_notifications'
    and schema_column.column_name = 'notification_type';

  if notification_udt = 'email_notification_type'
     and not exists (
       select 1
       from pg_type type
       join pg_enum enum_value on enum_value.enumtypid = type.oid
       join pg_namespace namespace on namespace.oid = type.typnamespace
       where namespace.nspname = 'public'
         and type.typname = 'email_notification_type'
         and enum_value.enumlabel = 'comment'
     ) then
    raise exception 'email_notification_type_comment_required';
  end if;
end;
$preflight$;

alter table public.email_notifications
  add column if not exists event_key text;

do $event_key_constraint$
begin
  if exists (
    select 1
    from public.email_notifications
    where event_key is not null
    group by event_key
    having count(*) > 1
  ) then
    raise exception 'duplicate_email_notification_event_keys';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.email_notifications'::regclass
      and conname = 'email_notifications_event_key_key'
  ) then
    alter table public.email_notifications
      add constraint email_notifications_event_key_key unique (event_key);
  end if;
end;
$event_key_constraint$;

create table if not exists public.work_order_comment_mentions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null
    references public.work_order_comments(id) on delete cascade,
  mentioned_user_id uuid not null
    references public.profiles(id) on delete restrict,
  mentioned_by_user_id uuid not null
    references public.profiles(id) on delete restrict,
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint work_order_comment_mentions_comment_user_key
    unique (comment_id, mentioned_user_id),
  constraint work_order_comment_mentions_event_key_key
    unique (event_key),
  constraint work_order_comment_mentions_event_key_check
    check (
      event_key = 'work_order_comment_mention:' || comment_id::text || ':' || mentioned_user_id::text
    )
);

create index if not exists work_order_comment_mentions_inbox_idx
  on public.work_order_comment_mentions(mentioned_user_id, read_at, created_at desc);

create index if not exists work_order_comment_mentions_comment_idx
  on public.work_order_comment_mentions(comment_id);

create or replace function public.escape_work_order_comment_mention_email_html(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $function$
  select replace(replace(replace(replace(replace(
    coalesce(value, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;');
$function$;

-- The private helper is the single source of truth used by both public RPCs.
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
  with target_order as (
    select wo.id, wo.brand_id, wo.created_by
    from public.work_orders wo
    where wo.id = target_work_order_id
  ), related_users as (
    select target_order.created_by as user_id from target_order
    union
    select assignee.user_id
    from public.work_order_assignees assignee
    where assignee.work_order_id = target_work_order_id
    union
    select phase.assigned_to
    from public.work_order_phases phase
    where phase.work_order_id = target_work_order_id and phase.assigned_to is not null
    union
    select manager.id
    from target_order
    join public.profiles manager on manager.role::text in ('admin', 'directora', 'cuentas')
    where manager.role::text in ('admin', 'directora')
       or exists (
         select 1 from public.brand_memberships membership
         where membership.user_id = manager.id
           and membership.brand_id = target_order.brand_id
       )
  )
  select profile.id, profile.full_name, profile.role::text, lower(btrim(profile.email))
  from related_users related
  join public.profiles profile on profile.id = related.user_id
  where profile.id <> target_actor_id
    and profile.is_active is true
    and profile.role::text <> 'cliente'
    and profile.email is not null
    and btrim(profile.email) <> ''
    and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  order by profile.full_name, profile.id;
$function$;

create or replace function public.list_work_order_comment_mention_candidates(
  target_work_order_id uuid
)
returns table (id uuid, full_name text, role text, email text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null or not public.can_access_work_order_conversation(target_work_order_id) then
    raise exception 'No tienes acceso a esta conversación.' using errcode = '42501';
  end if;

  return query
  select candidate.id, candidate.full_name, candidate.role, candidate.email
  from public.work_order_comment_mention_candidates_for(target_work_order_id, actor_id) candidate;
end;
$function$;

-- Drop the five-argument version before creating the single canonical signature.
drop function if exists public.create_work_order_comment(uuid, text, text, boolean, uuid);
drop function if exists public.create_work_order_comment(uuid, text, text, boolean, uuid, uuid[]);

create function public.create_work_order_comment(
  target_work_order_id uuid,
  comment_message text,
  next_comment_type text default 'comment',
  needs_response boolean default false,
  target_parent_comment_id uuid default null,
  mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns table (
  comment_id uuid,
  work_order_id uuid,
  author_user_id uuid,
  parent_comment_id uuid,
  message text,
  comment_type text,
  requires_response boolean,
  resolution_status text,
  resolved_by uuid,
  resolved_at timestamptz,
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
  cleaned_message text := trim(coalesce(comment_message, ''));
  normalized_type text := lower(trim(coalesce(next_comment_type, 'comment')));
  order_row public.work_orders%rowtype;
  root_comment_id uuid;
  root_resolution_status text;
  inserted_comment public.work_order_comments%rowtype;
  normalized_mention_ids uuid[] := '{}'::uuid[];
  validated_mention_ids uuid[] := '{}'::uuid[];
  actor_name text;
  brand_name text;
  type_label text;
  activity_action text;
  email_subject text;
  email_html_body text;
  work_order_url text;
  escaped_message text;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para participar en la conversación.' using errcode = '42501';
  end if;
  if cleaned_message = '' or char_length(cleaned_message) > 4000 then
    raise exception 'El mensaje debe contener entre 1 y 4000 caracteres.' using errcode = '22023';
  end if;
  if normalized_type not in ('comment', 'block', 'deadline_change', 'reassignment', 'decision') then
    raise exception 'El tipo de comentario no es válido.' using errcode = '22023';
  end if;

  select wo.* into order_row
  from public.work_orders wo
  where wo.id = target_work_order_id
    and public.can_access_work_order_conversation(wo.id)
  for update;

  if not found then
    raise exception 'No tienes acceso para participar en esta orden.' using errcode = '42501';
  end if;
  if order_row.archived_at is not null then
    raise exception 'La conversación de una orden archivada es de solo lectura.' using errcode = '55000';
  end if;

  if target_parent_comment_id is not null then
    select coalesce(parent.parent_comment_id, parent.id), root.resolution_status
    into root_comment_id, root_resolution_status
    from public.work_order_comments parent
    join public.work_order_comments root on root.id = coalesce(parent.parent_comment_id, parent.id)
    where parent.id = target_parent_comment_id
      and parent.work_order_id = target_work_order_id
      and root.work_order_id = target_work_order_id
      and root.parent_comment_id is null
    for share of parent, root;

    if not found then
      raise exception 'No se encontró el tema al que intentas responder.' using errcode = '23503';
    end if;
    if root_resolution_status = 'resolved' then
      raise exception 'Este tema ya está resuelto y no admite nuevas respuestas.' using errcode = '55000';
    end if;
  end if;

  select coalesce(array_agg(distinct requested.user_id order by requested.user_id), '{}'::uuid[])
  into normalized_mention_ids
  from unnest(coalesce(mentioned_user_ids, '{}'::uuid[])) requested(user_id)
  where requested.user_id is not null and requested.user_id <> actor_id;

  select coalesce(array_agg(candidate.id order by candidate.id), '{}'::uuid[])
  into validated_mention_ids
  from public.work_order_comment_mention_candidates_for(target_work_order_id, actor_id) candidate
  where candidate.id = any(normalized_mention_ids);

  if cardinality(validated_mention_ids) <> cardinality(normalized_mention_ids) then
    raise exception 'Una o más menciones no están autorizadas para esta orden.' using errcode = '42501';
  end if;

  insert into public.work_order_comments (
    work_order_id, author_user_id, parent_comment_id, message,
    comment_type, requires_response, resolution_status
  ) values (
    target_work_order_id, actor_id, root_comment_id, cleaned_message,
    normalized_type,
    case when root_comment_id is null then coalesce(needs_response, false) else false end,
    'open'
  ) returning * into inserted_comment;

  insert into public.work_order_comment_mentions (
    comment_id, mentioned_user_id, mentioned_by_user_id, event_key
  )
  select inserted_comment.id, mention_id, actor_id,
    'work_order_comment_mention:' || inserted_comment.id::text || ':' || mention_id::text
  from unnest(validated_mention_ids) mention_id
  on conflict on constraint work_order_comment_mentions_comment_user_key do nothing;

  select profile.full_name into actor_name
  from public.profiles profile where profile.id = actor_id;
  select brand.name into brand_name
  from public.brands brand where brand.id = order_row.brand_id;

  type_label := case normalized_type
    when 'block' then 'Bloqueo'
    when 'deadline_change' then 'Cambio de fecha'
    when 'reassignment' then 'Reasignación'
    when 'decision' then 'Decisión'
    else 'Comentario'
  end;
  work_order_url := 'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') || '&ot=' || coalesce(order_row.code, '') ||
    '&comment=' || inserted_comment.id::text;
  email_subject := regexp_replace(
    'Te mencionaron en la OT ' || coalesce(order_row.code, ''), E'[\r\n]+', ' ', 'g'
  );
  escaped_message := replace(
    public.escape_work_order_comment_mention_email_html(cleaned_message), E'\n', '<br />'
  );
  email_html_body := format($html$
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">MENCIÓN EN CONVERSACIÓN</div>
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">%s · %s</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">%s te mencionó en una orden de trabajo.</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%%;border-collapse:collapse;margin:10px 0 22px;">
            <tr><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Marca</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Tipo</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td></tr>
          </table>
          <div style="margin:0 0 22px;border:1px solid #e4ebe6;border-radius:10px;padding:16px;background:#f8fbf9;font-size:15px;line-height:1.6;">%s</div>
          <a href="%s" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Ver conversación</a>
          <p style="margin:20px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">Si el botón no abre, copia este link:<br/><a href="%s" style="color:#2d2d2d;overflow-wrap:anywhere;">%s</a></p>
        </div>
      </div>
    </div>
  $html$,
    public.escape_work_order_comment_mention_email_html(order_row.code),
    public.escape_work_order_comment_mention_email_html(order_row.title),
    public.escape_work_order_comment_mention_email_html(coalesce(actor_name, 'Equipo Lumen')),
    public.escape_work_order_comment_mention_email_html(coalesce(brand_name, 'Sin marca')),
    public.escape_work_order_comment_mention_email_html(type_label),
    escaped_message,
    public.escape_work_order_comment_mention_email_html(work_order_url),
    public.escape_work_order_comment_mention_email_html(work_order_url),
    public.escape_work_order_comment_mention_email_html(work_order_url)
  );

  insert into public.email_notifications (
    brand_id, work_order_id, recipient_user_id, recipient_email,
    notification_type, subject, html_body, status, scheduled_for,
    error_message, event_key
  )
  select
    order_row.brand_id, order_row.id, mention.mentioned_user_id,
    lower(btrim(profile.email)), 'comment'::public.email_notification_type,
    email_subject, email_html_body, 'queued', now(), null, mention.event_key
  from public.work_order_comment_mentions mention
  join public.profiles profile on profile.id = mention.mentioned_user_id
  where mention.comment_id = inserted_comment.id
  on conflict (event_key) do update set
    status = 'queued', scheduled_for = now(), sent_at = null,
    provider_message_id = null, error_message = null,
    recipient_user_id = excluded.recipient_user_id,
    recipient_email = excluded.recipient_email,
    subject = excluded.subject,
    html_body = excluded.html_body
  where public.email_notifications.status = 'failed';

  activity_action := case
    when root_comment_id is not null then 'work_order_comment_replied'
    when normalized_type = 'block' then 'work_order_block_created'
    else 'work_order_comment_added'
  end;
  insert into public.work_order_activity(work_order_id, actor_id, action, details)
  values (target_work_order_id, actor_id, activity_action, jsonb_build_object(
    'comment_id', inserted_comment.id,
    'parent_comment_id', inserted_comment.parent_comment_id,
    'comment_type', inserted_comment.comment_type,
    'requires_response', inserted_comment.requires_response
  ));
  if cardinality(validated_mention_ids) > 0 then
    insert into public.work_order_activity(work_order_id, actor_id, action, details)
    values (target_work_order_id, actor_id, 'work_order_comment_mention_created', jsonb_build_object(
      'comment_id', inserted_comment.id,
      'mentioned_user_ids', to_jsonb(validated_mention_ids)
    ));
  end if;

  return query select
    inserted_comment.id, inserted_comment.work_order_id, inserted_comment.author_user_id,
    inserted_comment.parent_comment_id, inserted_comment.message, inserted_comment.comment_type,
    inserted_comment.requires_response, inserted_comment.resolution_status,
    inserted_comment.resolved_by, inserted_comment.resolved_at,
    inserted_comment.created_at, inserted_comment.updated_at, validated_mention_ids;
end;
$function$;

create or replace function public.list_my_work_order_comment_mentions(
  page_size integer default 30,
  before_created_at timestamptz default null
)
returns table (
  mention_id uuid,
  comment_id uuid,
  work_order_id uuid,
  work_order_code text,
  work_order_title text,
  brand_id uuid,
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
  select mention.id, comment.id, orders.id, orders.code, orders.title, orders.brand_id,
    author.id, author.full_name, author.role::text,
    left(comment.message, 220), mention.created_at, mention.read_at, orders.archived_at
  from public.work_order_comment_mentions mention
  join public.work_order_comments comment on comment.id = mention.comment_id
  join public.work_orders orders on orders.id = comment.work_order_id
  join public.profiles author on author.id = mention.mentioned_by_user_id
  where mention.mentioned_user_id = actor_id
    and (before_created_at is null or mention.created_at < before_created_at)
  order by mention.created_at desc, mention.id desc
  limit greatest(1, least(coalesce(page_size, 30), 100));
end;
$function$;

create or replace function public.mark_work_order_comment_mention_read(target_mention_id uuid)
returns table (mention_id uuid, read_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  return query
  update public.work_order_comment_mentions mention
  set read_at = coalesce(mention.read_at, now())
  where mention.id = target_mention_id and mention.mentioned_user_id = actor_id
  returning mention.id, mention.read_at;
  if not found then
    raise exception 'La mención no existe o no te pertenece.' using errcode = '42501';
  end if;
end;
$function$;

create or replace function public.retry_work_order_comment_mention_email(target_mention_id uuid)
returns table (mention_id uuid, email_notification_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  return query
  update public.email_notifications email
  set status = 'queued', scheduled_for = now(), sent_at = null,
      provider_message_id = null, error_message = null
  from public.work_order_comment_mentions mention
  join public.work_order_comments comment on comment.id = mention.comment_id
  where mention.id = target_mention_id
    and email.event_key = mention.event_key
    and email.status = 'failed'
    and (
      mention.mentioned_user_id = actor_id
      or (public.can_manage_work_orders() and public.can_access_work_order_conversation(comment.work_order_id))
    )
  returning mention.id, email.id, email.status;
  if not found then
    raise exception 'No hay un correo fallido autorizado para reintentar.' using errcode = '42501';
  end if;
end;
$function$;

alter table public.work_order_comment_mentions enable row level security;

drop policy if exists work_order_comment_mentions_select_related on public.work_order_comment_mentions;
create policy work_order_comment_mentions_select_related
on public.work_order_comment_mentions for select to authenticated
using (
  mentioned_user_id = auth.uid()
  or exists (
    select 1 from public.work_order_comments comment
    where comment.id = work_order_comment_mentions.comment_id
      and public.can_access_work_order_conversation(comment.work_order_id)
  )
);

revoke all privileges on table public.work_order_comment_mentions from public, anon, authenticated;
grant select on table public.work_order_comment_mentions to authenticated;

revoke all on function public.escape_work_order_comment_mention_email_html(text) from public, anon, authenticated;
revoke all on function public.work_order_comment_mention_candidates_for(uuid, uuid) from public, anon, authenticated;
revoke all on function public.list_work_order_comment_mention_candidates(uuid) from public, anon;
revoke all on function public.create_work_order_comment(uuid, text, text, boolean, uuid, uuid[]) from public, anon;
revoke all on function public.list_my_work_order_comment_mentions(integer, timestamptz) from public, anon;
revoke all on function public.mark_work_order_comment_mention_read(uuid) from public, anon;
revoke all on function public.retry_work_order_comment_mention_email(uuid) from public, anon;

grant execute on function public.list_work_order_comment_mention_candidates(uuid) to authenticated;
grant execute on function public.create_work_order_comment(uuid, text, text, boolean, uuid, uuid[]) to authenticated;
grant execute on function public.list_my_work_order_comment_mentions(integer, timestamptz) to authenticated;
grant execute on function public.mark_work_order_comment_mention_read(uuid) to authenticated;
grant execute on function public.retry_work_order_comment_mention_email(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
