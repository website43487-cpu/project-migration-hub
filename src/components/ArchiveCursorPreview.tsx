import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadGsap } from "@/lib/motion";
import type { Flower } from "@/lib/flowers";

/** Floating photo of the object that follows the cursor over the archive list (desktop only). */
export function ArchiveCursorPreview({ active }: { active: Flower | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const api = useRef<{ x?: (v: number) => void; y?: (v: number) => void; show?: (v: boolean) => void }>({});

  useEffect(() => {
    if (!mounted || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let move: ((e: PointerEvent) => void) | null = null;
    loadGsap().then(({ gsap }) => {
      const el = ref.current;
      if (!el) return;
      gsap.set(el, { autoAlpha: 0, scale: 0.85 });
      const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      api.current = { x, y, show: (v) => gsap.to(el, { autoAlpha: v ? 1 : 0, scale: v ? 1 : 0.85, duration: 0.4, ease: "power3.out" }) };
      move = (e) => { x(e.clientX + 28); y(e.clientY - 120); };
      window.addEventListener("pointermove", move);
    });
    return () => { if (move) window.removeEventListener("pointermove", move); };
  }, [mounted]);

  useEffect(() => { api.current.show?.(!!active); }, [active]);

  const src = active ? active.images?.[0]?.src || active.card : "";
  if (!mounted) return null;
  return createPortal(
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-50 hidden w-56 border border-current/20 bg-ink p-2 shadow-2xl lg:block" style={{ visibility: "hidden" }}>
      {src && <img key={src} src={src} alt="" className="aspect-[4/5] w-full object-cover" />}
      {active && <p className="caps mt-2 text-[10px] opacity-75">{active.product}</p>}
    </div>,
    document.body,
  );
}
