import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminSaveSetting } from "@/lib/data.functions";
import { useSetting } from "@/lib/site";
import { MediaUpload } from "@/components/MediaUpload";
import { slugify, useJournal, type JournalPost } from "@/lib/journal";
import { defaultFaq, defaultShowcase, type FaqItem, type ShowcaseSettings, type ShowcaseSlide } from "@/lib/motion";

const input = "mt-2 w-full border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current";
const blank = (): JournalPost => ({
  slug: "", title: "", category: "Studio Notes", date: new Date().toISOString().slice(0, 10),
  excerpt: "", cover: "", body: "", featured: false, published: false,
});

function useSave(key: string) {
  const save = useServerFn(adminSaveSetting);
  const qc = useQueryClient();
  return async (value: unknown) => {
    await save({ data: { key, value } });
    await qc.invalidateQueries({ queryKey: ["site_settings", key] });
  };
}

/** Studio editor for journal posts (stored in site settings). */
export function JournalEditor() {
  const posts = useJournal(true);
  const save = useSave("journal");
  const [d, setD] = useState<JournalPost | null>(null);
  const [orig, setOrig] = useState<string | null>(null);

  const commit = async () => {
    if (!d || !d.title.trim()) return;
    const post = { ...d, slug: d.slug || slugify(d.title) };
    let list = posts.filter((p) => p.slug !== orig && p.slug !== post.slug);
    if (post.featured) list = list.map((p) => ({ ...p, featured: false }));
    await save([...list, post]);
    setD(null);
  };

  return (
    <section className="border border-current/20 p-6">
      <h2 className="font-display text-3xl font-light">Journal</h2>
      <ul className="mt-4 divide-y divide-current/15 text-sm">
        {posts.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>{p.title} <span className="opacity-50">· {p.published ? "Published" : "Draft"}{p.featured ? " · Featured" : ""}</span></span>
            <span className="flex gap-4">
              <button type="button" className="caps link-underline" onClick={() => { setD(p); setOrig(p.slug); }}>Edit</button>
              <button type="button" className="caps opacity-50" onClick={() => confirm("Delete this post?") && save(posts.filter((x) => x.slug !== p.slug))}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {!d ? (
        <button type="button" className="caps link-underline mt-4" onClick={() => { setD(blank()); setOrig(null); }}>New post</button>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="caps opacity-55">Title</span><input className={input} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></label>
          <label className="block"><span className="caps opacity-55">Link name (auto if blank)</span><input className={input} value={d.slug} onChange={(e) => setD({ ...d, slug: slugify(e.target.value) })} /></label>
          <label className="block"><span className="caps opacity-55">Category</span><input className={input} list="jcats" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} />
            <datalist id="jcats"><option value="The Cause" /><option value="Improvements" /><option value="Studio Notes" /></datalist></label>
          <label className="block"><span className="caps opacity-55">Date</span><input type="date" className={input} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></label>
          <label className="block sm:col-span-2"><span className="caps opacity-55">Short summary</span><textarea rows={2} className={`${input} resize-none`} value={d.excerpt} onChange={(e) => setD({ ...d, excerpt: e.target.value })} /></label>
          <div className="sm:col-span-2"><MediaUpload label="Cover image" accept="image/*" value={d.cover} onChange={(cover) => setD({ ...d, cover })} /></div>
          <label className="block sm:col-span-2"><span className="caps opacity-55">Body — blank line between paragraphs, "## " for a heading, "&gt; " for a quote</span>
            <textarea rows={12} className={input} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} /> Featured on the Journal page</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.published} onChange={(e) => setD({ ...d, published: e.target.checked })} /> Published</label>
          <div className="flex gap-5 sm:col-span-2">
            <button type="button" className="caps link-underline" onClick={commit}>Save post</button>
            <button type="button" className="caps opacity-50" onClick={() => setD(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Numbers shown subtly on the "Got an idea?" panel. */
export function CoCreateCounter() {
  const fallback = { creators: 0, inProduction: 0 };
  const cur = useSetting("cocreate", fallback).data ?? fallback;
  const [d, setD] = useState(cur);
  const [ok, setOk] = useState(false);
  const save = useSave("cocreate");
  useEffect(() => setD(cur), [cur]);
  return (
    <section className="border border-current/20 p-6">
      <h2 className="font-display text-3xl font-light">Co-creation counter</h2>
      <p className="mt-2 text-sm opacity-60">Shown on the "Got an idea?" panel. Set co-creators to 0 to hide it.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="block"><span className="caps opacity-55">Co-creators in dialogue</span><input type="number" min={0} className={input} value={d.creators} onChange={(e) => setD({ ...d, creators: Number(e.target.value) })} /></label>
        <label className="block"><span className="caps opacity-55">Objects in production</span><input type="number" min={0} className={input} value={d.inProduction} onChange={(e) => setD({ ...d, inProduction: Number(e.target.value) })} /></label>
      </div>
      <div className="mt-6 flex gap-5">
        <button type="button" className="caps link-underline" onClick={async () => { await save(d); setOk(true); setTimeout(() => setOk(false), 2500); }}>Save</button>
        {ok && <span className="caps opacity-55">Saved</span>}
      </div>
    </section>
  );
}

function move<T>(l: T[], i: number, d: number) { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; }

/** Studio editor for the FAQ shown in the menu. */
export function FaqEditor() {
  const cur = useSetting<FaqItem[]>("faq", defaultFaq).data;
  const [l, setL] = useState<FaqItem[]>(defaultFaq);
  const [ok, setOk] = useState(false);
  const save = useSave("faq");
  useEffect(() => { if (Array.isArray(cur) && cur.length) setL(cur); }, [cur]);
  const up = (i: number, p: Partial<FaqItem>) => setL(l.map((x, k) => (k === i ? { ...x, ...p } : x)));
  return (
    <section className="border border-current/20 p-6">
      <h2 className="font-display text-3xl font-light">Frequently asked</h2>
      {l.map((f, i) => (
        <div key={i} className="mt-6 border-t border-current/15 pt-4">
          <input className={input} placeholder="Question" value={f.q} onChange={(e) => up(i, { q: e.target.value })} />
          <textarea rows={2} className={`${input} resize-none`} placeholder="Answer" value={f.a} onChange={(e) => up(i, { a: e.target.value })} />
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.published !== false} onChange={(e) => up(i, { published: e.target.checked })} /> Shown</label>
            <button type="button" className="caps" onClick={() => setL(move(l, i, -1))}>↑</button>
            <button type="button" className="caps" onClick={() => setL(move(l, i, 1))}>↓</button>
            <button type="button" className="caps opacity-50" onClick={() => setL(l.filter((_, k) => k !== i))}>Delete</button>
          </div>
        </div>
      ))}
      <div className="mt-6 flex gap-5">
        <button type="button" className="caps link-underline" onClick={() => setL([...l, { q: "", a: "", published: true }])}>Add question</button>
        <button type="button" className="caps link-underline" onClick={async () => { await save(l); setOk(true); setTimeout(() => setOk(false), 2500); }}>Save</button>
        {ok && <span className="caps opacity-55">Saved</span>}
      </div>
    </section>
  );
}

/** Studio editor for the full-screen photo plates after "Got an idea?". */
export function ShowcaseEditor() {
  const cur = useSetting<ShowcaseSettings>("showcase", defaultShowcase).data ?? defaultShowcase;
  const [d, setD] = useState<ShowcaseSettings>(cur);
  const [ok, setOk] = useState(false);
  const save = useSave("showcase");
  useEffect(() => setD(cur), [cur]);
  const slides = d.slides ?? [];
  const up = (i: number, p: Partial<ShowcaseSlide>) => setD({ ...d, slides: slides.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  return (
    <section className="border border-current/20 p-6">
      <h2 className="font-display text-3xl font-light">Photo plates</h2>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} /> Show plates on the homepage</label>
      {slides.map((s, i) => (
        <div key={i} className="mt-6 grid gap-3 border-t border-current/15 pt-4 sm:grid-cols-2">
          <input className={input} placeholder="Heading" value={s.heading} onChange={(e) => up(i, { heading: e.target.value })} />
          <input className={input} placeholder="Caption" value={s.caption} onChange={(e) => up(i, { caption: e.target.value })} />
          <input className={input} placeholder="Link (e.g. /archive)" value={s.link} onChange={(e) => up(i, { link: e.target.value })} />
          <div><MediaUpload label="Photo" accept="image/*" value={s.image} onChange={(image) => up(i, { image })} /></div>
          <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={s.published !== false} onChange={(e) => up(i, { published: e.target.checked })} /> Shown</label>
            <button type="button" className="caps" onClick={() => setD({ ...d, slides: move(slides, i, -1) })}>↑</button>
            <button type="button" className="caps" onClick={() => setD({ ...d, slides: move(slides, i, 1) })}>↓</button>
            <button type="button" className="caps opacity-50" onClick={() => setD({ ...d, slides: slides.filter((_, k) => k !== i) })}>Delete</button>
          </div>
        </div>
      ))}
      <div className="mt-6 flex gap-5">
        <button type="button" className="caps link-underline" onClick={() => setD({ ...d, slides: [...slides, { heading: "", caption: "", image: "", link: "", published: true }] })}>Add plate</button>
        <button type="button" className="caps link-underline" onClick={async () => { await save(d); setOk(true); setTimeout(() => setOk(false), 2500); }}>Save</button>
        {ok && <span className="caps opacity-55">Saved</span>}
      </div>
    </section>
  );
}
