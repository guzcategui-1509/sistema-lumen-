-- Lumen Workspace: authoritative status transitions for work orders without phases.
-- This patch does not modify work_order_phases, its statuses, triggers, or notifications.

create or replace function public.escape_no_phase_status_email_html(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $function$
  select replace(
    replace(
      replace(
        replace(
          replace(value, '&', '&amp;'),
          '<', '&lt;'
        ),
        '>', '&gt;'
      ),
      '"', '&quot;'
    ),
    '''', '&#39;'
  );
$function$;

create or replace function public.no_phase_work_order_status_label(
  value public.work_order_status
)
returns text
language sql
immutable
strict
set search_path = ''
as $function$
  select case value
    when 'new'::public.work_order_status then 'Sin iniciar'
    when 'in_progress'::public.work_order_status then 'En proceso'
    when 'in_review'::public.work_order_status then 'En revisión interna'
    when 'completed'::public.work_order_status then 'Terminada'
    when 'cancelled'::public.work_order_status then 'Cancelada'
    when 'client_approved'::public.work_order_status then 'Aprobada por cliente'
    when 'scheduled'::public.work_order_status then 'Programada'
    else value::text
  end;
$function$;

create unique index if not exists work_order_activity_no_phase_operation_uidx
  on public.work_order_activity ((details ->> 'operation_id'))
  where action = 'status_changed'
    and details ->> 'scope' = 'without_phases'
    and details ? 'operation_id';

create or replace function public.transition_work_order_without_phases(
  target_work_order_id uuid,
  next_status public.work_order_status,
  operation_id uuid,
  change_reason text default null
)
returns table (
  work_order_id uuid,
  status public.work_order_status,
  previous_status public.work_order_status,
  updated_at timestamptz,
  event_id uuid,
  eligible_recipient_count integer,
  queued_count integer,
  already_queued_count integer,
  idempotent boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_user_id uuid := auth.uid();
  actor_role public.app_role;
  actor_name text;
  current_order public.work_orders%rowtype;
  stored_activity public.work_order_activity%rowtype;
  normalized_reason text := nullif(btrim(change_reason), '');
  is_manager boolean := false;
  is_participant boolean := false;
  is_reopening boolean := false;
  event_timestamp timestamptz := clock_timestamp();
  result_updated_at timestamptz;
  result_eligible_count integer := 0;
  result_queued_count integer := 0;
  result_already_queued_count integer := 0;
  previous_label text;
  next_label text;
  safe_code text;
  safe_title text;
  safe_brand text;
  safe_actor text;
  safe_reason text;
  safe_due_date text;
  safe_work_order_url text;
  email_subject text;
  email_html text;
begin
  if actor_user_id is null then
    raise exception 'Debes iniciar sesión para actualizar esta orden.'
      using errcode = '42501';
  end if;

  if operation_id is null then
    raise exception 'Falta el identificador único de la operación.'
      using errcode = '22023';
  end if;

  select profile.role, profile.full_name
  into actor_role, actor_name
  from public.profiles profile
  where profile.id = actor_user_id
    and profile.is_active is true;

  if not found or actor_role = 'cliente'::public.app_role then
    raise exception 'Tu perfil no está activo o no puede modificar órdenes.'
      using errcode = '42501';
  end if;

  select work_order.*
  into current_order
  from public.work_orders work_order
  where work_order.id = target_work_order_id
  for update;

  if not found then
    raise exception 'No se encontró la orden solicitada.'
      using errcode = 'P0002';
  end if;

  if current_order.archived_at is not null then
    raise exception 'No se puede cambiar el estado de una orden archivada.'
      using errcode = '55000';
  end if;

  if not public.can_access_brand(current_order.brand_id) then
    raise exception 'No tienes acceso a esta orden.'
      using errcode = '42501';
  end if;

  is_manager := public.can_manage_work_orders();
  is_participant := current_order.created_by = actor_user_id
    or exists (
      select 1
      from public.work_order_assignees assignee
      where assignee.work_order_id = current_order.id
        and assignee.user_id = actor_user_id
    );

  if not is_manager and not is_participant then
    raise exception 'Solo el creador, un responsable o Gestión puede cambiar este estado.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.work_order_phases phase
    where phase.work_order_id = current_order.id
  ) then
    raise exception 'Esta orden tiene fases y debe conservar su flujo actual.'
      using errcode = '55000';
  end if;

  select activity.*
  into stored_activity
  from public.work_order_activity activity
  where activity.work_order_id = current_order.id
    and activity.action = 'status_changed'
    and activity.details ->> 'scope' = 'without_phases'
    and activity.details ->> 'operation_id' = operation_id::text
  limit 1;

  if found then
    if stored_activity.details ->> 'to' is distinct from next_status::text then
      raise exception 'El identificador de operación ya fue usado para otra transición.'
        using errcode = '23505';
    end if;

    return query
    select
      current_order.id,
      current_order.status,
      (stored_activity.details ->> 'from')::public.work_order_status,
      current_order.updated_at,
      operation_id,
      coalesce((stored_activity.details ->> 'eligible_recipient_count')::integer, 0),
      coalesce((stored_activity.details ->> 'queued_count')::integer, 0),
      coalesce((stored_activity.details ->> 'already_queued_count')::integer, 0),
      true;
    return;
  end if;

  if next_status not in (
    'new'::public.work_order_status,
    'in_progress'::public.work_order_status,
    'completed'::public.work_order_status,
    'cancelled'::public.work_order_status
  ) then
    raise exception 'El estado solicitado no pertenece al flujo de órdenes sin fases.'
      using errcode = '22023';
  end if;

  if current_order.status = next_status then
    raise exception 'La orden ya tiene ese estado.'
      using errcode = '22023';
  end if;

  is_reopening := current_order.status in (
    'completed'::public.work_order_status,
    'cancelled'::public.work_order_status
  );

  if is_reopening then
    if not is_manager then
      raise exception 'Solo Gestión puede reabrir una orden terminada o cancelada.'
        using errcode = '42501';
    end if;
    if next_status <> 'in_progress'::public.work_order_status then
      raise exception 'Una orden cerrada solo puede reabrirse hacia En proceso.'
        using errcode = '22023';
    end if;
    if normalized_reason is null then
      raise exception 'Es obligatorio indicar el motivo de la reapertura.'
        using errcode = '22023';
    end if;
  elsif current_order.status = 'new'::public.work_order_status then
    if next_status not in (
      'in_progress'::public.work_order_status,
      'completed'::public.work_order_status,
      'cancelled'::public.work_order_status
    ) then
      raise exception 'La transición solicitada no está permitida desde Sin iniciar.'
        using errcode = '22023';
    end if;
  elsif current_order.status = 'in_progress'::public.work_order_status then
    if next_status not in (
      'new'::public.work_order_status,
      'completed'::public.work_order_status,
      'cancelled'::public.work_order_status
    ) then
      raise exception 'La transición solicitada no está permitida desde En proceso.'
        using errcode = '22023';
    end if;
  elsif current_order.status = 'in_review'::public.work_order_status then
    if next_status not in (
      'in_progress'::public.work_order_status,
      'completed'::public.work_order_status,
      'cancelled'::public.work_order_status
    ) then
      raise exception 'La transición solicitada no está permitida desde En revisión interna.'
        using errcode = '22023';
    end if;
  else
    raise exception 'El estado actual no puede modificarse desde el flujo sin fases.'
      using errcode = '55000';
  end if;

  if next_status = 'cancelled'::public.work_order_status
    and normalized_reason is null
  then
    raise exception 'Es obligatorio indicar el motivo de la cancelación.'
      using errcode = '22023';
  end if;

  previous_label := public.no_phase_work_order_status_label(current_order.status);
  next_label := public.no_phase_work_order_status_label(next_status);

  select
    public.escape_no_phase_status_email_html(regexp_replace(current_order.code, E'[\\r\\n]+', ' ', 'g')),
    public.escape_no_phase_status_email_html(regexp_replace(current_order.title, E'[\\r\\n]+', ' ', 'g')),
    public.escape_no_phase_status_email_html(regexp_replace(brand.name, E'[\\r\\n]+', ' ', 'g')),
    public.escape_no_phase_status_email_html(coalesce(actor_name, 'Usuario interno'))
  into safe_code, safe_title, safe_brand, safe_actor
  from public.brands brand
  where brand.id = current_order.brand_id;

  safe_reason := case
    when normalized_reason is null then null
    else public.escape_no_phase_status_email_html(normalized_reason)
  end;
  safe_due_date := case
    when current_order.due_date is null then null
    else public.escape_no_phase_status_email_html(to_char(current_order.due_date, 'DD/MM/YYYY'))
  end;
  safe_work_order_url := public.escape_no_phase_status_email_html(
    format(
      'https://sistema-lumen.vercel.app/?module=work-orders&brand=%s&ot=%s',
      current_order.brand_id,
      current_order.code
    )
  );

  email_subject := left(
    case
      when next_status = 'cancelled'::public.work_order_status
        then format('%s fue cancelada', regexp_replace(current_order.code, E'[\\r\\n]+', ' ', 'g'))
      when next_status = 'completed'::public.work_order_status
        then format('%s fue marcada como Terminada', regexp_replace(current_order.code, E'[\\r\\n]+', ' ', 'g'))
      when is_reopening
        then format('%s fue reabierta', regexp_replace(current_order.code, E'[\\r\\n]+', ' ', 'g'))
      else format(
        '%s cambió de %s a %s',
        regexp_replace(current_order.code, E'[\\r\\n]+', ' ', 'g'),
        previous_label,
        next_label
      )
    end,
    180
  );

  email_html :=
    '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' ||
    '<style>@media only screen and (max-width:620px){.lumen-shell{padding:18px 10px!important}.lumen-card{border-radius:10px!important}.lumen-head,.lumen-body{padding-left:20px!important;padding-right:20px!important}.lumen-title{font-size:25px!important}.lumen-row td{display:block!important;width:100%!important;text-align:left!important;padding:7px 0!important}.lumen-row td:last-child{padding-bottom:13px!important}.lumen-cta{display:block!important;text-align:center!important}}</style>' ||
    '</head><body style="margin:0;background:#f6f6f3;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">' ||
    '<div class="lumen-shell" style="margin:0;background:#f6f6f3;padding:28px 16px;">' ||
    '<div class="lumen-card" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">' ||
    '<div class="lumen-head" style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">' ||
    '<div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">ESTADO DE ORDEN ACTUALIZADO</div>' ||
    '<h1 class="lumen-title" style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">' || safe_code || '</h1>' ||
    '<p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">' || safe_title || '</p>' ||
    '</div>' ||
    '<div class="lumen-body" style="padding:0 28px 28px;">' ||
    '<table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">' ||
    '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Marca</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">' || safe_brand || '</td></tr>' ||
    '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado anterior</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">' || public.escape_no_phase_status_email_html(previous_label) || '</td></tr>' ||
    '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado nuevo</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;color:#176339;">' || public.escape_no_phase_status_email_html(next_label) || '</td></tr>' ||
    '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Actualizado por</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">' || safe_actor || '</td></tr>' ||
    '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Fecha y hora</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">' || public.escape_no_phase_status_email_html(to_char(event_timestamp at time zone 'America/Guatemala', 'DD/MM/YYYY HH24:MI')) || '</td></tr>' ||
    case when safe_due_date is null then '' else
      '<tr class="lumen-row"><td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Fecha de entrega</td><td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">' || safe_due_date || '</td></tr>'
    end ||
    '</table>' ||
    case when safe_reason is null then '' else
      '<div style="margin:0 0 22px;border:1px solid #ecece8;border-radius:12px;padding:14px 16px;background:#fafaf8;"><div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:8px;">Motivo</div><div style="font-size:15px;line-height:1.55;color:#3c403d;white-space:pre-wrap;">' || safe_reason || '</div></div>'
    end ||
    '<a class="lumen-cta" href="' || safe_work_order_url || '" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Abrir orden en Lumen</a>' ||
    '<div style="margin-top:16px;font-size:12px;line-height:1.5;color:#7b817c;word-break:break-all;">' || safe_work_order_url || '</div>' ||
    '</div></div></div></body></html>';

  update public.work_orders work_order
  set
    status = next_status,
    updated_at = event_timestamp
  where work_order.id = current_order.id
  returning work_order.updated_at into result_updated_at;

  with recipient_sources as (
    select current_order.created_by as user_id, 1 as source_priority
    where current_order.created_by is not null
    union all
    select assignee.user_id, 2
    from public.work_order_assignees assignee
    where assignee.work_order_id = current_order.id
  ), eligible_recipients as (
    select distinct on (lower(btrim(profile.email)))
      profile.id as user_id,
      lower(btrim(profile.email)) as email
    from recipient_sources source
    join public.profiles profile on profile.id = source.user_id
    where profile.is_active is true
      and profile.role <> 'cliente'::public.app_role
      and profile.email is not null
      and btrim(profile.email) <> ''
    order by lower(btrim(profile.email)), source.source_priority, profile.id
  ), inserted_notifications as (
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
      event_key
    )
    select
      current_order.brand_id,
      current_order.id,
      recipient.user_id,
      recipient.email,
      'status_change'::public.email_notification_type,
      email_subject,
      email_html,
      'queued',
      event_timestamp,
      format('work_order_status_changed:%s:%s', operation_id, recipient.user_id)
    from eligible_recipients recipient
    on conflict (event_key) do nothing
    returning id
  )
  select
    (select count(*)::integer from eligible_recipients),
    count(*)::integer
  into result_eligible_count, result_queued_count
  from inserted_notifications;

  result_already_queued_count := greatest(result_eligible_count - result_queued_count, 0);

  insert into public.work_order_activity (
    work_order_id,
    actor_id,
    action,
    details,
    created_at
  )
  values (
    current_order.id,
    actor_user_id,
    'status_changed',
    jsonb_build_object(
      'from', current_order.status::text,
      'to', next_status::text,
      'without_phases', true,
      'scope', 'without_phases',
      'operation_id', operation_id::text,
      'event_id', operation_id::text,
      'reason', normalized_reason,
      'reopened', is_reopening,
      'eligible_recipient_count', result_eligible_count,
      'queued_count', result_queued_count,
      'already_queued_count', result_already_queued_count
    ),
    event_timestamp
  );

  return query
  select
    current_order.id,
    next_status,
    current_order.status,
    result_updated_at,
    operation_id,
    result_eligible_count,
    result_queued_count,
    result_already_queued_count,
    false;
end;
$function$;

-- Compatibility for already-open clients. The new UI calls the transition RPC directly.
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
begin
  return query
  select
    result.work_order_id,
    result.status,
    result.updated_at
  from public.transition_work_order_without_phases(
    target_work_order_id,
    'completed'::public.work_order_status,
    gen_random_uuid(),
    null
  ) result;
end;
$function$;

revoke all on function public.escape_no_phase_status_email_html(text)
from public, anon, authenticated;

revoke all on function public.no_phase_work_order_status_label(public.work_order_status)
from public, anon, authenticated;

revoke all on function public.transition_work_order_without_phases(
  uuid, public.work_order_status, uuid, text
)
from public, anon;

grant execute on function public.transition_work_order_without_phases(
  uuid, public.work_order_status, uuid, text
)
to authenticated;

revoke all on function public.complete_work_order_without_phases(uuid)
from public, anon;

grant execute on function public.complete_work_order_without_phases(uuid)
to authenticated;
