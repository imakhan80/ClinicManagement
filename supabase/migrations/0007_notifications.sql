-- In-app notifications: a table + a set of triggers that fire it from real
-- domain events. No external delivery (email/SMS) — surfaced in-app only.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- No insert/delete policy for authenticated: notifications are only ever
-- created by the SECURITY DEFINER trigger functions below.

alter publication supabase_realtime add table public.notifications;

create function public.notify(
  p_recipient uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (recipient_id, type, title, body, link)
  select p_recipient, p_type, p_title, p_body, p_link
  where p_recipient is not null;
$$;

-- appointment.created / appointment.cancelled -> assigned doctor
create function public.notify_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify(
      new.doctor_id,
      'appointment.created',
      'New appointment booked',
      'A new appointment was scheduled for ' || to_char(new.scheduled_at, 'Mon DD, HH12:MI AM'),
      '/appointments'
    );
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' then
    perform public.notify(
      new.doctor_id,
      'appointment.cancelled',
      'Appointment cancelled',
      'The appointment scheduled for ' || to_char(new.scheduled_at, 'Mon DD, HH12:MI AM') || ' was cancelled',
      '/appointments'
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_appointment_event
  after insert or update of status on public.appointments
  for each row execute function public.notify_appointment_event();

-- patient.checked_in -> assigned doctor
create function public.notify_checked_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid;
  v_patient_name text;
begin
  select doctor_id into v_doctor_id from public.appointments where id = new.appointment_id;
  select full_name into v_patient_name from public.patients where id = new.patient_id;

  perform public.notify(
    v_doctor_id,
    'patient.checked_in',
    'Patient checked in',
    coalesce(v_patient_name, 'A patient') || ' checked in and joined the queue',
    '/queue'
  );
  return new;
end;
$$;

create trigger trg_notify_checked_in
  after insert on public.queue_entries
  for each row execute function public.notify_checked_in();

-- lab.result_ready -> ordering doctor
create function public.notify_result_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.notify(
      new.ordered_by,
      'lab.result_ready',
      (case when new.category = 'imaging' then 'Imaging' else 'Lab' end) || ' result ready',
      new.test_name || ' result is ready to review',
      '/laboratory'
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_result_ready
  after update of status on public.investigations
  for each row execute function public.notify_result_ready();

-- prescription.created -> pharmacy staff (admin + nurse)
create function public.notify_prescription_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_name text;
  r record;
begin
  select full_name into v_patient_name from public.patients where id = new.patient_id;

  for r in select id from public.profiles where role in ('admin', 'nurse') loop
    perform public.notify(
      r.id,
      'prescription.created',
      'New prescription to fill',
      coalesce(v_patient_name, 'A patient') || ' has a new prescription awaiting dispensing',
      '/pharmacy'
    );
  end loop;
  return new;
end;
$$;

create trigger trg_notify_prescription_created
  after insert on public.prescriptions
  for each row execute function public.notify_prescription_created();

-- payment.received (invoice fully paid) -> the staff member who created the invoice
create function public.notify_payment_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.notify(
      new.created_by,
      'payment.received',
      'Invoice paid in full',
      'Invoice ' || new.invoice_number || ' has been fully paid',
      '/billing/' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_payment_received
  after update of status on public.invoices
  for each row execute function public.notify_payment_received();
