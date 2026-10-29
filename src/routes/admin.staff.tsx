import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createAdmin, listStaff, removeAdmin } from "@/lib/staff-auth.functions";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Studio Access — ObjektHaus" },
      { name: "description", content: "Grant or remove ObjektHaus studio admin access." },
      { property: "og:title", content: "Studio Access — ObjektHaus" },
      { property: "og:description", content: "Manage who can enter the studio panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Staff,
});

function Staff() {
  const qc = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const addAdmin = useServerFn(createAdmin);
  const dropAdmin = useServerFn(removeAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetchStaff(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: () => addAdmin({ data: { email, password } }),
    onSuccess: (r) => {
      setMsg(`${r.email} can now sign in on the studio sign-in page.`);
      setEmail("");
      setPassword("");
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const drop = useMutation({
    mutationFn: (id: string) => dropAdmin({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["staff"] }),
    onError: (e: Error) => setMsg(e.message),
  });

  if (error) {
    return <p className="text-sm opacity-70">{(error as Error).message}</p>;
  }

  const rows = data ?? [];

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-light">Studio access</h2>
      <p className="mt-3 text-sm opacity-70">
        Create a staff login with any email and password. They can manage orders, objects and site
        content — but cannot add or remove other staff.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          create.mutate();
        }}
        className="mt-8 space-y-5 border border-current/20 p-6"
      >
        <label className="block">
          <span className="caps opacity-55">Email</span>
          <input
            required
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
        </label>
        <label className="block">
          <span className="caps opacity-55">Password</span>
          <input
            required
            type="text"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
        </label>
        <button type="submit" disabled={create.isPending} className="caps link-underline disabled:opacity-40">
          {create.isPending ? "Creating…" : "Create staff login"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm opacity-75">{msg}</p>}

      <h3 className="caps mt-12 opacity-55">People with access</h3>
      {isLoading ? (
        <p className="mt-3 text-sm opacity-60">Loading…</p>
      ) : (
        <ul className="mt-4 divide-y divide-current/15 border-t border-current/15">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p>{r.email}</p>
                <p className="caps mt-1 opacity-50">{r.role === "owner" ? "Owner" : "Admin"}</p>
              </div>
              {r.role === "admin" && (
                <button
                  type="button"
                  onClick={() => drop.mutate(r.id)}
                  className="caps opacity-55 hover:opacity-90"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
