import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavTone } from "./use-nav-tone";
import { SocialLinks } from "./Social";
import { useCart } from "@/lib/cart";
import eyeMark from "@/assets/objekthaus-eye.png.asset.json";
import { WordmarkGlyph } from "./WordmarkGlyph";
import { useFaq } from "@/lib/motion";

const items: { no: string; label: string; to?: string; hash?: string; faq?: boolean }[] = [
  { no: "I", label: "Botanical Archive", to: "/archive" },
  { no: "II", label: "Journal", to: "/journal" },
  { no: "III", label: "Your orders", to: "/account" },
  { no: "IV", label: "Got an idea?", to: "/collaborate" },
  { no: "V", label: "Frequently asked", faq: true },
  { no: "VI", label: "Contact", to: "/contact" },
  { no: "VII", label: "Studio panel", to: "/admin" },
];

/** The original hand-brushed ObjektHaus eye, drawn in currentColor via a mask. */
function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`ink-mark block h-[26px] w-[44px] sm:h-[30px] sm:w-[50px] ${className}`}
      style={{ maskImage: `url(${eyeMark.url})`, WebkitMaskImage: `url(${eyeMark.url})` }}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <WordmarkGlyph className={`block ${className}`} />;
}

export function SiteNav() {
  const tone = useNavTone();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { count, setOpen: setCartOpen } = useCart();
  const faq = useFaq();
  const [faqOpen, setFaqOpen] = useState(false);
  const [openQ, setOpenQ] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const goToSection = (hash: string) => {
    setOpen(false);
    const scroll = () =>
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (router.state.location.pathname !== "/") {
      router.navigate({ to: "/" }).then(() => setTimeout(scroll, 160));
    } else {
      setTimeout(scroll, 80);
    }
  };

  const iconTone = open ? "text-olive-foreground" : tone === "dark" ? "text-ink" : "text-bone";
  const chip =
    "nav-chip pointer-events-auto relative flex items-center justify-center transition-all duration-300";

  return (
    <>
      <header
        data-nav-root
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 transition-colors duration-500 sm:px-8 lg:px-12 ${iconTone}`}
      >
        <Link
          to="/"
          aria-label="Back to the exhibition entrance"
          onClick={() => setOpen(false)}
          className={`${chip} h-11 w-14`}
        >
          <EyeIcon />
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Open your selection — ${count} item${count === 1 ? "" : "s"}`}
            onClick={() => {
              setOpen(false);
              setCartOpen(true);
            }}
            className={`${chip} h-11 w-11`}
          >
            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" aria-hidden="true">
              <path
                d="M2.6 6.2h14.8l-1.2 12.3H3.8L2.6 6.2Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path
                d="M7 8V5.2a3 3 0 0 1 6 0V8"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0 -right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-current px-1">
                <span className="text-[0.6rem] leading-none font-medium text-bone mix-blend-difference">
                  <AnimatedNumber value={count} />
                </span>
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`${chip} h-11 w-11 flex-col items-center justify-center gap-[7px]`}
          >
            <span
              className={`block h-px bg-current transition-all duration-500 ${
                open ? "w-6 translate-y-[4px] rotate-45" : "w-6"
              }`}
            />
            <span
              className={`block h-px bg-current transition-all duration-500 ${
                open ? "w-6 -translate-y-[4px] -rotate-45" : "w-3.5 self-end"
              }`}
            />
          </button>
        </div>
      </header>

      {/* Minimal index overlay */}
      <div
        className={`fixed inset-0 z-40 bg-olive text-olive-foreground transition-opacity duration-700 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="h-full w-full overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center px-7 py-24 sm:px-10 lg:px-16">
          <Wordmark
            className={`mb-10 h-8 w-52 transition-all duration-700 sm:h-10 sm:w-64 ${
              open ? "translate-y-0 opacity-90" : "translate-y-2 opacity-0"
            }`}
          />
          <p
            className={`caps mb-12 opacity-50 transition-all duration-700 ${
              open ? "translate-y-0 opacity-50" : "translate-y-2 opacity-0"
            }`}
          >
            Index
          </p>
          <ul>
            {items.map((item, i) => (
              <li key={item.label}>
                {item.faq ? (
                  <div>
                    <button
                      type="button"
                      aria-expanded={faqOpen}
                      onClick={() => setFaqOpen((v) => !v)}
                      style={{ transitionDelay: open ? `${120 + i * 90}ms` : "0ms" }}
                      className={`group flex w-full items-baseline gap-5 py-4 text-left transition-all duration-700 hover:opacity-60 ${
                        open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}
                    >
                      <span className="caps w-7 shrink-0 opacity-45">{item.no}</span>
                      <span className="font-display text-2xl font-light sm:text-3xl">{item.label}</span>
                      <span className={`ml-auto self-center transition-transform duration-500 ${faqOpen ? "rotate-45" : ""}`}>+</span>
                    </button>
                    {faqOpen && (
                      <ul className="mb-4 ml-12 border-t border-dashed border-current/30">
                        {faq.map((f, qi) => (
                          <li key={qi} className="border-b border-dashed border-current/30">
                            <button type="button" aria-expanded={openQ === qi} onClick={() => setOpenQ(openQ === qi ? null : qi)} className="flex w-full justify-between gap-4 py-3 text-left font-mono text-xs tracking-wider uppercase">
                              <span>{f.q}</span>
                              <span className={`transition-transform duration-300 ${openQ === qi ? "rotate-180" : ""}`}>⌄</span>
                            </button>
                            {openQ === qi && <p className="pb-4 text-sm leading-relaxed opacity-75">{f.a}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : item.hash ? (
                  <button
                    type="button"
                    onClick={() => goToSection(item.hash!)}
                    style={{ transitionDelay: open ? `${120 + i * 90}ms` : "0ms" }}
                    className={`group flex w-full items-baseline gap-5 py-4 text-left transition-all duration-700 hover:opacity-60 ${
                      open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    <span className="caps w-7 shrink-0 opacity-45">{item.no}</span>
                    <span className="font-display text-2xl font-light sm:text-3xl">
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    to={item.to!}
                    onClick={() => setOpen(false)}
                    style={{ transitionDelay: open ? `${120 + i * 90}ms` : "0ms" }}
                    className={`group flex w-full items-baseline gap-5 py-4 text-left transition-all duration-700 hover:opacity-60 ${
                      open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    <span className="caps w-7 shrink-0 opacity-45">{item.no}</span>
                    <span className="font-display text-2xl font-light sm:text-3xl">
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div
            style={{ transitionDelay: open ? "520ms" : "0ms" }}
            className={`mt-14 flex flex-wrap items-center gap-x-6 gap-y-4 transition-all duration-700 ${
              open ? "translate-y-0 opacity-70" : "translate-y-3 opacity-0"
            }`}
          >
            <SocialLinks />
            <span className="hidden h-px w-10 bg-current opacity-40 sm:block" />
            <span className="caps whitespace-nowrap opacity-70">© ObjektHaus 2024</span>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
