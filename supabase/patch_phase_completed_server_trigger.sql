-- Queue phase_completed notifications in the same transaction that changes
-- work_order_phases.status to completed.

BEGIN;

ALTER TABLE public.email_notifications
  ADD COLUMN IF NOT EXISTS work_order_phase_id uuid;

ALTER TABLE public.email_notifications
  ADD COLUMN IF NOT EXISTS event_occurred_at timestamptz;

ALTER TABLE public.email_notifications
  ADD COLUMN IF NOT EXISTS event_actor_user_id uuid;

COMMENT ON COLUMN public.email_notifications.work_order_phase_id IS
  'Phase that originated a phase_completed notification event.';

COMMENT ON COLUMN public.email_notifications.event_occurred_at IS
  'Exact completed_at value that identifies the notification event.';

COMMENT ON COLUMN public.email_notifications.event_actor_user_id IS
  'Authenticated user who caused the event. No FK preserves audit history.';

CREATE INDEX IF NOT EXISTS idx_email_notifications_work_order_phase
  ON public.email_notifications (work_order_phase_id, event_occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS
  email_notifications_phase_completed_event_recipient_active_uidx
  ON public.email_notifications (
    work_order_phase_id,
    event_occurred_at,
    lower(btrim(recipient_email))
  )
  WHERE notification_type =
      'phase_completed'::public.email_notification_type
    AND status IN ('queued', 'sent');

CREATE OR REPLACE FUNCTION public.escape_phase_completed_email_html(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $function$
  SELECT replace(
    replace(
      replace(
        replace(
          replace(coalesce(value, ''), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ),
      '"',
      '&quot;'
    ),
    chr(39),
    '&#39;'
  );
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_phase_completed_notification_event(
  target_phase_id uuid,
  target_completed_at timestamptz,
  target_actor_id uuid
)
RETURNS TABLE (
  eligible_recipient_count integer,
  queued_count integer,
  already_queued_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  phase_row public.work_order_phases%ROWTYPE;
  order_row public.work_orders%ROWTYPE;
  brand_row public.brands%ROWTYPE;
  next_phase_row public.work_order_phases%ROWTYPE;
  client_name text;
  actor_name text;
  next_assignee_name text;
  responsible_names text;
  responsible_row_html text := '';
  next_phase_rows_html text := '';
  email_subject text;
  email_html_body text;
  work_order_url text;
BEGIN
  IF target_phase_id IS NULL
     OR target_completed_at IS NULL
     OR target_actor_id IS NULL THEN
    RAISE EXCEPTION 'phase_completed_event_identity_required';
  END IF;

  SELECT phase.*
  INTO phase_row
  FROM public.work_order_phases AS phase
  WHERE phase.id = target_phase_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_phase_not_found';
  END IF;

  IF phase_row.status IS DISTINCT FROM
      'completed'::public.work_order_phase_status
     OR phase_row.completed_at IS DISTINCT FROM target_completed_at THEN
    RAISE EXCEPTION 'phase_completed_event_mismatch';
  END IF;

  SELECT work_order.*
  INTO order_row
  FROM public.work_orders AS work_order
  WHERE work_order.id = phase_row.work_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'work_order_not_found';
  END IF;

  SELECT brand.*
  INTO brand_row
  FROM public.brands AS brand
  WHERE brand.id = order_row.brand_id;

  SELECT client.name
  INTO client_name
  FROM public.clients AS client
  WHERE client.id = brand_row.client_id;

  SELECT next_phase.*
  INTO next_phase_row
  FROM public.work_order_phases AS next_phase
  WHERE next_phase.work_order_id = phase_row.work_order_id
    AND (
      next_phase.sort_order,
      next_phase.id
    ) > (
      phase_row.sort_order,
      phase_row.id
    )
  ORDER BY next_phase.sort_order, next_phase.id
  LIMIT 1;

  SELECT profile.full_name
  INTO actor_name
  FROM public.profiles AS profile
  WHERE profile.id = target_actor_id;

  IF next_phase_row.assigned_to IS NOT NULL THEN
    SELECT profile.full_name
    INTO next_assignee_name
    FROM public.profiles AS profile
    WHERE profile.id = next_phase_row.assigned_to;
  END IF;

  SELECT string_agg(responsible.full_name, ', ' ORDER BY responsible.full_name)
  INTO responsible_names
  FROM (
    SELECT DISTINCT profile.id, profile.full_name
    FROM (
      SELECT assignee.user_id
      FROM public.work_order_assignees AS assignee
      WHERE assignee.work_order_id = order_row.id

      UNION

      SELECT order_phase.assigned_to
      FROM public.work_order_phases AS order_phase
      WHERE order_phase.work_order_id = order_row.id
        AND order_phase.assigned_to IS NOT NULL
    ) AS related_user
    JOIN public.profiles AS profile
      ON profile.id = related_user.user_id
    WHERE btrim(coalesce(profile.full_name, '')) <> ''
  ) AS responsible;

  work_order_url :=
    'https://sistema-lumen.vercel.app/?module=work-orders&brand=' ||
    coalesce(order_row.brand_id::text, '') ||
    '&ot=' ||
    coalesce(order_row.code, '');

  email_subject := regexp_replace(
    'Fase completada: ' ||
      coalesce(phase_row.title, 'Fase') ||
      ' · ' ||
      coalesce(order_row.code, ''),
    E'[\r\n]+',
    ' ',
    'g'
  );

  IF btrim(coalesce(responsible_names, '')) <> '' THEN
    responsible_row_html := format(
      $row$
        <tr>
          <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Responsables</td>
          <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>
        </tr>
      $row$,
      public.escape_phase_completed_email_html(responsible_names)
    );
  END IF;

  IF next_phase_row.id IS NOT NULL THEN
    next_phase_rows_html := format(
      $rows$
        <tr>
          <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Siguiente fase</td>
          <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>
        </tr>
        %s
      $rows$,
      public.escape_phase_completed_email_html(next_phase_row.title),
      CASE
        WHEN btrim(coalesce(next_assignee_name, '')) <> '' THEN format(
          $row$
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Responsable siguiente</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>
            </tr>
          $row$,
          public.escape_phase_completed_email_html(next_assignee_name)
        )
        ELSE ''
      END
    );
  END IF;

  email_html_body := format(
    $html$
      <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
          <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
            <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">
              Fase completada
            </div>
            <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">%s</h1>
            <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">%s · %s</p>
          </div>
          <div style="padding:0 28px 26px;">
            <table role="presentation" style="width:100%%;border-collapse:collapse;margin:10px 0 22px;">
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cliente / marca</td>
                <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s / %s</td>
              </tr>
              <tr>
                <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Completada por</td>
                <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>
              </tr>
              %s
              %s
            </table>
            <a href="%s" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">
              Ver orden en Lumen
            </a>
            <p style="margin:20px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">
              Si el botón no abre, copia este link en tu navegador:<br/>
              <a href="%s" style="color:#2d2d2d;">%s</a>
            </p>
          </div>
        </div>
      </div>
    $html$,
    public.escape_phase_completed_email_html(phase_row.title),
    public.escape_phase_completed_email_html(order_row.code),
    public.escape_phase_completed_email_html(order_row.title),
    public.escape_phase_completed_email_html(coalesce(client_name, 'Cliente')),
    public.escape_phase_completed_email_html(coalesce(brand_row.name, 'Marca')),
    public.escape_phase_completed_email_html(coalesce(actor_name, 'Equipo Lumen')),
    responsible_row_html,
    next_phase_rows_html,
    public.escape_phase_completed_email_html(work_order_url),
    public.escape_phase_completed_email_html(work_order_url),
    public.escape_phase_completed_email_html(work_order_url)
  );

  RETURN QUERY
  WITH source_users AS (
    SELECT order_row.created_by AS user_id, 1 AS source_priority

    UNION ALL

    SELECT assignee.user_id, 2
    FROM public.work_order_assignees AS assignee
    WHERE assignee.work_order_id = order_row.id

    UNION ALL

    SELECT phase_row.assigned_to, 3

    UNION ALL

    SELECT next_phase_row.assigned_to, 4

    UNION ALL

    SELECT configured.user_id, 5
    FROM public.brand_notification_recipients AS configured
    WHERE configured.brand_id = order_row.brand_id
  ),
  eligible_recipients AS MATERIALIZED (
    SELECT DISTINCT ON (lower(btrim(profile.email)))
      profile.id AS recipient_user_id,
      lower(btrim(profile.email)) AS recipient_email
    FROM source_users AS source
    JOIN public.profiles AS profile
      ON profile.id = source.user_id
    WHERE source.user_id IS NOT NULL
      AND profile.is_active IS TRUE
      AND profile.email IS NOT NULL
      AND btrim(profile.email) <> ''
      AND lower(btrim(profile.email)) ~
        '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ORDER BY
      lower(btrim(profile.email)),
      source.source_priority,
      profile.id
  ),
  inserted AS (
    INSERT INTO public.email_notifications (
      brand_id,
      work_order_id,
      work_order_phase_id,
      event_occurred_at,
      event_actor_user_id,
      recipient_user_id,
      recipient_email,
      notification_type,
      subject,
      html_body,
      status,
      scheduled_for,
      error_message
    )
    SELECT
      order_row.brand_id,
      order_row.id,
      phase_row.id,
      target_completed_at,
      target_actor_id,
      recipient.recipient_user_id,
      recipient.recipient_email,
      'phase_completed'::public.email_notification_type,
      email_subject,
      email_html_body,
      'queued',
      now(),
      NULL
    FROM eligible_recipients AS recipient
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT
    (SELECT count(*)::integer FROM eligible_recipients),
    (SELECT count(*)::integer FROM inserted),
    (
      (SELECT count(*)::integer FROM eligible_recipients) -
      (SELECT count(*)::integer FROM inserted)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.queue_phase_completed_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM
      'completed'::public.work_order_phase_status
     AND NEW.status =
      'completed'::public.work_order_phase_status THEN
    IF NEW.completed_at IS NULL THEN
      RAISE EXCEPTION 'phase_completed_at_required';
    END IF;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'phase_completed_actor_required';
    END IF;

    PERFORM public.enqueue_phase_completed_notification_event(
      NEW.id,
      NEW.completed_at,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_phase_completed_server_producer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.notification_type::text = 'phase_completed'
     AND (
       NEW.work_order_phase_id IS NULL
       OR NEW.event_occurred_at IS NULL
       OR NEW.event_actor_user_id IS NULL
     ) THEN
    RAISE EXCEPTION
      USING
        ERRCODE = '42501',
        MESSAGE = 'phase_completed_must_be_queued_by_server';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_queue_phase_completed_after_update
  ON public.work_order_phases;

CREATE TRIGGER trg_queue_phase_completed_after_update
AFTER UPDATE OF status
ON public.work_order_phases
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM
    'completed'::public.work_order_phase_status
  AND NEW.status =
    'completed'::public.work_order_phase_status
)
EXECUTE FUNCTION public.queue_phase_completed_after_update();

DROP TRIGGER IF EXISTS trg_enforce_phase_completed_server_producer
  ON public.email_notifications;

CREATE TRIGGER trg_enforce_phase_completed_server_producer
BEFORE INSERT
ON public.email_notifications
FOR EACH ROW
WHEN (NEW.notification_type::text = 'phase_completed')
EXECUTE FUNCTION public.enforce_phase_completed_server_producer();

REVOKE ALL ON FUNCTION
  public.escape_phase_completed_email_html(text)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.enqueue_phase_completed_notification_event(uuid, timestamptz, uuid)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.queue_phase_completed_after_update()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.enforce_phase_completed_server_producer()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.enqueue_phase_completed_notification_event(uuid, timestamptz, uuid)
  TO service_role;

COMMIT;
