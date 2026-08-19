-- Stock can never go negative — catches over-dispensing at the database
-- layer (the dispense action also validates, but this is the real backstop).
alter table public.medications
  add constraint medications_stock_non_negative check (stock_quantity >= 0);
