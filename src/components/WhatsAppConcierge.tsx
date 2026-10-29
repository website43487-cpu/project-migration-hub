import { useEffect, useRef, useState } from "react";
import { loadGsap, prefersReducedMotion } from "@/lib/motion";
import { useRouterState } from "@tanstack/react-router";
import { defaultContact, useSetting, whatsappHref, type ContactSettings } from "@/lib/site";

const PRESETS = [
  "I'd like to book a studio visit.",
  "What is the delivery timeline for my area?",
  "Do you take bespoke commissions?",
  "Can you help me track my order?",
];

/** Floating WhatsApp button with preset questions. */
export function WhatsAppConcierge() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const contact = useSetting<ContactSettings>("contact", defaultContact).data ?? defaultContact;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const btn = useRef<HTMLButtonElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const gs = useRef<typeof import("gsap").gsap | null>(null);
  useEffect(() => {
    if (prefersReducedMotion() || path.startsWith("/admin")) return;
    let tw: { kill: () => void } | null = null;
    loadGsap().then(({ gsap }) => {
      gs.current = gsap;
      if (btn.current) tw = gsap.to(btn.current, { y: -6, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });
    return () => tw?.kill();
  }, [path]);
  useEffect(() => {
    const g = gs.current;
    if (open) { setShown(true); return; }
    if (!shown) return;
    if (!g || !panel.current) { setShown(false); return; }
    g.to(panel.current, { scale: 0.85, autoAlpha: 0, y: 12, duration: 0.25, ease: "power2.in", onComplete: () => setShown(false) });
  }, [open]);
  useEffect(() => {
    const g = gs.current;
    if (!shown || !open || !g || !panel.current) return;
    g.fromTo(panel.current, { autoAlpha: 0, scale: 0.75, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(2.2)" });
    g.from(panel.current.querySelectorAll("li"), { autoAlpha: 0, x: 12, duration: 0.4, stagger: 0.05, ease: "back.out(2)", delay: 0.1 });
  }, [shown, open]);
  const pulse = () => {
    const g = gs.current;
    if (!g || !ring.current || !btn.current) return;
    g.fromTo(ring.current, { scale: 1, autoAlpha: 0.5 }, { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: "power2.out" });
    g.fromTo(btn.current, { scale: 0.8 }, { scale: 1, duration: 0.8, ease: "elastic.out(1.2, 0.35)" });
  };
  const hover = (v: boolean) => gs.current && btn.current && gs.current.to(btn.current, { scale: v ? 1.1 : 1, duration: 0.4, ease: v ? "back.out(3)" : "elastic.out(1, 0.4)" });
  if (path.startsWith("/admin")) return null;
  const base = whatsappHref(contact.whatsapp || defaultContact.whatsapp);
  const send = (text: string) =>
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  const presets = path.startsWith("/flower/")
    ? [`I have a question about this object: ${window.location.href}`, ...PRESETS]
    : PRESETS;

  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {shown && (
        <div ref={panel} style={{ transformOrigin: "bottom right" }} className="w-72 border border-current/20 bg-bone p-5 text-bone-foreground shadow-2xl">
          <p className="caps opacity-55">Studio concierge</p>
          <ul className="mt-3 space-y-2">
            {presets.map((p) => (
              <li key={p}>
                <button type="button" onClick={() => send(p)} className="text-left text-sm hover:opacity-60">
                  → {p}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 flex gap-2 border-t border-current/20 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (msg.trim()) send(msg.trim());
            }}
          >
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={500}
              placeholder="Write your own…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button type="submit" className="caps">Send</button>
          </form>
        </div>
      )}
      <button
        ref={btn}
        type="button"
        onClick={() => { setOpen((o) => !o); pulse(); }}
        onPointerEnter={() => hover(true)}
        onPointerLeave={() => hover(false)}
        aria-expanded={open}
        aria-label={open ? "Close WhatsApp chat" : "Chat with the studio on WhatsApp"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-soot text-bone ring-1 ring-bone/15 shadow-xl"
      >
        <span ref={ring} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-soot opacity-0" />
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="relative"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true" className="relative"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.04.72C5.78.72.68 5.82.68 12.08c0 2 .52 3.96 1.52 5.68L.58 23.28l5.65-1.48a11.3 11.3 0 0 0 5.8 1.48h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03z"/></svg>
        )}
      </button>
    </div>
  );
}
