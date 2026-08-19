alter table public.invoices add column discount numeric(10, 2) not null default 0;

alter table public.payments
  add column is_refund boolean not null default false,
  add column note text;
