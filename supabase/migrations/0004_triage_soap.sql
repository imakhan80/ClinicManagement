-- Richer triage vitals (structured BP, respiratory rate, pain score, auto BMI)
-- and a structured SOAP note on medical_records, plus reusable note templates.

-- ============================================================
-- triage_records: structured BP + new vitals + auto BMI
-- ============================================================
alter table public.triage_records
  add column bp_systolic integer,
  add column bp_diastolic integer,
  add column respiratory_rate integer,
  add column pain_score integer check (pain_score between 0 and 10);

update public.triage_records
  set bp_systolic = split_part(blood_pressure, '/', 1)::integer,
      bp_diastolic = split_part(blood_pressure, '/', 2)::integer
  where blood_pressure ~ '^[0-9]+/[0-9]+$';

alter table public.triage_records drop column blood_pressure;

alter table public.triage_records
  add column bmi numeric(5, 1) generated always as (
    case
      when height_cm is not null and height_cm > 0 and weight_kg is not null
        then round((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 1)
      else null
    end
  ) stored;

-- ============================================================
-- medical_records: structured SOAP (diagnosis column doubles as "Assessment")
-- ============================================================
alter table public.medical_records
  add column soap_subjective text,
  add column soap_objective text,
  add column soap_plan text,
  add column status text not null default 'draft' check (status in ('draft', 'completed'));

-- ============================================================
-- clinical_note_templates: reusable SOAP templates per author
-- ============================================================
create table public.clinical_note_templates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  name text not null,
  subjective text,
  objective text,
  assessment text,
  plan text,
  created_at timestamptz not null default now()
);

alter table public.clinical_note_templates enable row level security;

create policy "clinical_note_templates_select_own_or_admin"
  on public.clinical_note_templates for select
  to authenticated
  using (created_by = auth.uid() or public.current_user_role() = 'admin');

create policy "clinical_note_templates_insert_doctor"
  on public.clinical_note_templates for insert
  to authenticated
  with check (created_by = auth.uid() and public.current_user_role() = 'doctor');

create policy "clinical_note_templates_update_own"
  on public.clinical_note_templates for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "clinical_note_templates_delete_own_or_admin"
  on public.clinical_note_templates for delete
  to authenticated
  using (created_by = auth.uid() or public.current_user_role() = 'admin');
