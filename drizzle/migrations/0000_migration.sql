create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, no text not null default '', name text not null,
  latin text not null default '', note text not null default '', product text not null default '',
  edition text not null default '', price numeric not null default 0, weight_kg numeric not null default 0,
  represents text not null default '', why text not null default '', story text not null default '',
  card_url text not null default '', images jsonb not null default '[]'::jsonb, specs jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0, published boolean not null default true, stock_out boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.site_settings (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null default (to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5))),
  customer_name text not null, phone text not null, address text not null, email text, note text,
  items jsonb not null default '[]'::jsonb, subtotal numeric not null default 0, shipping numeric not null default 0,
  total numeric not null default 0, total_weight numeric not null default 0, delivery_zone text not null default 'inside',
  status text not null default 'new', user_id uuid,
  payment_method text, payment_trx_id text, payment_sender text, courier text, tracking_code text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_created_at_idx on public.orders (created_at desc);
create unique index orders_trx_unique on public.orders (upper(btrim(payment_trx_id))) where payment_trx_id is not null and btrim(payment_trx_id) <> '';
create table public.staff (
  id uuid primary key default gen_random_uuid(), email text not null unique, password_hash text not null,
  role text not null default 'admin' check (role in ('owner','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_audit (
  id bigserial primary key, order_id uuid not null, field text not null, old_value text, new_value text,
  changed_at timestamptz not null default now()
);
create index order_audit_order_idx on public.order_audit (order_id, changed_at desc);

grant all on public.products, public.site_settings, public.orders, public.staff, public.order_audit to service_role;
grant usage, select on sequence public.order_audit_id_seq to service_role;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.staff enable row level security;
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
create trigger orders_audit after update on public.orders for each row execute function public.log_order_changes();

insert into public.products (slug, no, name, latin, note, product, edition, price, weight_kg, represents, why, story, card_url, images, specs, sort_order) values
  ('queen-annes-lace','041','Queen Anne''s Lace','Daucus carota','','Object No.01 — Halo Pendant','Edition 001 / 101',420,2.4,'','','','','[]','[]',1),
  ('cow-parsley','042','Cow Parsley','Anthriscus sylvestris','','Object No.12 — Card Holder','Edition 042 / 200',60,0.4,'','','','','[]','[]',2)
on conflict (slug) do nothing;
insert into public.site_settings (key, value) values
  ('hero','{"videoUrl":"","eyebrow":"","caption":""}'),
  ('manifesto','{"body":"Objects shape\nthe spaces\nwe inhabit.\n\nSpaces shape\nthe moments\nwe remember.\n\nWe create\nobjects that\ninvite you\nto notice."}'),
  ('featured','{"slug":"queen-annes-lace"}'),
  ('delivery','{"perKg":80,"base":60,"freeAbove":0}'),
  ('checkout','{"noteEnabled":true,"noteLabel":"Special note (optional)","noteHint":"Anything we should know — delivery timing, gift wrapping, a dedication.","notePlaceholder":""}'),
  ('panel5','{"eyebrow":"","title":"","body":"","videoUrl":"","caption":""}'),
  ('contact','{"facebook":"https://www.facebook.com/profile.php?id=61577360109655","instagram":"https://www.instagram.com/objekthaus_studio_","whatsapp":"+8801635592323","email":"objekthaus.studio@gmail.com","address":"Mirpur-12, Block-D, Road-09, Dhaka-1216, Bangladesh","hours":"Thursday – Saturday, by appointment"}'),
  ('hidden','{"slugs":[]}')
on conflict (key) do nothing;