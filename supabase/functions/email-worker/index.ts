type EmailNotification = {
  id: string;
  recipient_email: string;
  subject: string;
  html_body: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Lumen Workspace <workspace@grupolumen.com>";

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

async function markNotification(id: string, payload: Record<string, unknown>) {
  await supabaseRequest(`email_notifications?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
}

async function sendEmail(notification: EmailNotification) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [notification.recipient_email],
      subject: notification.subject,
      html: notification.html_body ?? "<p>Tienes una actualizacion en Lumen Workspace.</p>",
    }),
  });

  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

  if (!response.ok) {
    throw new Error(result?.message ?? "Email provider failed");
  }

  return result?.id ?? null;
}

Deno.serve(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return Response.json({ error: "Missing environment variables" }, { status: 500 });
  }

  const now = encodeURIComponent(new Date().toISOString());
  const response = await supabaseRequest(
    `email_notifications?status=eq.queued&or=(scheduled_for.is.null,scheduled_for.lte.${now})&select=id,recipient_email,subject,html_body&limit=25`,
  );

  if (!response.ok) {
    return Response.json({ error: await response.text() }, { status: 500 });
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

  return Response.json({
    processed: results.length,
    results,
  });
});
