revoke all on function public.complete_work_order_without_phases(uuid)
from authenticated;

drop function if exists public.complete_work_order_without_phases(uuid);

drop trigger if exists guard_work_order_phase_parent_state
on public.work_order_phases;

drop function if exists public.guard_work_order_phase_parent_state();
