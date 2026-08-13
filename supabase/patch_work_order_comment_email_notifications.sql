-- Queue one email per involved internal user when a work-order comment is created.
-- Covers general conversation comments and phase comments without changing access rules.

begin;

do $preflight$
declare
  missing_dependency record;
begin
  for missing_dependency in
    select required.relation_name
    from (values
      ('work_orders'),
      ('work_order_assignees'),
      ('work_order_phases'),
      ('profiles'),
      ('brands'),
      ('work_order_comments'),
      ('work_order_comment_mentions'),
      ('work_order_phase_comments'),
      ('work_order_activity'),
      ('email_notifications')
    ) as required(relation_name)
    where to_regclass('public.' || required.relation_name) is null
  loop
    raise exception 'required_relation_missing: public.%', missing_dependency.relation_name;
  end loop;

  for missing_dependency in
    select required.relation_name, required.column_name
    from (values
      ('work_orders', 'id'),
      ('work_orders', 'created_by'),
      ('work_orders', 'brand_id'),
      ('work_orders', 'code'),
      ('work_orders', 'title'),
      ('work_orders', 'archived_at'),
      ('work_order_assignees', 'work_order_id'),
      ('work_order_assignees', 'user_id'),
      ('work_order_phases', 'id'),
      ('work_order_phases', 'work_order_id'),
      ('work_order_phases', 'assigned_to'),
      ('work_order_phases', 'title'),
      ('work_order_phases', 'phase_key'),
      ('profiles', 'id'),
      ('profiles', 'email'),
      ('profiles', 'full_name'),
      ('profiles', 'role'),
      ('profiles', 'is_active'),
      ('brands', 'id'),
      ('brands', 'name'),
      ('work_order_comments', 'id'),
      ('work_order_comments', 'work_order_id'),
      ('work_order_comments', 'author_user_id'),
      ('work_order_comments', 'parent_comment_id'),
      ('work_order_comments', 'message'),
      ('work_order_comments', 'comment_type'),
      ('work_order_comments', 'requires_response'),
      ('work_order_comments', 'resolution_status'),
      ('work_order_comments', 'resolved_by'),
      ('work_order_comments', 'resolved_at'),
      ('work_order_comments', 'created_at'),
      ('work_order_comments', 'updated_at'),
      ('work_order_comment_mentions', 'id'),
      ('work_order_comment_mentions', 'comment_id'),
      ('work_order_comment_mentions', 'mentioned_user_id'),
      ('work_order_comment_mentions', 'mentioned_by_user_id'),
      ('work_order_comment_mentions', 'event_key'),
      ('work_order_phase_comments', 'id'),
      ('work_order_phase_comments', 'work_order_id'),
      ('work_order_phase_comments', 'phase_id'),
      ('work_order_phase_comments', 'author_id'),
      ('work_order_phase_comments', 'body'),
      ('work_order_phase_comments', 'created_at'),
      ('work_order_activity', 'work_order_id'),
      ('work_order_activity', 'actor_id'),
      ('work_order_activity', 'action'),
      ('work_order_activity', 'details'),
      ('email_notifications', 'id'),
      ('email_notifications', 'brand_id'),
      ('email_notifications', 'work_order_id'),
      ('email_notifications', 'recipient_user_id'),
      ('email_notifications', 'recipient_email'),
      ('email_notifications', 'notification_type'),
      ('email_notifications', 'subject'),
      ('email_notifications', 'html_body'),
      ('email_notifications', 'status'),
      ('email_notifications', 'scheduled_for'),
      ('email_notifications', 'sent_at'),
      ('email_notifications', 'provider_message_id'),
      ('email_notifications', 'error_message'),
      ('email_notifications', 'event_key')
    ) as required(relation_name, column_name)
    where not exists (
      select 1
      from information_schema.columns schema_column
      where schema_column.table_schema = 'public'
        and schema_column.table_name = required.relation_name
        and schema_column.column_name = required.column_name
    )
  loop
    raise exception 'required_column_missing: public.%.%',
      missing_dependency.relation_name,
      missing_dependency.column_name;
  end loop;

  if to_regprocedure('public.create_work_order_comment(uuid,text,text,boolean,uuid,uuid[])') is null then
    raise exception 'create_work_order_comment_mentions_rpc_required';
  end if;
  if to_regprocedure('public.add_work_order_phase_comment(uuid,text)') is null then
    raise exception 'add_work_order_phase_comment_rpc_required';
  end if;
  if to_regprocedure('public.normalize_work_order_conversation_role(text)') is null then
    raise exception 'normalize_work_order_conversation_role_required';
  end if;
  if to_regprocedure('public.can_access_work_order_conversation(uuid)') is null then
    raise exception 'can_access_work_order_conversation_required';
  end if;
  if to_regprocedure('public.work_order_comment_mention_candidates_for(uuid,uuid)') is null then
    raise exception 'work_order_comment_mention_candidates_for_required';
  end if;
  if to_regprocedure('public.escape_work_order_comment_mention_email_html(text)') is null then
    raise exception 'escape_work_order_comment_mention_email_html_required';
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
    where constraint_row.conrelid = 'public.work_order_comment_mentions'::regclass
      and constraint_row.conname = 'work_order_comment_mentions_comment_user_key'
      and constraint_row.contype = 'u'
  ) then
    raise exception 'work_order_comment_mentions_comment_user_key_required';
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

create or replace function public.resolve_work_order_notification_recipients(
  target_work_order_id uuid
)
returns table (
  recipient_user_id uuid,
  recipient_email text,
  recipient_name text,
  source_priority integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  with recipient_sources as (
    select orders.created_by as user_id, 10 as priority
    from public.work_orders orders
    where orders.id = target_work_order_id
      and orders.created_by is not null

    union all

    select assignee.user_id, 20
    from public.work_order_assignees assignee
    where assignee.work_order_id = target_work_order_id

    union all

    select phase.assigned_to, 30
    from public.work_order_phases phase
    where phase.work_order_id = target_work_order_id
      and phase.assigned_to is not null
  ), valid_profiles as (
    select
      profile.id,
      lower(btrim(profile.email)) as email,
      profile.full_name,
      min(source.priority) as priority
    from recipient_sources source
    join public.profiles profile on profile.id = source.user_id
    where profile.is_active is true
      and public.normalize_work_order_conversation_role(profile.role::text) is distinct from 'cliente'
      and profile.email is not null
      and btrim(profile.email) <> ''
      and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    group by profile.id, lower(btrim(profile.email)), profile.full_name
  ), email_ranked as (
    select
      profile.*,
      row_number() over (
        partition by profile.email
        order by profile.priority, profile.id
      ) as email_rank
    from valid_profiles profile
  )
  select profile.id, profile.email, profile.full_name, profile.priority
  from email_ranked profile
  where profile.email_rank = 1
  order by profile.priority, profile.id;
$function$;

create or replace function public.render_work_order_comment_notification_email(
  target_code text,
  target_title text,
  target_brand_name text,
  target_author_name text,
  target_message text,
  target_created_at timestamptz,
  target_url text,
  target_phase_name text default null
)
returns text
language plpgsql
immutable
set search_path = ''
as $function$
declare
  safe_message text;
  context_label text;
begin
  safe_message := public.escape_work_order_comment_mention_email_html(left(coalesce(target_message, ''), 700));
  safe_message := replace(safe_message, E'\n', '<br />');
  if char_length(coalesce(target_message, '')) > 700 then
    safe_message := safe_message || '<br /><strong>...</strong>';
  end if;
  context_label := case
    when nullif(btrim(target_phase_name), '') is null then 'Conversación de la orden'
    else 'Fase · ' || target_phase_name
  end;

  return format($html$
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">NUEVO COMENTARIO</div>
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">%s · %s</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">%s publicó un comentario.</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%%;border-collapse:collapse;margin:10px 0 22px;">
            <tr><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Marca</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Ubicación</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td></tr>
            <tr><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Fecha</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td></tr>
          </table>
          <div style="margin:0 0 22px;border:1px solid #e4ebe6;border-radius:10px;padding:16px;background:#f8fbf9;font-size:15px;line-height:1.6;overflow-wrap:anywhere;">%s</div>
          <a href="%s" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Ver orden</a>
          <p style="margin:20px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">Si el botón no abre, copia este link:<br/><a href="%s" style="color:#2d2d2d;overflow-wrap:anywhere;">%s</a></p>
        </div>
      </div>
    </div>
  $html$,
    public.escape_work_order_comment_mention_email_html(target_code),
    public.escape_work_order_comment_mention_email_html(target_title),
    public.escape_work_order_comment_mention_email_html(coalesce(target_author_name, 'Equipo Lumen')),
    public.escape_work_order_comment_mention_email_html(coalesce(target_brand_name, 'Sin marca')),
    public.escape_work_order_comment_mention_email_html(context_label),
    public.escape_work_order_comment_mention_email_html(
      to_char(target_created_at at time zone 'America/Guatemala', 'DD/MM/YYYY HH24:MI')
    ),
    safe_message,
    public.escape_work_order_comment_mention_email_html(target_url),
    public.escape_work_order_comment_mention_email_html(target_url),
    public.escape_work_order_comment_mention_email_html(target_url)
  );
end;
$function$;

create or replace function public.create_work_order_comment(
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
  activity_action text;
  email_subject text;
  email_html_body text;
  work_order_url text;
  queued_count integer := 0;
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

  select orders.* into order_row
  from public.work_orders orders
  where orders.id = target_work_order_id
    and public.can_access_work_order_conversation(orders.id)
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

  work_order_url := 'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') || '&ot=' || coalesce(order_row.code, '') ||
    '&comment=' || inserted_comment.id::text;
  email_subject := regexp_replace(
    'Nuevo comentario en ' || coalesce(order_row.code, ''), E'[\r\n]+', ' ', 'g'
  );
  email_html_body := public.render_work_order_comment_notification_email(
    order_row.code, order_row.title, brand_name, actor_name, cleaned_message,
    inserted_comment.created_at, work_order_url, null
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
      'work_order_comment:' || inserted_comment.id::text || ':' || recipient.recipient_user_id::text
    from ranked recipient
    where recipient.email_rank = 1
    on conflict (event_key) do nothing
    returning id
  )
  select count(*) into queued_count from inserted;

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
    'requires_response', inserted_comment.requires_response,
    'queued_notification_count', queued_count
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

create or replace function public.add_work_order_phase_comment(
  target_phase_id uuid,
  comment_body text
)
returns public.work_order_phase_comments
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  phase_row public.work_order_phases%rowtype;
  order_row public.work_orders%rowtype;
  comment_row public.work_order_phase_comments%rowtype;
  cleaned_body text := trim(coalesce(comment_body, ''));
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
  if cleaned_body = '' then
    raise exception 'empty_phase_comment';
  end if;
  if char_length(cleaned_body) > 2000 then
    raise exception 'phase_comment_too_long';
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
    raise exception 'not_allowed_to_access_phase';
  end if;
  if order_row.archived_at is not null then
    raise exception 'not_allowed_to_comment_archived_order_phase';
  end if;
  if not (public.can_manage_work_orders() or phase_row.assigned_to = actor_id) then
    raise exception 'not_allowed_to_comment_phase';
  end if;

  insert into public.work_order_phase_comments (
    work_order_id, phase_id, author_id, body
  ) values (
    phase_row.work_order_id, phase_row.id, actor_id, cleaned_body
  ) returning * into comment_row;

  select profile.full_name into actor_name
  from public.profiles profile where profile.id = actor_id;
  select brand.name into brand_name
  from public.brands brand where brand.id = order_row.brand_id;

  work_order_url := 'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') || '&ot=' || coalesce(order_row.code, '');
  email_subject := regexp_replace(
    'Nuevo comentario en ' || coalesce(order_row.code, '') || ' · ' || coalesce(phase_row.title, ''),
    E'[\r\n]+', ' ', 'g'
  );
  email_html_body := public.render_work_order_comment_notification_email(
    order_row.code, order_row.title, brand_name, actor_name, cleaned_body,
    comment_row.created_at, work_order_url, phase_row.title
  );

  with inserted as (
    insert into public.email_notifications (
      brand_id, work_order_id, recipient_user_id, recipient_email,
      notification_type, subject, html_body, status, scheduled_for,
      error_message, event_key
    )
    select order_row.brand_id, order_row.id, recipient.recipient_user_id,
      recipient.recipient_email, 'comment'::public.email_notification_type,
      email_subject, email_html_body, 'queued', now(), null,
      'work_order_phase_comment:' || comment_row.id::text || ':' || recipient.recipient_user_id::text
    from public.resolve_work_order_notification_recipients(order_row.id) recipient
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
      'queued_notification_count', queued_count
    )
  );

  return comment_row;
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
    and email.event_key in (
      mention.event_key,
      'work_order_comment:' || mention.comment_id::text || ':' || mention.mentioned_user_id::text
    )
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

revoke all on function public.resolve_work_order_notification_recipients(uuid)
  from public, anon, authenticated;
revoke all on function public.render_work_order_comment_notification_email(text,text,text,text,text,timestamptz,text,text)
  from public, anon, authenticated;
revoke all on function public.create_work_order_comment(uuid,text,text,boolean,uuid,uuid[])
  from public, anon;
revoke all on function public.add_work_order_phase_comment(uuid,text)
  from public, anon;
revoke all on function public.retry_work_order_comment_mention_email(uuid)
  from public, anon;

grant execute on function public.create_work_order_comment(uuid,text,text,boolean,uuid,uuid[])
  to authenticated;
grant execute on function public.add_work_order_phase_comment(uuid,text)
  to authenticated;
grant execute on function public.retry_work_order_comment_mention_email(uuid)
  to authenticated;

notify pgrst, 'reload schema';

commit;
