import { brandShareMeta } from "@/lib/brand-media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Reveal, RuleLine } from "@/components/Reveal";
import { SocialLinks } from "@/components/Social";
import { QuickAdd } from "@/components/AddToCart";
import { HeroVideo } from "@/components/HeroVideo";
import { CoCreateTeaser } from "@/components/CoCreatePanel";
import { ObserverShowcase } from "@/components/ObserverShowcase";
import { Wordmark } from "@/components/SiteNav";
import { ImageWithSkeleton } from "@/components/ImageWithSkeleton";
import { useAllFlowers } from "@/lib/products";
import { useHero, usePanel5, useManifesto, useFeatured } from "@/lib/site";
import heroVideo from "@/assets/hero-meadow.mp4.asset.json";
import haloHero from "@/assets/halo-2.jpg.asset.json";
import qalCard from "@/assets/qal-card.jpg.asset.json";
import archiveDark from "@/assets/archive-dark.jpg";
import heroPoster from "@/assets/halo-pendant-poster.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/" }],
    meta: [
      ...brandShareMeta,
      { title: "ObjektHaus — A Quiet Exhibition of Handcrafted Objects" },
      {
        name: "description",
        content:
          "Scroll through the ObjektHaus exhibition: Object No.07, its botanical archive card, the materials behind it and the flowers that name each plywood object.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/" },
      { property: "og:title", content: "ObjektHaus — A Quiet Exhibition of Handcrafted Objects" },
      {
        property: "og:description",
        content: "Scroll through the ObjektHaus exhibition: Object No.07, its botanical archive card, the materials behind it and the flowers that name each plywood object.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Arrow() {
  return (
    <svg className="arrow" width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
      <path d="M0 4h20M16.5 1L20 4l-3.5 3" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Index() {
  const hero = useHero();
  const panel5 = usePanel5();
  const manifesto = useManifesto();
  const allFlowers = useAllFlowers();
  const chosenSlug = useFeatured().slug || "queen-annes-lace";
  // If the chosen object was hidden or removed, fall back to the first live object.
  const featured = allFlowers.find((f) => f.slug === chosenSlug) ?? allFlowers[0];
  const featuredSlug = featured?.slug ?? chosenSlug;
  const quoteBlocks = (manifesto.body || "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const materials = (panel5.body || "Plywood\nBrass\nStone\nLinen\nPaper")
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <main className="bg-bone">
      <SiteNav />

      {/* I — Entrance */}
      <section id="hero" data-tone="light" className="panel justify-end bg-ink text-bone">
        <HeroVideo
          key={hero.videoUrl || heroVideo.url}
          src={hero.videoUrl || heroVideo.url}
          poster={heroPoster.url}
          label="The Halo Pendant glowing in warm light"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/45" />
        <h1 className="rise absolute inset-0 flex items-center justify-center px-10 text-bone">
          <span className="sr-only">ObjektHaus — A Quiet Exhibition of Objects</span>
          <Wordmark className="h-16 w-[min(78vw,22rem)] drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:h-20 sm:w-[26rem] lg:h-28 lg:w-[38rem] xl:w-[44rem]" />
        </h1>
        <div className="relative flex flex-col items-center gap-5 text-bone">
          <p className="caps drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
            {hero.caption || "Scroll to enter exhibition"}
          </p>
          <span className="drift h-14 w-px bg-current opacity-60" />
        </div>
      </section>

      {/* II — Manifesto */}
      <section id="manifesto" data-tone="light" className="panel bg-olive text-olive-foreground">
        <div className="space-y-9 font-display text-[2.1rem] leading-[1.15] font-light sm:text-5xl lg:text-6xl">
          {quoteBlocks.map((block, bi) => (
            <div key={bi} className="space-y-9">
              {bi > 0 && <RuleLine delay={(bi - 1) * 100} />}
              <Reveal as="p" delay={bi * 100}>
                {block.split("\n").map((line, li) => (
                  <span key={li} className="block">
                    {line}
                  </span>
                ))}
              </Reveal>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center gap-3">
          <p className="caps opacity-60">Scroll</p>
          <span className="drift h-10 w-px bg-current opacity-45" />
        </div>
      </section>

      {/* III — Featured object */}
      <section id="object" data-tone="dark" className="panel bg-clay text-clay-foreground">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="image-veil mx-auto w-full max-w-md lg:max-w-none">
          <ImageWithSkeleton
            src={featured?.images[0]?.src || haloHero.url}
            alt={featured ? `${featured.product} by ObjektHaus` : "ObjektHaus Object No.01, the Halo Pendant lamp glowing above a dark table"}
            loading="lazy"
            width={1020}
            height={1110}
            frameClassName="mx-auto aspect-[1020/1110] w-full lg:max-h-[68svh] lg:w-auto"
            className="h-full w-full object-cover"
          />
        </Reveal>
        <div className="lg:pr-6">
        <Reveal className="mt-10 lg:mt-0" delay={120}>
          <h2 className="font-display text-4xl font-light sm:text-5xl lg:text-6xl">
            {featured ? `${featured.no} — ${featured.product}` : "Object No.01 — Halo Pendant"}
          </h2>
          <p className="mt-3 text-sm tracking-wide opacity-70">
            {featured?.edition || "Edition 001 / 101"}
          </p>
        </Reveal>
        <RuleLine className="mt-8" />
        <div className="mt-14 flex justify-end">
          {featured && (
            <Reveal delay={200}>
              <QuickAdd flower={featured} />
            </Reveal>
          )}
        </div>
        </div>
        </div>
      </section>

      {/* IV — Botanical card */}
      <section id="card" data-tone="dark" className="panel bg-sand text-sand-foreground">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="image-veil mx-auto w-full max-w-xs lg:max-w-sm">
          <img
            src={featured?.card || qalCard.url}
            alt={`Botanical archive card of ${featured?.name ?? "Queen Anne's Lace"}`}
            loading="lazy"
            width={1024}
            height={1200}
            className="mx-auto w-full lg:max-h-[62svh] lg:w-auto lg:object-contain"
          />
        </Reveal>
        <div className="lg:pr-6">
        <Reveal as="h2" className="mt-8 font-display text-4xl font-light sm:text-5xl lg:mt-0 lg:text-6xl">
          {featured?.name ?? "Queen Anne's Lace"}
        </Reveal>
        <RuleLine className="mt-5" />
        <div className="mt-7 space-y-6 text-[0.95rem] leading-relaxed opacity-85">
          {(featured?.why || featured?.note) && (
            <Reveal as="p" delay={80}>
              {(featured.why || featured.note).split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </Reveal>
          )}
          {!featured && (
            <Reveal as="p" delay={80}>
              Queen Anne&apos;s Lace grows quietly.
              <br />
              Its beauty is discovered,
              <br />
              never announced.
            </Reveal>
          )}
          <Reveal as="p" delay={240}>
            Every ObjektHaus purchase
            <br />
            includes a botanical archive card.
          </Reveal>
        </div>
        <div className="mt-14 flex justify-end">
          <Reveal delay={300}>
            <Link
              to="/flower/$slug"
              params={{ slug: featuredSlug }}
              className="corner-action caps"
            >
              Explore floret <Arrow />
            </Link>
          </Reveal>
        </div>
        </div>
        </div>
      </section>


      {/* V — Materials */}
      <section id="materials" data-tone="dark" className="panel bg-bone text-bone-foreground">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
        {panel5.eyebrow && <p className="caps mb-4 opacity-55">{panel5.eyebrow}</p>}
        <Reveal as="h2" className="font-display text-[2.1rem] leading-[1.15] font-light sm:text-5xl lg:text-6xl">
          {panel5.title ? (
            panel5.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))
          ) : (
            <>
              Every object
              <br />
              begins as
              <br />
              a material,
              <br />
              not a product.
            </>
          )}
        </Reveal>
        <RuleLine className="mt-8" />
        <ul className="mt-10 space-y-4 text-lg font-light tracking-wide opacity-70 lg:mt-12">
          {materials.map((m, i) => (
            <Reveal as="li" key={m} delay={i * 80}>
              {m}
            </Reveal>
          ))}
        </ul>
        </div>
        <div>
        <Reveal className="image-veil mt-10 w-full rounded-xl lg:mt-0" delay={100}>
          <HeroVideo
            key={panel5.videoUrl || heroVideo.url}
            src={panel5.videoUrl || heroVideo.url}
            poster={heroPoster.url}
            label="The Halo Pendant and its illuminated plywood ribs"
            className="w-full rounded-xl object-cover lg:max-h-[58svh]"
          />
        </Reveal>
        {panel5.caption && <p className="caps mt-4 opacity-55">{panel5.caption}</p>}
        <div className="mt-12 flex justify-end">
          <Reveal>
            <Link to="/archive" className="corner-action caps">
              Explore <Arrow />
            </Link>
          </Reveal>
        </div>
        </div>
        </div>
      </section>

      {/* VI — Botanical archive */}
      <section
        id="archive"
        data-tone="light"
        className="panel justify-end bg-ink text-ink-foreground"
      >
        <img
          src={archiveDark}
          alt="Herbarium plate of pale botanical engravings on a dark ground"
          loading="lazy"
          width={1024}
          height={1408}
          className="ken absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative">
          <Reveal as="h2" className="font-display text-4xl font-light sm:text-5xl lg:text-6xl">
            Botanical
            <br />
            Archive
          </Reveal>
          <RuleLine className="mt-5" />
          <Reveal as="p" className="mt-5 text-[0.95rem] leading-relaxed opacity-80" delay={100}>
            Explore the flowers behind
            <br />
            each object and their stories.
          </Reveal>
          <Reveal className="mt-8" delay={180}>
            <Link to="/archive" className="corner-action text-lg font-light">
              Enter Archive <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* VII — Bring it home */}
      <CoCreateTeaser />
      <ObserverShowcase />

      <section id="order" data-snap-end data-tone="dark" className="relative z-20 flex h-[100svh] flex-col justify-center overflow-hidden bg-clay px-7 py-10 text-clay-foreground sm:px-10 lg:px-16">
        <h2 className="font-display text-[2.4rem] leading-[1.05] font-light sm:text-6xl">
          Bring it
          <br />
          home
        </h2>
        <div className="mt-8 flex flex-col items-start gap-5">
          <Link to="/order" className="corner-action font-display text-2xl font-light sm:text-3xl">
            Order <Arrow />
          </Link>
          <Link to="/contact" className="corner-action font-display text-2xl font-light sm:text-3xl">
            Contact <Arrow />
          </Link>
          <SocialLinks className="opacity-75" size={20} />
        </div>
        <div className="mt-10 flex justify-center">
          <RuleLine />
        </div>
        <p className="caps mt-6 text-center opacity-55">© ObjektHaus 2024</p>
        <p className="mt-4 flex justify-center gap-5 text-[0.65rem] tracking-widest uppercase opacity-45">
          <Link to="/privacy" className="hover:opacity-100">Privacy policy</Link>
          <Link to="/terms" className="hover:opacity-100">Terms</Link>
        </p>
      </section>
    </main>
  );
}
