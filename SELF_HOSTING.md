# Self-hosting guide (GitHub → Vercel)

This project is a TanStack Start app. All store data (products, orders,
settings, staff accounts, uploaded media) lives in **your personal Supabase
project**, so moving off Lovable only requires re-creating the environment
variables.

## 1. Export the code

- Connect this project to GitHub (Lovable: + menu → GitHub → Connect project), or
- Download the codebase and push it to your own GitHub repo.

## 2. Set environment variables in Vercel

Vercel → your project → Settings → Environment Variables.
See `.env.example` for the full list. Required minimum:

| Variable | Where to get it |
|---|---|
| `PERSONAL_SUPABASE_URL` | Supabase dashboard → Project Settings → Data API |
| `PERSONAL_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → anon public |
| `PERSONAL_SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → service_role (secret) |
| `STAFF_SESSION_SECRET` | Generate: `openssl rand -hex 32` |
| `TELEGRAM_BOT_TOKEN` | @BotFather → /mybots → API token |
| `TELEGRAM_CHAT_ID` | Message your bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` |

The Lovable-managed Supabase variables (`VITE_SUPABASE_*`, `SUPABASE_*`) are
only needed while the sign-in/account features still use the managed backend.

## 3. Deploy

- Framework preset: **TanStack Start** (or "Other")
- Build command: `bun run build` (or `npm run build`)
- Deploy. Your products, orders, staff logins, and media bucket keep working
  because they live in your personal Supabase, not in Lovable.

## Notes

- **Telegram alerts** work self-hosted via `TELEGRAM_BOT_TOKEN`
  (`src/lib/telegram.server.ts` uses the Bot API directly when the token is
  set; on Lovable it falls back to the connector gateway).
- **Google Tag Manager** (`GTM-T46VVTCD`) is embedded in `src/routes/__root.tsx`
  — no env var needed.
- **GTM / analytics** events (`view_item`, `add_to_cart`, `begin_checkout`,
  `purchase`) are pushed in `src/lib/analytics.ts`.
- The one-time owner setup flow (`OWNER_BOOTSTRAP_TOKEN`) is deprecated —
  staff/owner accounts are managed from Studio access on your Supabase staff
  table.
