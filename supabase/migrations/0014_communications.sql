-- Communications — in-app log of patient contact (call/SMS/email/in-person)
-- plus reusable templates. Nothing is actually sent to any external
-- provider; this records that a contact happened, for the patient timeline
-- and front-desk follow-up tracking.

create table public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('call', 'sms', 'email', 'in_person')),
  subject text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.communication_templates enable row level security;

create policy "communication_templates_select_staff" on public.communication_templates for select to authenticated using (true);
create policy "communication_templates_write_billing" on public.communication_templates for all to authenticated
  using (public.current_user_role() in ('admin', 'receptionist'))
  with check (public.current_user_role() in ('admin', 'receptionist'));

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  channel text not null check (channel in ('call', 'sms', 'email', 'in_person')),
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  subject text,
  body text not null,
  template_id uuid references public.communication_templates(id) on delete set null,
  logged_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.communication_logs enable row level security;

create index communication_logs_patient_id_idx on public.communication_logs (patient_id);

create policy "communication_logs_select_staff" on public.communication_logs for select to authenticated using (true);
create policy "communication_logs_insert_billing" on public.communication_logs for insert to authenticated
  with check (public.current_user_role() in ('admin', 'receptionist') and logged_by = auth.uid());
