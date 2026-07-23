-- Lumen Workspace — estado operativo y comentarios por fase interna.
-- Ejecutar en Supabase SQL Editor despues de:
-- 1. supabase/patch_work_order_phases.sql
-- 2. supabase/patch_work_order_phase_completion.sql
--
-- No modifica ordenes, responsables, deadlines ni fases ajenas.
-- Permite a la persona asignada actualizar solo el estado de su fase y
-- agregar comentarios/avances en esa fase.

create table if not exists public.work_order_phase_comments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  phase_id uuid not null references public.work_order_phases(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists work_order_phase_comments_work_order_id_idx
on public.work_order_phase_comments(work_order_id);

create index if not exists work_order_phase_comments_phase_id_idx
on public.work_order_phase_comments(phase_id);

create index if not exists work_order_phase_comments_created_at_idx
on public.work_order_phase_comments(created_at);

alter table public.work_order_phase_comments enable row level security;

drop policy if exists "work_order_phase_comments_select_brand_access" on public.work_order_phase_comments;
drop policy if exists "work_order_phase_comments_insert_own_phase" on public.work_order_phase_comments;

create policy "work_order_phase_comments_select_brand_access"
on public.work_order_phase_comments for select
to authenticated
using (
  public.current_app_role() <> 'cliente'
  and exists (
    select 1
    from public.work_orders wo
    where wo.id = work_order_phase_comments.work_order_id
      and public.can_access_brand(wo.brand_id)
  )
);

create policy "work_order_phase_comments_insert_own_phase"
on public.work_order_phase_comments for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_app_role() <> 'cliente'
  and exists (
    select 1
    from public.work_order_phases phase
    join public.work_orders wo on wo.id = phase.work_order_id
    where phase.id = work_order_phase_comments.phase_id
      and phase.work_order_id = work_order_phase_comments.work_order_id
      and wo.archived_at is null
      and public.can_access_brand(wo.brand_id)
      and (
        public.can_manage_work_orders()
        or phase.assigned_to = auth.uid()
      )
  )
);

create or replace function public.update_work_order_phase_status(
  target_phase_id uuid,
  next_status text
)
returns public.work_order_phases
language plpgsql
security definer
set search_path = public
as $$
declare
  phase_row public.work_order_phases%rowtype;
  previous_status public.work_order_phase_status;
  next_phase_status public.work_order_phase_status;
  phase_brand_id uuid;
  order_archived_at timestamptz;
begin
  if next_status not in ('pending', 'in_progress', 'blocked', 'in_review', 'completed') then
    raise exception 'invalid_phase_status';
  end if;
  next_phase_status := next_status::public.work_order_phase_status;

  select *
    into phase_row
  from public.work_order_phases
  where id = target_phase_id;

  if not found then
    raise exception 'work_order_phase_not_found';
  end if;

  select wo.brand_id, wo.archived_at
    into phase_brand_id, order_archived_at
  from public.work_orders wo
  where wo.id = phase_row.work_order_id;

  if phase_brand_id is null or not public.can_access_brand(phase_brand_id) then
    raise exception 'not_allowed_to_access_phase';
  end if;

  if order_archived_at is not null then
    raise exception 'not_allowed_to_update_archived_order_phase';
  end if;

  if not (
    public.can_manage_work_orders()
    or phase_row.assigned_to = auth.uid()
  ) then
    raise exception 'not_allowed_to_update_phase_status';
  end if;

  previous_status := phase_row.status;

  update public.work_order_phases
  set
    status = next_phase_status,
    completed_at = case
      when next_phase_status = 'completed' then coalesce(completed_at, now())
      else null
    end,
    updated_at = now()
  where id = target_phase_id
  returning * into phase_row;

  insert into public.work_order_activity (work_order_id, actor_id, action, details)
  values (
    phase_row.work_order_id,
    auth.uid(),
    case
      when next_phase_status = 'completed' and previous_status <> 'completed' then 'phase_completed'
      else 'phase_status_updated'
    end,
    jsonb_build_object(
      'phase_id', phase_row.id,
      'phase_key', phase_row.phase_key,
      'title', phase_row.title,
      'previous_status', previous_status,
      'status', phase_row.status
    )
  );

  return phase_row;
end;
$$;

grant execute on function public.update_work_order_phase_status(uuid, text) to authenticated;

create or replace function public.add_work_order_phase_comment(
  target_phase_id uuid,
  comment_body text
)
returns public.work_order_phase_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  phase_row public.work_order_phases%rowtype;
  comment_row public.work_order_phase_comments%rowtype;
  phase_brand_id uuid;
  order_archived_at timestamptz;
  cleaned_body text;
begin
  cleaned_body := trim(coalesce(comment_body, ''));

  if cleaned_body = '' then
    raise exception 'empty_phase_comment';
  end if;

  if char_length(cleaned_body) > 2000 then
    raise exception 'phase_comment_too_long';
  end if;

  select *
    into phase_row
  from public.work_order_phases
  where id = target_phase_id;

  if not found then
    raise exception 'work_order_phase_not_found';
  end if;

  select wo.brand_id, wo.archived_at
    into phase_brand_id, order_archived_at
  from public.work_orders wo
  where wo.id = phase_row.work_order_id;

  if phase_brand_id is null or not public.can_access_brand(phase_brand_id) then
    raise exception 'not_allowed_to_access_phase';
  end if;

  if order_archived_at is not null then
    raise exception 'not_allowed_to_comment_archived_order_phase';
  end if;

  if not (
    public.can_manage_work_orders()
    or phase_row.assigned_to = auth.uid()
  ) then
    raise exception 'not_allowed_to_comment_phase';
  end if;

  insert into public.work_order_phase_comments (
    work_order_id,
    phase_id,
    author_id,
    body
  )
  values (
    phase_row.work_order_id,
    phase_row.id,
    auth.uid(),
    cleaned_body
  )
  returning * into comment_row;

  insert into public.work_order_activity (work_order_id, actor_id, action, details)
  values (
    phase_row.work_order_id,
    auth.uid(),
    'phase_comment_added',
    jsonb_build_object(
      'phase_id', phase_row.id,
      'phase_key', phase_row.phase_key,
      'title', phase_row.title
    )
  );

  return comment_row;
end;
$$;

grant execute on function public.add_work_order_phase_comment(uuid, text) to authenticated;

-- Verificacion rapida:
-- select proname
-- from pg_proc
-- where proname in ('update_work_order_phase_status', 'add_work_order_phase_comment')
-- order by proname;
--
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'work_order_phase_comments';
