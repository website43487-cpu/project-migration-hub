import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

export function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Recalibrate on every entry: play when any meaningful part of the element
    // is inside the viewport, reset only once it has fully left, so scrolling
    // back to a panel always replays the reveal.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const enter = entry.isIntersecting && entry.intersectionRatio >= threshold;
          const leave = entry.intersectionRatio <= 0.001;
          if (enter) setInView(true);
          else if (leave) setInView(false);
        }
      },
      { threshold: [0, 0.001, threshold, 0.5, 1], rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);

    // Elements already on screen at mount should not wait for a scroll event.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) setInView(true);

    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
};

/** Fades, lifts and un-blurs its children the first time they scroll into view. */
export function Reveal({ children, as: Tag = "div", className = "", delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** A hairline rule that draws itself from left to right when scrolled into view. */
export function RuleLine({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  return (
    <span
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`rule-line reveal-line ${inView ? "scale-x-100" : ""} ${className}`}
    />
  );
}
