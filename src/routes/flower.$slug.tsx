import { brandShareMeta } from "@/lib/brand-media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { defaultContact, useSetting, whatsappHref, type ContactSettings } from "@/lib/site";
import { SiteNav } from "@/components/SiteNav";
import { Reveal, RuleLine } from "@/components/Reveal";
import { getFlower, type Flower } from "@/lib/flowers";
import { listProducts } from "@/lib/data.functions";
import { mergeWithBuiltIn, rowToFlower, useAllFlowers, useFlower, useProductsLoaded } from "@/lib/products";
import { AddToCart, QuickAdd } from "@/components/AddToCart";
import { formatPrice, toAnalyticsItem } from "@/lib/cart";
import { trackViewItem } from "@/lib/analytics";

export const Route = createFileRoute("/flower/$slug")({
  loader: async ({ params }) => {
    // Resolve live Studio-created products on direct visits and browser refreshes.
    // Keep the built-in catalogue available if the personal database is temporarily unreachable.
    try {
      const rows = await listProducts();
      const row = rows.find((product) => product.slug === params.slug);
      if (row) return mergeWithBuiltIn(rowToFlower(row));
    } catch (error) {
      console.error("Live product detail lookup failed; using built-in catalogue:", error);
    }
    return getFlower(params.slug) ?? null;
  },
  head: ({ loaderData, params }) => ({
    links: [{ rel: "canonical", href: `https://objekthausstudio.lovable.app/flower/${params.slug}` }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: `${loaderData.product} — ${loaderData.name}`,
              description: loaderData.represents,
              image: loaderData.images?.[0]?.src?.startsWith("http") ? loaderData.images[0].src : undefined,
              itemCondition: "https://schema.org/NewCondition",
              brand: { "@type": "Brand", name: "ObjektHaus" },
              offers: {
                "@type": "Offer",
                priceCurrency: "BDT",
                price: loaderData.price,
                availability: "https://schema.org/InStock",
                url: `https://objekthausstudio.lovable.app/flower/${params.slug}`,
                seller: { "@type": "Organization", name: "ObjektHaus" },
                shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" } },
                hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "BD", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 7 },
              },
            }),
          },
        ]
      : [],
    meta: [
      ...brandShareMeta,
      { property: "og:url", content: `https://objekthausstudio.lovable.app/flower/${params.slug}` },
      { title: loaderData ? `${loaderData.product} — ${loaderData.name} | ObjektHaus` : "Floret — ObjektHaus" },
      {
        name: "description",
        content:
          (loaderData ? `${loaderData.product} — handcrafted plywood object with a numbered ${loaderData.name} archive card. Ships across Bangladesh.` : undefined) ??
          "A plywood object from the ObjektHaus botanical archive.",
      },
      { property: "og:title", content: loaderData ? `${loaderData.product} — ${loaderData.name} | ObjektHaus` : "Floret — ObjektHaus" },
      { property: "og:description", content: loaderData ? `${loaderData.product} — handcrafted plywood object with a numbered ${loaderData.name} archive card.` : "" },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FlowerCard,
});

function FlowerCard() {
  const { slug } = Route.useParams();
  const flowers = useAllFlowers();
  const contact = useSetting<ContactSettings>("contact", defaultContact).data ?? defaultContact;
  // Live studio data always wins over the build-time copy in the loader.
  const live = useFlower(slug);
  const f = live ?? (Route.useLoaderData() as Flower | null) ?? null;
  const loaded = useProductsLoaded();

  const viewedSlug = f?.slug;
  const viewedName = f?.product;
  const viewedVariant = f?.name;
  const viewedPrice = f?.price;
  // Fire view_item once per object, and only after the live prices have arrived,
  // so the event never carries a stale build-time price.
  const trackedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (!viewedSlug || !viewedName || typeof viewedPrice !== "number") return;
    if (trackedSlug.current === viewedSlug) return;
    trackedSlug.current = viewedSlug;
    trackViewItem(
      toAnalyticsItem(
        { slug: viewedSlug, name: viewedVariant ?? "", product: viewedName, price: viewedPrice },
        1,
      ),
    );
  }, [loaded, viewedSlug, viewedName, viewedVariant, viewedPrice]);


  if (!f) {
    return (
      <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
        <SiteNav />
        <section className="mx-auto max-w-5xl px-7 pt-40 pb-20 sm:px-10">
          <p className="caps opacity-55">Botanical archive</p>
          <p className="mt-4 font-display text-4xl font-light">{loaded ? "This floret is unavailable." : "Opening this floret…"}</p>
          {loaded && <p className="mt-3 max-w-md text-sm opacity-65">The product could not be found in the catalogue. Return to the archive and choose another object.</p>}
          <Link to="/archive" className="caps link-underline mt-8 inline-block">
            Back to the archive
          </Link>
        </section>
      </main>
    );
  }

  const idx = flowers.findIndex((x) => x.slug === f.slug);
  const next = flowers[(idx + 1 + flowers.length) % flowers.length] ?? f;

  return (
    <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
      <SiteNav />

      <section className="mx-auto max-w-5xl px-7 pt-32 pb-14 sm:px-10 lg:pt-40">
        <p className="caps rise opacity-55">Floret No. {f.no}</p>
        <h1 className="rise mt-4 font-display text-5xl leading-[1.05] font-light sm:text-6xl">
          {f.name}
        </h1>
        <p className="mt-3 text-sm italic opacity-60">{f.latin}</p>
        <RuleLine className="mt-6" />
        <p className="caps mt-6 opacity-60">{f.product}</p>
        <p className="mt-2 text-sm opacity-60">
          {f.edition} — <AnimatedNumber value={formatPrice(f.price)} />
        </p>
      </section>

      {/* Swipeable product images */}
      <section className="pb-4">
        <div className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-7 pb-4 sm:px-10">
          {f.images.map((img, index) => (
            <div
              key={img.src}
              className="image-veil w-[78%] shrink-0 snap-center overflow-hidden rounded-xl sm:w-[52%]"
            >
              <Loupe
                src={img.src}
                alt={img.alt}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                width={1020}
                height={1110}
                className="aspect-[1020/1110] w-full object-cover"
              />
            </div>
          ))}
        </div>
        <p className="caps mx-auto max-w-6xl px-7 opacity-45 sm:px-10">Swipe — {f.images.length} views</p>
      </section>

      <section className="mx-auto max-w-5xl space-y-12 px-7 py-14 sm:px-10">
        <Reveal>
          <h2 className="caps opacity-55">The representing flower card</h2>
          <RuleLine className="mt-3" />
          <div className="mt-6 flex flex-col items-center border border-current/20 p-8 text-center">
            <img
              src={f.card}
              alt={`Botanical archive card engraving of ${f.name}`}
              loading="lazy"
              width={1024}
              height={1200}
              className="drift w-44 opacity-95"
            />
            <p className="caps mt-6 opacity-55">Floret No. {f.no}</p>
            <p className="mt-2 font-display text-2xl font-light">{f.name}</p>
            <p className="mt-1 text-sm italic opacity-60">{f.latin}</p>
            <p className="mt-4 max-w-sm text-sm opacity-70">
              A letterpressed archive card of {f.name}, numbered and slipped into every{" "}
              {f.product.split("—")[1]?.trim() ?? "object"} we ship.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="caps opacity-55">What it represents</h2>
          <RuleLine className="mt-3" />
          <p className="mt-4 text-[1rem] leading-relaxed opacity-85">{f.represents}</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="caps opacity-55">Why this flower</h2>
          <RuleLine className="mt-3" />
          <p className="mt-4 text-[1rem] leading-relaxed opacity-85">{f.why}</p>
        </Reveal>
        <Reveal delay={160}>
          <h2 className="caps opacity-55">The story</h2>
          <RuleLine className="mt-3" />
          <p className="mt-4 text-[1rem] leading-relaxed opacity-85">{f.story}</p>
        </Reveal>

        <Reveal delay={200} className="flex flex-wrap items-center justify-between gap-6 pt-4">
          <a
            href={`${whatsappHref(contact.whatsapp)}?text=${encodeURIComponent(`Inquiring about ${f.product} (${formatPrice(f.price)}) — custom dimensions or Dhaka studio pickup?`)}`}
            target="_blank"
            rel="noreferrer"
            className="caps link-underline"
          >
            Ask the studio on WhatsApp
          </a>
          <AddToCart flower={f} className="justify-end" />
        </Reveal>

        <div className="flex items-center justify-between border-t border-current/15 pt-8">
          <Link to="/archive" className="caps link-underline">
            Archive
          </Link>
          <Link to="/flower/$slug" params={{ slug: next.slug }} className="caps link-underline">
            Next — {next.name}
          </Link>
        </div>
        <div className="h-20 md:hidden" aria-hidden="true" />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-current/15 bg-bone/90 text-ink backdrop-blur-md md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="caps truncate opacity-60">{f.product}</p>
            <p className="font-display text-lg font-light"><AnimatedNumber value={formatPrice(f.price)} /></p>
          </div>
          <QuickAdd flower={f} className="shrink-0" />
        </div>
      </div>
    </main>
  );
}

/** Hover/touch loupe: magnifies the photo 2.2x around the pointer. */
function Loupe(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [z, setZ] = useState<string | null>(null);
  return (
    <div
      className="relative cursor-zoom-in overflow-hidden"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setZ(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onPointerLeave={() => setZ(null)}
    >
      <img
        {...props}
        className={`${props.className ?? ""} transition-transform duration-300`}
        style={z ? { transform: "scale(2.2)", transformOrigin: z } : undefined}
      />
    </div>
  );
}
