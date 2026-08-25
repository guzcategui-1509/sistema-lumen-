# Lumen Workspace Email Setup

## Recomendacion

Usar **Brevo** para el MVP. Ya queda conectado por API transaccional y tambien deja abierta la puerta para listas, templates y automatizaciones mas adelante.

Lenguaje dentro del sistema:

- **Preparar correos**: el sistema arma los mensajes y los deja listos.
- **Enviar pendientes**: manda los correos preparados usando Brevo.
- **Enviar resumen diario ahora**: agrupa las últimas 24 horas y hace ambos pasos en una sola acción.

Por debajo esos correos preparados viven en `email_notifications`, pero el equipo no necesita ver ni entender la palabra "cola".

Para reducir ruido:

- Nuevas asignaciones, urgencias y vencimientos importantes se notifican de inmediato.
- Ediciones, cambios de estado, subtareas, materiales, archivos y archivo/restauración de OTs se reúnen en un solo resumen diario por persona.

## Variables

Variables necesarias en Supabase:

- `BREVO_API_KEY`: API key de Brevo.
- `EMAIL_FROM`: remitente validado, por ejemplo `Lumen Workspace <workspace@grupolumen.com>`.
- `CRON_SECRET`: texto secreto largo para automatizaciones externas.
- `APP_URL`: URL publica de Vercel, para que los botones de los correos abran Lumen Workspace.

En Brevo:

1. Crea o confirma un **sender** transaccional.
2. Verifica el dominio o sender antes de usarlo en produccion.
3. Crea una API key con permiso para enviar emails transaccionales.

Supabase ya expone por defecto dentro de Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` ni `BREVO_API_KEY` en `config.js`, Vercel frontend o navegador.

En `config.js`, `appUrl` es opcional. Si se llena con la URL de Vercel, los botones de correos como **Ver orden en Lumen** siempre abriran produccion. Si queda vacio, la app usa la URL desde donde se esta creando la OT.

## Funciones

- `weekly-digest`: prepara el resumen semanal para todo el equipo interno activo.
- `daily-activity-digest`: prepara un solo correo por persona con la actividad de sus OTs en las últimas 24 horas.
- `email-worker`: envia los correos preparados con Brevo.
- `monthly-work-orders`: endpoint deshabilitado que responde `410 Gone` para neutralizar cron o clientes antiguos. No crea OTs.

Desde la app:

- `Notificaciones > Preparar resumen diario`: prepara el resumen de las últimas 24 horas en `email_notifications`.
- `Notificaciones > Enviar pendientes`: envia correos reales pendientes.
- `Notificaciones > Enviar resumen diario ahora`: prepara el resumen diario y lo envia en un solo flujo.

Usuarios `admin`, `directora` y `cuentas` pueden disparar automatizaciones generales. `generador` y `creativo` pueden crear OTs; al crear una OT con email activo, la app prepara y procesa los correos de asignacion.

## Deploy con Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase login
supabase link --project-ref gxvvamripgwtzrmhmaiz
supabase secrets set BREVO_API_KEY="xkeysib_xxx"
supabase secrets set EMAIL_FROM="Lumen Workspace <workspace@grupolumen.com>"
supabase secrets set CRON_SECRET="un-secreto-largo-y-privado"
supabase secrets set APP_URL="https://tu-app.vercel.app"
supabase functions deploy weekly-digest --no-verify-jwt
supabase functions deploy daily-activity-digest --no-verify-jwt
supabase functions deploy email-worker --no-verify-jwt
supabase functions deploy monthly-work-orders --no-verify-jwt
```

Usamos `--no-verify-jwt` porque las funciones activas validan internamente dos modos seguros:
usuario autorizado desde la app, o `x-cron-secret` para automatizaciones. `monthly-work-orders` permanece desplegada solo como tombstone sin efectos.

## Automatizacion lunes 8:00

Opcion recomendada: programarlo dentro de Supabase con `pg_cron` + `pg_net`.

Programa dos llamadas seguras:

1. Lunes 8:00 Guatemala/Mexico: invocar `weekly-digest`.
2. Lunes 8:02 Guatemala/Mexico: invocar `email-worker`.

En el SQL usamos `14:00 UTC` y `14:02 UTC`, equivalente a 8:00am y 8:02am en Guatemala/Mexico.

Cada request debe enviar el header:

```http
x-cron-secret: un-secreto-largo-y-privado
```

Tambien puedes correr `email-worker` cada 5 minutos si quieres que asignaciones de OTs salgan casi en tiempo real.

Hay un SQL base listo en:

```text
supabase/schedule_email_automation.sql
```

Antes de ejecutarlo, reemplaza `REPLACE_WITH_YOUR_CRON_SECRET` por el mismo valor que guardaste en `CRON_SECRET`.

## Activar el resumen diario

En un proyecto ya existente:

1. Ejecuta `supabase/patch_daily_activity_digest.sql` en SQL Editor.
2. Despliega `daily-activity-digest`.
3. Ejecuta `supabase/schedule_daily_activity_digest.sql` en SQL Editor.

El horario recomendado es 23:00 Guatemala/Mexico. El resumen se prepara a esa hora y el `email-worker` existente lo envía dentro de los siguientes 10 minutos.
