// Studio media uploads. The browser cannot write to the media store directly
// (studio staff are not signed in to the storage backend), so the file is sent
// through a staff-guarded server function that uploads with elevated rights and
// returns a long-lived link.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bundledMediaUrls } from "./media-catalog";
import { collectMedia, rewriteMedia, personalObjectPath } from "./media-policy";

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

    const path = `${Date.now()}-${crypto.randomUUID()}-${data.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
  const [productResult, settingResult] = await Promise.all([
    db.from("products").select("id, slug, card_url, images"),
    db.from("site_settings").select("key, value"),
  ]);
  if (productResult.error || settingResult.error) throw new Error("Could not read the media library. No references were changed.");
  const products = productResult.data ?? [];
  const settings = settingResult.data ?? [];
  const urls = collectMedia([products, settings, bundledMediaUrls]);
  const storageOrigin = new URL(db.storage.from(BUCKET).getPublicUrl("probe").data.publicUrl).origin;
  const previous = settings.find((row: any) => row.key === "media_copies")?.value ?? {};
  const map = new Map<string, string>(Object.entries(previous).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const failed: string[] = [];
  let copied = 0;
  let skipped = 0;
  const queue = [...urls].filter((url) => {
    if (personalObjectPath(url, storageOrigin) || map.has(url)) { skipped += 1; return false; }
    return true;
  });
  const copy = async (url: string) => {
    try {
      const absolute = url.startsWith("/") ? `${origin}${url}` : url;
      const res = await fetch(absolute);
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const name = decodeURIComponent(new URL(absolute).pathname.split("/").pop() || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
      const id = Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("").slice(0, 24);
      const path = `copies/${id}-${name}`;
      const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
        contentType: res.headers.get("content-type") || "application/octet-stream",
        cacheControl: "31536000", upsert: false,
      });
      if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(error.message);
      const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      map.set(url, publicUrl);
      copied += 1;
    } catch (err) {
      failed.push(`${url} — ${err instanceof Error ? err.message : "unknown error"}`);
    }
  };
  for (let index = 0; index < queue.length; index += 3) await Promise.all(queue.slice(index, index + 3).map(copy));
  const { error: mapError } = await db.from("site_settings").upsert({ key: "media_copies", value: Object.fromEntries(map) });
  if (mapError) throw new Error("Files were copied, but their saved links could not be updated. Retry safely to finish.");

  let productsUpdated = 0;
  for (const p of products as any[]) {
    const card_url = rewriteMedia(p.card_url, map);
    const images = rewriteMedia(p.images, map);
    if (card_url === p.card_url && JSON.stringify(images) === JSON.stringify(p.images)) continue;
    const { error } = await db.from("products").update({ card_url, images }).eq("id", p.id);
    if (error) failed.push(`product ${p.slug ?? p.id} — ${error.message}`);
    else productsUpdated += 1;
  }

  let settingsUpdated = 0;
  for (const s of settings as any[]) {
    if (s.key === "media_copies") continue;
    const value = rewriteMedia(s.value, map);
    if (JSON.stringify(value) === JSON.stringify(s.value)) continue;
    const { error } = await db.from("site_settings").upsert({ key: s.key, value });
    if (error) failed.push(`setting ${s.key} — ${error.message}`);
    else settingsUpdated += 1;
  }

  return { found: urls.size, copied, skipped, productsUpdated, settingsUpdated, failed };
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
