type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active?: boolean;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
  client_id: string;
  clients?: { slug?: string; name?: string } | null;
};

type BrandMembership = {
  brand_id: string;
  user_id: string;
  role: string;
};

type BrandResponsibility = {
  brand_id: string;
  user_id: string;
  responsibility_role: string;
  is_active?: boolean;
};

type BrandNotificationRecipient = {
  brand_id: string;
  user_id: string;
};

type WorkOrder = {
  id: string;
  code: string;
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
  if (!authHeader.startsWith("Bearer ")) return { ok: false, status: 401, error: "Missing Authorization header" };

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authHeader },
  });
  if (!userResponse.ok) return { ok: false, status: 401, error: "Invalid session" };

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) return { ok: false, status: 401, error: "Invalid session user" };

  const profileResponse = await supabaseRequest(`profiles?id=eq.${user.id}&select=role,is_active&limit=1`);
  if (!profileResponse.ok) return { ok: false, status: 500, error: await profileResponse.text() };

  const profiles = (await profileResponse.json()) as RequestProfile[];
  const profile = profiles[0];
  if (!profile?.is_active || !["admin", "directora", "cuentas"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Only direccion or cuentas can create monthly work orders" };
  }

  return { ok: true };
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

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
}

function normalizeSlug(value = "") {
  return value.toLowerCase().trim();
}

function targetDateFor(kind: string, baseDate: Date) {
  const offset = kind === "content_matrix" ? 2 : 1;
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
}

function defaultDueDate(kind: string, targetDate: Date) {
  if (kind === "content_matrix") {
    return new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 5);
  }
  return new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 28);
}

function automationConfig(kind: string) {
  if (kind === "paid_placement") {
    return {
      codePrefix: "AUTO-PAUTA",
      titlePrefix: "Colocacion de pauta",
      category: "pauta",
      assigneeRoles: ["medios", "pauta"],
      excludedBrandSlugs: new Set(["constructivos", "lumen-proyectos", "lumen-pitch"]),
      excludedClientSlugs: new Set(["lumen"]),
      description:
        "Orden automatica para preparar colocacion de pauta, revisar materiales, presupuesto, audiencias y fecha de activacion.",
    };
  }

  return {
    codePrefix: "AUTO-MATRIZ",
    titlePrefix: "Matriz de contenido",
    category: "copy",
    assigneeRoles: ["generador", "creativo"],
    excludedBrandSlugs: new Set(["constructivos", "lumen-proyectos", "lumen-pitch"]),
    excludedClientSlugs: new Set<string>(),
    description:
      "Orden automatica para preparar matriz mensual de contenido: pilares, formatos, copies, necesidades de diseno, referencias y entregables.",
  };
}

function shouldIncludeBrand(brand: Brand, kind: string) {
  const config = automationConfig(kind);
  const brandSlug = normalizeSlug(brand.slug);
  const clientSlug = normalizeSlug(brand.clients?.slug ?? "");
  if (config.excludedBrandSlugs.has(brandSlug)) return false;
  if (config.excludedClientSlugs.has(clientSlug)) return false;
  return true;
}

function usersForBrandRole(
  brandId: string,
  roles: string[],
  responsibilities: BrandResponsibility[],
  memberships: BrandMembership[],
  profilesById: Map<string, Profile>,
) {
  const ids = new Set<string>();
  responsibilities
    .filter((row) => row.brand_id === brandId && row.is_active !== false && roles.includes(row.responsibility_role))
    .forEach((row) => ids.add(row.user_id));
  memberships
    .filter((row) => row.brand_id === brandId && roles.includes(row.role))
    .forEach((row) => ids.add(row.user_id));
  return [...ids].map((id) => profilesById.get(id)).filter((profile): profile is Profile => Boolean(profile?.email));
}

function workOrderUrl(appUrl: string, brandId: string, code: string) {
  if (!appUrl) return "";
  const url = new URL(appUrl);
  url.searchParams.set("module", "work-orders");
  url.searchParams.set("brand", brandId);
  url.searchParams.set("ot", code);
  return url.toString();
}

function buildEmailHtml({
  brand,
  code,
  title,
  dueDate,
  appUrl,
}: {
  brand: Brand;
  code: string;
  title: string;
  dueDate: string;
  appUrl: string;
}) {
  const link = workOrderUrl(appUrl, brand.id, code);
  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#157a44;margin-bottom:10px;">Orden automatica mensual</div>
          <h1 style="margin:0 0 8px;font-size:26px;line-height:1.15;color:#2d2d2d;">${escapeHtml(title)}</h1>
          <p style="margin:0;color:#5f6760;font-size:16px;line-height:1.45;">${escapeHtml(brand.clients?.name ?? "Cliente")} / ${escapeHtml(brand.name)}</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Codigo</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:800;">${escapeHtml(code)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Deadline</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:800;">${escapeHtml(dueDate)}</td>
            </tr>
          </table>
          ${
            link
              ? `<a href="${escapeHtml(link)}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Ver orden en Lumen</a>`
              : ""
          }
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

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    base_date?: string;
    due_date?: string;
  };
  const kind = body.kind === "paid_placement" ? "paid_placement" : "content_matrix";
  const config = automationConfig(kind);
  const baseDate = body.base_date ? new Date(`${body.base_date}T12:00:00`) : new Date();
  const targetDate = targetDateFor(kind, baseDate);
  const dueDate = body.due_date || formatDateKey(defaultDueDate(kind, targetDate));
  const targetKey = `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  const targetLabel = monthLabel(targetDate);
  const appUrl = getAppUrl(request);

  const [brandsResponse, profilesResponse, membershipsResponse, responsibilitiesResponse, notificationRecipientsResponse] =
    await Promise.all([
      supabaseRequest("brands?is_active=eq.true&select=id,name,slug,client_id,clients(slug,name)"),
      supabaseRequest("profiles?is_active=eq.true&role=neq.cliente&select=id,full_name,email,role,is_active"),
      supabaseRequest("brand_memberships?select=brand_id,user_id,role"),
      supabaseRequest("brand_responsibilities?select=brand_id,user_id,responsibility_role,is_active"),
      supabaseRequest("brand_notification_recipients?select=brand_id,user_id"),
    ]);

  if (!brandsResponse.ok) return jsonResponse({ error: await brandsResponse.text() }, 500);
  if (!profilesResponse.ok) return jsonResponse({ error: await profilesResponse.text() }, 500);
  if (!membershipsResponse.ok) return jsonResponse({ error: await membershipsResponse.text() }, 500);

  const brands = ((await brandsResponse.json()) as Brand[]).filter((brand) => shouldIncludeBrand(brand, kind));
  const profiles = (await profilesResponse.json()) as Profile[];
  const memberships = (await membershipsResponse.json()) as BrandMembership[];
  const responsibilities = responsibilitiesResponse.ok
    ? ((await responsibilitiesResponse.json()) as BrandResponsibility[])
    : [];
  const notificationRecipients = notificationRecipientsResponse.ok
    ? ((await notificationRecipientsResponse.json()) as BrandNotificationRecipient[])
    : [];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  let created = 0;
  let skipped = 0;
  let emailsQueued = 0;

  for (const brand of brands) {
    const code = `${config.codePrefix}-${brand.slug.toUpperCase().replaceAll("-", "-")}-${targetKey}`;
    const existsResponse = await supabaseRequest(`work_orders?code=eq.${encodeURIComponent(code)}&select=id,code&limit=1`);
    if (!existsResponse.ok) return jsonResponse({ error: await existsResponse.text() }, 500);
    const existing = (await existsResponse.json()) as WorkOrder[];
    if (existing.length) {
      skipped += 1;
      continue;
    }

    const title = `${config.titlePrefix} ${targetLabel} - ${brand.name}`;
    const accounts = usersForBrandRole(brand.id, ["cuentas"], responsibilities, memberships, profilesById);
    const assignees = usersForBrandRole(brand.id, config.assigneeRoles, responsibilities, memberships, profilesById);
    const finalAssignees = assignees.length ? assignees : accounts;

    const orderResponse = await supabaseRequest("work_orders?select=id,code", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        code,
        brand_id: brand.id,
        title,
        status: "new",
        priority: "medium",
        category: config.category,
        due_date: dueDate,
        description: `${config.description}\n\nMes objetivo: ${targetLabel}. Creada automaticamente por Lumen Workspace.`,
        notify_on_email: true,
      }),
    });

    if (!orderResponse.ok) return jsonResponse({ error: await orderResponse.text() }, 500);
    const [order] = (await orderResponse.json()) as WorkOrder[];
    if (!order?.id) continue;
    created += 1;

    if (finalAssignees.length) {
      await supabaseRequest("work_order_assignees", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(
          finalAssignees.map((profile) => ({
            work_order_id: order.id,
            user_id: profile.id,
          })),
        ),
      });
    }

    await supabaseRequest("work_order_activity", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        work_order_id: order.id,
        action: "monthly_automation_created",
        details: { kind, target_month: targetKey, accounts: accounts.length, assignees: finalAssignees.length },
      }),
    });

    const configuredRecipients = notificationRecipients
      .filter((row) => row.brand_id === brand.id)
      .map((row) => profilesById.get(row.user_id))
      .filter((profile): profile is Profile => Boolean(profile?.email));
    const recipients = new Map<string, Profile>();
    (configuredRecipients.length ? configuredRecipients : [...accounts, ...finalAssignees]).forEach((profile) =>
      recipients.set(profile.id, profile)
    );
    if (recipients.size) {
      const notifications = [...recipients.values()].map((profile) => ({
        brand_id: brand.id,
        work_order_id: order.id,
        recipient_user_id: profile.id,
        recipient_email: profile.email,
        notification_type: "assignment",
        subject: `Nueva orden automatica: ${title}`,
        html_body: buildEmailHtml({ brand, code, title, dueDate, appUrl }),
        status: "queued",
        scheduled_for: new Date().toISOString(),
      }));
      const notificationResponse = await supabaseRequest("email_notifications", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(notifications),
      });
      if (!notificationResponse.ok) return jsonResponse({ error: await notificationResponse.text() }, 500);
      emailsQueued += notifications.length;
    }
  }

  return jsonResponse({
    kind,
    target_month: targetKey,
    due_date: dueDate,
    created,
    skipped,
    emails_queued: emailsQueued,
  });
});
