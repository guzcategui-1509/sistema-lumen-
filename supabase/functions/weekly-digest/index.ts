type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type WorkOrder = {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  brand_id: string;
};

type RequestProfile = {
  role: string;
  is_active: boolean;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

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

function buildDigestHtml(orders: WorkOrder[]) {
  const openOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.due_date) < 0);
  const upcoming = openOrders
    .slice()
    .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))
    .slice(0, 12);

  const rows = upcoming
    .map(
      (order) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>${order.code}</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${order.title}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${order.priority}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${order.due_date ?? "Sin fecha"}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#132033;line-height:1.45;">
      <h1 style="margin:0 0 8px;">Estatus semanal de proyectos</h1>
      <p style="margin:0 0 18px;color:#617083;">Resumen automatico de Lumen Workspace.</p>
      <div style="display:flex;gap:10px;margin-bottom:18px;">
        <div style="padding:12px;border:1px solid #d9e0ea;border-radius:8px;"><strong>${openOrders.length}</strong><br/>OTs abiertas</div>
        <div style="padding:12px;border:1px solid #d9e0ea;border-radius:8px;"><strong>${overdueOrders.length}</strong><br/>vencidas</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left">Codigo</th>
            <th align="left">Orden</th>
            <th align="left">Prioridad</th>
            <th align="left">Deadline</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" style="padding:12px 0;">Sin OTs abiertas.</td></tr>`}</tbody>
      </table>
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

  const [profilesResponse, ordersResponse] = await Promise.all([
    supabaseRequest("profiles?is_active=eq.true&role=neq.cliente&select=id,full_name,email"),
    supabaseRequest("work_orders?status=neq.completed&select=id,code,title,priority,status,due_date,brand_id"),
  ]);

  if (!profilesResponse.ok) return jsonResponse({ error: await profilesResponse.text() }, 500);
  if (!ordersResponse.ok) return jsonResponse({ error: await ordersResponse.text() }, 500);

  const profiles = (await profilesResponse.json()) as Profile[];
  const orders = (await ordersResponse.json()) as WorkOrder[];
  const openOrders = orders.filter((order) => order.status !== "completed" && order.status !== "cancelled");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.due_date) < 0);
  const subject = "Lumen Workspace - estatus semanal de proyectos";
  const html = buildDigestHtml(orders);

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
