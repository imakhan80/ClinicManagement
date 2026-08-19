-- Atomic dispense: validates remaining quantity, resolves the catalog item,
-- and inserts the dispense row (whose trigger deducts stock and updates
-- prescription/prescription_item status) all in one transaction. If the
-- stock-non-negative constraint fails, everything rolls back together —
-- no partial state where a dispense is recorded but stock wasn't deducted.
create function public.dispense_prescription_item(
  p_item_id uuid,
  p_quantity integer
)
returns public.dispenses
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item record;
  v_medication_id uuid;
  v_result public.dispenses;
begin
  select * into v_item from public.prescription_items where id = p_item_id for update;
  if not found then
    raise exception 'Prescription item not found';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  if p_quantity > (v_item.quantity - v_item.quantity_dispensed) then
    raise exception 'Cannot dispense more than the remaining % unit(s)', (v_item.quantity - v_item.quantity_dispensed);
  end if;

  select id into v_medication_id
    from public.medications
    where lower(name) = lower(v_item.medication_name)
    limit 1;

  insert into public.dispenses (prescription_item_id, medication_id, quantity_dispensed, dispensed_by)
  values (p_item_id, v_medication_id, p_quantity, auth.uid())
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.dispense_prescription_item(uuid, integer) to authenticated;
