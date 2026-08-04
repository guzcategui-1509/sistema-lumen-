-- Roll back the no-phase status control while preserving all orders, activity,
-- and email notifications already created by the feature.

revoke all on function public.transition_work_order_without_phases(
  uuid, public.work_order_status, uuid, text
)
from public, anon, authenticated;

drop function if exists public.transition_work_order_without_phases(
  uuid, public.work_order_status, uuid, text
);

drop index if exists public.work_order_activity_no_phase_operation_uidx;

create or replace function public.complete_work_order_without_phases(
  target_work_order_id uuid
)
returns table (
  work_order_id uuid,
  status public.work_order_status,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
  previous_status public.work_order_status;
  result_updated_at timestamptz;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para terminar la orden.'
      using errcode = '42501';
  end if;

  select wo.status
  into previous_status
  from public.work_orders wo
  where wo.id = target_work_order_id
    and wo.archived_at is null
    and wo.status in (
      'new'::public.work_order_status,
      'in_progress'::public.work_order_status,
      'in_review'::public.work_order_status
    )
    and public.is_internal_user()
    and public.can_access_brand(wo.brand_id)
    and (
      wo.created_by = actor_id
      or public.can_manage_work_orders()
      or exists (
        select 1
        from public.work_order_assignees woa
        where woa.work_order_id = wo.id
          and woa.user_id = actor_id
      )
    )
  for update;

  if not found then
    raise exception
      'La orden no existe, está archivada, ya terminó o no tienes permiso para terminarla.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.work_order_phases wop
    where wop.work_order_id = target_work_order_id
  ) then
    raise exception
      'Esta orden tiene fases y debe completarse mediante su flujo de fases.'
      using errcode = '55000';
  end if;

  update public.work_orders wo
  set
    status = 'completed'::public.work_order_status,
    updated_at = now()
  where wo.id = target_work_order_id
  returning wo.updated_at into result_updated_at;

  insert into public.work_order_activity (
    work_order_id,
    actor_id,
    action,
    details
  )
  values (
    target_work_order_id,
    actor_id,
    'status_changed',
    jsonb_build_object(
      'from', previous_status::text,
      'to', 'completed',
      'without_phases', true
    )
  );

  return query
  select
    target_work_order_id,
    'completed'::public.work_order_status,
    result_updated_at;
end;
$function$;

revoke all on function public.complete_work_order_without_phases(uuid)
from public, anon;

grant execute on function public.complete_work_order_without_phases(uuid)
to authenticated;

drop function if exists public.no_phase_work_order_status_label(
  public.work_order_status
);

drop function if exists public.escape_no_phase_status_email_html(text);
