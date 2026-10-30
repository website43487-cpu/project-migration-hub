import { brandShareMeta } from "@/lib/brand-media";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SocialLinks } from "@/components/Social";
import { formatPrice, toAnalyticsItem, useCart } from "@/lib/cart";
import { deliveryCost, useCheckoutSettings, useDelivery } from "@/lib/site";
import { useAllFlowers } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/data.functions";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";

export const Route = createFileRoute("/order")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/order" }],
    meta: [
      ...brandShareMeta,
      { title: "Checkout — ObjektHaus" },
      {
        name: "description",
        content:
          "Review your ObjektHaus selection, adjust quantities and reserve your plywood objects. Every object ships with its botanical archive card.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/order" },
      { property: "og:title", content: "Checkout — ObjektHaus" },
      { property: "og:description", content: "Review your selection and reserve your objects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Order,
});

function Order() {
  const sendOrder = useServerFn(placeOrder);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [pay, setPay] = useState<"cod" | "bkash" | "nagad">("cod");
  const { lines, setQty, remove, total, totalWeight, count, clear } = useCart();
  const flowers = useAllFlowers();
  const delivery = useDelivery();
  const checkout = useCheckoutSettings();
  const shipping = lines.length === 0 ? 0 : deliveryCost(delivery, totalWeight, total);

  // One begin_checkout per visit, once the basket is known.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || lines.length === 0) return;
    checkoutTracked.current = true;
    trackBeginCheckout(
      lines.map((l) => toAnalyticsItem(l, l.qty)),
      total + shipping,
    );
  }, [lines, total, shipping]);


  const placeOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      // Checkout is available to guests. A managed-auth lookup must never
      // prevent an otherwise valid order from being saved.
      let userId: string | null = null;
      try {
        const auth = await supabase.auth.getUser();
        userId = auth.data.user?.id ?? null;
        if (auth.error) console.warn("Could not resolve checkout user; continuing as guest:", auth.error);
      } catch (authError) {
        console.warn("Checkout auth lookup failed; continuing as guest:", authError);
      }
      const { reference: ref } = await sendOrder({
        data: {
          customer_name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? ""),
          email: String(form.get("email") ?? "") || null,
          note:
            [
              pay === "cod" ? null : `Payment: ${pay === "bkash" ? "bKash" : "Nagad"} — sender ${String(form.get("sender") ?? "")} — TrxID ${String(form.get("trxid") ?? "")}`,
              String(form.get("note") ?? "").trim() || null,
            ].filter(Boolean).join("\n") || null,
          items: lines.map((l) => ({
            slug: l.slug,
            name: l.name,
            product: l.product,
            qty: l.qty,
            price: l.price,
            weight_kg: l.weightKg ?? 0,
          })),
          subtotal: total,
          total_weight: totalWeight,
          shipping,
          total: total + shipping,
          delivery_zone: "inside",
          payment_method: pay,
          payment_trx_id: pay === "cod" ? null : String(form.get("trxid") ?? "").trim().toUpperCase(),
          payment_sender: pay === "cod" ? null : String(form.get("sender") ?? "").trim(),
          user_id: userId,
        },
      });
      trackPurchase({
        transactionId: ref,
        value: total + shipping,
        shipping,
        items: lines.map((l) => toAnalyticsItem(l, l.qty)),
      });
      setReference(ref);
      setSent(true);
      clear();
    } catch (err) {
      setError(err instanceof Error && /transaction ID has already been used/i.test(err.message)
        ? "This transaction ID has already been used for another order. Please check the ID or contact the studio."
        : "We could not record your order. Please try again or write to the studio.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main data-tone="dark" className="min-h-screen bg-clay text-clay-foreground">
      <SiteNav />

      <section className="mx-auto max-w-2xl px-7 pt-32 pb-20 sm:px-10 lg:max-w-6xl lg:pt-40 xl:max-w-7xl">
        <p className="caps opacity-55">Bring it home</p>
        <h1 className="mt-4 font-display text-5xl font-light sm:text-6xl lg:text-7xl">Checkout</h1>
        <span className="rule-line mt-6" />

        <div className="mt-12 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-20">
          {/* Selection */}
          <div>
            <p className="caps opacity-55">Your selection — {count}</p>
            {lines.length === 0 ? (
              <div className="mt-6 border border-current/20 p-8">
                <p className="font-display text-2xl font-light">Your selection is empty.</p>
                <p className="mt-3 text-sm opacity-70">
                  Every object in the archive can be added here, in any quantity.
                </p>
                <Link to="/archive" className="caps link-underline mt-6 inline-block">
                  Open the botanical archive
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-current/18">
                  {lines.map((l) => (
                    <li key={l.slug} className="flex gap-5 py-6">
                      <img
                        src={l.image}
                        alt={l.product}
                        loading="lazy"
                        width={1020}
                        height={1110}
                        className="aspect-[1020/1110] w-24 shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-2xl font-light">{l.product}</p>
                        <p className="mt-1 text-sm italic opacity-60">{l.name}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-5">
                          <div className="flex items-center border border-current/25">
                            <button
                              type="button"
                              aria-label={`Remove one ${l.product}`}
                              onClick={() => setQty(l.slug, l.qty - 1)}
                              className="px-3 py-1 transition-opacity hover:opacity-55"
                            >
                              –
                            </button>
                            <span className="min-w-6 text-center text-sm">{l.qty}</span>
                            <button
                              type="button"
                              aria-label={`Add one ${l.product}`}
                              onClick={() => setQty(l.slug, l.qty + 1)}
                              className="px-3 py-1 transition-opacity hover:opacity-55"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm opacity-75">
                            <AnimatedNumber value={formatPrice(l.price * l.qty)} />
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(l.slug)}
                            className="caps opacity-45 transition-opacity hover:opacity-90"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <dl className="mt-6 divide-y divide-current/20 text-[0.95rem]">
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="caps opacity-55">Subtotal</dt>
                    <dd><AnimatedNumber value={formatPrice(total)} /></dd>
                  </div>
                  <div className="flex justify-between gap-6 py-3">
                    <dt className="caps opacity-55">
                      Delivery{totalWeight > 0 ? ` — ${totalWeight.toFixed(1)} kg` : ""}
                    </dt>
                    <dd>{shipping === 0 ? "Included" : <AnimatedNumber value={formatPrice(shipping)} />}</dd>
                  </div>
                  <div className="flex justify-between gap-6 py-4">
                    <dt className="caps opacity-55">Total</dt>
                    <dd className="font-display text-2xl font-light">
                      <AnimatedNumber value={formatPrice(total + shipping)} />
                    </dd>
                  </div>
                </dl>
                <ul className="mt-6 divide-y divide-current/15 border-y border-current/20 text-sm">
                  <li className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3">
                    <span className="caps opacity-55">Dispatch</span>
                    <span className="opacity-80">
                      Handcrafted to order — dispatches within 3–5 working days across Bangladesh.
                    </span>
                  </li>
                  <li className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3">
                    <span className="caps opacity-55">Guarantee</span>
                    <span className="opacity-80">
                      Arrives damaged? We replace it or refund you in full.
                    </span>
                  </li>
                  <li className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3">
                    <span className="caps opacity-55">Archive</span>
                    <span className="opacity-80">
                      Each object ships with its numbered botanical archive card.
                    </span>
                  </li>
                </ul>
              </>
            )}

            <div className="mt-10">
              <p className="caps opacity-55">Add another object</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {flowers.map((f) => (
                  <Link
                    key={f.slug}
                    to="/flower/$slug"
                    params={{ slug: f.slug }}
                    className="caps link-underline"
                  >
                    {f.product}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-16 lg:sticky lg:top-32 lg:mt-0">
            {sent ? (
              <p className="font-display text-2xl font-light">
                Thank you — we&apos;ll write to you about your objects.
                {reference && (
                  <span className="caps mt-4 block opacity-60">Order reference {reference}</span>
                )}
              </p>
            ) : (
          <form
            className="space-y-6"
            onSubmit={placeOrderSubmit}
          >
            <p className="caps opacity-55">Your details</p>
            <label className="block">
              <span className="caps opacity-55">Name</span>
              <input
                required
                name="name"
                autoComplete="name"
                maxLength={100}
                className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <label className="block">
              <span className="caps opacity-55">Phone number</span>
              <input
                required
                type="tel"
                name="phone"
                autoComplete="tel"
                maxLength={25}
                pattern="[0-9\+\(\)\s\-]{6,25}"
                className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <label className="block">
              <span className="caps opacity-55">Address</span>
              <textarea
                required
                name="address"
                rows={3}
                maxLength={300}
                autoComplete="street-address"
                className="mt-2 w-full resize-none border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <label className="block">
              <span className="caps opacity-55">Email (optional)</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={255}
                className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <fieldset className="space-y-3">
              <legend className="caps opacity-55">Payment</legend>
              <div className="flex flex-wrap gap-5 text-sm">
                {(["cod", "bkash", "nagad"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
                    {m === "cod" ? "Cash on delivery" : m === "bkash" ? "bKash" : "Nagad"}
                  </label>
                ))}
              </div>
              {pay !== "cod" && (
                <div className="space-y-4 border border-current/20 p-4 text-sm">
                  <p className="opacity-80">
                    Send <AnimatedNumber value={formatPrice(total + shipping)} /> by {pay === "bkash" ? "bKash" : "Nagad"} to{" "}
                    <strong>01635592323</strong>, then enter your details below.
                  </p>
                  <label className="block"><span className="caps opacity-55">Sender number</span>
                    <input required name="sender" type="tel" maxLength={20} pattern="[0-9+\s-]{10,20}" className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current" /></label>
                  <label className="block"><span className="caps opacity-55">Transaction ID (TrxID)</span>
                    <input required name="trxid" maxLength={30} pattern="[A-Za-z0-9]{6,30}" className="mt-2 w-full border-b border-current/30 bg-transparent py-2 uppercase outline-none focus:border-current" /></label>
                </div>
              )}
            </fieldset>
            {checkout.noteEnabled && (
              <label className="block">
                <span className="caps opacity-55">{checkout.noteLabel}</span>
                {checkout.noteHint && (
                  <span className="mt-1 block text-sm opacity-55">{checkout.noteHint}</span>
                )}
                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder={checkout.notePlaceholder}
                  className="mt-2 w-full resize-none border-b border-current/30 bg-transparent py-2 outline-none placeholder:opacity-40 focus:border-current"
                />
              </label>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={lines.length === 0 || busy}
              className="link-underline caps mt-4 disabled:pointer-events-none disabled:opacity-40"
            >
              {busy ? "Sending…" : `Reserve ${count > 1 ? `these ${count} objects` : "this object"}`}
            </button>
          </form>
            )}
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6">
          <span className="caps opacity-55">Or reach us</span>
          <SocialLinks className="opacity-80" size={20} />
        </div>

        <div className="mt-20 flex justify-between">
          <Link to="/" className="caps link-underline">
            Exhibition
          </Link>
          <Link to="/contact" className="caps link-underline">
            Contact
          </Link>
        </div>
      </section>
      <footer className="flex gap-6 px-7 py-8 sm:px-10"><Link to="/privacy" className="caps link-underline opacity-60">Privacy policy</Link><Link to="/terms" className="caps link-underline opacity-60">Terms</Link></footer>
    </main>
  );
}
