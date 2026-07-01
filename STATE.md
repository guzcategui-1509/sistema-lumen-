# Lumen Workspace State

## 2026-07-01

### Cambio: estabilización UX pre-piloto
- Se eliminó el toast de navegación `Abriendo ...` al abrir una OT para evitar mensajes flotantes espontáneos y códigos antiguos visibles.
- La navegación operativa ahora incluye `Dashboard`, `Mis órdenes`, `Calendario` y `Perfil`; `Admin`, Equipo, Reportería y Notificaciones siguen fuera para roles operativos.
- Se agregó una vista `Perfil` separada de `Admin`, con datos de sesión, rol, cambio de password, accesos básicos y cierre de sesión.
- `Calendario` queda disponible para todos los roles. El botón `+ Crear OT` en calendario solo aparece para roles con permiso de creación.
- `Crear OT` ahora abre un modal consistente desde todos los botones `+ Crear OT`; el formulario ya no queda incrustado en la página principal de OTs.
- El modal tiene botón `×` y `Cancelar`, y al navegar fuera de OTs se cierra para evitar backdrops invisibles que bloqueen clicks.
- Se creó `supabase/patch_archive_pre_pilot_test_orders.sql` con una consulta de revisión y un bloque de archivado comentado para OTs de prueba (`AUTO-%` o títulos con `prueba`). No se ejecutó ningún archivado.

### Pendiente de validación manual
1. Entrar como operativo y confirmar que puede hacer click en Dashboard, Mis órdenes, Calendario y Perfil.
2. Confirmar que un operativo no ve Crear OT, IA, Equipo, Reportería, Notificaciones ni Admin.
3. Entrar como cuentas/admin y confirmar que cualquier botón `+ Crear OT` abre el mismo modal.
4. Cerrar el modal con `×` y `Cancelar`, y confirmar que no queda overlay bloqueando clicks.
5. Abrir una OT desde Dashboard/Mis órdenes y confirmar que no aparece toast `Abriendo ...`.
6. Ejecutar primero la consulta de revisión de `supabase/patch_archive_pre_pilot_test_orders.sql`; descomentar el archivado solo después de aprobar la lista.

## 2026-07-01

### Cambio: fixes puntuales pre-piloto en creación de OT y fases
- Se corrigió el formulario de creación/edición para conservar título, marca, deadline, cantidad de artes, descripción, responsables y fases cuando se agrega/quita una fase o se re-renderiza la sección.
- Se eliminó el default hardcodeado `2026-05-08` del formulario de creación; el deadline nuevo queda vacío hasta que el usuario lo elija.
- Se agregó el control `Usar fases en esta orden` al crear OT. Si se desactiva, la orden se crea sin insertar filas en `work_order_phases`.
- En el detalle, las órdenes sin fases muestran un estado vacío claro: `Esta orden no tiene fases`.
- Al completar una fase, `phase_completed` ahora deja trazabilidad en consola si no encuentra destinatarios; si el usuario que completa la fase es el único relacionado, encola el email para ese usuario para no perder el evento.
- `supabase/patch_phase_completed_notifications.sql` se ajustó para permitir ese fallback acotado con `recipient_user_id = auth.uid()` sin abrir permisos globales.

### Pendiente para activar/probar en Supabase
1. Ejecutar o re-ejecutar `supabase/patch_phase_completed_notifications.sql` para actualizar la policy de inserción de `phase_completed`.
2. Crear una OT con fases activadas y confirmar que se insertan las fases oficiales.
3. Crear una OT con `Usar fases en esta orden` apagado y confirmar que no hay filas en `work_order_phases`.
4. Completar una fase y confirmar un registro en `email_notifications` con `notification_type = phase_completed`.
5. Confirmar que no se notifica a dirección/jefatura por defecto y que no hay correos duplicados.

### Checks
- `npm run check` pasó.
- `git diff --check` pasó.

## 2026-07-01

### Cambio: navegación por rol y dashboard pre-piloto
- Se desactivó el asistente IA en la experiencia visible del sistema mediante `ENABLE_AI_ASSISTANT = false`.
- Los módulos IA (`Copywriting IA` y `Creatividad IA`) quedan bloqueados por navegación; las acciones internas de IA muestran aviso de piloto si se intentan disparar.
- Usuarios operativos (`creativo`, `disenador`, `editor`, `generador`, `community`, `pauta`, `medios`, `operaciones` y roles no gestión) solo ven Dashboard y Mis órdenes.
- Los operativos ya no ven `+ Crear OT`, Reportería, Notificaciones, Equipo ni Admin en navegación o header.
- `+ Crear OT` queda visible solo para roles de gestión: admin, dirección/directora, cuentas, coordinación, jefe/jefatura y ejecutivo.
- La sección Órdenes funciona como “Mis órdenes” para usuarios operativos, mostrando solo OTs donde participan, tienen fases asignadas o fueron creadores.
- El dashboard de gestión ahora muestra KPIs clickeables, un listado filtrado por la card activa, “Mis órdenes pendientes” y “Órdenes por marca” con desplegable.
- La carga global del equipo queda separada en el módulo Equipo, no como foco principal del dashboard inicial.

### Pendiente de validación manual
1. Login operativo: confirmar menú limitado, sin IA, sin crear OT y con Mis órdenes filtrado.
2. Login cuentas/dirección/admin: confirmar KPIs clickeables, mis órdenes, marcas desplegables y acceso a Equipo.
3. Confirmar que abrir una OT desde dashboard o Mis órdenes conserva permisos de fase existentes.

## 2026-06-30

### Cambio: nomenclatura de OTs por marca
- Se implementó la nomenclatura oficial para órdenes nuevas: `[ABREVIACION]-[CORRELATIVO]`, sin prefijo `OT`.
- El correlativo es por marca, no global. Ejemplos esperados: `VW-001`, `VW-002`, `SLK-001`, `DNE-001`.
- Se creó `supabase/patch_work_order_brand_codes.sql` para agregar `brands.abbreviation`, `work_order_brand_counters` y la RPC transaccional `generate_work_order_code_for_brand(uuid)`.
- El frontend dejó de usar `workOrders.length + 1` cuando crea órdenes conectadas a Supabase; ahora llama la RPC y bloquea la creación si el patch no está aplicado.
- La automatización `monthly-work-orders` dejó de generar códigos `AUTO-MATRIZ-*` / `AUTO-PAUTA-*`; ahora solicita código por marca con la misma RPC.
- No se cambian códigos históricos ni títulos existentes.
- Fallback documentado: si una marca no tiene abreviación, Supabase usa iniciales limpias del nombre; si no puede generarlas usa `GEN`.

### Pendiente para activar en producción
1. Ejecutar `supabase/patch_work_order_brand_codes.sql` en Supabase.
2. Ejecutar `supabase/patch_work_order_design_phase.sql` para reconocer `diseno` como fase oficial.
3. Ejecutar `supabase/patch_work_order_art_count.sql` si se usará cantidad de artes en piloto.
4. Ejecutar `supabase/patch_phase_completed_notifications.sql` para permitir correos `phase_completed`.
5. Redeploy de `monthly-work-orders` después de ejecutar el patch de códigos por marca.
6. Crear dos órdenes seguidas para la misma marca y confirmar incremento por marca.
7. Crear una orden para otra marca y confirmar que empieza/continúa su propio correlativo.

### Cambio: bloqueantes pre-piloto de fases, artes y notificaciones
- Se agregó la fase oficial `Diseño` (`diseno`) al catálogo principal del frontend.
- Las órdenes nuevas y la inicialización de fases usan ahora: Brief, Creatividad, Diseño, Producción, Revisión, Ajustes y Entrega.
- La Edge Function `monthly-work-orders` también crea `diseno` dentro de sus fases base.
- Se creó `supabase/patch_work_order_design_phase.sql`; no inserta fases masivamente en órdenes existentes.
- Se agregó `art_count` como dato informativo opcional en creación, edición y detalle de OT.
- Se creó `supabase/patch_work_order_art_count.sql`; la columna queda nullable, entera y no negativa.
- Al completar una fase en Supabase, la app encola emails `phase_completed` para creador, participantes explícitos y responsable de la siguiente fase, deduplicados; si no hay otros destinatarios relacionados, usa como fallback al usuario que completó la fase.
- Se creó `supabase/patch_phase_completed_notifications.sql` para permitir el tipo/política de correo de fase completada.

### Auditoría final de pre-piloto
- Estado recomendado: casi listo para piloto interno controlado, pero no listo para salir a todo el equipo.
- Nivel de riesgo: medio.
- `npm run check` pasó.
- `git diff --check` pasó.
- En la auditoría inicial no se hicieron cambios funcionales ni SQL; después se agregó el ajuste de nomenclatura por marca documentado arriba.

### Hallazgos principales
- Bloqueante funcional corregido en repo: la fase oficial `Diseño` ya está en `workOrderPhaseCatalog`, creación manual y `monthly-work-orders`. Pendiente ejecutar `supabase/patch_work_order_design_phase.sql`.
- Bloqueante funcional corregido en repo: `art_count` ya está en formulario, detalle y patches SQL. Pendiente ejecutar `supabase/patch_work_order_art_count.sql`.
- Riesgo de datos corregido en código: la creación conectada a Supabase ahora depende de `generate_work_order_code_for_brand(uuid)`. Sigue pendiente ejecutar el patch SQL en Supabase producción.
- Notificaciones: completar una fase encola email `phase_completed` si el patch de notificación está aplicado; el envio real sigue dependiendo de `email-worker`.
- Digest diario/semanal y automatizaciones existen en código y SQL, pero siguen requiriendo confirmación en Supabase: functions desplegadas, secrets correctos y cron aplicado.
- No se encontró `work_order_items`; se mantiene la OT como unidad principal.
- `config.js` solo contiene Supabase URL + anon key pública; no contiene service role ni Brevo.
- `vercel.json` bloquea/redirige docs, SQL y carpeta `supabase/*` para reducir exposición pública.

### Pendientes bloqueantes antes de piloto
1. Ejecutar los patches nuevos: `patch_work_order_brand_codes.sql`, `patch_work_order_design_phase.sql`, `patch_work_order_art_count.sql`, `patch_phase_completed_notifications.sql`.
2. Confirmar en Supabase producción que los patches críticos están aplicados: fases, completar fase, guardado seguro, archivado, destinatarios por marca y digest diario.
3. Redeploy de `monthly-work-orders` para que incluya Diseño y códigos por marca.
4. Confirmar que `daily-activity-digest`, `weekly-digest`, `email-worker` y `monthly-work-orders` están desplegadas con secrets.
5. Probar manualmente con usuario admin/cuentas y dos usuarios operativos antes de invitar a más personas.

### Checklist de piloto recomendado
1. Login admin/cuentas y confirmar dashboard de gestión.
2. Login operativo y confirmar dashboard personal.
3. Crear OT con título personalizado.
4. Confirmar que no se asignan usuarios no seleccionados.
5. Confirmar fases oficiales y que `Diseño` aparece.
6. Usuario A completa solo su fase; Usuario B no puede completar la fase de A.
7. Confirmar que completar fase no cambia `work_orders.status`.
8. Archivar una OT y confirmar que conserva fases, archivos, comentarios y actividad.
9. Crear una OT con cantidad de artes y confirmar que `art_count` se guarda.
10. Completar una fase y revisar `email_notifications` con tipo `phase_completed`, sin duplicados.
11. Ejecutar digest diario manualmente solo con usuarios controlados antes de activar cron.

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
