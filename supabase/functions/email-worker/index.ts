type EmailNotification = {
  id: string;
  recipient_email: string;
  notification_type: string;
  subject: string;
  html_body: string | null;
  status: string;
  scheduled_for: string | null;
  created_at: string;
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
  if (
    !profile?.is_active ||
    !["admin", "directora", "cuentas", "generador", "creativo", "disenador", "editor"].includes(profile.role)
  ) {
    return { ok: false, status: 403, error: "Only authorized internal roles can send email queue" };
  }

  return { ok: true };
}

async function markNotification(id: string, payload: Record<string, unknown>) {
  const response = await supabaseRequest(`email_notifications?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to update email notification ${id}: ${await response.text()}`);
  }
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
  const missingFields = [
    !notification.recipient_email ? "recipient_email" : "",
    !notification.subject ? "subject" : "",
    !notification.html_body ? "html_body" : "",
  ].filter(Boolean);
  if (missingFields.length) {
    throw new Error(`Missing required email fields: ${missingFields.join(", ")}`);
  }

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

  const requestBody = await request.clone().json().catch(() => ({})) as {
    source?: string;
    job?: string;
  };
  console.log("email-worker:start", {
    source: requestBody.source ?? "manual",
    job: requestBody.job ?? "email-worker",
  });

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !BREVO_API_KEY) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  const auth = await authorizeRequest(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error ?? "Unauthorized" }, auth.status ?? 401);
  }

  const now = new Date().toISOString();
  const params = new URLSearchParams({
    status: "in.(queued,pending)",
    or: `(scheduled_for.is.null,scheduled_for.lte.${now})`,
    select: "id,recipient_email,notification_type,subject,html_body,status,scheduled_for,created_at",
    order: "scheduled_for.asc.nullsfirst,created_at.asc",
    limit: "25",
  });
  const response = await supabaseRequest(
    `email_notifications?${params.toString()}`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.log("email-worker:query-error", { error: errorText });
    return jsonResponse({ error: errorText }, 500);
  }

  const notifications = (await response.json()) as EmailNotification[];
  console.log("email-worker:candidates", { count: notifications.length });
  const results = [];

  for (const notification of notifications) {
    console.log("email-worker:candidate", {
      id: notification.id,
      notification_type: notification.notification_type,
      status: notification.status,
      recipient_email: notification.recipient_email,
      scheduled_for: notification.scheduled_for,
      has_html_body: Boolean(notification.html_body),
      has_subject: Boolean(notification.subject),
    });

    try {
      const providerMessageId = await sendEmail(notification);
      await markNotification(notification.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
        error_message: null,
      });
      console.log("email-worker:result", { id: notification.id, status: "sent" });
      results.push({ id: notification.id, notification_type: notification.notification_type, status: "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      try {
        await markNotification(notification.id, {
          status: "failed",
          error_message: message,
        });
      } catch (updateError) {
        console.log("email-worker:update-failed", {
          id: notification.id,
          error: updateError instanceof Error ? updateError.message : "Unknown update error",
        });
      }
      console.log("email-worker:result", { id: notification.id, status: "failed", error: message });
      results.push({ id: notification.id, notification_type: notification.notification_type, status: "failed" });
    }
  }

  return jsonResponse({
    processed: results.length,
    results,
  });
});
