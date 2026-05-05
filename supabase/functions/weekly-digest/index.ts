type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type WorkOrder = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string;
  due_date: string | null;
  brand_id: string;
};

type Brand = {
  id: string;
  name: string;
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
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

async function authorizeRequest(request: Request) {
  if (CRON_SECRET && request.headers.get("x-cron-secret") === CRON_SECRET) {
    return { ok: true };
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Authorization header" };
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: authHeader,
    },
  });

  if (!userResponse.ok) {
    return { ok: false, status: 401, error: "Invalid session" };
  }

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) {
    return { ok: false, status: 401, error: "Invalid session user" };
  }

  const profileResponse = await supabaseRequest(
    `profiles?id=eq.${user.id}&select=role,is_active&limit=1`,
  );

  if (!profileResponse.ok) {
    return { ok: false, status: 500, error: await profileResponse.text() };
  }

  const profiles = (await profileResponse.json()) as RequestProfile[];
  const profile = profiles[0];
  if (!profile?.is_active || !["admin", "directora"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Only admin or directora can queue weekly digest" };
  }

  return { ok: true };
}

function daysUntil(dateValue: string | null) {
  if (!dateValue) return 999;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const date = new Date(`${dateValue}T12:00:00`);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function escapeHtml(value = "") {
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

function buildDashboardUrl(appUrl: string) {
  if (!appUrl) return "";
  const url = new URL(appUrl);
  url.searchParams.set("module", "dashboard");
  url.searchParams.set("brand", "all-brands");
  return url.toString();
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Sin fecha";
  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function deadlineLabel(dateValue: string | null) {
  const days = daysUntil(dateValue);
  if (!dateValue) return "Sin fecha";
  if (days < 0) return `Vencida hace ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence manana";
  return `${days}d restantes`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Nueva",
    in_progress: "En proceso",
    in_review: "En revision",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return labels[status] ?? status;
}

function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };
  return labels[priority] ?? priority;
}

function priorityColor(priority: string) {
  if (priority === "high") return { bg: "#ffe8e8", color: "#9f1c1c" };
  if (priority === "low") return { bg: "#e9fff1", color: "#176339" };
  return { bg: "#fff3d8", color: "#8a5b00" };
}

function metricCard(label: string, value: number, note: string, accent = "#2d2d2d") {
  return `
    <td style="width:25%;padding:0 6px 12px 0;">
      <div style="border:1px solid #deded8;border-radius:12px;padding:14px 15px;background:#ffffff;">
        <div style="font-size:30px;line-height:1;font-weight:800;color:${accent};">${value}</div>
        <div style="font-size:14px;font-weight:800;color:#2d2d2d;margin-top:7px;">${label}</div>
        <div style="font-size:12px;color:#747b75;margin-top:4px;">${note}</div>
      </div>
    </td>
  `;
}

function buildOrderCard(order: WorkOrder, brandName: string, appUrl: string) {
  const link = buildWorkOrderUrl(appUrl, order);
  const priority = priorityColor(order.priority);
  const description = (order.description ?? "").replace(/\s+/g, " ").trim();

  return `
    <div style="border:1px solid #deded8;border-radius:14px;background:#ffffff;margin-bottom:12px;overflow:hidden;">
      <div style="padding:16px 18px 14px;border-left:6px solid #49ee8c;">
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;background:#f0f1ee;color:#2d2d2d;border-radius:999px;padding:7px 10px;font-size:13px;font-weight:800;">${escapeHtml(order.code)}</span>
          <span style="display:inline-block;background:${priority.bg};color:${priority.color};border-radius:999px;padding:7px 10px;font-size:13px;font-weight:800;margin-left:6px;">${escapeHtml(priorityLabel(order.priority))}</span>
        </div>
        <h3 style="margin:0 0 8px;font-size:20px;line-height:1.25;color:#2d2d2d;">${escapeHtml(order.title)}</h3>
        <div style="font-size:14px;color:#666d67;line-height:1.45;">
          ${escapeHtml(brandName)} / ${escapeHtml(statusLabel(order.status))} / ${escapeHtml(formatDate(order.due_date))}
        </div>
        <div style="font-size:14px;font-weight:800;color:${daysUntil(order.due_date) < 0 ? "#9f1c1c" : "#166274"};margin-top:8px;">
          ${escapeHtml(deadlineLabel(order.due_date))}
        </div>
        ${
          description
            ? `<p style="margin:12px 0 0;color:#4f5650;font-size:14px;line-height:1.5;">${escapeHtml(description.slice(0, 220))}</p>`
            : ""
        }
        ${
          link
            ? `<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:14px;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:9px;padding:11px 14px;font-size:14px;font-weight:800;">Ver orden</a>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildDigestHtml(orders: WorkOrder[], brands: Brand[], appUrl: string) {
  const openOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.due_date) < 0);
  const reviewOrders = openOrders.filter((order) => order.status === "in_review");
  const dueThisWeek = openOrders.filter((order) => {
    const days = daysUntil(order.due_date);
    return days >= 0 && days <= 7;
  });
  const upcoming = openOrders
    .slice()
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))
    .slice(0, 12);
  const dashboardUrl = buildDashboardUrl(appUrl);
  const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));

  const orderCards = upcoming
    .map((order) => buildOrderCard(order, brandNames.get(order.brand_id) ?? "Marca", appUrl))
    .join("");

  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:720px;margin:0 auto;">
        <div style="background:#2d2d2d;border-radius:16px 16px 0 0;padding:28px;border-left:8px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#49ee8c;margin-bottom:10px;">Lumen Workspace</div>
          <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.15;">Estatus semanal de proyectos</h1>
          <p style="margin:10px 0 0;color:#d7dbd7;font-size:16px;line-height:1.45;">Resumen operativo de OTs abiertas, vencimientos y prioridades del equipo.</p>
          ${
            dashboardUrl
              ? `<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;margin-top:18px;background:#49ee8c;color:#183522;text-decoration:none;border-radius:10px;padding:12px 16px;font-size:15px;font-weight:900;">Abrir dashboard</a>`
              : ""
          }
        </div>

        <div style="background:#ffffff;border:1px solid #deded8;border-top:0;border-radius:0 0 16px 16px;padding:22px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <tr>
              ${metricCard("Abiertas", openOrders.length, "OTs activas", "#2d2d2d")}
              ${metricCard("Vencidas", overdueOrders.length, "Requieren accion", overdueOrders.length ? "#9f1c1c" : "#176339")}
              ${metricCard("Esta semana", dueThisWeek.length, "Vencen en 7 dias", "#166274")}
              ${metricCard("En revision", reviewOrders.length, "Pendientes de cierre", "#7654a8")}
            </tr>
          </table>

          <div style="font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#747b75;margin:18px 0 10px;">
            Siguientes ordenes
          </div>

          ${
            orderCards ||
            `<div style="border:1px solid #deded8;border-radius:12px;padding:18px;background:#ffffff;color:#4f5650;">No hay OTs abiertas esta semana.</div>`
          }

          <p style="margin:18px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">
            Este correo se genera desde Lumen Workspace. Para editar, comentar o avanzar una OT, abre el boton de la orden correspondiente.
          </p>
        </div>
      </div>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  const auth = await authorizeRequest(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error ?? "Unauthorized" }, auth.status ?? 401);
  }

  const [profilesResponse, ordersResponse, brandsResponse] = await Promise.all([
    supabaseRequest("profiles?is_active=eq.true&role=neq.cliente&select=id,full_name,email"),
    supabaseRequest("work_orders?status=neq.completed&select=id,code,title,description,priority,status,category,due_date,brand_id"),
    supabaseRequest("brands?is_active=eq.true&select=id,name"),
  ]);

  if (!profilesResponse.ok) return jsonResponse({ error: await profilesResponse.text() }, 500);
  if (!ordersResponse.ok) return jsonResponse({ error: await ordersResponse.text() }, 500);
  if (!brandsResponse.ok) return jsonResponse({ error: await brandsResponse.text() }, 500);

  const profiles = (await profilesResponse.json()) as Profile[];
  const orders = (await ordersResponse.json()) as WorkOrder[];
  const brands = (await brandsResponse.json()) as Brand[];
  const openOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.due_date) < 0);
  const subject = "Lumen Workspace - estatus semanal de proyectos";
  const html = buildDigestHtml(orders, brands, getAppUrl(request));

  const notifications = profiles.map((profile) => ({
    brand_id: null,
    work_order_id: null,
    recipient_user_id: profile.id,
    recipient_email: profile.email,
    notification_type: "weekly_digest",
    subject,
    html_body: html,
    status: "queued",
    scheduled_for: new Date().toISOString(),
  }));

  const insertNotifications = await supabaseRequest("email_notifications", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(notifications),
  });

  if (!insertNotifications.ok) {
    return jsonResponse({ error: await insertNotifications.text() }, 500);
  }

  await supabaseRequest("weekly_digest_runs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      run_date: new Date().toISOString().slice(0, 10),
      subject,
      recipients_count: profiles.length,
      open_orders_count: openOrders.length,
      overdue_orders_count: overdueOrders.length,
      status: "queued",
    }),
  });

  return jsonResponse({
    queued: profiles.length,
    open_orders: openOrders.length,
    overdue_orders: overdueOrders.length,
  });
});
