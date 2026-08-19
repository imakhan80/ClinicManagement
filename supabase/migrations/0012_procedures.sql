-- Procedures — ordered by a doctor during consultation (or standalone),
-- performed by nurse/doctor/admin, consuming Inventory (0011) and billable
-- into an invoice once completed.

create table public.procedure_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  default_price numeric(10, 2) not null default 0,
  default_duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.procedure_catalog enable row level security;

create policy "procedure_catalog_select_staff" on public.procedure_catalog for select to authenticated using (true);
create policy "procedure_catalog_write_admin" on public.procedure_catalog for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create trigger trg_procedure_catalog_updated_at
  before update on public.procedure_catalog
  for each row execute function extensions.moddatetime(updated_at);

create table public.procedure_consumables (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedure_catalog(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id),
  quantity_per_procedure integer not null default 1
);

alter table public.procedure_consumables enable row level security;

create index procedure_consumables_procedure_id_idx on public.procedure_consumables (procedure_id);

create policy "procedure_consumables_select_staff" on public.procedure_consumables for select to authenticated using (true);
create policy "procedure_consumables_write_admin" on public.procedure_consumables for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create table public.procedure_orders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  procedure_id uuid references public.procedure_catalog(id),
  procedure_name text not null,
  price numeric(10, 2) not null default 0,
  ordered_by uuid not null references public.profiles(id),
  performed_by uuid references public.profiles(id),
  status text not null default 'ordered' check (status in ('ordered', 'completed', 'cancelled')),
  invoice_id uuid references public.invoices(id) on delete set null,
  notes text,
  ordered_at timestamptz not null default now(),
  performed_at timestamptz
);

alter table public.procedure_orders enable row level security;

create index procedure_orders_patient_id_idx on public.procedure_orders (patient_id);
create index procedure_orders_appointment_id_idx on public.procedure_orders (appointment_id);

create policy "procedure_orders_select_staff" on public.procedure_orders for select to authenticated using (true);
create policy "procedure_orders_insert_doctor" on public.procedure_orders for insert to authenticated
  with check (public.current_user_role() = 'doctor' and ordered_by = auth.uid());
create policy "procedure_orders_update_authorized" on public.procedure_orders for update to authenticated
  using (public.current_user_role() in ('admin', 'doctor', 'nurse', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

-- Atomic "mark performed": row-locks the order, flips its status, and logs
-- one inventory_movements row per consumable the procedure type defines —
-- all in one transaction, same shape as dispense_prescription_item in
-- 0010_dispense_transaction.sql. If a consumable is out of stock, the
-- non-negative check on inventory_items rolls the whole completion back.
create function public.complete_procedure_order(p_order_id uuid)
returns public.procedure_orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.procedure_orders;
  v_consumable record;
  v_result public.procedure_orders;
begin
  select * into v_order from public.procedure_orders where id = p_order_id for update;
  if not found then
    raise exception 'Procedure order not found';
  end if;

  if v_order.status <> 'ordered' then
    raise exception 'Only an ordered procedure can be marked performed';
  end if;

  update public.procedure_orders
    set status = 'completed', performed_by = auth.uid(), performed_at = now()
    where id = p_order_id
    returning * into v_result;

  for v_consumable in
    select * from public.procedure_consumables where procedure_id = v_order.procedure_id
  loop
    insert into public.inventory_movements (item_id, change_qty, reason, reference_type, reference_id, created_by)
    values (
      v_consumable.inventory_item_id,
      -v_consumable.quantity_per_procedure,
      'procedure_use',
      'procedure_order',
      p_order_id,
      auth.uid()
    );
  end loop;

  return v_result;
end;
$$;

grant execute on function public.complete_procedure_order(uuid) to authenticated;
