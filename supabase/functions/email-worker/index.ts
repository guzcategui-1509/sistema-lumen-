type EmailNotification = {
  id: string;
  recipient_email: string;
  subject: string;
  html_body: string | null;
};

type Profile = {
  role: string;
  is_active: boolean;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Lumen Workspace <workspace@grupolumen.com>";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const requestHeaders = new Headers(jsonHeaders);
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

  const profiles = (await profileResponse.json()) as Profile[];
  const profile = profiles[0];
  if (!profile?.is_active || !["admin", "directora"].includes(profile.role)) {
    return { ok: false, status: 403, error: "Only admin or directora can send email queue" };
  }

  return { ok: true };
}

async function markNotification(id: string, payload: Record<string, unknown>) {
  await supabaseRequest(`email_notifications?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
}

function parseEmailFrom(value: string) {
  const match = value.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || "Lumen Workspace",
      email: match[2].trim(),
    };
  }
  return {
    name: "Lumen Workspace",
    email: value.trim(),
  };
}

async function sendEmail(notification: EmailNotification) {
  const sender = parseEmailFrom(EMAIL_FROM);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: notification.recipient_email }],
      subject: notification.subject,
      htmlContent: notification.html_body ?? "<p>Tienes una actualizacion en Lumen Workspace.</p>",
      tags: ["lumen-workspace"],
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    messageId?: string;
  };

  if (!response.ok) {
    throw new Error(result?.message ?? result?.code ?? "Brevo email provider failed");
  }

  return result?.messageId ?? null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !BREVO_API_KEY) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  const auth = await authorizeRequest(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error ?? "Unauthorized" }, auth.status ?? 401);
  }

  const now = encodeURIComponent(new Date().toISOString());
  const response = await supabaseRequest(
    `email_notifications?status=eq.queued&or=(scheduled_for.is.null,scheduled_for.lte.${now})&select=id,recipient_email,subject,html_body&limit=25`,
  );

  if (!response.ok) {
    return jsonResponse({ error: await response.text() }, 500);
  }

  const notifications = (await response.json()) as EmailNotification[];
  const results = [];

  for (const notification of notifications) {
    try {
      const providerMessageId = await sendEmail(notification);
      await markNotification(notification.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
        error_message: null,
      });
      results.push({ id: notification.id, status: "sent" });
    } catch (error) {
      await markNotification(notification.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown email error",
      });
      results.push({ id: notification.id, status: "failed" });
    }
  }

  return jsonResponse({
    processed: results.length,
    results,
  });
});
