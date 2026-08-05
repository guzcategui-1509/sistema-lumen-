begin;

-- Restore the authorization and candidate rules that were active before this
-- hotfix. Existing comments, mentions, read state and emails are untouched.
create or replace function public.can_access_work_order_conversation(
  target_work_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    auth.uid() is not null
    and public.is_internal_user()
    and exists (
      select 1
      from public.work_orders wo
      where wo.id = target_work_order_id
        and (
          (
            public.can_manage_work_orders()
            and public.can_access_brand(wo.brand_id)
          )
          or wo.created_by = auth.uid()
          or exists (
            select 1
            from public.work_order_assignees woa
            where woa.work_order_id = wo.id
              and woa.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.work_order_phases wop
            where wop.work_order_id = wo.id
              and wop.assigned_to = auth.uid()
          )
        )
    ),
    false
  );
$function$;

create or replace function public.work_order_comment_mention_candidates_for(
  target_work_order_id uuid,
  target_actor_id uuid
)
returns table (
  id uuid,
  full_name text,
  role text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $function$
  with target_order as (
    select wo.id, wo.brand_id, wo.created_by
    from public.work_orders wo
    where wo.id = target_work_order_id
  ), related_users as (
    select target_order.created_by as user_id from target_order
    union
    select assignee.user_id
    from public.work_order_assignees assignee
    where assignee.work_order_id = target_work_order_id
    union
    select phase.assigned_to
    from public.work_order_phases phase
    where phase.work_order_id = target_work_order_id and phase.assigned_to is not null
    union
    select manager.id
    from target_order
    join public.profiles manager on manager.role::text in ('admin', 'directora', 'cuentas')
    where manager.role::text in ('admin', 'directora')
       or exists (
         select 1 from public.brand_memberships membership
         where membership.user_id = manager.id
           and membership.brand_id = target_order.brand_id
       )
  )
  select profile.id, profile.full_name, profile.role::text, lower(btrim(profile.email))
  from related_users related
  join public.profiles profile on profile.id = related.user_id
  where profile.id <> target_actor_id
    and profile.is_active is true
    and profile.role::text <> 'cliente'
    and profile.email is not null
    and btrim(profile.email) <> ''
    and lower(btrim(profile.email)) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  order by profile.full_name, profile.id;
$function$;

revoke all on function public.work_order_comment_mention_candidates_for(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.can_access_work_order_conversation(uuid) from public, anon;
grant execute on function public.can_access_work_order_conversation(uuid) to authenticated;
revoke all on function public.list_work_order_comment_mention_candidates(uuid) from public, anon;
grant execute on function public.list_work_order_comment_mention_candidates(uuid) to authenticated;

drop function if exists public.can_profile_access_work_order_conversation(uuid, uuid);
drop function if exists public.normalize_work_order_conversation_role(text);

notify pgrst, 'reload schema';

commit;
