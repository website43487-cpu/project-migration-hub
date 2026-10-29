import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createOwner, staffSignIn } from "@/lib/staff-auth.functions";
import { useStaff } from "@/lib/staff";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Studio Sign In — ObjektHaus" },
      { name: "description", content: "Sign in to the ObjektHaus studio panel to manage orders, objects and site content." },
      { property: "og:title", content: "Studio Sign In — ObjektHaus" },
      { property: "og:description", content: "Staff sign-in for the ObjektHaus studio panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

const DEFAULT_OWNER_EMAIL = "objekthaus@admin";

function AdminLogin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: status, isLoading } = useStaff();
  const signIn = useServerFn(staffSignIn);
  const makeOwner = useServerFn(createOwner);

  const needsOwner = !!status?.needsOwner;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status?.session) void navigate({ to: "/admin", search: { status: "all" }, replace: true });
  }, [status?.session, navigate]);

  useEffect(() => {
    if (needsOwner && !email) setEmail(DEFAULT_OWNER_EMAIL);
  }, [needsOwner, email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const session = needsOwner
        ? await makeOwner({ data: { email: email.trim(), password } })
        : await signIn({ data: { email: email.trim(), password } });
      qc.setQueryData(["staff-status"], { session, needsOwner: false, error: null });
      await navigate({ to: "/admin", search: { status: "all" }, replace: true });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
      <SiteNav />
      <section className="mx-auto max-w-md px-7 pt-32 pb-20 sm:px-10 lg:pt-40">
        <p className="caps opacity-55">ObjektHaus</p>
        <h1 className="mt-4 font-display text-5xl font-light">
          {needsOwner ? "Owner setup" : "Studio sign in"}
        </h1>
        <p className="mt-4 text-sm opacity-65">
          {needsOwner
            ? "No owner account exists yet. Choose the owner email and password — this happens once."
            : "For studio staff only. Customers sign in from the account page."}
        </p>
        <span className="rule-line mt-6" />

        {status?.error && <p className="mt-8 text-sm opacity-80">{status.error}</p>}

        <form onSubmit={submit} className="mt-10 space-y-6">
          <label className="block">
            <span className="caps opacity-55">Email</span>
            <input
              required
              type="text"
              autoComplete="username"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
            />
          </label>
          {msg && <p className="text-sm opacity-80">{msg}</p>}
          <button
            type="submit"
            disabled={busy || isLoading}
            className="caps border-b border-current pb-1 disabled:opacity-40"
          >
            {busy ? "One moment…" : needsOwner ? "Create owner account" : "Enter the studio"}
          </button>
        </form>
      </section>
    </main>
  );
}
