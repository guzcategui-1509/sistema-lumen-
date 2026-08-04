-- Safe rollback for structured work-order mentions.
-- Keeps mention rows and event keys for audit, disables new mention production,
-- and restores the pre-mentions comment RPC.

begin;

revoke all on function public.create_work_order_comment(uuid, text, text, boolean, uuid, uuid[]) from authenticated;
revoke all on function public.list_work_order_comment_mention_candidates(uuid) from authenticated;
revoke all on function public.list_my_work_order_comment_mentions(integer, timestamptz) from authenticated;
revoke all on function public.mark_work_order_comment_mention_read(uuid) from authenticated;
revoke all on function public.retry_work_order_comment_mention_email(uuid) from authenticated;

drop function if exists public.create_work_order_comment(uuid, text, text, boolean, uuid, uuid[]);
drop function if exists public.list_work_order_comment_mention_candidates(uuid);
drop function if exists public.list_my_work_order_comment_mentions(integer, timestamptz);
drop function if exists public.mark_work_order_comment_mention_read(uuid);
drop function if exists public.retry_work_order_comment_mention_email(uuid);
drop function if exists public.work_order_comment_mention_candidates_for(uuid, uuid);
drop function if exists public.escape_work_order_comment_mention_email_html(text);

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
    raise exception 'Debes iniciar sesion para participar en la conversacion.' using errcode = '42501';
  end if;
  if cleaned_message = '' or char_length(cleaned_message) > 4000 then
    raise exception 'El mensaje debe contener entre 1 y 4000 caracteres.' using errcode = '22023';
  end if;
  if normalized_type not in ('comment', 'block', 'deadline_change', 'reassignment', 'decision') then
    raise exception 'El tipo de comentario no es valido.' using errcode = '22023';
  end if;

  select wo.archived_at into order_archived_at
  from public.work_orders wo
  where wo.id = target_work_order_id
    and public.can_access_work_order_conversation(wo.id)
  for update;

  if not found then
    raise exception 'No tienes acceso para participar en esta orden.' using errcode = '42501';
  end if;
  if order_archived_at is not null then
    raise exception 'La conversacion de una orden archivada es de solo lectura.' using errcode = '55000';
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
      raise exception 'No se encontro el tema al que intentas responder.' using errcode = '23503';
    end if;
    if root_resolution_status = 'resolved' then
      raise exception 'Este tema ya esta resuelto y no admite nuevas respuestas.' using errcode = '55000';
    end if;
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

  return query select
    inserted_comment.id, inserted_comment.work_order_id, inserted_comment.author_user_id,
    inserted_comment.parent_comment_id, inserted_comment.message, inserted_comment.comment_type,
    inserted_comment.requires_response, inserted_comment.resolution_status,
    inserted_comment.resolved_by, inserted_comment.resolved_at,
    inserted_comment.created_at, inserted_comment.updated_at;
end;
$function$;

revoke all on function public.create_work_order_comment(uuid, text, text, boolean, uuid) from public, anon;
grant execute on function public.create_work_order_comment(uuid, text, text, boolean, uuid) to authenticated;

-- Historical mentions remain readable by their recipient only.
drop policy if exists work_order_comment_mentions_select_related on public.work_order_comment_mentions;
drop policy if exists work_order_comment_mentions_select_own on public.work_order_comment_mentions;
create policy work_order_comment_mentions_select_own
on public.work_order_comment_mentions for select to authenticated
using (mentioned_user_id = auth.uid());

revoke all privileges on table public.work_order_comment_mentions from public, anon, authenticated;
grant select on table public.work_order_comment_mentions to authenticated;

notify pgrst, 'reload schema';

commit;
