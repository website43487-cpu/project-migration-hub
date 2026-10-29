import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { useJournal } from "@/lib/journal";

export const Route = createFileRoute("/journal/$slug")({
  head: ({ params }) => ({
    links: [{ rel: "canonical", href: `https://objekthausstudio.lovable.app/journal/${params.slug}` }],
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — ObjektHaus Journal` },
      { name: "description", content: "A studio note from the ObjektHaus Journal — handcrafted plywood objects made in Dhaka." },
      { property: "og:url", content: `https://objekthausstudio.lovable.app/journal/${params.slug}` },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — ObjektHaus Journal` },
      { property: "og:description", content: "A studio note from the ObjektHaus Journal." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const posts = useJournal();
  const index = posts.findIndex((item) => item.slug === slug);
  const post = posts[index];
  const previous = index > 0 ? posts[index - 1] : undefined;
  const next = posts[index + 1];

  return (
    <main data-tone="dark" className="min-h-screen bg-bone text-ink">
      <SiteNav />
      <article className="mx-auto max-w-4xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
        {!post ? (
          <div className="border-t border-ink/20 pt-8">
            <p className="font-display text-3xl font-light">This note could not be found.</p>
            <Link to="/journal" className="corner-action caps mt-6">Back to the Journal <span aria-hidden="true">↗</span></Link>
          </div>
        ) : (
          <>
            <Link to="/journal" className="caps inline-flex items-center gap-3 opacity-55 transition hover:opacity-100"><span aria-hidden="true">←</span> The Journal</Link>
            <header className="mt-12 border-b border-ink/20 pb-8 sm:mt-16">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.18em] text-olive">
                <span>{post.category || "Studio notes"}</span><span className="opacity-45">/</span><time>{post.date}</time>
              </div>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-light leading-[1.04] sm:text-6xl lg:text-7xl">{post.title}</h1>
              {post.excerpt && <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed opacity-65">{post.excerpt}</p>}
            </header>
            {post.cover && (
              <figure className="mt-8 sm:mt-10">
                <img src={post.cover} alt={post.title} fetchPriority="high" className="max-h-[70vh] w-full bg-sand object-cover" />
                <figcaption className="mt-3 text-[10px] uppercase tracking-[0.16em] opacity-45">ObjektHaus · Studio journal</figcaption>
              </figure>
            )}
            <div className="mx-auto mt-12 max-w-2xl space-y-6 text-base font-light leading-[1.9] sm:mt-16 sm:text-lg">
              {post.body.split(/\n{2,}/).map((paragraph, paragraphIndex) =>
                paragraph.startsWith("## ") ? (
                  <h2 key={paragraphIndex} className="pt-8 font-display text-3xl font-light leading-tight sm:text-4xl">{paragraph.slice(3)}</h2>
                ) : paragraph.startsWith("> ") ? (
                  <blockquote key={paragraphIndex} className="my-10 border-l border-olive pl-6 font-display text-2xl italic leading-snug text-olive sm:pl-8 sm:text-3xl">{paragraph.slice(2)}</blockquote>
                ) : (
                  <p key={paragraphIndex} className="whitespace-pre-line opacity-80">{paragraph}</p>
                ),
              )}
            </div>
            <nav aria-label="More journal notes" className="mt-16 grid gap-6 border-t border-ink/20 pt-6 sm:grid-cols-2 sm:gap-10">
              <div>
                <p className="caps opacity-45">Back to the collection</p>
                <Link to="/journal" className="mt-3 inline-block font-display text-2xl font-light hover:text-olive">All journal notes ↗</Link>
              </div>
              <div className="sm:text-right">
                {next ? (
                  <>
                    <p className="caps opacity-45">Continue reading</p>
                    <Link to="/journal/$slug" params={{ slug: next.slug }} className="mt-3 inline-block font-display text-2xl font-light hover:text-olive">{next.title} <span aria-hidden="true">↗</span></Link>
                  </>
                ) : previous ? (
                  <>
                    <p className="caps opacity-45">Previous note</p>
                    <Link to="/journal/$slug" params={{ slug: previous.slug }} className="mt-3 inline-block font-display text-2xl font-light hover:text-olive">{previous.title} <span aria-hidden="true">↗</span></Link>
                  </>
                ) : null}
              </div>
            </nav>
          </>
        )}
      </article>
    </main>
  );
}
