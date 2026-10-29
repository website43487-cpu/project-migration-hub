// Server-only Supabase client for the user's personal Supabase project.
// Uses the service-role key (RLS bypassed) — all access is gated by server
// functions that authorize via the managed backend (has_role / auth.uid()).
// Do not import at module scope from client-reachable files; load inside handlers.
import { createClient } from "@supabase/supabase-js";

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    // New opaque sb_ keys are not JWTs — drop the Bearer header, keep apikey.
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

// Schema types for the personal project are not generated here, so the client
// is intentionally loosely typed.
type LooseClient = ReturnType<typeof createClient<any, any, any>>;

let _client: LooseClient | undefined;

export function getPersonalAdmin(): LooseClient {
  if (_client) return _client;
  const url = process.env["PERSONAL_SUPABASE_URL"] ?? "";
  const key = process.env["PERSONAL_SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  const isPlaceholder = (v: string) => !v || /PLACEHOLDER|REPLACE/i.test(v);
  if (isPlaceholder(url) || isPlaceholder(key)) {
    throw new Error(
      "Missing PERSONAL_SUPABASE_URL / PERSONAL_SUPABASE_SERVICE_ROLE_KEY. Add them in Project Settings → Secrets.",
    );
  }
  // Accept values saved without a scheme ("abc.supabase.co") or as a bare
  // project ref ("abcdefghijklmnop"), and strip any trailing slash.
  const trimmed = url.trim().replace(/\/+$/, "");
  const normalizedUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.includes(".")
      ? `https://${trimmed}`
      : `https://${trimmed}.supabase.co`;

  _client = createClient(normalizedUrl, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
