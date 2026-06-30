# Lumen Workspace State

## 2026-06-25

### Cambio realizado
- Se agregó dashboard adaptado por rol sin cambiar RLS, correos, funciones Supabase ni modelo de datos.
- Roles de gestión (`admin`, `directora`, `direccion`, `cuentas`, `coordinador`, `coordinacion`, `ejecutivo`) mantienen el dashboard ejecutivo de equipo.
- Roles operativos (`creativo`, `disenador`, `editor`, `generador`, `community`, `pauta`, `operaciones`, `medios` y cualquier rol no clasificado como gestión) ven un dashboard personal centrado en sus fases.
- El dashboard operativo muestra `Mis fases pendientes`, `Mis fases vencidas`, `Para hoy / próximos 7 días`, `En revisión`, `Terminadas recientemente` y búsqueda rápida por OT, título o marca.
- Las fases terminadas/canceladas no aparecen como pendientes.
- Las órdenes archivadas quedan excluidas de las listas activas del dashboard.
- Cada fila de fase y resultado de búsqueda abre el detalle existente de la OT con `view-work-order`.

### Estado de piloto
- Estado actual: listo para piloto interno controlado si las pruebas manuales pasan en Supabase/Vercel.
- Usuarios sugeridos para piloto:
  - 1 admin/cuentas.
  - 1 creativo.
  - 1 diseñador/editor.
  - 1 usuario operativo adicional.

### Pendientes
- Probar con sesiones reales de usuarios de distintos roles, porque el dashboard depende de `profiles.role` y de las fases visibles por RLS.
- Confirmar que cada fase relevante tiene `assigned_to` correcto en `work_order_phases`.
- Confirmar en producción que órdenes archivadas usan `archived_at` y no aparecen como activas.
- Mantener pendiente el refactor grande de `app.js`; esta fase solo agregó la bifurcación mínima del dashboard.

### Checklist de pruebas del piloto
1. Login como admin/cuentas.
2. Confirmar que ve dashboard de gestión.
3. Login como creativo/diseñador/editor.
4. Confirmar que ve dashboard operativo.
5. Confirmar que aparecen `Mis fases pendientes`.
6. Confirmar que fases de otros usuarios no aparecen como propias.
7. Confirmar que fases vencidas se destacan.
8. Confirmar que fases terminadas no aparecen como pendientes.
9. Confirmar que una orden archivada no aparece como activa.
10. Confirmar que título/código abre detalle de orden.
11. Confirmar que búsqueda funciona por título/código/marca.
12. Ejecutar `npm run check`.

## 2026-06-22

### Cambio realizado
- Se implementaron los bloqueantes de Fase 1 para piloto interno controlado.
- Se agregó `supabase/PRODUCTION_BASELINE.md` como checklist del schema esperado, patches requeridos, Edge Functions, secrets y crons.
- Se creó `supabase/patch_work_order_phase_safe_save.sql` con RPC `save_work_order_phases(target_work_order_id uuid, phases_payload jsonb)` para guardar fases en una transacción y reemplazar el patrón riesgoso de borrar/reinsertar desde el navegador.
- El frontend ahora guarda fases mediante `save_work_order_phases`; si falta el patch, muestra un mensaje específico para ejecutarlo.
- Las notificaciones de creación manual de OT ahora se limitan a creador, responsables generales seleccionados y responsables asignados a fases.
- La alerta urgente usa responsables relacionados y destinatarios fijos configurados para la marca; ya no toma automáticamente a todos los roles dirección/cuentas.
- El digest diario ahora agrupa solo actividad de OTs donde la persona es creadora, responsable general o responsable de fase.
- La automatización mensual ya no agrega destinatarios fijos de marca a cada email automático; usa cuentas/responsables definidos por marca.
- `vercel.json` ahora redirige archivos internos (`README.md`, `DEPLOY.md`, `EMAIL_SETUP.md`, `STATE.md`, `config.example.js`, `package.json`, `supabase/*`) para reducir exposición pública en Vercel.

### Pendientes
- Ejecutar en Supabase producción, en este orden mínimo: `supabase/patch_work_order_phase_completion.sql`, `supabase/patch_work_order_phase_safe_save.sql`, `supabase/patch_work_order_archive.sql`, `supabase/patch_brand_notification_recipients.sql`.
- Confirmar que `work_order_phases` tiene RLS activo, índices y RPCs `complete_work_order_phase` + `save_work_order_phases`.
- Redesplegar Edge Functions modificadas: `monthly-work-orders`, `daily-activity-digest` y `weekly-digest` si sus cambios aún no están en Supabase.
- Confirmar `APP_URL`, `BREVO_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Supabase Functions.
- Confirmar si `supabase/schedule_email_automation.sql` está aplicado antes de activar correos recurrentes a todo el equipo.
- Hacer prueba con usuarios controlados antes de dejar el digest diario y automatizaciones mensuales activas.

### Cómo probar
1. Ejecutar `npm run check`.
2. Crear una OT con título personalizado y confirmar que `work_orders.title` coincide con lo escrito.
3. Crear una OT sin responsables generales y confirmar que no se insertan filas no seleccionadas en `work_order_assignees`.
4. Crear fases con responsables distintos y guardar la OT.
5. Editar la OT, cambiar solo una fase y confirmar que las demás fases no se pierden.
6. Completar una fase asignada a Usuario A y confirmar que `completed_at` se llena solo en esa fase.
7. Confirmar que `work_orders.status` no cambia automáticamente al completar una fase.
8. Intentar completar una fase de Usuario B con Usuario A y confirmar bloqueo.
9. Crear una OT con notificación activa y revisar que `email_notifications` no duplica destinatarios.
10. Ejecutar `daily-activity-digest` manualmente con usuarios de prueba y confirmar que no incluye OTs ajenas.
11. Probar en Vercel que `/supabase/launch_mvp.sql`, `/README.md` y `/STATE.md` no muestran contenido interno.

## 2026-06-21

### Cambio realizado
- Se eliminó visual y funcionalmente el flujo antiguo de `jefe inmediato` en creación/detalle de OTs.
- La creación de OTs ya no agrega responsables de jefatura/dirección automáticamente ni inserta subtareas de revisión previa.
- El título de una OT nueva queda vacío hasta que el usuario lo escriba; la IA solo lo completa si el campo está vacío y no debe sobrescribir un título escrito.
- La validación de creación ya no exige responsables generales; una OT puede crearse con fases sin responsable.
- Las notificaciones combinan destinatarios fijos por marca + responsables seleccionados + responsables asignados a fases, sin duplicar.
- Se agregó acción `Marcar mi fase realizada` para completar una fase específica sin completar la orden principal.
- Se creó `supabase/patch_work_order_phase_completion.sql` con RLS más acotado y RPC `complete_work_order_phase(target_phase_id uuid)`.
- Las automatizaciones mensuales ahora crean fases base editables en `work_order_phases` para cada OT automática.
- El digest diario y semanal ahora consideran responsables de fases además de `work_order_assignees`.

### Pendientes
- Ejecutar `supabase/patch_work_order_phase_completion.sql` en Supabase producción.
- Redesplegar Edge Functions modificadas: `monthly-work-orders`, `daily-activity-digest` y `weekly-digest`.
- Confirmar en Supabase que `lumen-prepare-daily-activity-digest` está programado con `supabase/schedule_daily_activity_digest.sql` o `supabase/schedule_email_automation.sql`.
- Probar con usuarios reales: una fase asignada a Usuario A solo debe poder completarla Usuario A o un rol de gestión.
- Confirmar en `email_notifications` que los destinatarios incluyen fases asignadas y que no hay duplicados.

### Cómo probar
1. Crear una OT con título personalizado y verificar que `work_orders.title` coincide con lo escrito.
2. Crear una OT sin responsables generales y confirmar que no se insertan filas en `work_order_assignees`.
3. Asignar una fase a Usuario A y otra a Usuario B.
4. Entrar como Usuario A y completar solo su fase con `Marcar mi fase realizada`.
5. Confirmar que `work_order_phases.status = completed` y `completed_at` se actualiza solo para esa fase.
6. Confirmar que `work_orders.status` no cambia automáticamente a completada.
7. Revisar que una actualización de fase genere actividad `phase_completed`.
8. Crear una OT con notificaciones activas y revisar que `email_notifications` incluye destinatarios fijos de marca y responsables/fases relacionados.
9. Ejecutar manualmente `daily-activity-digest` solo con un usuario/control antes de dejarlo como cron de producción.

## 2026-06-19

### Cambio realizado
- Se diagnosticó y reforzó el flujo de archivado de órdenes de trabajo.
- El archivado usa `work_orders.archived_at`; no elimina órdenes ni cambia `work_order_status`.
- Se actualizó `supabase/patch_work_order_archive.sql` para que la RPC `archive_work_order` sea autocontenida, valide permisos con `can_archive_work_orders()` y registre actividad sin depender de políticas generales de actualización.
- Se agregó confirmación en la UI antes de archivar y mensajes de error más claros cuando falta ejecutar el patch SQL o el usuario no tiene permisos.

### Pendientes
- Ejecutar `supabase/patch_work_order_archive.sql` en Supabase producción si el proyecto tiene una versión anterior de la función.
- Probar con un usuario `admin` o `cuentas` y con un usuario `generador`/`creativo` con acceso a la marca.
- Confirmar en Supabase que la OT mantiene fases, archivos, comentarios, responsables y actividad después de archivarse.

### Cómo probar
1. Abrir una OT activa.
2. Presionar `Archivar`.
3. Confirmar el diálogo.
4. Verificar que la OT desaparece del panel activo.
5. Abrir `Ver archivadas` y confirmar que aparece.
6. Restaurarla y confirmar que vuelve al panel activo.
7. Revisar que `work_orders.archived_at` cambia y que `work_order_activity` registra `archived` / `unarchived`.
