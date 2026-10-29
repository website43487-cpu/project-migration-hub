import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MediaUpload } from "@/components/MediaUpload";
import { JournalEditor, CoCreateCounter, FaqEditor, ShowcaseEditor } from "@/components/StudioExtras";
import { adminSaveSetting } from "@/lib/data.functions";
import { migrateMediaToPersonal } from "@/lib/media.functions";
import {
  defaultCheckout,
  defaultContact,
  defaultDelivery,
  defaultHero,
  defaultManifesto,
  defaultPanel5,
  useSetting,
  type CheckoutSettings,
  type ContactSettings,
  type DeliverySettings,
  type HeroSettings,
  type ManifestoSettings,
  type Panel5Settings,
} from "@/lib/site";

export const Route = createFileRoute("/admin/site")({
  component: AdminSite,
});

function useEditor<T extends object>(key: string, fallback: T) {
  const { data } = useSetting<T>(key, fallback);
  const current = (data ?? fallback) as T;
  const [draft, setDraft] = useState<T>(current);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const saveSetting = useServerFn(adminSaveSetting);

  useEffect(() => setDraft(current), [current]);

  const save = async () => {
    await saveSetting({ data: { key, value: draft } });
    await qc.invalidateQueries({ queryKey: ["site_settings", key] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return { draft, set: (p: Partial<T>) => setDraft({ ...draft, ...p }), save, saved };
}

function Text({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="caps opacity-55">{label}</span>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full resize-none border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
        />
      )}
    </label>
  );
}

function SaveRow({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="mt-6 flex items-center gap-5">
      <button type="button" onClick={onSave} className="caps link-underline">
        Save
      </button>
      {saved && <span className="caps opacity-55">Saved</span>}
    </div>
  );
}

type MigrationResult = {
  found: number;
  copied: number;
  productsUpdated: number;
  settingsUpdated: number;
  failed: string[];
};

function MediaMigration() {
  const run = useServerFn(migrateMediaToPersonal);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = (await run({})) as MigrationResult;
      setResult(res);
      await qc.invalidateQueries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy the media.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-current/20 p-6">
      <h2 className="font-display text-3xl font-light">Media library</h2>
      <p className="mt-2 text-sm opacity-60">
        Copies every photo and video currently used by your objects and pages into your own storage,
        then points the site at the new copies. Safe to run more than once — files already stored
        with you are skipped.
      </p>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="caps mt-6 border border-current/40 px-5 py-2 text-xs disabled:opacity-50"
      >
        {busy ? "Copying…" : "Copy all media to my storage"}
      </button>
      {result && (
        <div className="mt-4 space-y-1 text-sm">
          <p>
            {result.copied} of {result.found} files copied · {result.productsUpdated} objects and{" "}
            {result.settingsUpdated} page sections updated.
          </p>
          {result.failed.length > 0 && (
            <ul className="list-disc pl-5 opacity-70">
              {result.failed.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-sm opacity-70">{error}</p>}
    </section>
  );
}

function AdminSite() {
  const hero = useEditor<HeroSettings>("hero", defaultHero);
  const manifesto = useEditor<ManifestoSettings>("manifesto", defaultManifesto);
  const panel5 = useEditor<Panel5Settings>("panel5", defaultPanel5);
  const delivery = useEditor<DeliverySettings>("delivery", defaultDelivery);
  const contact = useEditor<ContactSettings>("contact", defaultContact);
  const checkout = useEditor<CheckoutSettings>("checkout", defaultCheckout);

  return (
    <div className="space-y-16">
      <JournalEditor />
      <CoCreateCounter />
      <FaqEditor />
      <ShowcaseEditor />
      <MediaMigration />
      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Hero video</h2>
        <p className="mt-2 text-sm opacity-60">
          Replaces the entrance video. Leave empty to keep the original meadow film.
        </p>
        <div className="mt-6 space-y-6">
          <MediaUpload
            label="Hero video"
            accept="video/*"
            value={hero.draft.videoUrl}
            onChange={(v) => hero.set({ videoUrl: v })}
          />
          <Text label="Eyebrow (optional)" value={hero.draft.eyebrow} onChange={(v) => hero.set({ eyebrow: v })} />
          <Text label="Scroll caption" value={hero.draft.caption} onChange={(v) => hero.set({ caption: v })} />
        </div>
        <SaveRow onSave={hero.save} saved={hero.saved} />
      </section>

      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Second panel — Quote</h2>
        <p className="mt-2 text-sm opacity-60">
          One line per row. Leave an empty row between stanzas to draw a dividing line.
        </p>
        <div className="mt-6">
          <textarea
            rows={12}
            value={manifesto.draft.body}
            onChange={(e) => manifesto.set({ body: e.target.value })}
            className="w-full resize-none border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
          />
        </div>
        <SaveRow onSave={manifesto.save} saved={manifesto.saved} />
      </section>

      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Delivery charges</h2>
        <p className="mt-2 text-sm opacity-60">
          Delivery is calculated from the total weight of the basket, rounded up to the next kilo.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <label className="block">
            <span className="caps opacity-55">Charge per kg (৳)</span>
            <input
              type="number"
              value={delivery.draft.perKg}
              onChange={(e) => delivery.set({ perKg: Number(e.target.value) })}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
            />
          </label>
          <label className="block">
            <span className="caps opacity-55">Base handling (৳)</span>
            <input
              type="number"
              value={delivery.draft.base}
              onChange={(e) => delivery.set({ base: Number(e.target.value) })}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
            />
          </label>
          <label className="block">
            <span className="caps opacity-55">Free delivery above (৳, 0 = off)</span>
            <input
              type="number"
              value={delivery.draft.freeAbove}
              onChange={(e) => delivery.set({ freeAbove: Number(e.target.value) })}
              className="mt-2 w-full border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
            />
          </label>
        </div>
        <SaveRow onSave={delivery.save} saved={delivery.saved} />
      </section>

      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Checkout — special note box</h2>
        <p className="mt-2 text-sm opacity-60">
          The note customers can leave with their order. It appears with the order in the orders panel.
        </p>
        <div className="mt-6 space-y-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checkout.draft.noteEnabled}
              onChange={(e) => checkout.set({ noteEnabled: e.target.checked })}
            />
            <span className="caps opacity-70">Show the note box at checkout</span>
          </label>
          <Text
            label="Label"
            value={checkout.draft.noteLabel}
            onChange={(v) => checkout.set({ noteLabel: v })}
          />
          <Text
            label="Helper text"
            textarea
            value={checkout.draft.noteHint}
            onChange={(v) => checkout.set({ noteHint: v })}
          />
          <Text
            label="Placeholder"
            value={checkout.draft.notePlaceholder}
            onChange={(v) => checkout.set({ notePlaceholder: v })}
          />
        </div>
        <SaveRow onSave={checkout.save} saved={checkout.saved} />
      </section>

      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Fifth panel — Materials</h2>
        <div className="mt-6 space-y-6">
          <Text label="Eyebrow" value={panel5.draft.eyebrow} onChange={(v) => panel5.set({ eyebrow: v })} />
          <Text label="Headline" textarea value={panel5.draft.title} onChange={(v) => panel5.set({ title: v })} />
          <Text
            label="Materials list (one per line)"
            textarea
            value={panel5.draft.body}
            onChange={(v) => panel5.set({ body: v })}
          />
          <MediaUpload
            label="Panel video"
            accept="video/*"
            value={panel5.draft.videoUrl}
            onChange={(v) => panel5.set({ videoUrl: v })}
          />
          <Text label="Caption" value={panel5.draft.caption} onChange={(v) => panel5.set({ caption: v })} />
        </div>
        <SaveRow onSave={panel5.save} saved={panel5.saved} />
      </section>

      <section className="border border-current/20 p-6">
        <h2 className="font-display text-3xl font-light">Contact details</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Text label="Facebook link" value={contact.draft.facebook} onChange={(v) => contact.set({ facebook: v })} />
          <Text label="Instagram link" value={contact.draft.instagram} onChange={(v) => contact.set({ instagram: v })} />
          <Text label="WhatsApp number" value={contact.draft.whatsapp} onChange={(v) => contact.set({ whatsapp: v })} />
          <Text label="Email" value={contact.draft.email} onChange={(v) => contact.set({ email: v })} />
          <Text label="Opening hours" value={contact.draft.hours} onChange={(v) => contact.set({ hours: v })} />
        </div>
        <div className="mt-6">
          <Text label="Address" textarea value={contact.draft.address} onChange={(v) => contact.set({ address: v })} />
        </div>
        <SaveRow onSave={contact.save} saved={contact.saved} />
      </section>
    </div>
  );
}
