const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const disabledResponse = {
  ok: false,
  disabled: true,
  message: "Monthly automated work order creation is disabled.",
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(disabledResponse, {
    status: 410,
    headers: corsHeaders,
  });
});
