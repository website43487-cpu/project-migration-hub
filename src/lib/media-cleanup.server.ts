import { addedMedia, personalObjectPath, planReplacementCleanup, rewriteMedia } from "./media-policy";
import { getPersonalAdmin } from "./personal-supabase.server";

const BUCKET = "media";

function storageOrigin(): string {
  const raw = (process.env["PERSONAL_SUPABASE_URL"] ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw.includes(".") ? raw : `${raw}.supabase.co`}`;
}

async function copyId(url: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
  return Array.from(new Uint8Array(digest)).map((n) => n.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

/**
 * Before a save: any new media that is not already in personal storage is copied
 * there and the value is rewritten to point at the copy. Copies are recorded in
 * the shared `media_copies` map so retries reuse them instead of re-uploading.
 * Throws (and nothing is saved) if a replacement cannot be copied.
 */
export async function storeReplacementsInPersonal<T>(before: unknown, after: T, requestOrigin: string): Promise<T> {
  const origin = storageOrigin();
  const pending = addedMedia(before, after).filter((url) => !personalObjectPath(url, origin));
  if (!pending.length) return after;

  const db = getPersonalAdmin();
  const { data: row, error: mapReadError } = await db.from("site_settings").select("value").eq("key", "media_copies").maybeSingle();
  if (mapReadError) throw new Error("Could not check your media library. Nothing was saved.");
  const map = new Map<string, string>(
    Object.entries((row?.value ?? {}) as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  for (const url of pending) {
    if (map.has(url)) continue;
    const absolute = url.startsWith("/") ? `${requestOrigin}${url}` : url;
    const res = await fetch(absolute);
    if (!res.ok) throw new Error(`Could not copy a new file to your storage (download ${res.status}). Nothing was saved.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const name = decodeURIComponent(new URL(absolute).pathname.split("/").pop() || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `copies/${await copyId(url)}-${name}`;
    const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
      contentType: res.headers.get("content-type") || "application/octet-stream",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      throw new Error("Could not copy a new file to your storage. Nothing was saved.");
    }
    map.set(url, db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const { error: mapError } = await db.from("site_settings").upsert({ key: "media_copies", value: Object.fromEntries(map) });
  if (mapError) throw new Error("Could not record the copied files. Nothing was saved.");
  return rewriteMedia(after, map) as T;
}

export type CleanupResult = { removed: string[]; kept: "none" | "unverified" | "references-unreadable" };

/**
 * After a successful save: confirms every new replacement exists in personal
 * storage, re-reads all media references, and only then deletes the old files
 * nothing else uses. Any failed check keeps the old files.
 */
export async function cleanupReplacedMedia(before: unknown, after: unknown): Promise<CleanupResult> {
  const db = getPersonalAdmin();
  const origin = storageOrigin();

  const verifiedPaths = new Set<string>();
  for (const url of addedMedia(before, after)) {
    const path = personalObjectPath(url, origin);
    if (!path) continue;
    const { data, error } = await db.storage.from(BUCKET).info(path);
    if (!error && data && (data.size ?? 0) > 0) verifiedPaths.add(path);
  }

  const [products, settings] = await Promise.all([
    db.from("products").select("card_url, images"),
    db.from("site_settings").select("key, value"),
  ]);
  if (products.error || settings.error) return { removed: [], kept: "references-unreadable" };

  const plan = planReplacementCleanup({ before, after, references: [products.data, settings.data], origin, verifiedPaths });
  if (plan.blocked.length) return { removed: [], kept: "unverified" };
  if (plan.remove.length) {
    const { error } = await db.storage.from(BUCKET).remove(plan.remove);
    if (error) throw new Error("Saved successfully, but the previous media could not be removed. Please retry cleanup later.");
  }
  return { removed: plan.remove, kept: "none" };
}
