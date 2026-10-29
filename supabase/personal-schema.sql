-- ObjektHaus data schema for your PERSONAL Supabase project.
-- Run this once in your personal project's SQL editor.
-- Auth stays on the app's managed backend; this database only holds app data
-- and is reached exclusively through server functions using the service role
-- key, so RLS is enabled with no public policies (locked to service role).

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  no text not null default '',
  name text not null,
  latin text not null default '',
  note text not null default '',
  product text not null default '',
  edition text not null default '',
  price numeric not null default 0,
  weight_kg numeric not null default 0,
  represents text not null default '',
  why text not null default '',
  story text not null default '',
  card_url text not null default '',
  images jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  stock_out boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null default (to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5))),
  customer_name text not null,
  phone text not null,
  address text not null,
  email text,
  note text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  total_weight numeric not null default 0,
  delivery_zone text not null default 'inside',
  status text not null default 'new',
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
alter table public.products add column if not exists stock_quantity integer not null default 0 check (stock_quantity >= 0);

grant all on public.products to service_role;
grant all on public.site_settings to service_role;
grant all on public.orders to service_role;

alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
-- No policies on purpose: only the service role (server functions) may read/write.

-- Studio staff (owner + admins). Sign-in happens through server functions that
-- verify a PBKDF2 password hash; sessions are signed HttpOnly cookies.
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.staff to service_role;
alter table public.staff enable row level security;
-- No policies on purpose: credentials are only reachable by the service role.

-- ── Order integrity upgrade (safe to re-run) ─────────────────────────────
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_trx_id text;
alter table public.orders add column if not exists payment_sender text;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists tracking_code text;

-- A bKash/Nagad transaction ID can only be used on one order.
create unique index if not exists orders_trx_unique
  on public.orders (upper(btrim(payment_trx_id)))
  where payment_trx_id is not null and btrim(payment_trx_id) <> '';

-- Audit trail: every status / payment / courier change is recorded.
create table if not exists public.order_audit (
  id bigserial primary key,
  order_id uuid not null,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);
create index if not exists order_audit_order_idx on public.order_audit (order_id, changed_at desc);
grant all on public.order_audit to service_role;
grant usage, select on sequence public.order_audit_id_seq to service_role;
alter table public.order_audit enable row level security;

create or replace function public.log_order_changes()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into order_audit(order_id, field, old_value, new_value) values (new.id, 'status', old.status, new.status);
  end if;
  if new.payment_trx_id is distinct from old.payment_trx_id then
    insert into order_audit(order_id, field, old_value, new_value) values (new.id, 'payment_trx_id', old.payment_trx_id, new.payment_trx_id);
  end if;
  if new.courier is distinct from old.courier or new.tracking_code is distinct from old.tracking_code then
    insert into order_audit(order_id, field, old_value, new_value)
      values (new.id, 'courier', concat_ws(' ', old.courier, old.tracking_code), concat_ws(' ', new.courier, new.tracking_code));
  end if;
  return new;
end $$;

drop trigger if exists orders_audit on public.orders;
create trigger orders_audit after update on public.orders
  for each row execute function public.log_order_changes();
