-- Lumen Workspace: restaura la plantilla visual histórica de "Nueva orden".
-- Este patch solo reemplaza la generación de html_body. No modifica policies,
-- destinatarios, estados de cola, cron, worker ni registros existentes.

BEGIN;

CREATE OR REPLACE FUNCTION public.escape_assignment_email_html(input_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT replace(
    replace(
      replace(
        replace(
          replace(COALESCE(input_value, ''), '&', '&amp;'),
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
$$;

REVOKE ALL
ON FUNCTION public.escape_assignment_email_html(text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.escape_assignment_email_html(text)
FROM anon;

REVOKE ALL
ON FUNCTION public.escape_assignment_email_html(text)
FROM authenticated;

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
  client_name text;
  creator_name text;
  client_brand_label text;
  assignee_names text;
  phase_assignee_names text;
  description_raw text;
  description_marker constant text := E'\n\n---\nSeguimiento operativo';
  description_marker_position integer := 0;
  context_text text := '';
  extras_text text := '';
  subtasks_text text := '';
  material_changes_text text := '';
  uploaded_count integer := 0;
  file_label text;
  priority_label text;
  status_label text;
  category_label text;
  work_order_url text;
  escaped_code text;
  escaped_title text;
  escaped_client_brand text;
  escaped_due_date text;
  escaped_priority text;
  escaped_status text;
  escaped_category text;
  escaped_art_count text;
  escaped_assignees text;
  escaped_phase_assignees text;
  escaped_context text;
  escaped_subtasks text;
  escaped_material_changes text;
  escaped_file_label text;
  escaped_creator_name text;
  escaped_work_order_url text;
  metadata_rows text := '';
  assignees_block text := '';
  phase_assignees_block text := '';
  context_block text := '';
  tracking_block text := '';
  creator_pill text := '';
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

  -- Ownership and brand access remain in the locking query so an
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

  SELECT
    b.name,
    c.name
  INTO
    brand_name,
    client_name
  FROM public.brands AS b
  LEFT JOIN public.clients AS c
    ON c.id = b.client_id
  WHERE b.id = order_row.brand_id;

  SELECT p.full_name
  INTO creator_name
  FROM public.profiles AS p
  WHERE p.id = order_row.created_by;

  SELECT string_agg(responsible.full_name, ', ' ORDER BY responsible.full_name)
  INTO assignee_names
  FROM (
    SELECT DISTINCT
      p.id,
      trim(p.full_name) AS full_name
    FROM public.work_order_assignees AS woa
    JOIN public.profiles AS p
      ON p.id = woa.user_id
    WHERE woa.work_order_id = order_row.id
      AND trim(COALESCE(p.full_name, '')) <> ''
  ) AS responsible;

  SELECT string_agg(responsible.full_name, ', ' ORDER BY responsible.full_name)
  INTO phase_assignee_names
  FROM (
    SELECT DISTINCT
      p.id,
      trim(p.full_name) AS full_name
    FROM public.work_order_phases AS wop
    JOIN public.profiles AS p
      ON p.id = wop.assigned_to
    WHERE wop.work_order_id = order_row.id
      AND trim(COALESCE(p.full_name, '')) <> ''
  ) AS responsible;

  SELECT count(*)::integer
  INTO uploaded_count
  FROM public.work_order_files AS wof
  WHERE wof.work_order_id = order_row.id;

  client_brand_label := concat_ws(
    ' / ',
    NULLIF(trim(COALESCE(client_name, '')), ''),
    NULLIF(trim(COALESCE(brand_name, '')), '')
  );

  priority_label := CASE order_row.priority::text
    WHEN 'high' THEN 'Alta'
    WHEN 'medium' THEN 'Media'
    WHEN 'low' THEN 'Baja'
    ELSE NULLIF(trim(order_row.priority::text), '')
  END;

  status_label := CASE order_row.status::text
    WHEN 'new' THEN 'Nueva'
    WHEN 'in_progress' THEN 'En proceso'
    WHEN 'in_review' THEN 'En revisión interna'
    WHEN 'client_approved' THEN 'Aprobada por cliente'
    WHEN 'scheduled' THEN 'Programada'
    WHEN 'completed' THEN 'Entregada'
    WHEN 'cancelled' THEN 'Cancelada'
    ELSE NULLIF(trim(order_row.status::text), '')
  END;

  category_label := CASE order_row.category
    WHEN 'matriz' THEN 'Matriz'
    WHEN 'campana' THEN 'Campaña'
    WHEN 'dinamica_digital' THEN 'Dinámica digital'
    WHEN 'arte_final' THEN 'Arte final'
    WHEN 'propuesta' THEN 'Propuesta'
    WHEN 'cotizacion' THEN 'Cotización'
    WHEN 'diseno' THEN 'Diseño'
    WHEN 'edicion' THEN 'Edición'
    WHEN 'copy' THEN 'Copy'
    WHEN 'pauta' THEN 'Pauta'
    WHEN 'produccion' THEN 'Producción'
    WHEN 'desarrollo' THEN 'Desarrollo'
    WHEN 'otro' THEN 'Otro'
    ELSE NULLIF(trim(order_row.category), '')
  END;

  description_raw := COALESCE(order_row.description, '');
  description_marker_position := strpos(description_raw, description_marker);

  IF description_marker_position > 0 THEN
    context_text := trim(
      substring(description_raw FROM 1 FOR description_marker_position - 1)
    );
    extras_text := trim(
      substring(
        description_raw
        FROM description_marker_position + length(description_marker)
      )
    );
  ELSE
    context_text := trim(description_raw);
  END IF;

  IF strpos(extras_text, E'Subtareas:\n') > 0 THEN
    subtasks_text := split_part(extras_text, E'Subtareas:\n', 2);
    IF strpos(subtasks_text, E'\n\nCambios en materiales:') > 0 THEN
      subtasks_text := split_part(
        subtasks_text,
        E'\n\nCambios en materiales:',
        1
      );
    END IF;
  END IF;

  IF strpos(extras_text, E'Cambios en materiales:\n') > 0 THEN
    material_changes_text := split_part(
      extras_text,
      E'Cambios en materiales:\n',
      2
    );
  END IF;

  context_text := trim(
    regexp_replace(context_text, '[[:space:]]+', ' ', 'g')
  );
  subtasks_text := trim(
    regexp_replace(
      regexp_replace(
        subtasks_text,
        E'(^|\\n)[[:space:]]*[-*][[:space:]]*',
        E'\\1',
        'g'
      ),
      E'[[:space:]]*\\n+[[:space:]]*',
      ' / ',
      'g'
    )
  );
  material_changes_text := trim(
    regexp_replace(
      regexp_replace(
        material_changes_text,
        E'(^|\\n)[[:space:]]*[-*][[:space:]]*',
        E'\\1',
        'g'
      ),
      E'[[:space:]]*\\n+[[:space:]]*',
      ' / ',
      'g'
    )
  );

  file_label := CASE uploaded_count
    WHEN 0 THEN 'Sin archivos adjuntos'
    WHEN 1 THEN '1 archivo adjunto'
    ELSE uploaded_count::text || ' archivos adjuntos'
  END;

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

  work_order_url := format(
    'https://sistema-lumen.vercel.app/?module=work-orders&brand=%s&ot=%s',
    order_row.brand_id::text,
    subject_code
  );

  escaped_code := public.escape_assignment_email_html(order_row.code);
  escaped_title := public.escape_assignment_email_html(order_row.title);
  escaped_client_brand := public.escape_assignment_email_html(client_brand_label);
  escaped_due_date := public.escape_assignment_email_html(
    CASE
      WHEN order_row.due_date IS NULL THEN NULL
      ELSE
        extract(day FROM order_row.due_date)::integer::text || ' ' ||
        CASE extract(month FROM order_row.due_date)::integer
          WHEN 1 THEN 'ene'
          WHEN 2 THEN 'feb'
          WHEN 3 THEN 'mar'
          WHEN 4 THEN 'abr'
          WHEN 5 THEN 'may'
          WHEN 6 THEN 'jun'
          WHEN 7 THEN 'jul'
          WHEN 8 THEN 'ago'
          WHEN 9 THEN 'sep'
          WHEN 10 THEN 'oct'
          WHEN 11 THEN 'nov'
          WHEN 12 THEN 'dic'
        END || ' ' ||
        extract(year FROM order_row.due_date)::integer::text
    END
  );
  escaped_priority := public.escape_assignment_email_html(priority_label);
  escaped_status := public.escape_assignment_email_html(status_label);
  escaped_category := public.escape_assignment_email_html(category_label);
  escaped_art_count := public.escape_assignment_email_html(order_row.art_count::text);
  escaped_assignees := public.escape_assignment_email_html(assignee_names);
  escaped_phase_assignees := public.escape_assignment_email_html(phase_assignee_names);
  escaped_context := public.escape_assignment_email_html(context_text);
  escaped_subtasks := public.escape_assignment_email_html(subtasks_text);
  escaped_material_changes := public.escape_assignment_email_html(material_changes_text);
  escaped_file_label := public.escape_assignment_email_html(file_label);
  escaped_creator_name := public.escape_assignment_email_html(creator_name);
  escaped_work_order_url := public.escape_assignment_email_html(work_order_url);

  IF escaped_client_brand <> '' THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cliente / marca</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_client_brand
    );
  END IF;

  IF order_row.due_date IS NOT NULL THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Deadline</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_due_date
    );
  END IF;

  IF escaped_priority <> '' THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Prioridad</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_priority
    );
  END IF;

  IF escaped_status <> '' THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_status
    );
  END IF;

  IF escaped_category <> '' THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Categoria</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_category
    );
  END IF;

  IF order_row.art_count IS NOT NULL THEN
    metadata_rows := metadata_rows || format(
      '<tr>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cantidad de artes</td>' ||
      '<td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">%s</td>' ||
      '</tr>',
      escaped_art_count
    );
  END IF;

  IF escaped_assignees <> '' THEN
    assignees_block := format(
      '<div style="margin-bottom:18px;">' ||
      '<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Responsables</div>' ||
      '<div style="font-size:16px;line-height:1.45;">%s</div>' ||
      '</div>',
      escaped_assignees
    );
  END IF;

  IF escaped_phase_assignees <> '' THEN
    phase_assignees_block := format(
      '<div style="margin-bottom:18px;">' ||
      '<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Responsables por fase</div>' ||
      '<div style="font-size:16px;line-height:1.45;">%s</div>' ||
      '</div>',
      escaped_phase_assignees
    );
  END IF;

  IF escaped_context <> '' THEN
    context_block := format(
      '<div style="margin-bottom:22px;">' ||
      '<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Contexto</div>' ||
      '<div style="font-size:16px;line-height:1.55;color:#3c403d;">%s</div>' ||
      '</div>',
      escaped_context
    );
  END IF;

  IF escaped_subtasks <> '' OR escaped_material_changes <> '' THEN
    tracking_block :=
      '<div style="margin-bottom:22px;border:1px solid #ecece8;border-radius:12px;padding:14px 16px;background:#fafaf8;">';

    IF escaped_subtasks <> '' THEN
      tracking_block := tracking_block || format(
        '<div style="font-size:14px;line-height:1.55;%s"><strong>Subtareas:</strong> %s</div>',
        CASE WHEN escaped_material_changes <> '' THEN 'margin-bottom:8px;' ELSE '' END,
        escaped_subtasks
      );
    END IF;

    IF escaped_material_changes <> '' THEN
      tracking_block := tracking_block || format(
        '<div style="font-size:14px;line-height:1.55;"><strong>Cambios en materiales:</strong> %s</div>',
        escaped_material_changes
      );
    END IF;

    tracking_block := tracking_block || '</div>';
  END IF;

  IF escaped_creator_name <> '' THEN
    creator_pill := format(
      '<span style="display:inline-block;background:#f0f1ee;color:#555b56;border-radius:999px;padding:8px 12px;">Creada por %s</span>',
      escaped_creator_name
    );
  END IF;

  email_html_body := format(
    '<div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">' ||
    '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">' ||
    '<div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">' ||
    '<div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5f6b61;margin-bottom:10px;">NUEVA ORDEN PARA SEGUIMIENTO</div>' ||
    '<h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">%s</h1>' ||
    '<p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">%s</p>' ||
    '</div>' ||
    '<div style="padding:0 28px 24px;">' ||
    '<table role="presentation" style="width:100%%;border-collapse:collapse;margin:10px 0 22px;">%s</table>' ||
    '%s%s%s%s' ||
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">' ||
    '<span style="display:inline-block;background:#e9fff1;color:#176339;border-radius:999px;padding:8px 12px;font-weight:700;">%s</span>' ||
    '%s' ||
    '</div>' ||
    '<a href="%s" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Ver orden en Lumen</a>' ||
    '<p style="margin:20px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">' ||
    'Si el boton no abre, copia este link en tu navegador:<br/>' ||
    '<a href="%s" style="color:#2d2d2d;overflow-wrap:anywhere;">%s</a>' ||
    '</p>' ||
    '</div>' ||
    '</div>' ||
    '</div>',
    escaped_code,
    escaped_title,
    metadata_rows,
    assignees_block,
    phase_assignees_block,
    context_block,
    tracking_block,
    escaped_file_label,
    creator_pill,
    escaped_work_order_url,
    escaped_work_order_url,
    escaped_work_order_url
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
  'Queues deduplicated assignment notifications using persisted recipients and the restored full visual work-order template.';

COMMIT;
