import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { uploadSchematic } from "@/lib/media.functions";
import { defaultContact, useSetting, whatsappHref, type ContactSettings } from "@/lib/site";
import { AnimatedNumber } from "@/components/AnimatedNumber";

type Stats = { creators: number; inProduction: number };

const TERMS = [
  "Your design must be original and unique.",
  "Inspired by existing work is welcome — a full copy is not.",
  "It must be useful in day-to-day life.",
  "Honest materials: it should suit plywood, wood or natural finishes.",
  "If produced, you receive an agreed share of profit from every sale.",
  "We refine and prototype together before production.",
  "You are credited by name on the object's archive card.",
  "We review every submission and reply within 14 days.",
  "If we decline, your idea stays yours — we will not use it.",
  "Final production depends on feasibility, cost and safety.",
];

const MARQUEE = "OBJEKTHAUS CO-CREATION • SUBMIT YOUR SCHEMATIC • EARN ROYALTIES • HONEST MATERIALS • ";

async function toBase64(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192));
  return btoa(s);
}

const Req = () => <span className="text-red-500" aria-hidden="true"> *</span>;
const field = "mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current";

/** "Got an idea?" — community co-creation submissions, sent to WhatsApp. */
export function CoCreatePanel() {
  const contact = useSetting<ContactSettings>("contact", defaultContact).data ?? defaultContact;
  const stats = useSetting<Stats>("cocreate", { creators: 0, inProduction: 0 }).data;
  const upload = useServerFn(uploadSchematic);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) return setError("Please attach at least one schematic image.");
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 6)) {
        const { url } = await upload({ data: { name: file.name, contentType: file.type, data: await toBase64(file) } });
        urls.push(url);
      }
      const g = (k: string) => String(f.get(k) ?? "").trim();
      const text = [
        "*Got an idea? — New co-creation submission*",
        `Name: ${g("name")}`,
        `Contact: ${g("phone")}`,
        `Project: ${g("project")}`,
        `Category: ${g("category") || "—"}`,
        `Description: ${g("description") || "—"}`,
        `Why it's unique: ${g("unique") || "—"}`,
        `Why it works: ${g("works") || "—"}`,
        "Schematics:",
        ...urls.map((u, i) => `${i + 1}. ${u}`),
        "Terms accepted: yes",
      ].join("\n");
      window.open(`${whatsappHref(contact.whatsapp || defaultContact.whatsapp)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="collaborate" data-tone="dark" className="relative overflow-hidden bg-sand px-7 py-24 text-sand-foreground sm:px-10">
      <svg aria-hidden="true" viewBox="0 0 1200 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]">
        <path id="cc-datum" d="M-100,480 C250,120 500,560 800,260 S1150,80 1350,300" fill="none" stroke="currentColor" strokeWidth="1" />
        <text className="caps" fontSize="22" letterSpacing="4" fill="currentColor">
          <textPath href="#cc-datum">
            {MARQUEE.repeat(4)}
            <animate attributeName="startOffset" from="0%" to="-50%" dur="60s" repeatCount="indefinite" />
          </textPath>
        </text>
      </svg>

      <div className="relative mx-auto max-w-3xl">
        <p className="caps opacity-55">Co-creation</p>
        <h2 className="mt-4 font-display text-5xl font-light sm:text-6xl">Got an idea?</h2>
        {stats && stats.creators > 0 && (
          <p className="mt-3 font-mono text-xs uppercase tracking-widest opacity-50">
            <AnimatedNumber value={String(stats.creators).padStart(2, "0")} /> co-creators in dialogue •{" "}
            <AnimatedNumber value={String(stats.inProduction).padStart(2, "0")} /> objects in production
          </p>
        )}
        <p className="mt-6 max-w-xl opacity-75">
          Send us your design. We review it, contact you, make it together — and share a percentage of profit with you after every sale.
        </p>

        {done ? (
          <p className="mt-10 font-display text-2xl font-light">Thank you — finish sending the message in WhatsApp and we&apos;ll be in touch.</p>
        ) : (
          <form onSubmit={submit} className="mt-10 grid gap-6 sm:grid-cols-2">
            <label className="block"><span className="caps opacity-55">Your name<Req /></span><input required name="name" maxLength={100} className={field} /></label>
            <label className="block"><span className="caps opacity-55">Mobile / WhatsApp<Req /></span><input required name="phone" type="tel" maxLength={25} className={field} /></label>
            <label className="block"><span className="caps opacity-55">Project name<Req /></span><input required name="project" maxLength={120} className={field} /></label>
            <label className="block"><span className="caps opacity-55">Product category</span><input name="category" maxLength={80} placeholder="Lighting, desk, storage…" className={`${field} placeholder:opacity-40`} /></label>
            <label className="block sm:col-span-2"><span className="caps opacity-55">Description</span><textarea name="description" rows={3} maxLength={800} className={`${field} resize-none`} /></label>
            <label className="block"><span className="caps opacity-55">Why this is unique</span><textarea name="unique" rows={3} maxLength={500} className={`${field} resize-none`} /></label>
            <label className="block"><span className="caps opacity-55">Why this works</span><textarea name="works" rows={3} maxLength={500} className={`${field} resize-none`} /></label>
            <label className="block sm:col-span-2">
              <span className="caps opacity-55">Design schematics (images, up to 6)<Req /></span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="mt-3 block text-sm" />
              {files.length > 0 && <span className="mt-2 block text-sm opacity-60">{files.length} file(s) selected</span>}
            </label>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm">
                <input required type="checkbox" className="mt-1" />
                <span>I agree to the co-creation terms<Req /></span>
              </label>
              <button type="button" onClick={() => setShowTerms((s) => !s)} className="caps link-underline mt-3 opacity-70">
                {showTerms ? "Hide terms" : "Read the terms"}
              </button>
              {showTerms && (
                <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm opacity-75">
                  {TERMS.map((t) => <li key={t}>{t}</li>)}
                </ol>
              )}
            </div>
            {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
            <button type="submit" disabled={busy} className="caps link-underline justify-self-start disabled:opacity-40">
              {busy ? "Uploading…" : "Submit via WhatsApp"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/** Slim homepage invitation that leads to the full form on /collaborate. */
export function CoCreateTeaser() {
  const stats = useSetting<Stats>("cocreate", { creators: 0, inProduction: 0 }).data;
  return (
    <section data-tone="dark" className="relative overflow-hidden bg-sand px-7 py-20 text-sand-foreground sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="caps opacity-55">Co-creation</p>
          <h2 className="mt-4 font-display text-5xl font-light sm:text-6xl">Got an idea?</h2>
          <p className="mt-4 max-w-md opacity-75">Send us your design. We make it together and share profit from every sale.</p>
          {stats && stats.creators > 0 && (
            <p className="mt-3 font-mono text-xs uppercase tracking-widest opacity-50">
              <AnimatedNumber value={String(stats.creators).padStart(2, "0")} /> co-creators in dialogue
            </p>
          )}
        </div>
        <Link to="/collaborate" className="corner-action caps">Submit your design →</Link>
      </div>
    </section>
  );
}
