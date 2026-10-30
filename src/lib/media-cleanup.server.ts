import { replacedMediaPaths } from "./media-policy";
import { getPersonalAdmin } from "./personal-supabase.server";

// Invoked only after an authorized write succeeds. A failed reference read must never delete files.
export async function cleanupReplacedMedia(before: unknown, after: unknown) {
  const db = getPersonalAdmin();
  const [products, settings] = await Promise.all([
    db.from("products").select("card_url, images"),
    db.from("site_settings").select("key, value"),
  ]);
  if (products.error || settings.error) return;
  const origin = process.env["PERSONAL_SUPABASE_URL"] ?? "";
  const normalized = origin.startsWith("http") ? origin : `https://${origin.includes(".") ? origin : `${origin}.supabase.co`}`;
  const paths = replacedMediaPaths(before, after, [products.data, settings.data], normalized);
  // Branding originals are retained even if an editor stops referencing them.
  const removable = paths.filter((path) => !path.startsWith("branding/"));
  if (removable.length) {
    const { error } = await db.storage.from("media").remove(removable);
    if (error) throw new Error("Saved successfully, but the previous media could not be removed. Please retry cleanup later.");
  }
}