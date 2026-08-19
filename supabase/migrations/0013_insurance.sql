-- Insurance — patient policies plus a lightweight per-invoice claim.
-- Approving/paying a claim records a payment on the invoice using the
-- 'insurance' payments.method value that already existed in 0001_init.sql.

create table public.insurance_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.insurance_providers enable row level security;

create policy "insurance_providers_select_staff" on public.insurance_providers for select to authenticated using (true);
create policy "insurance_providers_write_admin" on public.insurance_providers for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create table public.patient_insurance_policies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.insurance_providers(id),
  policy_number text not null,
  group_number text,
  coverage_percent numeric(5, 2) not null default 80,
  is_primary boolean not null default true,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_insurance_policies enable row level security;

create index patient_insurance_policies_patient_id_idx on public.patient_insurance_policies (patient_id);

create policy "patient_insurance_policies_select_staff" on public.patient_insurance_policies for select to authenticated using (true);
create policy "patient_insurance_policies_write_billing" on public.patient_insurance_policies for all to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'receptionist'));

create trigger trg_patient_insurance_policies_updated_at
  before update on public.patient_insurance_policies
  for each row execute function extensions.moddatetime(updated_at);

create table public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  policy_id uuid not null references public.patient_insurance_policies(id),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  claimed_amount numeric(10, 2) not null,
  approved_amount numeric(10, 2),
  submitted_at timestamptz,
  decided_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insurance_claims enable row level security;

create index insurance_claims_invoice_id_idx on public.insurance_claims (invoice_id);

create policy "insurance_claims_select_staff" on public.insurance_claims for select to authenticated using (true);
create policy "insurance_claims_write_billing" on public.insurance_claims for all to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'receptionist'));

create trigger trg_insurance_claims_updated_at
  before update on public.insurance_claims
  for each row execute function extensions.moddatetime(updated_at);
