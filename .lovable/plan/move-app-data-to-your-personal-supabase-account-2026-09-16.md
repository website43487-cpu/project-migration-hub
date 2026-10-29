# Move app data to your personal Supabase account

## Goal
Keep auth (sign-up / sign-in / roles) on the managed backend, but move the
**business data** — products, site settings, and orders — to your own
Supabase project so you own and control it.

## Why auth stays on the managed backend
Row-level security (who can read/edit a row) is enforced inside the database
using the signed-in user's identity (`auth.uid()`). Users live on the managed
backend, so role checks (`has_role`) must run there. Splitting users across two
databases would break "show my orders" and "only admins can edit". Auth and
roles therefore stay put; only data moves.

## What moves to your Supabase
- `products` (catalogue, pricing, weights, images)
- `site_settings` (delivery rules, featured object, quote, hidden slugs, checkout note config)
- `orders` (customer orders, line items, totals)

What stays on the managed backend (tied to its auth users):
- `user_roles`, `profiles`, `design_submissions`

## How data access changes
All reads/writes to your Supabase go through server functions instead of
direct browser calls:

- **Public reads** (products, settings): server function uses your
  **publishable key** — fast, respects public read policies.
- **Admin writes** (edit products, settings, orders): server function first
  checks the caller is an admin via the managed backend's `user_roles`, then
  writes to your Supabase with the **service role key**.
- **Orders**: placing an order calls a server function (no sign-in needed, as
  today). Reading your own order history calls a server function that checks
  the managed session, then queries your Supabase by user id.

No credentials reach the browser. Only the server talks to your Supabase.

## Schema migration to your Supabase
A single SQL migration run against your project, recreating:
- `products`, `site_settings`, `orders` tables with the same columns
- RLS policies (public reads; service-role writes — since the app talks via
  the service key, plus narrow `anon` SELECT where public reads happen)
- The `enforce_order_integrity` trigger (recomputed pricing/weight/shipping
  from the products table + delivery settings), adjusted so `user_id` comes
  from the order payload (the managed user id) instead of `auth.uid()` (which
  is null on your DB)
- Seed data: the two founding objects (Queen Anne's Lace, Cow Parsley) with
  correct prices and weights

## Credentials needed (stored as secrets, never in chat)
- `PERSONAL_SUPABASE_URL`
- `PERSONAL_SUPABASE_PUBLISHABLE_KEY` (anon/publishable)
- `PERSONAL_SUPABASE_SERVICE_ROLE_KEY` (secret)

Requested through the secure secrets form.

## Files that change
- New `src/lib/personal-supabase.server.ts` — server-only client using the
  service-role / publishable key from secrets
- New `src/lib/data.functions.ts` — server functions: `getProducts`,
  `getSettings`, `getSetting`, `placeOrder`, `getMyOrders`, plus admin
  `saveProduct`, `saveSettings`, `saveOrder`
- `src/lib/products.ts`, `src/lib/site.ts` — switch from direct client calls
  to the new server functions (queries stay the same shape)
- `src/routes/order.tsx` — place order + read own orders via server function
- Admin routes (`admin.products`, `admin.site`, `admin.index`/orders) —
  edit/save via server functions
- `src/lib/cart.tsx` — unaffected (local storage only)

## Testing
- Place a test order from checkout → confirm it lands in your Supabase
  `orders` table with correct weight-based delivery
- Edit a product's price/weight from the studio → confirm it shows on the
  live site and recalculates checkout delivery
- Confirm an ordinary user sees only their own order history
