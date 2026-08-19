-- Inventory — general clinical supplies/equipment, separate from the
-- Pharmacy medications catalog. Same stock/reorder/movement-ledger shape
-- as medications/dispenses in 0002_workflow.sql and 0005_pharmacy_stock.sql,
-- so Procedures (0012) has something to consume.

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text,
  unit_cost numeric(10, 2) not null default 0,
  stock_quantity integer not null default 0,
  reorder_level integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_stock_non_negative check (stock_quantity >= 0)
);

alter table public.inventory_items enable row level security;

create policy "inventory_items_select_staff" on public.inventory_items for select to authenticated using (true);
create policy "inventory_items_write_admin" on public.inventory_items for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create trigger trg_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function extensions.moddatetime(updated_at);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  change_qty integer not null,
  reason text not null check (reason in ('received', 'procedure_use', 'adjustment', 'wastage')),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

create index inventory_movements_item_id_idx on public.inventory_movements (item_id);

create policy "inventory_movements_select_staff" on public.inventory_movements for select to authenticated using (true);
-- 'doctor' is included so completing a procedure order (which a doctor can
-- also do, per procedure_orders' update policy) can log its consumable use.
create policy "inventory_movements_insert_authorized" on public.inventory_movements for insert to authenticated
  with check (public.current_user_role() in ('admin', 'nurse', 'doctor') and created_by = auth.uid());

-- Keep inventory_items.stock_quantity in sync with the movement ledger.
create function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_items
    set stock_quantity = stock_quantity + new.change_qty
    where id = new.item_id;
  return new;
end;
$$;

create trigger trg_apply_inventory_movement
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();
