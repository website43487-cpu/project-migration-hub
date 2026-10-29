import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { useJournal, type JournalPost } from "@/lib/journal";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/journal" }],
    meta: [
      { title: "The Journal — ObjektHaus Studio Notes" },
      { name: "description", content: "Studio notes from ObjektHaus in Dhaka: our cause, object improvements, materials and the making of handcrafted plywood objects." },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/journal" },
      { property: "og:title", content: "The Journal — ObjektHaus Studio Notes" },
      { property: "og:description", content: "Our cause, improvements and notes from the ObjektHaus studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});

const readMinutes = (post: JournalPost) => Math.max(1, Math.round((post.body || "").split(/\\s+/).length / 200));
const volume = (i: number) => `No. ${String(i + 1).padStart(2, "0")}`;

function PostLink({ post, className, children }: { post: JournalPost; className?: string; children: React.ReactNode }) {
  return <Link to="/journal/$slug" params={{ slug: post.slug }} className={className}>{children}</Link>;
}

function Journal() {
  const posts = useJournal();
  const [category, setCategory] = useState("All");
  const [reelCategory, setReelCategory] = useState("All");
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const categories = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
  const filtered = posts.filter((post) => category === "All" || post.category === category);
  const reelPosts = posts.filter((post) => reelCategory === "All" || post.category === reelCategory);

  return (
    <main data-tone="dark" className="min-h-screen overflow-x-clip bg-bone text-ink">
      <SiteNav />

      <header className="mx-auto max-w-7xl px-6 pb-8 pt-32 sm:px-10 lg:px-16 lg:pt-40">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/20 pb-6">
          <div>
            <p className="caps opacity-55">ObjektHaus · Dhaka</p>
            <h1 className="mt-3 font-display text-6xl font-light leading-none sm:text-7xl lg:text-8xl">The Journal</h1>
          </div>
          <p className="max-w-xs pb-1 text-sm font-light leading-relaxed opacity-65">Notes on the objects we make, the materials we choose, and the small details worth noticing.</p>
        </div>
        {categories.length > 0 && (
          <nav aria-label="Filter journal by category" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {["All", ...categories].map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item}
                className={`border-b pb-1 text-xs uppercase tracking-[0.16em] transition-colors ${category === item ? "border-olive text-ink" : "border-transparent text-ink/50 hover:border-ink/35 hover:text-ink"}`}>
                {item}
              </button>
            ))}
          </nav>
        )}
      </header>

      {!featured ? (
        <section className="mx-auto max-w-7xl px-6 py-28 sm:px-10 lg:px-16">
          <p className="font-display text-3xl font-light">The first notes from the studio are on their way.</p>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-16 lg:pb-28">
            <div className="order-2 lg:order-1">
              <p className="caps text-olive">Featured note <span className="mx-2 opacity-40">/</span> {featured.category || "Studio notes"}</p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-light leading-[1.08] sm:text-5xl lg:text-6xl">{featured.title}</h2>
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed opacity-70">{featured.excerpt}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <PostLink post={featured} className="corner-action caps">Read the note <span aria-hidden="true" className="arrow">↗</span></PostLink>
                <span className="text-xs tracking-wide opacity-50">{featured.date} · {readMinutes(featured)} min read</span>
              </div>
            </div>
            <PostLink post={featured} className="group order-1 block lg:order-2">
              <div className="relative aspect-[5/4] overflow-hidden bg-sand">
                {featured.cover ? (
                  <img src={featured.cover} alt={featured.title} fetchPriority="high" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                ) : (
                  <div className="flex h-full items-end p-8"><span className="font-display text-4xl font-light opacity-35">ObjektHaus / Studio archive</span></div>
                )}
                <span className="absolute bottom-4 left-4 bg-bone/90 px-3 py-2 text-[10px] uppercase tracking-[0.18em]">Latest from the studio</span>
              </div>
            </PostLink>
          </section>

          <section className="bg-sand/60 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/20 pb-5">
                <div>
                  <p className="caps opacity-50">The archive</p>
                  <h2 className="mt-2 font-display text-4xl font-light sm:text-5xl">Keep reading</h2>
                </div>
                <p className="text-xs tracking-wide opacity-55">{filtered.length} {filtered.length === 1 ? "note" : "notes"} · approx. {Math.round(filtered.reduce((sum, post) => sum + readMinutes(post), 0) / Math.max(1, filtered.length))} min average read</p>
              </div>
              {filtered.length === 0 ? (
                <p className="py-16 font-display text-2xl font-light">No notes in this category yet.</p>
              ) : (
                <div className="mt-2 grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((post, index) => (
                    <PostLink key={post.slug} post={post} className="group border-b border-ink/15 py-7">
                      <div className="overflow-hidden bg-sand">
                        {post.cover ? <img src={post.cover} alt={post.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.025]" /> : <div className="aspect-[4/3] bg-olive/10" />}
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] opacity-55">
                        <span>{volume(posts.indexOf(post))} · {post.category}</span><span>{readMinutes(post)} min</span>
                      </div>
                      <h3 className="mt-2 font-display text-2xl font-light leading-tight group-hover:text-olive sm:text-3xl">{post.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm font-light leading-relaxed opacity-65">{post.excerpt}</p>
                      <span className="mt-5 inline-block text-xs uppercase tracking-[0.15em] opacity-70">Read note <span aria-hidden="true">↗</span></span>
                    </PostLink>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="caps opacity-50">From the collection</p>
                <h2 className="mt-3 font-display text-4xl font-light sm:text-5xl">Six flavors</h2>
                <p className="mt-4 max-w-xs text-sm font-light leading-relaxed opacity-60">Different threads from the studio, gathered in one place.</p>
              </div>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {posts.slice(0, 6).map((post, index) => (
                  <PostLink key={post.slug} post={post} className="group flex gap-4 border-b border-ink/15 py-5">
                    <span className="pt-1 font-display text-xl font-light text-olive/70">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.16em] opacity-50">{post.category}</span>
                      <span className="mt-1 block font-display text-xl font-light leading-tight group-hover:text-olive">{post.title}</span>
                    </span>
                    <span className="ml-auto pt-1 text-sm opacity-40 transition-transform group-hover:translate-x-1">↗</span>
                  </PostLink>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-olive py-16 text-bone sm:py-20">
            <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="caps opacity-60">The collection</p>
                  <h2 className="mt-3 font-display text-4xl font-light sm:text-5xl">On the shelf</h2>
                </div>
                <p className="text-xs tracking-wide opacity-65">{posts.length} volumes in the archive</p>
              </div>
              <div className="mt-8 flex gap-3 overflow-x-auto pb-3">
                {posts.slice(0, 12).map((post, index) => (
                  <PostLink key={post.slug} post={post} className="group flex min-h-64 w-36 shrink-0 flex-col justify-between border border-bone/25 bg-ink/10 p-4 transition-colors hover:bg-bone/10 sm:w-44">
                    <span className="text-[10px] uppercase tracking-[0.16em] opacity-60">{volume(index)}</span>
                    {post.cover && <img src={post.cover} alt="" loading="lazy" className="my-4 aspect-[3/4] w-full object-cover opacity-80 transition group-hover:opacity-100" />}
                    <span className="font-display text-xl font-light leading-tight">{post.title}</span>
                  </PostLink>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/20 pb-5">
              <div>
                <p className="caps opacity-50">Recently added</p>
                <h2 className="mt-3 font-display text-4xl font-light sm:text-5xl">New volumes</h2>
              </div>
              <nav aria-label="Filter new journal volumes" className="flex flex-wrap gap-x-4 gap-y-2">
                {["All", ...categories].map((item) => (
                  <button key={item} type="button" onClick={() => setReelCategory(item)} aria-pressed={reelCategory === item}
                    className={`border-b pb-1 text-[10px] uppercase tracking-[0.15em] transition-colors ${reelCategory === item ? "border-olive text-ink" : "border-transparent opacity-55 hover:opacity-100"}`}>
                    {item}
                  </button>
                ))}
              </nav>
            </div>
            <div className="mt-2 grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
              {reelPosts.map((post) => (
                <PostLink key={post.slug} post={post} className="group flex gap-4 border-b border-ink/15 py-5 sm:pr-5">
                  <span className="font-display text-2xl font-light text-olive/70">{String(posts.indexOf(post) + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.15em] opacity-50">{post.date} · {post.category}</span>
                    <span className="mt-1 block font-display text-xl font-light leading-tight group-hover:text-olive">{post.title}</span>
                    <span className="mt-2 block text-[10px] uppercase tracking-[0.15em] opacity-55">{readMinutes(post)} min read ↗</span>
                  </span>
                </PostLink>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="bg-ink py-12 text-bone">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          <div><p className="font-display text-3xl font-light">ObjektHaus</p><p className="mt-2 text-xs opacity-55">Handcrafted objects · Dhaka</p></div>
          <div className="text-xs leading-7"><p className="caps mb-2 opacity-45">Directory</p><Link to="/archive" className="block hover:opacity-65">Botanical Archive</Link><Link to="/collaborate" className="block hover:opacity-65">Got an idea?</Link><Link to="/contact" className="block hover:opacity-65">Contact</Link></div>
          <div className="text-xs leading-7"><p className="caps mb-2 opacity-45">Categories</p>{categories.map((item) => <p key={item}>{item}</p>)}</div>
          <div className="text-xs leading-7"><p className="caps mb-2 opacity-45">Colophon</p><p className="opacity-65">Studio notes in ink, olive, bone and clay.</p><p className="mt-2 opacity-45">{posts.length} notes in the archive</p></div>
        </div>
      </footer>
    </main>
  );
}
