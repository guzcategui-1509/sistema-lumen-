# Lumen Workspace State

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
