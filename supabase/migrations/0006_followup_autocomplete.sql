-- When the appointment a follow-up was scheduled into gets completed, the
-- follow-up itself should move to completed automatically — done as a
-- trigger (not app code) so it holds regardless of which code path
-- completes the appointment.

create function public.complete_linked_follow_up()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.follow_ups
      set status = 'completed'
      where scheduled_appointment_id = new.id
        and status = 'scheduled';
  end if;
  return new;
end;
$$;

create trigger trg_complete_linked_follow_up
  after update of status on public.appointments
  for each row execute function public.complete_linked_follow_up();
