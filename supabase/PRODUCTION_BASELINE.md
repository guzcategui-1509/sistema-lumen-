# Lumen Workspace — baseline de Supabase para piloto interno

Fecha: 2026-06-22

Este documento registra el estado SQL esperado por la app antes de usarla con el equipo en piloto. No aplica cambios por si solo; sirve como checklist para ejecutar/verificar en Supabase.

## Fuente base recomendada

Para un proyecto nuevo, usar:

1. `supabase/launch_mvp.sql`

Después aplicar estos patches en orden:

1. `supabase/patch_roles_brands_step1.sql`
2. `supabase/patch_roles_brands_step2.sql`
3. `supabase/patch_memberships_policy.sql`
4. `supabase/patch_ot_workflow_creators.sql`
5. `supabase/patch_work_order_phases.sql`
6. `supabase/patch_work_order_phase_completion.sql`
7. `supabase/patch_work_order_phase_safe_save.sql`
8. `supabase/patch_work_order_archive.sql`
9. `supabase/patch_work_order_file_delete.sql`
10. `supabase/patch_work_order_material_uploads.sql`
11. `supabase/patch_brand_notification_recipients.sql`
12. `supabase/patch_daily_activity_digest.sql`
13. `supabase/patch_monthly_matrix_automation_rules.sql`
14. `supabase/patch_add_brand_212.sql`, si la marca 212 debe estar activa.
15. `supabase/patch_remove_laura_lopez.sql`, si Laura Lopez debe quedar inactiva/removida del acceso operativo.

## Tablas que deben existir para el piloto

- `clients`
- `brands`
- `profiles`
- `brand_memberships`
- `brand_responsibilities`
- `work_orders`
- `work_order_assignees`
- `work_order_phases`
- `work_order_comments`
- `work_order_files`
- `work_order_activity`
- `notification_rules`
- `email_notifications`
- `weekly_digest_runs`
- `brand_notification_recipients`

## Requisitos especificos de `work_order_phases`

Columnas requeridas:

- `id uuid primary key`
- `work_order_id uuid references work_orders(id) on delete cascade`
- `phase_key text`
- `title text`
- `description text`
- `assigned_to uuid references profiles(id) on delete set null`
- `status work_order_phase_status`
- `due_date date`
- `completed_at timestamptz`
- `sort_order integer`
- `created_at timestamptz`
- `updated_at timestamptz`

Indices requeridos:

- `idx_work_order_phases_order` en `(work_order_id, sort_order)`
- `idx_work_order_phases_assigned_to` en `(assigned_to)`
- `idx_work_order_phases_status` en `(status)`

Funciones/RPC requeridas:

- `complete_work_order_phase(uuid)`: permite que una persona complete solo su fase asignada.
- `save_work_order_phases(uuid, jsonb)`: guarda fases de forma transaccional sin usar DELETE + INSERT desde el navegador.

RLS esperado:

- Usuarios autenticados con acceso a la marca pueden leer fases.
- Creadores autorizados pueden insertar fases al crear una OT.
- Admin/direccion/cuentas pueden gestionar fases.
- Usuarios asignados a una fase solo pueden marcar su propia fase como completada mediante `complete_work_order_phase`.

## Storage

Bucket requerido:

- `work-order-files`

Reglas:

- Bucket privado.
- La ruta debe iniciar con `brand_id`: `brand_id/work_order_id/archivo`.
- Las policies deben validar acceso de marca con `can_access_brand`.
- No se deben guardar archivos persistentes en Vercel ni carpetas locales.

## Edge Functions requeridas

Desplegar:

- `email-worker`
- `weekly-digest`
- `daily-activity-digest`
- `monthly-work-orders`

Secrets requeridos en Supabase Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`
- `APP_URL`

`APP_URL` debe apuntar a la URL productiva, por ejemplo `https://sistema-lumen.vercel.app`.

## Automatizaciones

Para programar crons, usar uno de estos archivos:

- `supabase/schedule_email_automation.sql` para weekly digest, daily digest, monthly orders y procesar emails.
- `supabase/schedule_daily_activity_digest.sql` solo si se quiere activar el resumen diario de manera independiente.

No activar envios recurrentes al equipo completo sin probar primero con usuarios controlados.

## Notificaciones: regla de piloto

- Creacion manual de OT: creador + participantes generales seleccionados + responsables de fases asignadas.
- Cambio de fase: responsable de esa fase + creador, agrupado preferiblemente en digest diario.
- Urgencia: responsables involucrados + destinatarios fijos de marca si existen.
- Resumen diario: cada usuario recibe solo actividad de OTs donde sea creador, responsable general o responsable de fase.
- No enviar a usuarios no relacionados por defecto.

## Config publica

`config.js` puede estar disponible en el navegador porque esta app es estatica. Solo debe contener:

- Supabase URL publica.
- Supabase anon/publishable key.
- `appUrl` publica opcional.

Nunca guardar en `config.js`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `CRON_SECRET`
- claves privadas.
