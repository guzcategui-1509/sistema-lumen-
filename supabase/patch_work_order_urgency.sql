-- Adds a persistent urgency flag for work orders.
-- Safe to run in production: no data is deleted and existing rows default to false.

alter table public.work_orders
add column if not exists is_urgent boolean not null default false;

create index if not exists idx_work_orders_is_urgent
on public.work_orders (is_urgent)
where is_urgent = true;
