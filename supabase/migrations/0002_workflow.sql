-- Clinic Operating System — workflow extension
-- Queue -> Triage -> Consultation (diagnosis/investigation/prescription) -> Pharmacy -> Follow-up

-- ============================================================
-- queue_entries
-- ============================================================
create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  queue_number integer not null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  status text not null default 'waiting'
    check (status in ('waiting', 'triaged', 'ready', 'in_consult', 'completed', 'cancelled')),
  checked_in_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz
);

alter table public.queue_entries enable row level security;

create index queue_entries_status_idx on public.queue_entries (status, checked_in_at);

create policy "queue_entries_select_staff" on public.queue_entries for select to authenticated using (true);
create policy "queue_entries_insert_staff" on public.queue_entries for insert to authenticated with check (true);
create policy "queue_entries_update_staff" on public.queue_entries for update to authenticated using (true) with check (true);
create policy "queue_entries_delete_admin" on public.queue_entries for delete to authenticated using (public.current_user_role() = 'admin');

alter publication supabase_realtime add table public.queue_entries;

-- ============================================================
-- triage_records
-- ============================================================
create table public.triage_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  taken_by uuid references public.profiles(id),
  blood_pressure text,
  pulse_bpm integer,
  temperature_c numeric(4, 1),
  spo2 integer,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  chief_complaint text,
  created_at timestamptz not null default now()
);

alter table public.triage_records enable row level security;

create index triage_records_appointment_id_idx on public.triage_records (appointment_id);

create policy "triage_select_authorized" on public.triage_records for select to authenticated
  using (public.current_user_role() in ('admin', 'doctor', 'nurse'));
create policy "triage_insert_nurse" on public.triage_records for insert to authenticated
  with check (public.current_user_role() in ('admin', 'nurse') and taken_by = auth.uid());
create policy "triage_update_own_or_admin" on public.triage_records for update to authenticated
  using (taken_by = auth.uid() or public.current_user_role() = 'admin')
  with check (taken_by = auth.uid() or public.current_user_role() = 'admin');

-- ============================================================
-- investigations (lab / imaging orders)
-- ============================================================
create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ordered_by uuid not null references public.profiles(id),
  category text not null check (category in ('lab', 'imaging', 'other')),
  test_name text not null,
  status text not null default 'ordered' check (status in ('ordered', 'in_progress', 'completed', 'cancelled')),
  result_text text,
  result_attachments jsonb not null default '[]',
  ordered_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.investigations enable row level security;

create index investigations_patient_id_idx on public.investigations (patient_id);
create index investigations_appointment_id_idx on public.investigations (appointment_id);

create policy "investigations_select_staff" on public.investigations for select to authenticated using (true);
create policy "investigations_insert_doctor" on public.investigations for insert to authenticated
  with check (public.current_user_role() = 'doctor' and ordered_by = auth.uid());
create policy "investigations_update_authorized" on public.investigations for update to authenticated
  using (public.current_user_role() in ('admin', 'doctor', 'nurse'))
  with check (public.current_user_role() in ('admin', 'doctor', 'nurse'));

alter publication supabase_realtime add table public.investigations;

-- ============================================================
-- prescriptions / prescription_items
-- ============================================================
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'partially_dispensed', 'dispensed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;

create index prescriptions_patient_id_idx on public.prescriptions (patient_id);

create policy "prescriptions_select_staff" on public.prescriptions for select to authenticated using (true);
create policy "prescriptions_insert_doctor" on public.prescriptions for insert to authenticated
  with check (public.current_user_role() = 'doctor' and doctor_id = auth.uid());
create policy "prescriptions_update_authorized" on public.prescriptions for update to authenticated
  using (doctor_id = auth.uid() or public.current_user_role() in ('admin', 'nurse'))
  with check (doctor_id = auth.uid() or public.current_user_role() in ('admin', 'nurse'));

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_name text not null,
  dosage text,
  frequency text,
  duration text,
  quantity integer not null default 1,
  instructions text,
  quantity_dispensed integer not null default 0
);

alter table public.prescription_items enable row level security;

create index prescription_items_prescription_id_idx on public.prescription_items (prescription_id);

create policy "prescription_items_select_staff" on public.prescription_items for select to authenticated using (true);
create policy "prescription_items_insert_doctor" on public.prescription_items for insert to authenticated
  with check (public.current_user_role() = 'doctor');
create policy "prescription_items_update_authorized" on public.prescription_items for update to authenticated
  using (public.current_user_role() in ('admin', 'doctor', 'nurse'))
  with check (public.current_user_role() in ('admin', 'doctor', 'nurse'));

alter publication supabase_realtime add table public.prescriptions;

-- ============================================================
-- pharmacy: medications catalog + dispenses
-- ============================================================
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  form text,
  strength text,
  unit_price numeric(10, 2) not null default 0,
  stock_quantity integer not null default 0,
  reorder_level integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medications enable row level security;

create policy "medications_select_staff" on public.medications for select to authenticated using (true);
create policy "medications_write_admin" on public.medications for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create trigger trg_medications_updated_at
  before update on public.medications
  for each row execute function extensions.moddatetime(updated_at);

create table public.dispenses (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid not null references public.prescription_items(id) on delete cascade,
  medication_id uuid references public.medications(id),
  quantity_dispensed integer not null,
  dispensed_by uuid references public.profiles(id),
  dispensed_at timestamptz not null default now()
);

alter table public.dispenses enable row level security;

create index dispenses_prescription_item_id_idx on public.dispenses (prescription_item_id);

create policy "dispenses_select_staff" on public.dispenses for select to authenticated using (true);
create policy "dispenses_insert_pharmacy" on public.dispenses for insert to authenticated
  with check (public.current_user_role() in ('admin', 'nurse') and dispensed_by = auth.uid());

-- Keep prescription_items.quantity_dispensed and prescriptions.status in sync.
create function public.apply_dispense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prescription_id uuid;
  v_total_qty integer;
  v_dispensed_qty integer;
begin
  update public.prescription_items
    set quantity_dispensed = quantity_dispensed + new.quantity_dispensed
    where id = new.prescription_item_id
    returning prescription_id into v_prescription_id;

  if new.medication_id is not null then
    update public.medications
      set stock_quantity = stock_quantity - new.quantity_dispensed
      where id = new.medication_id;
  end if;

  select sum(quantity), sum(quantity_dispensed)
    into v_total_qty, v_dispensed_qty
    from public.prescription_items
    where prescription_id = v_prescription_id;

  update public.prescriptions
    set status = case
      when v_dispensed_qty >= v_total_qty then 'dispensed'
      when v_dispensed_qty > 0 then 'partially_dispensed'
      else 'pending'
    end
    where id = v_prescription_id;

  return new;
end;
$$;

create trigger trg_apply_dispense
  after insert on public.dispenses
  for each row execute function public.apply_dispense();

-- ============================================================
-- follow_ups
-- ============================================================
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  doctor_id uuid references public.profiles(id),
  recommended_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  scheduled_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.follow_ups enable row level security;

create index follow_ups_patient_id_idx on public.follow_ups (patient_id);
create index follow_ups_recommended_date_idx on public.follow_ups (recommended_date);

create policy "follow_ups_select_staff" on public.follow_ups for select to authenticated using (true);
create policy "follow_ups_insert_doctor" on public.follow_ups for insert to authenticated
  with check (public.current_user_role() in ('admin', 'doctor') and (doctor_id = auth.uid() or public.current_user_role() = 'admin'));
create policy "follow_ups_update_staff" on public.follow_ups for update to authenticated using (true) with check (true);

-- ============================================================
-- link medical_records to investigations/prescriptions for a unified consult view
-- ============================================================
alter table public.medical_records
  add column if not exists chief_complaint text,
  add column if not exists vitals_snapshot jsonb;
