# Lumen Workspace

Implementacion base del plan maestro para convertir Lumen Workspace en un sistema operativo de agencia sin Planable.

## Que incluye

- App navegable en HTML, CSS y JavaScript sin dependencias.
- Modo lanzamiento interno activado: navegacion enfocada en Dashboard, OTs, Equipo, Notificaciones y Sistema.
- Modulos: Dashboard, Configuracion de Marca, OTs, Producciones, Contenido, Assets/Canva, Copywriting IA, Creatividad IA, Reporteria, Equipo, Portal cliente, Roadmap y Sistema.
- Flujo de contenido sin publicacion automatica: draft, revision interna, revision cliente, cambios, aprobado y completado.
- Calendario con toggle de Concepto / Final / Programado y composer de concepto.
- Flujo de contenido operable en prototipo: pasar a final, programar, aprobar, pedir cambios y comentar.
- OTs priorizadas con creador, responsable, deadline, email activo, vencimientos y avance de estado.
- OTs con multiples responsables y adjuntos de archivo en prototipo.
- Selector global con opcion "Todas las marcas" y dashboard visual cross-brand por cliente, marca, OTs, carga y aprobaciones.
- Equipo con carga operativa por usuario, OTs vencidas/abiertas y digest semanal.
- Notificaciones de OTs con reglas para asignacion, vencimiento 24h, atrasos y digest de lunes.
- Checklist de lanzamiento MVP con modulos beta estacionados hasta despues del piloto.
- Canva v1 como links + previews + version visual aprobable.
- Portal cliente limitado: solo piezas visibles y comentarios no internos.
- Configuracion de marca con 7 secciones, auto-save simulado, rail "como se usa", Gemini config y bitacora.
- Persistencia local en navegador para configuracion de marca y piezas de contenido.
- Schema Supabase en `supabase/schema.sql` con roles, permisos, RLS y tablas nuevas.
- Schema Supabase enfocado en lanzamiento interno en `supabase/launch_mvp.sql`.
- Edge Functions base para emails en `supabase/functions/email-worker` y digest semanal en `supabase/functions/weekly-digest`.
- Guia de correo real en `EMAIL_SETUP.md`.
- Conexion opcional a Supabase desde `config.js`; si queda vacio, la app sigue en modo demo.

## Lanzamiento interno recomendado

Release 1 se enfoca solo en operar ordenes de trabajo:

1. Ejecutar `supabase/launch_mvp.sql` en el proyecto Supabase real.
2. Crear usuarios internos en Supabase Auth.
3. Crear registros en `profiles` y `brand_memberships`.
4. Conectar el frontend a Supabase para OTs, responsables, comentarios y archivos.
5. Crear el bucket privado `work-order-files` usando el SQL incluido.
6. Configurar variables de Edge Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`.
7. Programar `weekly-digest` los lunes y correr `email-worker` para procesar la cola.
8. Invitar primero solo al equipo interno de Lumen.

Si ya ejecutaste `launch_mvp.sql` antes de conectar el frontend, ejecuta `supabase/patch_memberships_policy.sql` para que el equipo pueda ver responsables por marca.

## Roadmap incorporado

- Fase 0: `clients`, `brands.client_id`, 7 roles, `brand_memberships`, `module_permissions`, RLS.
- Fase 1: Configuracion de Marca con `brand_assets`, `brand_channels`, `brand_ai_config`, `brand_audit_log`.
- Fase 2: `content_calendars`, `content_items`, `content_versions`, `content_comments`, toggle concepto/final/programado.
- Fase 3: `canva_designs` y `asset_versions` con version aprobada bloqueada.
- Fase 4: `work_orders.linked_content_item_id` para loop OT y contenido.
- Prioridad operativa agregada: `work_orders`, `work_order_assignees`, `work_order_files`, `work_order_comments`, `work_order_activity`, `notification_rules`, `email_notifications`, `weekly_digest_runs`.
- Fase 5: Portal cliente, magic links, aprobaciones, comentarios visibles y `approval_events`.
- Fase 6: CSV manual, `report_snapshots`, dashboards y PDF mensual.
- Fase 7: IA dentro de piezas, ideas al calendario y producciones a multiples piezas.

## Como verlo

Abre `index.html` en un navegador o sirve la carpeta con:

```bash
python3 -m http.server 4174
```

Luego entra a:

```text
http://localhost:4174
```

## Como publicarlo

Este prototipo ya incluye configuracion para Vercel:

- `package.json`
- `vercel.json`
- `.gitignore`
- `DEPLOY.md`

La ruta recomendada es subir esta carpeta a GitHub e importar el repositorio desde Vercel. Ver pasos completos en `DEPLOY.md`.

Nota importante: publicado asi funciona como app estatica con datos en `localStorage` por navegador. Para uso multiusuario real hay que conectar el frontend a Supabase.

## Como usarlo con Lovable

1. Lleva la estructura visual y de modulos a tu proyecto Lovable actual.
2. Ejecuta o adapta `supabase/schema.sql` en Supabase antes de reemplazar el modelo temporal de accesos por marca.
3. Empieza por Fase 0 y Fase 1 antes de construir mas pantallas: permisos y configuracion de marca sostienen todo lo demas.
4. Integra el modulo `Contenido` como reemplazo de Planable para calendario, comentarios y aprobacion.
5. Mantén Canva como herramienta de diseno, pero guarda en Lumen el link, preview y version aprobada.
6. No agregues publicacion automatica todavia; esa fase queda fuera de este alcance.

## Siguiente capa tecnica

- Conectar esta UI a Supabase real.
- Migrar usuarios actuales a `profiles`, `brand_memberships` y `module_permissions`.
- Crear storage buckets para `asset_versions`.
- Agregar edge functions para IA y notificaciones.
- Conectar `email_notifications` a una Edge Function con Resend/SendGrid para enviar asignaciones, vencimientos y digest de lunes.
- Agregar import CSV para reportería inicial.
