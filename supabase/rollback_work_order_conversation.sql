-- Rollback seguro: desactiva las RPCs nuevas sin eliminar conversaciones.
-- Las columnas nuevas se conservan porque pueden contener auditoria.
-- Para volver al frontend anterior, desplegar la version previa de app.js/styles.css.

revoke all
on function public.create_work_order_comment(uuid, text, text, boolean, uuid)
from authenticated;
revoke all
on function public.resolve_work_order_comment(uuid)
from authenticated;
revoke all
on function public.can_access_work_order_conversation(uuid)
from authenticated;

drop function if exists public.create_work_order_comment(
  uuid,
  text,
  text,
  boolean,
  uuid
);
drop function if exists public.resolve_work_order_comment(uuid);

drop policy if exists "work_order_comments_select_related_order"
  on public.work_order_comments;

create policy "work_order_comments_select_brand_access"
on public.work_order_comments
for select
to authenticated
using (
  public.is_internal_user()
  and exists (
    select 1
    from public.work_orders wo
    where wo.id = work_order_comments.work_order_id
      and public.can_access_brand(wo.brand_id)
  )
);

revoke all privileges
on table public.work_order_comments
from public, anon, authenticated;

grant select
on table public.work_order_comments
to authenticated;

drop function if exists public.can_access_work_order_conversation(uuid);
