-- Rollback for patch_fix_work_order_phase_comment_read_access.sql.
-- Restores the previous brand-access based SELECT policy.

begin;

drop policy if exists "work_order_phase_comments_select_work_order_access"
on public.work_order_phase_comments;

drop policy if exists "work_order_phase_comments_select_brand_access"
on public.work_order_phase_comments;

create policy "work_order_phase_comments_select_brand_access"
on public.work_order_phase_comments
for select
to authenticated
using (
  public.current_app_role() <> 'cliente'
  and exists (
    select 1
    from public.work_orders wo
    where wo.id = work_order_phase_comments.work_order_id
      and public.can_access_brand(wo.brand_id)
  )
);

commit;
