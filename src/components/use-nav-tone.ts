import { useEffect, useState } from "react";

export type Tone = "light" | "dark";

/**
 * Reads the tone of whatever panel currently sits behind the fixed nav bar and
 * returns the tone the icons should be drawn in, so they stay visible on any
 * background. Panels opt in with `data-tone="light" | "dark"`.
 */
export function useNavTone(probeY = 40) {
  const [tone, setTone] = useState<Tone>("light");

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const x = Math.round(window.innerWidth / 2);
      const stack = document.elementsFromPoint(x, probeY);
      for (const el of stack) {
        if (el.closest("[data-nav-root]")) continue;
        const holder = el.closest<HTMLElement>("[data-tone]");
        if (holder) {
          const next: Tone = holder.dataset.tone === "dark" ? "dark" : "light";
          setTone((prev) => (prev === next ? prev : next));
          return;
        }
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [probeY]);

  return tone;
}
