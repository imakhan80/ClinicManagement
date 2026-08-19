-- Clinic Management System — initial schema
-- Roles: admin, doctor, nurse, receptionist

create extension if not exists moddatetime schema extensions;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'receptionist'
    check (role in ('admin', 'doctor', 'nurse', 'receptionist')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Safe SECURITY DEFINER: body is hard-restricted to the caller's own row,
-- so it can never be used to read/act on anyone else's data. Exists only
-- to avoid RLS self-recursion on profiles.role checks used elsewhere.
create function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

-- Prevent non-admins from changing their own role via the "update own" policy.
create function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and public.current_user_role() <> 'admin' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

-- Bootstrap a profile row whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- patients
-- ============================================================
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  mrn text not null unique default ('MRN-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  full_name text not null,
  date_of_birth date not null,
  gender text check (gender in ('male', 'female', 'other')),
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text,
  allergies text[] not null default '{}',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

create policy "patients_select_staff"
  on public.patients for select
  to authenticated
  using (true);

create policy "patients_insert_staff"
  on public.patients for insert
  to authenticated
  with check (true);

create policy "patients_update_staff"
  on public.patients for update
  to authenticated
  using (true)
  with check (true);

create policy "patients_delete_admin"
  on public.patients for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- appointments
-- ============================================================
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create index appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index appointments_patient_id_idx on public.appointments (patient_id);
create index appointments_doctor_id_idx on public.appointments (doctor_id);

create policy "appointments_select_staff"
  on public.appointments for select
  to authenticated
  using (true);

create policy "appointments_insert_staff"
  on public.appointments for insert
  to authenticated
  with check (true);

create policy "appointments_update_staff"
  on public.appointments for update
  to authenticated
  using (true)
  with check (true);

create policy "appointments_delete_admin"
  on public.appointments for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function extensions.moddatetime(updated_at);

alter publication supabase_realtime add table public.appointments;

-- ============================================================
-- medical_records (clinically sensitive — restricted)
-- ============================================================
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id),
  diagnosis text,
  prescription text,
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medical_records enable row level security;

create index medical_records_patient_id_idx on public.medical_records (patient_id);

create policy "medical_records_select_authorized"
  on public.medical_records for select
  to authenticated
  using (
    doctor_id = auth.uid()
    or public.current_user_role() in ('admin', 'nurse')
  );

create policy "medical_records_insert_doctor"
  on public.medical_records for insert
  to authenticated
  with check (
    doctor_id = auth.uid()
    and public.current_user_role() = 'doctor'
  );

create policy "medical_records_update_own_or_admin"
  on public.medical_records for update
  to authenticated
  using (doctor_id = auth.uid() or public.current_user_role() = 'admin')
  with check (doctor_id = auth.uid() or public.current_user_role() = 'admin');

create policy "medical_records_delete_admin"
  on public.medical_records for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create trigger trg_medical_records_updated_at
  before update on public.medical_records
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- invoices / invoice_items / payments
-- ============================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  patient_id uuid not null references public.patients(id),
  appointment_id uuid references public.appointments(id),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'partially_paid', 'void')),
  subtotal numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  due_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create index invoices_patient_id_idx on public.invoices (patient_id);

create policy "invoices_select_staff"
  on public.invoices for select
  to authenticated
  using (true);

create policy "invoices_insert_billing"
  on public.invoices for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'receptionist'));

create policy "invoices_update_billing"
  on public.invoices for update
  to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'receptionist'));

create policy "invoices_delete_admin"
  on public.invoices for delete
  to authenticated
  using (public.current_user_role() = 'admin');

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function extensions.moddatetime(updated_at);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null,
  amount numeric(10, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

create policy "invoice_items_select_staff"
  on public.invoice_items for select
  to authenticated
  using (true);

create policy "invoice_items_insert_billing"
  on public.invoice_items for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'receptionist'));

create policy "invoice_items_update_billing"
  on public.invoice_items for update
  to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'receptionist'));

create policy "invoice_items_delete_billing"
  on public.invoice_items for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'));

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(10, 2) not null,
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'insurance', 'other')),
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id)
);

alter table public.payments enable row level security;

create index payments_invoice_id_idx on public.payments (invoice_id);

create policy "payments_select_staff"
  on public.payments for select
  to authenticated
  using (true);

create policy "payments_insert_billing"
  on public.payments for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'receptionist'));

create policy "payments_delete_admin"
  on public.payments for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ============================================================
-- storage: patient-documents (private bucket)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

create policy "patient_documents_select_staff"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'patient-documents');

create policy "patient_documents_insert_staff"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'patient-documents');

create policy "patient_documents_update_staff"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'patient-documents')
  with check (bucket_id = 'patient-documents');

create policy "patient_documents_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'patient-documents' and public.current_user_role() = 'admin');
