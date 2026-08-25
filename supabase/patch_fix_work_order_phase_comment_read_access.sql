-- HOTFIX: allow users who can legitimately open an OT conversation to read
-- comments attached to phases of that same OT.
--
-- This does not grant brand-wide access and does not change INSERT/UPDATE/DELETE.

begin;

grant select on table public.work_order_phase_comments to authenticated;

drop policy if exists "work_order_phase_comments_select_brand_access"
on public.work_order_phase_comments;

drop policy if exists "work_order_phase_comments_select_work_order_access"
on public.work_order_phase_comments;

create policy "work_order_phase_comments_select_work_order_access"
on public.work_order_phase_comments
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.work_orders wo
    where wo.id = work_order_phase_comments.work_order_id
      and public.can_access_work_order_conversation(wo.id)
  )
);

commit;
