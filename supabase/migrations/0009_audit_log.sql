-- Audit trail for sensitive clinical/billing actions. Rows can only be
-- written by SECURITY DEFINER trigger functions (never inserted directly by
-- a client), and only admins can read them.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.current_user_role() = 'admin');

create function public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after);
$$;

-- Clinical note edited
create function public.audit_medical_record_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.diagnosis is distinct from old.diagnosis
    or new.soap_subjective is distinct from old.soap_subjective
    or new.soap_objective is distinct from old.soap_objective
    or new.soap_plan is distinct from old.soap_plan
  then
    perform public.log_audit(
      'medical_record.updated',
      'medical_records',
      new.id,
      jsonb_build_object(
        'diagnosis', old.diagnosis, 'soap_subjective', old.soap_subjective,
        'soap_objective', old.soap_objective, 'soap_plan', old.soap_plan, 'status', old.status
      ),
      jsonb_build_object(
        'diagnosis', new.diagnosis, 'soap_subjective', new.soap_subjective,
        'soap_objective', new.soap_objective, 'soap_plan', new.soap_plan, 'status', new.status
      )
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_medical_record_update
  after update on public.medical_records
  for each row execute function public.audit_medical_record_update();

-- Prescription status changes (e.g. dispensed)
create function public.audit_prescription_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.log_audit(
      'prescription.updated',
      'prescriptions',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_prescription_status
  after update of status on public.prescriptions
  for each row execute function public.audit_prescription_status();

-- Invoice voided
create function public.audit_invoice_void()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'void' and old.status is distinct from 'void' then
    perform public.log_audit(
      'invoice.voided',
      'invoices',
      new.id,
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_invoice_void
  after update of status on public.invoices
  for each row execute function public.audit_invoice_void();

-- Invoice refunded
create function public.audit_payment_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_refund then
    perform public.log_audit(
      'invoice.refunded',
      'invoices',
      new.invoice_id,
      null,
      jsonb_build_object('amount', new.amount, 'method', new.method, 'note', new.note)
    );
  end if;
  return new;
end;
$$;

create trigger trg_audit_payment_refund
  after insert on public.payments
  for each row execute function public.audit_payment_refund();
