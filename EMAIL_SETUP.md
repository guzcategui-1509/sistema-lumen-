# Lumen Workspace Email Setup

## Proveedor

El sistema queda preparado para enviar correos con Resend desde Supabase Edge Functions.

Variables necesarias en Supabase:

- `RESEND_API_KEY`: API key de Resend.
- `EMAIL_FROM`: remitente validado, por ejemplo `Lumen Workspace <workspace@grupolumen.com>`.
- `CRON_SECRET`: texto secreto largo para automatizaciones externas.

Supabase ya expone por defecto dentro de Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` ni `RESEND_API_KEY` en `config.js`, Vercel frontend o navegador.

## Funciones

- `weekly-digest`: crea emails en cola para todo el equipo interno activo.
- `email-worker`: procesa `email_notifications` y envia correos reales con Resend.

Desde la app:

- `Notificaciones > Crear cola`: crea el digest en `email_notifications`.
- `Notificaciones > Enviar cola`: envia correos reales pendientes.
- `Notificaciones > Enviar digest ahora`: crea la cola y la envia en un solo flujo.

Solo usuarios `admin` o `directora` pueden disparar estas funciones desde la app.

## Deploy con Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase login
supabase link --project-ref gxvvamripgwtzrmhmaiz
supabase secrets set RESEND_API_KEY="re_xxx"
supabase secrets set EMAIL_FROM="Lumen Workspace <workspace@grupolumen.com>"
supabase secrets set CRON_SECRET="un-secreto-largo-y-privado"
supabase functions deploy weekly-digest --no-verify-jwt
supabase functions deploy email-worker --no-verify-jwt
```

Usamos `--no-verify-jwt` porque las funciones validan internamente dos modos seguros:
usuario `admin/directora` desde la app, o `x-cron-secret` para automatizaciones.

## Automatizacion lunes 8:00

Para automatizar, programa dos llamadas seguras:

1. Lunes 8:00: invocar `weekly-digest`.
2. Lunes 8:02: invocar `email-worker`.

Cada request debe enviar el header:

```http
x-cron-secret: un-secreto-largo-y-privado
```

Tambien puedes correr `email-worker` cada 5 minutos si quieres que asignaciones de OTs salgan casi en tiempo real.
