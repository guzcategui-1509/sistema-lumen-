type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type WorkOrder = {
  id: string;
  code: string;
  title: string;
  brand_id: string;
  created_by: string | null;
  status: string;
};

type Brand = {
  id: string;
  name: string;
};

type WorkOrderAssignee = {
  work_order_id: string;
  user_id: string;
};

type Activity = {
  id: string;
  work_order_id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type RequestProfile = {
  role: string;
  is_active: boolean;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const CONFIGURED_APP_URL = Deno.env.get("APP_URL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const requestHeaders = new Headers(headers);
  new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: requestHeaders,
  });
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function authorizeRequest(request: Request) {
  if (CRON_SECRET && request.headers.get("x-cron-secret") === CRON_SECRET) return { ok: true };

  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Authorization header" };
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
  });
  if (!userResponse.ok) return { ok: false, status: 401, error: "Invalid session" };

  const user = (await userResponse.json()) as { id?: string };
  const profileResponse = await supabaseRequest(`profiles?id=eq.${user.id}&select=role,is_active&limit=1`);
  if (!profileResponse.ok) return { ok: false, status: 500, error: await profileResponse.text() };

  const profile = ((await profileResponse.json()) as RequestProfile[])[0];
  if (!profile?.is_active || !["admin", "directora", "cuentas"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Only direccion or cuentas can queue daily digest" };
  }
  return { ok: true };
}

function escapeHtml(value: unknown = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAppUrl(request: Request) {
  return (CONFIGURED_APP_URL || request.headers.get("origin") || "").replace(/\/$/, "");
}

function buildWorkOrderUrl(appUrl: string, order: WorkOrder) {
  if (!appUrl) return "";
  const url = new URL(appUrl);
  url.searchParams.set("module", "work-orders");
  url.searchParams.set("brand", order.brand_id);
  url.searchParams.set("ot", order.code);
  return url.toString();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guatemala",
  });
}

function statusLabel(status: unknown) {
  const labels: Record<string, string> = {
    new: "Nueva",
    in_progress: "En proceso",
    in_review: "Revisión interna",
    sent_to_client: "Enviada al cliente",
    changes_requested: "Con cambios",
    client_approved: "Aprobada por cliente",
    scheduled: "Programada",
    completed: "Entregada",
    cancelled: "Cancelada",
  };
  return labels[String(status)] ?? String(status);
}

function activityLabel(activity: Activity, actorName: string) {
  const details = activity.details ?? {};
  switch (activity.action) {
    case "created":
      return `${actorName} creó la orden`;
    case "updated": {
      const changes = Array.isArray(details.changes) ? details.changes.map(String).slice(0, 4) : [];
      return changes.length ? `${actorName}: ${changes.join(" · ")}` : `${actorName} actualizó la orden`;
    }
    case "status_changed":
      return `${actorName} cambió el estado de ${statusLabel(details.from)} a ${statusLabel(details.to)}`;
    case "materials_uploaded":
      return `${actorName} subió ${Number(details.files_added) || 1} material(es)`;
    case "file_deleted":
      return `${actorName} eliminó el archivo ${String(details.file_name || "")}`.trim();
    case "urgent_rebalanced":
      return `${actorName} aplicó un ajuste urgente de carga y fecha`;
    case "archived":
      return `${actorName} archivó la orden`;
    case "unarchived":
      return `${actorName} restauró la orden`;
    default:
      return `${actorName} registró un cambio`;
  }
}

function buildDigestHtml(
  profile: Profile,
  activities: Activity[],
  orderMap: Map<string, WorkOrder>,
  brandMap: Map<string, string>,
  profileMap: Map<string, Profile>,
  appUrl: string,
) {
  const grouped = new Map<string, Activity[]>();
  activities.forEach((activity) => {
    const current = grouped.get(activity.work_order_id) ?? [];
    current.push(activity);
    grouped.set(activity.work_order_id, current);
  });

  const orderSections = Array.from(grouped.entries())
    .map(([orderId, orderActivities]) => {
      const order = orderMap.get(orderId);
      if (!order) return "";
      const link = buildWorkOrderUrl(appUrl, order);
      const activityRows = orderActivities
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((activity) => {
          const actorName = activity.actor_id ? profileMap.get(activity.actor_id)?.full_name || "El equipo" : "El equipo";
          return `
            <div style="padding:9px 0;border-top:1px solid #ecece8;font-size:14px;line-height:1.45;color:#465049;">
              <strong style="color:#687069;margin-right:8px;">${escapeHtml(formatTime(activity.created_at))}</strong>
              ${escapeHtml(activityLabel(activity, actorName))}
            </div>
          `;
        })
        .join("");

      return `
        <div style="border:1px solid #deded8;border-radius:12px;background:#ffffff;margin-bottom:12px;padding:16px 18px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#687069;">
            ${escapeHtml(order.code)} · ${escapeHtml(brandMap.get(order.brand_id) || "Marca")}
          </div>
          <h3 style="margin:6px 0 10px;font-size:18px;line-height:1.25;color:#202923;">${escapeHtml(order.title)}</h3>
          ${activityRows}
          ${
            link
              ? `<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:12px;color:#176339;font-size:14px;font-weight:800;text-decoration:none;">Ver orden →</a>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  const firstName = profile.full_name.split(" ")[0] || profile.full_name;
  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#202923;">
      <div style="max-width:700px;margin:0 auto;">
        <div style="background:#202923;border-radius:14px 14px 0 0;padding:25px 28px;border-left:7px solid #49ee8c;">
          <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#49ee8c;margin-bottom:9px;">Lumen Workspace</div>
          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.15;">Resumen diario de actividad</h1>
          <p style="margin:10px 0 0;color:#d7dbd7;font-size:15px;line-height:1.45;">
            Hola ${escapeHtml(firstName)}, hoy hubo ${activities.length} cambio${activities.length === 1 ? "" : "s"} en ${grouped.size} OT${grouped.size === 1 ? "" : "s"} relacionadas contigo.
          </p>
        </div>
        <div style="background:#ffffff;border:1px solid #deded8;border-top:0;border-radius:0 0 14px 14px;padding:22px;">
          ${orderSections}
          <p style="margin:16px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">
            Las asignaciones nuevas y alertas urgentes se envían al momento. Las ediciones rutinarias se reúnen aquí para reducir correos.
          </p>
        </div>
      </div>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return jsonResponse({ error: "Missing environment variables" }, 500);

  const auth = await authorizeRequest(request);
  if (!auth.ok) return jsonResponse({ error: auth.error ?? "Unauthorized" }, auth.status ?? 401);

  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const encodedStart = encodeURIComponent(windowStart);
  const internalRoles = [
    "admin",
    "directora",
    "cuentas",
    "medios",
    "creativo",
    "disenador",
    "editor",
    "generador",
    "community",
    "pauta",
    "operaciones",
    "ejecutivo",
  ].join(",");

  const [profilesResponse, activitiesResponse, ordersResponse, brandsResponse, assigneesResponse, existingResponse] =
    await Promise.all([
      supabaseRequest(`profiles?is_active=eq.true&role=in.(${internalRoles})&select=id,full_name,email,role,is_active`),
      supabaseRequest(
        `work_order_activity?created_at=gte.${encodedStart}&select=id,work_order_id,actor_id,action,details,created_at&order=created_at.asc`,
      ),
      supabaseRequest("work_orders?select=id,code,title,brand_id,created_by,status"),
      supabaseRequest("brands?select=id,name"),
      supabaseRequest("work_order_assignees?select=work_order_id,user_id"),
      supabaseRequest(
        `email_notifications?notification_type=eq.daily_digest&created_at=gte.${encodedStart}&select=recipient_user_id`,
      ),
    ]);

  for (const response of [profilesResponse, activitiesResponse, ordersResponse, brandsResponse, assigneesResponse, existingResponse]) {
    if (!response.ok) return jsonResponse({ error: await response.text() }, 500);
  }

  const profiles = ((await profilesResponse.json()) as Profile[]).filter((profile) => profile.email);
  const activities = (await activitiesResponse.json()) as Activity[];
  const orders = (await ordersResponse.json()) as WorkOrder[];
  const brands = (await brandsResponse.json()) as Brand[];
  const assignees = (await assigneesResponse.json()) as WorkOrderAssignee[];
  const existingRecipients = new Set(
    ((await existingResponse.json()) as { recipient_user_id: string | null }[])
      .map((item) => item.recipient_user_id)
      .filter(Boolean) as string[],
  );

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const brandMap = new Map(brands.map((brand) => [brand.id, brand.name]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const recipientIdsByOrder = new Map<string, Set<string>>();

  orders.forEach((order) => {
    const recipientIds = new Set<string>();
    if (order.created_by) recipientIds.add(order.created_by);
    assignees.filter((assignee) => assignee.work_order_id === order.id).forEach((assignee) => recipientIds.add(assignee.user_id));
    recipientIdsByOrder.set(order.id, recipientIds);
  });

  const appUrl = getAppUrl(request);
  const notifications = profiles
    .filter((profile) => !existingRecipients.has(profile.id))
    .map((profile) => {
      const profileActivities = activities.filter((activity) => recipientIdsByOrder.get(activity.work_order_id)?.has(profile.id));
      if (!profileActivities.length) return null;
      return {
        brand_id: null,
        work_order_id: null,
        recipient_user_id: profile.id,
        recipient_email: profile.email,
        notification_type: "daily_digest",
        subject: `Lumen Workspace - resumen diario (${profileActivities.length} cambios)`,
        html_body: buildDigestHtml(profile, profileActivities, orderMap, brandMap, profileMap, appUrl),
        status: "queued",
        scheduled_for: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (notifications.length) {
    const insertResponse = await supabaseRequest("email_notifications", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(notifications),
    });
    if (!insertResponse.ok) return jsonResponse({ error: await insertResponse.text() }, 500);
  }

  return jsonResponse({
    queued: notifications.length,
    activities: activities.length,
    orders: new Set(activities.map((activity) => activity.work_order_id)).size,
    skipped_existing: existingRecipients.size,
  });
});
