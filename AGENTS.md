<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All app data (products, settings, orders, staff, audit) lives in Lovable Cloud and is reached only through server functions using the privileged client via `getPersonalAdmin()`; tables have RLS with no policies so the browser can never read them directly.
- Studio staff sign-in is custom (PBKDF2 hashes in `staff`, HMAC-signed cookie with STAFF_SESSION_SECRET), separate from customer accounts, to keep studio access independent of shopper logins.
- The `media` bucket is private (workspace blocks public buckets), so uploads return long-lived signed URLs.
