-- Lumen Workspace: Planificador de producción
-- Herramienta independiente para planificar producciones mensuales por marca.
-- Seguro para producción: crea una tabla nueva y no modifica work_orders ni work_order_phases.

create table if not exists public.production_planner_items (
  id uuid primary key default gen_random_uuid(),

  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2026),

  brand text not null,
  medium text,
  deliverables text,

  talent_requirement text,
  raw_matrix_status text,
  raw_matrix_due_date date,
  production_date date,

  status text not null default 'Pendiente',

  account_owner text,
  digital_owner text,
  notes text,

  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_production_planner_items_period
on public.production_planner_items (year, month);

create index if not exists idx_production_planner_items_brand
on public.production_planner_items (brand);

create index if not exists idx_production_planner_items_status
on public.production_planner_items (status);

create index if not exists idx_production_planner_items_production_date
on public.production_planner_items (production_date);

create index if not exists idx_production_planner_items_archived_at
on public.production_planner_items (archived_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_production_planner_items_updated_at on public.production_planner_items;
create trigger trg_production_planner_items_updated_at
before update on public.production_planner_items
for each row execute function public.touch_updated_at();

create or replace function public.can_access_production_planner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (public.current_app_role())::text in (
      'admin',
      'directora',
      'director',
      'direccion',
      'dirección',
      'cuentas',
      'cuenta',
      'coordinador',
      'coordinadora',
      'coordinacion',
      'coordinación',
      'ejecutivo',
      'ejecutiva',
      'produccion',
      'producción'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(p.email) in ('guzcategui@grupolumen.com')
        and p.is_active is not false
    ),
    false
  );
$$;

alter table public.production_planner_items enable row level security;

drop policy if exists "production_planner_select_allowed" on public.production_planner_items;
create policy "production_planner_select_allowed"
on public.production_planner_items for select
using (public.can_access_production_planner());

drop policy if exists "production_planner_insert_allowed" on public.production_planner_items;
create policy "production_planner_insert_allowed"
on public.production_planner_items for insert
with check (public.can_access_production_planner());

drop policy if exists "production_planner_update_allowed" on public.production_planner_items;
create policy "production_planner_update_allowed"
on public.production_planner_items for update
using (public.can_access_production_planner())
with check (public.can_access_production_planner());

grant select, insert, update on public.production_planner_items to authenticated;
grant execute on function public.can_access_production_planner() to authenticated;

-- Seed opcional para Julio 2026.
-- Revisar antes de ejecutar. Para cargarlo, quitar los comentarios del bloque insert.
/*
insert into public.production_planner_items (
  month, year, brand, medium, deliverables, talent_requirement, raw_matrix_status,
  raw_matrix_due_date, production_date, status, account_owner, digital_owner, notes
) values
  (7, 2026, 'Talleres', 'Meta', null, 'Modelo', 'En revisión', '2026-07-01', '2026-07-14', 'Pendiente', 'Raquel', 'lis', 'mismo modelo'),
  (7, 2026, 'Repuestos', 'Meta', null, 'Modelo', 'En revisión', '2026-07-01', '2026-07-14', 'Pendiente', 'Raquel', 'lis', 'mismo modelo'),
  (7, 2026, 'Volkswagen', 'TikTok', '10 videos', 'Modelo', null, '2026-07-10', '2026-07-15', 'Pendiente', 'Pelin', 'lis', null),
  (7, 2026, 'Volkswagen Camiones', 'TikTok', '10 videos', 'Vendedor', null, '2026-07-09', '2026-07-16', 'Pendiente', 'Pelin', 'lis', null),
  (7, 2026, '212', 'TikTok', '5 videos', 'No', 'Aprobado', null, null, 'Pendiente', 'Raquel', 'lis', 'material de stock ya tiene rodrigo, Revisar Julio con Raquel'),
  (7, 2026, 'JIM', 'TikTok', '10 videos', 'Modelo', null, '2026-07-09', '2026-07-21', 'Pendiente', 'Raquel', 'lis', 'Axel y lis ven modelo'),
  (7, 2026, 'Bestune', 'TikTok', '10 videos', 'Modelo', null, '2026-07-03', '2026-07-22', 'Pendiente', 'Raquel', null, null),
  (7, 2026, 'Leapmotor', 'TikTok', '10 videos', 'Vendedor', null, '2026-07-03', '2026-07-20', 'Pendiente', 'Raquel', null, null),
  (7, 2026, 'Wash&go', 'Meta', '4 videos', 'No', null, null, '2026-07-16', 'Pendiente', 'Karen', 'Javi', 'No se necesita produccion en Julio'),
  (7, 2026, 'Solarsa', 'Meta', '4 videos', 'No', null, null, '2026-07-15', 'Pendiente', 'Karen', 'Javi', null),
  (7, 2026, 'Usados', 'Meta', 'Diseño', null, 'En revisión', null, null, 'Pendiente', 'Raquel', 'Lis', null),
  (7, 2026, 'RZ', null, null, null, null, null, null, 'Pendiente', 'Karen', null, null),
  (7, 2026, 'SILK', 'Meta', '8 videos', 'Modelo', null, null, null, 'Pendiente', 'Alejandro', 'Javi/Giuls', 'En espera de fecha con Axel y Alejandro');
*/
