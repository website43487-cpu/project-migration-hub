import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatPrice, useCart } from "@/lib/cart";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, total, count } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Lock the page behind the drawer so mobile doesn't scroll the exhibition
  // underneath while the selection is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Your selection"
        className={`fixed top-0 right-0 z-[61] flex h-full w-full max-w-[26rem] flex-col bg-bone text-bone-foreground shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-current/15 px-6 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-7">
          <p className="caps opacity-60">Your selection — <AnimatedNumber value={count} /></p>
          <button type="button" onClick={() => setOpen(false)} className="caps link-underline">
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-7">
          {lines.length === 0 ? (
            <p className="mt-16 font-display text-2xl font-light opacity-70">
              Nothing chosen yet. Open the archive and pick a floret.
            </p>
          ) : (
            <ul className="divide-y divide-current/12">
              {lines.map((l) => (
                <li key={l.slug} className="flex gap-4 py-6">
                  <img
                    src={l.image}
                    alt={l.name}
                    width={1020}
                    height={1110}
                    className="aspect-[1020/1110] w-20 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-xl leading-tight font-light">{l.product}</p>
                      <button
                        type="button"
                        onClick={() => remove(l.slug)}
                        className="caps shrink-0 pt-1 opacity-45 transition-opacity hover:opacity-90"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-1 text-sm italic opacity-60">{l.name}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center border border-current/25">
                        <button
                          type="button"
                          aria-label={`Remove one ${l.product}`}
                          onClick={() => setQty(l.slug, l.qty - 1)}
                          className="px-3 py-1 transition-opacity hover:opacity-55"
                        >
                          –
                        </button>
                        <span className="min-w-6 text-center text-sm"><AnimatedNumber value={l.qty} /></span>
                        <button
                          type="button"
                          aria-label={`Add one ${l.product}`}
                          onClick={() => setQty(l.slug, l.qty + 1)}
                          className="px-3 py-1 transition-opacity hover:opacity-55"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm opacity-75"><AnimatedNumber value={formatPrice(l.price * l.qty)} /></span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-current/15 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7">
          <div className="flex items-center justify-between">
            <span className="caps opacity-55">Total</span>
            <span className="font-display text-2xl font-light"><AnimatedNumber value={formatPrice(total)} /></span>
          </div>
          <Link
            to="/order"
            onClick={() => setOpen(false)}
            className={`corner-action mt-6 font-display text-3xl font-light ${
              lines.length === 0 ? "pointer-events-none opacity-35" : ""
            }`}
          >
            Checkout
            <svg className="arrow" width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
              <path d="M0 4h20M16.5 1L20 4l-3.5 3" stroke="currentColor" strokeWidth="1" />
            </svg>
          </Link>
        </footer>
      </aside>
    </>
  );
}