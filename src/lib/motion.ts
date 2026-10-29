import { useSetting } from "@/lib/site";

/** Loads GSAP + plugins only in the browser (never during server render). */
export async function loadGsap() {
  const [{ gsap }, { ScrollTrigger }, { Observer }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/Observer"),
  ]);
  gsap.registerPlugin(ScrollTrigger, Observer);
  return { gsap, ScrollTrigger, Observer };
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type ShowcaseSlide = { heading: string; caption: string; image: string; link: string; published: boolean };
export type ShowcaseSettings = { enabled: boolean; autoplay: number; slides: ShowcaseSlide[] };
export const defaultShowcase: ShowcaseSettings = {
  enabled: true,
  autoplay: 6,
  slides: [
    { heading: "Curved by hand", caption: "Plate I — The jig", image: "", link: "/archive", published: true },
    { heading: "Honest plywood", caption: "Plate II — Material", image: "", link: "/journal", published: true },
    { heading: "Made together", caption: "Plate III — Co-creation", image: "", link: "/collaborate", published: true },
  ],
};
export const useShowcase = () => useSetting<ShowcaseSettings>("showcase", defaultShowcase).data ?? defaultShowcase;

export type FaqItem = { q: string; a: string; published: boolean };
export const defaultFaq: FaqItem[] = [
  { q: "How long does an object take to make?", a: "Most objects leave the workshop in 7–14 days. Each is assembled by hand, one at a time.", published: true },
  { q: "Do you deliver outside Dhaka?", a: "Yes — we deliver across Bangladesh. Delivery is calculated by weight at checkout.", published: true },
  { q: "How do I pay?", a: "Cash on delivery, bKash or Nagad. For mobile payments, send the amount and enter your transaction ID at checkout.", published: true },
  { q: "What is the botanical archive card?", a: "Every object ships with a printed card of the flower that names it, and the story behind it.", published: true },
  { q: "Can I submit my own design?", a: "Yes. Use “Got an idea?” — if we produce it, you share in the profit of every sale.", published: true },
];
export const useFaq = () => {
  const v = useSetting<FaqItem[]>("faq", defaultFaq).data;
  return (Array.isArray(v) && v.length ? v : defaultFaq).filter((f) => f.published !== false);
};
