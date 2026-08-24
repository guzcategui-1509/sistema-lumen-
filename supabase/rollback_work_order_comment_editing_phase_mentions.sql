-- Safe rollback for author-only comment editing and structured phase mentions.
-- Existing general conversation RPCs and the two-argument phase comment RPC are untouched.

begin;

drop function if exists public.update_work_order_comment(uuid,text,uuid[]);
drop function if exists public.update_work_order_phase_comment(uuid,text,uuid[]);
drop function if exists public.add_work_order_phase_comment(uuid,text,uuid[]);
drop function if exists public.list_my_work_order_mentions(integer,timestamptz);
drop function if exists public.mark_work_order_mention_read(uuid,text);
drop function if exists public.queue_work_order_comment_mention_email(
  text,uuid,uuid,uuid,text,timestamptz,uuid,uuid,uuid,text
);

-- Preserve real mention/read history after the feature has been used. The table
-- is removed only while empty; otherwise it remains private for a later recovery.
do $preserve_feature_data$
begin
  if to_regclass('public.work_order_phase_comment_mentions') is not null then
    execute 'drop policy if exists work_order_phase_comment_mentions_select_related on public.work_order_phase_comment_mentions';
    execute 'revoke all privileges on table public.work_order_phase_comment_mentions from public, anon, authenticated';
    if not exists (select 1 from public.work_order_phase_comment_mentions) then
      drop table public.work_order_phase_comment_mentions;
    end if;
  end if;
end;
$preserve_feature_data$;

-- edited_at remains nullable on both comment tables so a rollback never erases
-- audit evidence from comments that were already edited.

notify pgrst, 'reload schema';

commit;
