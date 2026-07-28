-- Lumen Workspace: encolado seguro de correos assignment al crear una OT.
-- Revisar antes de ejecutar en Supabase. Este patch no modifica policies existentes.

BEGIN;

CREATE OR REPLACE FUNCTION public.queue_work_order_assignment_notifications(
  target_work_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  order_row public.work_orders%ROWTYPE;
  brand_name text;
  escaped_code text;
  escaped_title text;
  escaped_brand text;
  escaped_due_date text;
  subject_code text;
  subject_title text;
  subject_brand text;
  email_subject text;
  email_html_body text;
  eligible_recipient_count integer := 0;
  queued_count integer := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '28000',
      MESSAGE = 'authentication_required';
  END IF;

  IF NOT COALESCE(public.can_create_work_orders(), false) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'work_order_creation_not_allowed';
  END IF;

  -- Ownership and brand access are checked in the locking query so an
  -- unauthorized caller cannot lock another user's work order.
  SELECT wo.*
  INTO order_row
  FROM public.work_orders AS wo
  WHERE wo.id = target_work_order_id
    AND wo.created_by = current_user_id
    AND public.can_access_brand(wo.brand_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'work_order_not_found_or_not_authorized';
  END IF;

  SELECT b.name
  INTO brand_name
  FROM public.brands AS b
  WHERE b.id = order_row.brand_id;

  escaped_code := replace(
    replace(
      replace(
        replace(
          replace(COALESCE(order_row.code, ''), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ),
      '"',
      '&quot;'
    ),
    '''',
    '&#39;'
  );
  escaped_title := replace(
    replace(
      replace(
        replace(
          replace(COALESCE(order_row.title, ''), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ),
      '"',
      '&quot;'
    ),
    '''',
    '&#39;'
  );
  escaped_brand := replace(
    replace(
      replace(
        replace(
          replace(COALESCE(brand_name, 'Sin marca'), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ),
      '"',
      '&quot;'
    ),
    '''',
    '&#39;'
  );
  escaped_due_date := COALESCE(
    to_char(order_row.due_date, 'DD/MM/YYYY'),
    'Sin fecha'
  );

  subject_code := trim(
    replace(replace(COALESCE(order_row.code, ''), chr(13), ' '), chr(10), ' ')
  );
  subject_title := trim(
    replace(replace(COALESCE(order_row.title, ''), chr(13), ' '), chr(10), ' ')
  );
  subject_brand := trim(
    replace(replace(COALESCE(brand_name, 'Sin marca'), chr(13), ' '), chr(10), ' ')
  );
  email_subject := format(
    'Nueva OT creada: %s - %s · %s',
    subject_code,
    subject_title,
    subject_brand
  );
  email_html_body := format(
    '<div style="font-family:Arial,sans-serif;color:#202722;line-height:1.5">' ||
    '<h1 style="font-size:24px;margin:0 0 16px">Nueva orden de trabajo</h1>' ||
    '<p><strong>%s</strong> · %s</p>' ||
    '<p><strong>Marca:</strong> %s<br><strong>Deadline:</strong> %s</p>' ||
    '<p>La orden ya está disponible en Lumen Workspace.</p>' ||
    '</div>',
    escaped_code,
    escaped_title,
    escaped_brand,
    escaped_due_date
  );

  WITH recipient_sources AS (
    SELECT order_row.created_by AS user_id, 1 AS source_priority
    WHERE order_row.created_by IS NOT NULL

    UNION ALL

    SELECT woa.user_id, 2 AS source_priority
    FROM public.work_order_assignees AS woa
    WHERE woa.work_order_id = order_row.id
      AND woa.user_id IS NOT NULL

    UNION ALL

    SELECT wop.assigned_to AS user_id, 3 AS source_priority
    FROM public.work_order_phases AS wop
    WHERE wop.work_order_id = order_row.id
      AND wop.assigned_to IS NOT NULL

    UNION ALL

    SELECT bnr.user_id, 4 AS source_priority
    FROM public.brand_notification_recipients AS bnr
    WHERE bnr.brand_id = order_row.brand_id
      AND bnr.user_id IS NOT NULL
  ),
  eligible_profiles AS (
    SELECT
      rs.user_id,
      rs.source_priority,
      lower(trim(p.email)) AS normalized_email
    FROM recipient_sources AS rs
    JOIN public.profiles AS p
      ON p.id = rs.user_id
    WHERE p.is_active = true
      AND p.email IS NOT NULL
      AND trim(p.email) <> ''
      AND trim(p.email) ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  deduplicated_recipients AS (
    SELECT DISTINCT ON (ep.normalized_email)
      ep.user_id,
      ep.normalized_email
    FROM eligible_profiles AS ep
    ORDER BY
      ep.normalized_email,
      ep.source_priority,
      ep.user_id
  ),
  inserted_notifications AS (
    INSERT INTO public.email_notifications (
      brand_id,
      work_order_id,
      recipient_user_id,
      recipient_email,
      notification_type,
      subject,
      html_body,
      status,
      scheduled_for
    )
    SELECT
      order_row.brand_id,
      order_row.id,
      recipient.user_id,
      recipient.normalized_email,
      'assignment'::public.email_notification_type,
      email_subject,
      email_html_body,
      'queued',
      now()
    FROM deduplicated_recipients AS recipient
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.email_notifications AS existing
      WHERE existing.work_order_id = order_row.id
        AND existing.notification_type::text = 'assignment'
        AND existing.status IN ('queued', 'sent')
        AND lower(trim(existing.recipient_email)) = recipient.normalized_email
    )
    RETURNING id
  )
  SELECT
    (SELECT count(*) FROM deduplicated_recipients),
    (SELECT count(*) FROM inserted_notifications)
  INTO eligible_recipient_count, queued_count;

  IF eligible_recipient_count = 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'no_valid_assignment_recipients';
  END IF;

  RETURN jsonb_build_object(
    'eligible_recipient_count', eligible_recipient_count,
    'queued_count', queued_count,
    'already_queued_count', eligible_recipient_count - queued_count
  );
END;
$$;

REVOKE ALL
ON FUNCTION public.queue_work_order_assignment_notifications(uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.queue_work_order_assignment_notifications(uuid)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.queue_work_order_assignment_notifications(uuid)
TO authenticated;

COMMENT ON FUNCTION public.queue_work_order_assignment_notifications(uuid) IS
  'Queues deduplicated assignment notifications for a work order using persisted recipients. Only the authenticated work-order creator with create permission may execute it.';

COMMIT;
