# Plan de cierre pre-piloto Lumen Workspace

Fecha: 2026-07-07

Este documento convierte la Auditoría 360 en un plan accionable para cerrar riesgos antes de iniciar un piloto interno controlado. No agrega funcionalidades nuevas ni propone rediseños grandes. El objetivo es validar y estabilizar lo que ya existe.

## 1. Estado actual

Estado general: parcialmente listo para piloto controlado.

Riesgo actual: medio-alto.

Recomendación: salir a piloto solo con condiciones, no abrir todavía a todo el equipo.

La app ya cubre los flujos principales: órdenes de trabajo, fases, roles operativos/gestión, urgencias, archivado, planificador de producción, notificaciones y Edge Functions. El riesgo principal está en confirmar que producción está alineada con el repo: patches SQL aplicados, Edge Functions desplegadas, cron activo, emails procesando correctamente y permisos reales validados con usuarios reales.

## 2. Riesgo general

Riesgos principales antes del piloto:

| Riesgo | Nivel | Motivo | Acción requerida |
|---|---:|---|---|
| Correos `phase_completed` atorados en `queued` | Crítico | Hay 8 registros completos que no pasan a `sent` ni `failed` | Ejecutar worker con logs y confirmar resultado por SQL |
| Schema drift / patches no confirmados | Alto | La app depende de múltiples patches SQL | Verificar tablas, columnas y RPCs en Supabase producción |
| Edge Functions / cron no observados end-to-end | Alto | Digest y worker pueden preparar pero no enviar | Validar functions, secrets, cron y logs |
| Permisos por rol no probados con usuarios reales | Alto | Frontend y RLS pueden divergir | QA con usuario operativo, gestión y admin |
| `app.js` monolítico | Medio | Alto riesgo de regresión al modificar | No refactorizar antes del piloto; tocar solo bugs bloqueantes |

## 3. Bloqueantes antes de piloto

### B1. Cerrar `email-worker` / correos queued

Problema:

- Hay 8 correos `phase_completed` en `queued`.
- Tienen `scheduled_for` vencido.
- Tienen `recipient_email`, `recipient_user_id`, `brand_id`, `work_order_id`.
- No tienen `sent_at`.
- No tienen `error_message`.
- `email-worker` ya aparece activo en Supabase como versión 12, pero esos registros siguen atorados.

Tareas:

1. Ejecutar SQL de diagnóstico para confirmar candidatos:

```sql
select
  id,
  recipient_email,
  notification_type::text as notification_type,
  subject,
  status,
  scheduled_for,
  created_at,
  html_body is not null as has_html_body,
  length(coalesce(html_body, '')) as html_length
from public.email_notifications
where status in ('queued', 'pending')
  and (scheduled_for is null or scheduled_for <= now())
order by scheduled_for asc nulls first, created_at asc;
```

2. Ejecutar manualmente `email-worker`.
3. Revisar logs de Supabase Edge Function.
4. Confirmar que aparezca:

```txt
email-worker:start
email-worker:candidates
email-worker:candidate
email-worker:result
```

5. Verificar los 8 IDs específicos:

```sql
select
  id,
  recipient_email,
  notification_type::text as notification_type,
  subject,
  status,
  sent_at,
  error_message
from public.email_notifications
where id in (
  'bce3de86-a60f-4ffd-9556-02c0128349dd',
  '00b32ef0-1bf5-457f-b2ee-648c465b1755',
  '8b533da5-1608-4a6a-84ef-c4bd2a8b501c',
  '484c14ba-dc1b-4744-aabb-56a0820b2937',
  'dde8dbe9-107b-47c4-95d5-380f4632fc55',
  'cc38af4e-aa39-4b65-aebf-507cea17dfc6',
  'f55cca86-88e5-4d37-a233-3295b34865b8',
  '52f93fb3-8f26-4c5a-aff9-be364e0695a5'
)
order by created_at asc;
```

Criterio de aceptación:

- Los 8 correos dejan de estar en `queued`.
- Cada correo queda en `sent` o `failed`.
- Si queda en `failed`, tiene `error_message`.
- No queda ningún `phase_completed` vencido en `queued` sin explicación.

### B2. Confirmar patches críticos aplicados

Tareas:

1. Confirmar tablas:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'work_orders',
    'work_order_phases',
    'work_order_brand_counters',
    'production_planner_items',
    'email_notifications'
  )
order by table_name;
```

2. Confirmar columnas:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'work_orders' and column_name in ('art_count', 'is_urgent', 'archived_at'))
    or (table_name = 'work_order_phases' and column_name in ('assigned_to', 'status', 'due_date', 'completed_at'))
    or (table_name = 'production_planner_items' and column_name in ('month', 'year', 'archived_at'))
  )
order by table_name, column_name;
```

3. Confirmar RPCs:

```sql
select proname
from pg_proc
where proname in (
  'generate_work_order_code_for_brand',
  'save_work_order_phases',
  'complete_work_order_phase',
  'archive_work_order'
)
order by proname;
```

Criterio de aceptación:

- Todas las tablas existen.
- Todas las columnas críticas existen.
- Todas las RPCs existen.
- No hay errores de schema cache en la app durante creación, fases, urgencias o archivado.

### B3. Validar Planificador de producción

Tareas:

1. Confirmar tabla:

```sql
select count(*) as total
from public.production_planner_items;
```

2. Confirmar periodo Julio 2026:

```sql
select count(*) as julio_2026
from public.production_planner_items
where month = 7
  and year = 2026;
```

3. Abrir UI de Planificador.
4. Confirmar que no aparece aviso rojo de tabla faltante.
5. Confirmar que abre en Julio 2026.
6. Confirmar que muestra todas las producciones del mes por defecto.
7. Confirmar filtros horizontales.
8. Confirmar que una fila completa es clickeable.
9. Editar estado/notas y guardar.
10. Archivar una fila.
11. Activar `Ver archivadas`.
12. Restaurar.

Criterio de aceptación:

- Tabla existe.
- Seed Julio 2026 está cargado si fue aprobado.
- UI carga sin errores.
- Crear, editar, archivar y restaurar funcionan.
- La vista no depende del selector global de marca.

### B4. Validar usuario operativo real

Roles sugeridos:

- diseñador / disenador
- creativo
- editor
- generador

Checklist:

1. Login sin refresh.
2. Dashboard operativo carga.
3. Mis órdenes carga.
4. Calendario visible.
5. Perfil visible.
6. Abrir una OT visible desde Dashboard.
7. Abrir una OT visible desde Mis órdenes.
8. Completar fase propia.
9. Confirmar que la OT completa no cambia a completada.
10. Confirmar que no puede completar fase ajena.
11. Confirmar que no ve:
    - Crear OT
    - Admin
    - Equipo
    - Reportería
    - Notificaciones globales
    - IA

Criterio de aceptación:

- Operativo puede trabajar sin ayuda técnica.
- Puede abrir órdenes visibles.
- Puede completar solo su fase.
- No ve módulos administrativos.

### B5. Validar usuario gestión real

Roles sugeridos:

- admin
- cuentas
- dirección / directora
- coordinador

Checklist:

1. Login sin refresh.
2. Dashboard de gestión carga.
3. Crear OT con título personalizado.
4. Crear OT con fases oficiales.
5. Crear OT sin fases.
6. Confirmar código por marca.
7. Editar OT.
8. Marcar urgencia.
9. Refrescar y confirmar persistencia.
10. Quitar urgencia.
11. Archivar OT.
12. Restaurar OT.
13. Abrir Planificador.
14. Abrir Notificaciones.
15. Preparar resumen diario.
16. Preparar resumen semanal.
17. Enviar pendientes.

Criterio de aceptación:

- Gestión puede crear, editar, supervisar y archivar.
- Urgencia persiste.
- Notificaciones muestran estado real.
- Enviar pendientes procesa o falla con error visible.

### B6. Consola limpia

Durante los flujos principales no debe aparecer:

- `ReferenceError`
- `TypeError`
- `is not defined`
- `Cannot read properties`
- errores de `data-action`
- overlays bloqueando clicks
- spinner infinito

Criterio de aceptación:

- Consola limpia en login, dashboard, Mis órdenes, detalle OT, completar fase, crear OT, Planificador, Notificaciones.
- Si una Edge Function falla, debe haber mensaje claro y log útil, no error genérico silencioso.

## 4. Checklist técnico Supabase

Ejecutar antes de piloto:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Verificar específicamente:

- `profiles`
- `brands`
- `brand_memberships`
- `work_orders`
- `work_order_assignees`
- `work_order_phases`
- `work_order_activity`
- `work_order_files`
- `email_notifications`
- `weekly_digest_runs`
- `brand_notification_recipients`
- `production_planner_items`
- `work_order_brand_counters`

Verificar funciones:

```sql
select proname
from pg_proc
where proname in (
  'generate_work_order_code_for_brand',
  'save_work_order_phases',
  'complete_work_order_phase',
  'archive_work_order',
  'can_access_production_planner'
)
order by proname;
```

Verificar crons:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname in (
  'lumen-prepare-daily-activity-digest',
  'lumen-prepare-weekly-digest',
  'lumen-send-prepared-emails',
  'lumen-send-weekly-digest',
  'lumen-monthly-content-matrix',
  'lumen-monthly-paid-placement'
)
order by jobname;
```

Verificar últimos runs:

```sql
select jobid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 50;
```

## 5. Checklist QA por rol

### Admin / gestión

- Login.
- Dashboard.
- Crear OT con fases.
- Crear OT sin fases.
- Editar OT.
- Archivar/restaurar.
- Marcar/quitar urgencia.
- Planificador.
- Notificaciones.
- Enviar pendientes.
- Equipo.

### Operativo

- Login.
- Dashboard.
- Mis órdenes.
- Abrir OT.
- Completar fase propia.
- Intentar completar fase ajena.
- Calendario.
- Perfil.
- Ver badge urgente.
- Confirmar módulos ocultos.

### Cuentas

- Crear OT.
- Asignar responsables.
- Revisar fases sin responsable.
- Usar Planificador.
- Revisar urgencias.
- Revisar cola de correos.

## 6. Checklist emails/cron

Diario antes y durante piloto:

```sql
select
  status,
  notification_type::text as notification_type,
  count(*) as total
from public.email_notifications
group by status, notification_type
order by status, notification_type;
```

Correos atorados:

```sql
select
  id,
  recipient_email,
  notification_type::text as notification_type,
  subject,
  status,
  scheduled_for,
  sent_at,
  error_message,
  created_at
from public.email_notifications
where status in ('queued', 'pending')
  and (scheduled_for is null or scheduled_for <= now())
order by scheduled_for asc nulls first, created_at asc;
```

Fallidos:

```sql
select
  recipient_email,
  notification_type::text as notification_type,
  subject,
  status,
  error_message,
  created_at
from public.email_notifications
where status = 'failed'
order by created_at desc
limit 50;
```

Criterio de aceptación:

- No hay correos vencidos en `queued/pending` sin explicación.
- Todo fallo tiene `error_message`.
- El cron `lumen-send-prepared-emails` corre o se ejecuta worker manualmente.

## 7. Checklist Planificador de producción

Validar:

- Acceso solo a roles autorizados.
- Periodo Julio 2026.
- Selector mes/año.
- Filtros:
  - marca
  - medio
  - estado
  - responsable cuentas
  - responsable digital
  - archivadas
- Tabla visible arriba.
- Filas clickeables.
- Modal de edición.
- Guardar cambios.
- Archivar.
- Restaurar.
- Duplicar mes anterior.

Criterio de aceptación:

- Puede usarse como spreadsheet operativo.
- No genera OTs.
- No modifica fases.
- No depende del selector global de marca.

## 8. Criterios para salir a piloto

Salir a piloto solo si:

1. Los 8 correos `phase_completed` ya no están atorados.
2. Patches críticos confirmados en producción.
3. Usuario operativo real pasa QA.
4. Usuario gestión real pasa QA.
5. Planificador funciona con datos reales.
6. `email-worker` procesa pendientes o falla con error claro.
7. Cron está confirmado o se decide operación manual temporal.
8. Consola limpia en flujos principales.
9. No hay overlays bloqueando clicks.
10. `npm run check` y `git diff --check` pasan.

## 9. Criterios para detener piloto

Detener piloto si ocurre cualquiera de estos casos:

- Usuarios operativos no pueden abrir OTs.
- Usuarios operativos no pueden completar fases propias.
- Se crean OTs con títulos incorrectos o códigos duplicados.
- Se asignan responsables no seleccionados.
- Archivar borra o pierde información.
- Correos se envían a personas no relacionadas.
- Emails fallan masivamente sin `error_message`.
- Aparecen errores recurrentes `ReferenceError` / `TypeError`.
- RLS bloquea flujos legítimos principales.
- Datos reales quedan inconsistentes.

## 10. Plan de monitoreo durante 5 días

### Día 1

- Probar login y navegación por rol.
- Crear 2 OTs reales controladas.
- Completar fases.
- Revisar `email_notifications`.
- Revisar consola.

### Día 2

- Probar Planificador con datos reales.
- Revisar filtros y edición.
- Revisar archivado/restauración de una fila.
- Revisar crons ejecutados.

### Día 3

- Revisar urgencias.
- Revisar OTs sin fases.
- Revisar OTs con fases.
- Monitorear correos `queued`, `failed`, `sent`.

### Día 4

- Revisar dashboard operativo.
- Revisar dashboard gestión.
- Registrar fricciones UX.
- Confirmar que no hay errores de permisos.

### Día 5

- Revisar métricas finales.
- Listar bugs encontrados.
- Decidir:
  - ampliar piloto;
  - corregir bloqueantes;
  - mantener piloto controlado.

Canal recomendado para bugs:

- Un documento o canal único con:
  - usuario
  - rol
  - acción
  - resultado esperado
  - resultado real
  - captura/consola
  - hora

## 11. Mejoras post-piloto

No hacer antes del piloto salvo bloqueo real.

1. Modularizar `app.js`.
2. Crear tests mínimos:
   - navegación por rol
   - crear OT
   - completar fase
   - archivar
   - urgencia
   - planificador
3. Limpiar código IA desactivado.
4. Limpiar SQL histórico obsoleto.
5. Unificar helpers de roles.
6. Crear observabilidad de Edge Functions:
   - últimos runs
   - emails procesados
   - fallidos
   - errores por función
7. Crear panel admin real de health checks.
8. Mejorar documentación técnica:
   - orden de patches
   - funciones desplegadas
   - secrets requeridos
   - cron activo
   - checklist de release.
