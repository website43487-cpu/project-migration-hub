import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Account — ObjektHaus" },
      { name: "description", content: "Sign in or create an ObjektHaus account to follow your orders." },
      { property: "og:title", content: "Account — ObjektHaus" },
      { property: "og:description", content: "Your ObjektHaus account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;
    void navigate({ to: "/account" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    if (error) setMsg(error.message);
    else if (mode === "signup") setMsg("Account created. Signing you in…");
    setBusy(false);
  };

  return (
    <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
      <SiteNav />
      <section className="mx-auto max-w-md px-7 pt-32 pb-20 sm:px-10 lg:pt-40">
        <p className="caps opacity-55">ObjektHaus</p>
        <h1 className="mt-4 font-display text-5xl font-light">Sign in</h1>
        <p className="mt-4 text-sm opacity-65">
          Create an account to follow your orders, or sign in to an existing one.
        </p>
        <span className="rule-line mt-6" />
        <form onSubmit={submit} className="mt-10 space-y-6">
          <label className="block">
            <span className="caps opacity-55">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
            />
          </label>
          <label className="block">
            <span className="caps opacity-55">Password</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
            />
          </label>
          {msg && <p className="text-sm opacity-80">{msg}</p>}
          <button type="submit" disabled={busy} className="link-underline caps disabled:opacity-40">
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="caps mt-10 opacity-55 hover:opacity-90"
        >
          {mode === "signin" ? "Create an account" : "I already have an account"}
        </button>
      </section>
    </main>
  );
}
