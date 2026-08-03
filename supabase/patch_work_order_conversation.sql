-- Lumen Workspace: conversacion persistente por orden de trabajo.
-- Evoluciona public.work_order_comments sin eliminar datos existentes.

do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_order_comments'
      and column_name = 'user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_order_comments'
      and column_name = 'author_user_id'
  ) then
    alter table public.work_order_comments
      rename column user_id to author_user_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_order_comments'
      and column_name = 'body'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_order_comments'
      and column_name = 'message'
  ) then
    alter table public.work_order_comments
      rename column body to message;
  end if;
end;
$migration$;

alter table public.work_order_comments
  add column if not exists parent_comment_id uuid,
  add column if not exists comment_type text not null default 'comment',
  add column if not exists requires_response boolean not null default false,
  add column if not exists resolution_status text not null default 'open',
  add column if not exists resolved_by uuid,
  add column if not exists resolved_at timestamptz,
  add column if not exists updated_at timestamptz;

do $preflight$
begin
  if exists (
    select 1
    from public.work_order_comments
    where work_order_id is null
      or author_user_id is null
      or created_at is null
      or trim(coalesce(message, '')) = ''
  ) then
    raise exception
      'work_order_comments contiene filas incompletas; corrige los datos antes de aplicar la conversacion';
  end if;
end;
$preflight$;

alter table public.work_order_comments
  alter column work_order_id set not null,
  alter column author_user_id set not null,
  alter column created_at set not null,
  alter column created_at set default now();

alter table public.work_order_comments
  drop constraint if exists work_order_comments_user_id_fkey,
  drop constraint if exists work_order_comments_author_user_id_fkey,
  drop constraint if exists work_order_comments_parent_comment_id_fkey,
  drop constraint if exists work_order_comments_resolved_by_fkey,
  drop constraint if exists work_order_comments_message_check,
  drop constraint if exists work_order_comments_type_check,
  drop constraint if exists work_order_comments_resolution_check,
  drop constraint if exists work_order_comments_resolution_consistency_check,
  drop constraint if exists work_order_comments_reply_state_check;

alter table public.work_order_comments
  add constraint work_order_comments_author_user_id_fkey
    foreign key (author_user_id)
    references public.profiles(id)
    on delete restrict,
  add constraint work_order_comments_parent_comment_id_fkey
    foreign key (parent_comment_id)
    references public.work_order_comments(id)
    on delete restrict,
  add constraint work_order_comments_resolved_by_fkey
    foreign key (resolved_by)
    references public.profiles(id)
    on delete restrict,
  add constraint work_order_comments_message_check
    check (char_length(trim(message)) between 1 and 4000),
  add constraint work_order_comments_type_check
    check (
      comment_type in (
        'comment',
        'block',
        'deadline_change',
        'reassignment',
        'decision'
      )
    ),
  add constraint work_order_comments_resolution_check
    check (resolution_status in ('open', 'resolved')),
  add constraint work_order_comments_resolution_consistency_check
    check (
      (
        resolution_status = 'open'
        and resolved_by is null
        and resolved_at is null
      )
      or
      (
        resolution_status = 'resolved'
        and resolved_by is not null
        and resolved_at is not null
      )
    ),
  add constraint work_order_comments_reply_state_check
    check (
      parent_comment_id is null
      or (
        requires_response = false
        and resolution_status = 'open'
        and resolved_by is null
        and resolved_at is null
      )
    );

create index if not exists work_order_comments_order_created_idx
  on public.work_order_comments(work_order_id, created_at, id);

create index if not exists work_order_comments_parent_idx
  on public.work_order_comments(parent_comment_id);

create index if not exists work_order_comments_pending_response_idx
  on public.work_order_comments(work_order_id, created_at)
  where requires_response = true
    and resolution_status = 'open'
    and parent_comment_id is null;

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
    and public.is_internal_user()
    and exists (
      select 1
      from public.work_orders wo
      where wo.id = target_work_order_id
        and (
          (
            public.can_manage_work_orders()
            and public.can_access_brand(wo.brand_id)
          )
          or wo.created_by = auth.uid()
          or exists (
            select 1
            from public.work_order_assignees woa
            where woa.work_order_id = wo.id
              and woa.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.work_order_phases wop
            where wop.work_order_id = wo.id
              and wop.assigned_to = auth.uid()
          )
        )
    ),
    false
  );
$function$;

create or replace function public.create_work_order_comment(
  target_work_order_id uuid,
  comment_message text,
  next_comment_type text default 'comment',
  needs_response boolean default false,
  target_parent_comment_id uuid default null
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
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  cleaned_message text := trim(coalesce(comment_message, ''));
  normalized_type text := lower(trim(coalesce(next_comment_type, 'comment')));
  order_archived_at timestamptz;
  root_comment_id uuid;
  root_resolution_status text;
  inserted_comment public.work_order_comments%rowtype;
  activity_action text;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesion para participar en la conversacion.'
      using errcode = '42501';
  end if;

  if cleaned_message = '' or char_length(cleaned_message) > 4000 then
    raise exception 'El mensaje debe contener entre 1 y 4000 caracteres.'
      using errcode = '22023';
  end if;

  if normalized_type not in (
    'comment',
    'block',
    'deadline_change',
    'reassignment',
    'decision'
  ) then
    raise exception 'El tipo de comentario no es valido.'
      using errcode = '22023';
  end if;

  select wo.archived_at
  into order_archived_at
  from public.work_orders wo
  where wo.id = target_work_order_id
    and public.can_access_work_order_conversation(wo.id)
  for update;

  if not found then
    raise exception 'No tienes acceso para participar en esta orden.'
      using errcode = '42501';
  end if;

  if order_archived_at is not null then
    raise exception 'La conversacion de una orden archivada es de solo lectura.'
      using errcode = '55000';
  end if;

  if target_parent_comment_id is not null then
    select
      coalesce(parent.parent_comment_id, parent.id),
      root.resolution_status
    into
      root_comment_id,
      root_resolution_status
    from public.work_order_comments parent
    join public.work_order_comments root
      on root.id = coalesce(parent.parent_comment_id, parent.id)
    where parent.id = target_parent_comment_id
      and parent.work_order_id = target_work_order_id
      and root.work_order_id = target_work_order_id
      and root.parent_comment_id is null
    for share of parent, root;

    if not found then
      raise exception 'No se encontro el tema al que intentas responder.'
        using errcode = '23503';
    end if;

    if root_resolution_status = 'resolved' then
      raise exception 'Este tema ya esta resuelto y no admite nuevas respuestas.'
        using errcode = '55000';
    end if;
  end if;

  insert into public.work_order_comments (
    work_order_id,
    author_user_id,
    parent_comment_id,
    message,
    comment_type,
    requires_response,
    resolution_status
  )
  values (
    target_work_order_id,
    actor_id,
    root_comment_id,
    cleaned_message,
    normalized_type,
    case when root_comment_id is null then coalesce(needs_response, false) else false end,
    'open'
  )
  returning * into inserted_comment;

  activity_action := case
    when root_comment_id is not null then 'work_order_comment_replied'
    when normalized_type = 'block' then 'work_order_block_created'
    else 'work_order_comment_added'
  end;

  insert into public.work_order_activity (
    work_order_id,
    actor_id,
    action,
    details
  )
  values (
    target_work_order_id,
    actor_id,
    activity_action,
    jsonb_build_object(
      'comment_id', inserted_comment.id,
      'parent_comment_id', inserted_comment.parent_comment_id,
      'comment_type', inserted_comment.comment_type,
      'requires_response', inserted_comment.requires_response
    )
  );

  return query
  select
    inserted_comment.id,
    inserted_comment.work_order_id,
    inserted_comment.author_user_id,
    inserted_comment.parent_comment_id,
    inserted_comment.message,
    inserted_comment.comment_type,
    inserted_comment.requires_response,
    inserted_comment.resolution_status,
    inserted_comment.resolved_by,
    inserted_comment.resolved_at,
    inserted_comment.created_at,
    inserted_comment.updated_at;
end;
$function$;

create or replace function public.resolve_work_order_comment(
  target_comment_id uuid
)
returns table (
  comment_id uuid,
  resolution_status text,
  resolved_by uuid,
  resolved_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  comment_row public.work_order_comments%rowtype;
  order_created_by uuid;
  order_archived_at timestamptz;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesion para resolver un tema.'
      using errcode = '42501';
  end if;

  select comment.*
  into comment_row
  from public.work_order_comments comment
  join public.work_orders wo on wo.id = comment.work_order_id
  where comment.id = target_comment_id
    and comment.parent_comment_id is null
    and public.can_access_work_order_conversation(wo.id)
  for update of comment, wo;

  if not found then
    raise exception 'No se encontro el tema o no tienes acceso para resolverlo.'
      using errcode = '42501';
  end if;

  select wo.created_by, wo.archived_at
  into order_created_by, order_archived_at
  from public.work_orders wo
  where wo.id = comment_row.work_order_id;

  if order_archived_at is not null then
    raise exception 'La conversacion de una orden archivada es de solo lectura.'
      using errcode = '55000';
  end if;

  if not (
    comment_row.author_user_id = actor_id
    or order_created_by = actor_id
    or public.can_manage_work_orders()
  ) then
    raise exception 'Solo el autor del tema, el creador de la OT o gestion pueden resolverlo.'
      using errcode = '42501';
  end if;

  if comment_row.resolution_status = 'open' then
    update public.work_order_comments comment
    set
      resolution_status = 'resolved',
      resolved_by = actor_id,
      resolved_at = now(),
      updated_at = now()
    where comment.id = comment_row.id
    returning * into comment_row;

    insert into public.work_order_activity (
      work_order_id,
      actor_id,
      action,
      details
    )
    values (
      comment_row.work_order_id,
      actor_id,
      'work_order_comment_resolved',
      jsonb_build_object(
        'comment_id', comment_row.id,
        'comment_type', comment_row.comment_type,
        'requires_response', comment_row.requires_response
      )
    );
  end if;

  return query
  select
    comment_row.id,
    comment_row.resolution_status,
    comment_row.resolved_by,
    comment_row.resolved_at,
    comment_row.updated_at;
end;
$function$;

alter table public.work_order_comments enable row level security;

drop policy if exists "work_order_comments_brand_access"
  on public.work_order_comments;
drop policy if exists "work_order_comments_internal_manage"
  on public.work_order_comments;
drop policy if exists "work_order_comments_select_brand_access"
  on public.work_order_comments;
drop policy if exists "work_order_comments_manage_internal"
  on public.work_order_comments;
drop policy if exists "work_order_comments_select_related_order"
  on public.work_order_comments;

create policy "work_order_comments_select_related_order"
on public.work_order_comments
for select
to authenticated
using (
  public.can_access_work_order_conversation(work_order_id)
);

revoke all privileges
on table public.work_order_comments
from public, anon, authenticated;

grant select
on table public.work_order_comments
to authenticated;

revoke all
on function public.can_access_work_order_conversation(uuid)
from public, anon;
revoke all
on function public.create_work_order_comment(uuid, text, text, boolean, uuid)
from public, anon;
revoke all
on function public.resolve_work_order_comment(uuid)
from public, anon;

grant execute
on function public.can_access_work_order_conversation(uuid)
to authenticated;
grant execute
on function public.create_work_order_comment(uuid, text, text, boolean, uuid)
to authenticated;
grant execute
on function public.resolve_work_order_comment(uuid)
to authenticated;
