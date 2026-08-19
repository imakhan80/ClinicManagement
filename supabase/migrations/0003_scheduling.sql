-- Prevent double-booking a doctor via a database-level exclusion constraint
-- (not just app-level validation, which can race under concurrent requests).
-- timestamptz + interval is STABLE (not IMMUTABLE) in Postgres, so the end
-- time is maintained by a trigger into a plain column instead of a generated
-- one; the EXCLUDE constraint's tstzrange(...) expression over two plain
-- timestamptz columns is immutable and is what actually needs to be.

create extension if not exists btree_gist;

alter table public.appointments add column ends_at timestamptz;

create function public.set_appointment_ends_at()
returns trigger
language plpgsql
as $$
begin
  new.ends_at := new.scheduled_at + (new.duration_minutes * interval '1 minute');
  return new;
end;
$$;

create trigger trg_set_appointment_ends_at
  before insert or update of scheduled_at, duration_minutes on public.appointments
  for each row execute function public.set_appointment_ends_at();

update public.appointments
  set ends_at = scheduled_at + (duration_minutes * interval '1 minute')
  where ends_at is null;

alter table public.appointments alter column ends_at set not null;

alter table public.appointments
  add constraint appointments_no_doctor_overlap
  exclude using gist (
    doctor_id with =,
    tstzrange(scheduled_at, ends_at, '[)') with &&
  )
  where (doctor_id is not null and status not in ('cancelled', 'no_show'));
