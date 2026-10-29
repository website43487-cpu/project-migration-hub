// Studio media uploads. The browser cannot write to the media store directly
// (studio staff are not signed in to the storage backend), so the file is sent
// through a staff-guarded server function that uploads with elevated rights and
// returns a long-lived link.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 45 * 1024 * 1024;
const BUCKET = "media";

const payload = z.object({
  name: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  data: z.string().min(16), // base64, no data: prefix
});

export const uploadMedia = createServerFn({ method: "POST" })
  .inputValidator((d) => payload.parse(d))
  .handler(async ({ data }) => {
    const { requireStaff } = await import("./staff-auth.server");
    await requireStaff();

    const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) {
      throw new Error("That file is larger than 45 MB — please use a smaller one.");
    }

    // Files live in the owner's own Supabase project, next to the tables.
    const { getPersonalAdmin } = await import("./personal-supabase.server");
    const db = getPersonalAdmin();

    const buckets = await db.storage.listBuckets();
    if (!buckets.error && !buckets.data?.some((b: { name: string }) => b.name === BUCKET)) {
      await db.storage.createBucket(BUCKET, { public: true });
    }

    const path = `${Date.now()}-${data.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
      contentType: data.contentType || "application/octet-stream",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const pub = db.storage.from(BUCKET).getPublicUrl(path);
    if (pub.data?.publicUrl) return { url: pub.data.publicUrl };

    const signed = await db.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
    if (signed.error || !signed.data) {
      throw new Error(signed.error?.message ?? "Could not create a link for that file.");
    }
    return { url: signed.data.signedUrl };
  });

// ---------- Copy existing media into the personal bucket ----------

const MEDIA_RE = /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|mov)(\?|$)/i;

function looksLikeMedia(v: unknown): v is string {
  if (typeof v !== "string" || v.length < 5) return false;
  if (!/^https?:\/\//i.test(v) && !v.startsWith("/")) return false;
  return MEDIA_RE.test(v);
}

/** Walk a JSON value, replacing media URLs through the supplied map. */
function rewrite(value: any, map: Map<string, string>): any {
  if (typeof value === "string") return map.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => rewrite(v, map));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = rewrite(v, map);
    return out;
  }
  return value;
}

function collect(value: any, into: Set<string>) {
  if (looksLikeMedia(value)) into.add(value);
  else if (Array.isArray(value)) value.forEach((v) => collect(v, into));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collect(v, into));
}

export const migrateMediaToPersonal = createServerFn({ method: "POST" }).handler(async () => {
  const { requireStaff } = await import("./staff-auth.server");
  await requireStaff();

  const { getRequest } = await import("@tanstack/react-start/server");
  const origin = new URL(getRequest().url).origin;

  const { getPersonalAdmin } = await import("./personal-supabase.server");
  const db = getPersonalAdmin();

  const buckets = await db.storage.listBuckets();
  if (!buckets.error && !buckets.data?.some((b: { name: string }) => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, { public: true });
  }
  const bucketMarker = `/storage/v1/object/public/${BUCKET}/`;

  const products = (await db.from("products").select("id, slug, card_url, images")).data ?? [];
  const settings = (await db.from("site_settings").select("key, value")).data ?? [];

  const urls = new Set<string>();
  for (const p of products as any[]) {
    collect(p.card_url, urls);
    collect(p.images, urls);
  }
  for (const s of settings as any[]) collect(s.value, urls);

  const map = new Map<string, string>();
  const failed: string[] = [];
  let copied = 0;

  for (const url of urls) {
    if (url.includes(bucketMarker)) continue; // already in the personal bucket
    try {
      const absolute = url.startsWith("/") ? `${origin}${url}` : url;
      const res = await fetch(absolute);
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_BYTES) throw new Error("file larger than 45 MB");

      const rawName = decodeURIComponent(absolute.split("?")[0]!.split("/").pop() || "file");
      const name = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`;

      const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
        contentType: res.headers.get("content-type") || "application/octet-stream",
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw new Error(error.message);

      const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl;
      if (!publicUrl) throw new Error("could not build a public link");
      map.set(url, publicUrl);
      copied += 1;
    } catch (err) {
      failed.push(`${url} — ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  let productsUpdated = 0;
  for (const p of products as any[]) {
    const card_url = rewrite(p.card_url, map);
    const images = rewrite(p.images, map);
    if (card_url === p.card_url && JSON.stringify(images) === JSON.stringify(p.images)) continue;
    const { error } = await db.from("products").update({ card_url, images }).eq("id", p.id);
    if (error) failed.push(`product ${p.slug ?? p.id} — ${error.message}`);
    else productsUpdated += 1;
  }

  let settingsUpdated = 0;
  for (const s of settings as any[]) {
    const value = rewrite(s.value, map);
    if (JSON.stringify(value) === JSON.stringify(s.value)) continue;
    const { error } = await db.from("site_settings").upsert({ key: s.key, value });
    if (error) failed.push(`setting ${s.key} — ${error.message}`);
    else settingsUpdated += 1;
  }

  return { found: urls.size, copied, productsUpdated, settingsUpdated, failed };
});

// ---------- Public co-creation schematic upload (images only, 8 MB) ----------
const schematic = z.object({
  name: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/),
  data: z.string().min(1).max(12_000_000),
});

export const uploadSchematic = createServerFn({ method: "POST" })
  .inputValidator((d) => schematic.parse(d))
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Each image must be under 8 MB.");
    const { getPersonalAdmin } = await import("./personal-supabase.server");
    const db = getPersonalAdmin();
    const path = `collaborations/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${data.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  });
