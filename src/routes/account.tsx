import { brandShareMeta } from "@/lib/brand-media";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { getMyOrders } from "@/lib/data.functions";
import { SiteNav } from "@/components/SiteNav";
import { formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      ...brandShareMeta,
      { title: "Your Orders — ObjektHaus" },
      { name: "description", content: "Track your ObjektHaus orders and see the status of every object you reserved." },
      { property: "og:title", content: "Your Orders — ObjektHaus" },
      { property: "og:description", content: "Track your ObjektHaus orders and their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

const OPEN = new Set(["new", "pending", "confirmed"]);

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  total: number;
  shipping: number;
  created_at: string;
  items: { name?: string; product?: string; qty?: number }[] | null;
};

function Account() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const fetchOrders = useServerFn(getMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: () => fetchOrders(),
  });

  const current = (data ?? []).filter((o) => OPEN.has(o.status));
  const past = (data ?? []).filter((o) => !OPEN.has(o.status));

  return (
    <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-7 pt-32 pb-24 sm:px-10 lg:max-w-5xl lg:pt-40">
        <p className="caps opacity-55">{session?.user.email}</p>
        <h1 className="mt-4 font-display text-5xl font-light sm:text-6xl">Your orders</h1>
        <span className="rule-line mt-6" />

        {isLoading ? (
          <p className="mt-10 text-sm opacity-70">Loading…</p>
        ) : (data ?? []).length === 0 ? (
          <div className="mt-10 border border-current/20 p-8">
            <p className="font-display text-2xl font-light">No orders yet.</p>
            <Link to="/archive" className="caps link-underline mt-6 inline-block">
              Open the botanical archive
            </Link>
          </div>
        ) : (
          <>
            <OrderList title="Current" rows={current} empty="Nothing in progress." />
            <OrderList title="Past" rows={past} empty="No completed orders yet." />
          </>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="caps mt-14 block opacity-55 hover:opacity-90"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}

function OrderList({ title, rows, empty }: { title: string; rows: OrderRow[]; empty: string }) {
  return (
    <section className="mt-12">
      <p className="caps opacity-55">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm opacity-60">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-current/18 border-t border-current/18">
          {rows.map((o) => (
            <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-3 py-5">
              <div>
                <p className="font-display text-xl font-light">#{o.reference}</p>
                <p className="mt-1 text-sm opacity-65">
                  {(o.items ?? []).map((i) => `${i.name ?? i.product ?? ""} ×${i.qty ?? 1}`).join(", ")}
                </p>
                <p className="mt-1 text-xs opacity-50">
                  {new Date(o.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="caps">{o.status}</p>
                <p className="mt-1 text-sm opacity-70">{formatPrice(o.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
