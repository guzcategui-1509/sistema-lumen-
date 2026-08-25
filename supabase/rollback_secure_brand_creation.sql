begin;

revoke all on function public.create_brand(text, uuid, text)
  from public, anon, authenticated;
drop function if exists public.create_brand(text, uuid, text);

notify pgrst, 'reload schema';

commit;
