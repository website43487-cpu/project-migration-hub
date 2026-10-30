import { brandShareMeta } from "@/lib/brand-media";
import { useMediaCopies } from "@/lib/use-media-url";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal, RuleLine } from "@/components/Reveal";
import { useAllFlowers } from "@/lib/products";
import { useState } from "react";
import { ArchiveCursorPreview } from "@/components/ArchiveCursorPreview";
import type { Flower } from "@/lib/flowers";
import archiveDark from "@/assets/archive-dark.jpg";
import qalCard from "@/assets/qal-card.jpg.asset.json";

export const Route = createFileRoute("/archive")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/archive" }],
    meta: [
      ...brandShareMeta,
      { title: "Botanical Archive — ObjektHaus" },
      {
        name: "description",
        content:
          "Every flower in the ObjektHaus archive names a plywood object. Open a floret to see the product it represents, why we chose it, and the story behind it.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/archive" },
      { property: "og:title", content: "Botanical Archive — ObjektHaus" },
      {
        property: "og:description",
        content: "Explore the flowers behind each plywood object and their stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Archive,
});

function Archive() {
  const flowers = useAllFlowers();
  const copies = useMediaCopies();
  const [hover, setHover] = useState<Flower | null>(null);

  return (
    <main data-tone="light" className="min-h-screen bg-ink text-ink-foreground">
      <SiteNav />

      <header className="relative flex min-h-[70svh] flex-col justify-end overflow-hidden px-7 pb-12 sm:px-10 lg:min-h-[80svh] lg:px-16 lg:pb-20">
        <img
          src={copies[archiveDark] ?? archiveDark}
          alt="Herbarium plate of botanical engravings"
          width={1024}
          height={1408}
          className="ken absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="relative">
          <p className="caps rise opacity-55">Plate No. XXXII</p>
          <h1 className="rise mt-4 font-display text-5xl font-light sm:text-6xl">
            Botanical
            <br />
            Archive
          </h1>
          <RuleLine className="mt-6" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-7 py-16 sm:px-10">
        <p className="caps mb-8 opacity-50">Each floret is an object — open one</p>
        <ul className="divide-y divide-current/15" onPointerLeave={() => setHover(null)}>
          {flowers.map((f, i) => (
            <Reveal as="li" key={f.no} delay={i * 70}>
              <Link
                to="/flower/$slug"
                params={{ slug: f.slug }}
                onPointerEnter={() => setHover(f)}
                className="group flex items-baseline gap-5 py-7 transition-opacity duration-500 hover:opacity-65"
              >
                <span className="caps w-12 shrink-0 opacity-50">{f.no}</span>
                <div className="flex-1">
                  <h2 className="font-display text-3xl font-light lg:text-4xl">{f.name}</h2>
                  <p className="mt-1 text-sm italic opacity-60">{f.latin}</p>
                  <p className="mt-3 text-[0.95rem] opacity-80">{f.note}</p>
                  <p className="caps mt-3 opacity-55">{f.product}</p>
                </div>
                <svg
                  width="22"
                  height="8"
                  viewBox="0 0 22 8"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 self-center transition-transform duration-500 group-hover:translate-x-1.5"
                >
                  <path d="M0 4h20M16.5 1L20 4l-3.5 3" stroke="currentColor" strokeWidth="1" />
                </svg>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-7 pb-24 sm:px-10">
        <Reveal className="border border-current/20 p-8 text-center">
          <img
            src={copies[qalCard.url] ?? qalCard.url}
            alt="Archive card of Queen Anne's Lace"
            loading="lazy"
            width={1024}
            height={1200}
            className="drift mx-auto w-40 opacity-90"
          />
          <p className="caps mt-6 opacity-60">Included with every object</p>
          <p className="mt-3 font-display text-2xl font-light">The botanical archive card</p>
          <Link to="/order" className="corner-action caps mt-8 inline-flex">
            Bring it home
          </Link>
        </Reveal>
      </section>
      <ArchiveCursorPreview active={hover} />
    </main>
  );
}
