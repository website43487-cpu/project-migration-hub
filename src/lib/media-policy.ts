export const MAX_MEDIA_BYTES = 45 * 1024 * 1024;

export function collectMedia(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === "string" && /^(https?:\/\/|\/)/i.test(value) && /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|mov|woff2?|mp3|wav|pdf)(\?|$)/i.test(value)) into.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectMedia(item, into));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectMedia(item, into));
  return into;
}

export function rewriteMedia(value: unknown, map: Map<string, string>): unknown {
  if (typeof value === "string") return map.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => rewriteMedia(item, map));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteMedia(item, map)]));
  return value;
}

export function personalObjectPath(value: string, origin: string): string | null {
  try {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/media\/(.+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

export function replacedMediaPaths(before: unknown, after: unknown, references: unknown, origin: string): string[] {
  const next = collectMedia(after);
  const used = collectMedia(references);
  const usedPaths = new Set([...next, ...used].map((url) => personalObjectPath(url, origin)).filter(Boolean));
  return [...new Set([...collectMedia(before)].map((url) => personalObjectPath(url, origin)).filter((path): path is string => Boolean(path) && !usedPaths.has(path)))];
}

/** Media links that appear in the saved value but were not in the previous one. */
export function addedMedia(before: unknown, after: unknown): string[] {
  const prior = collectMedia(before);
  return [...collectMedia(after)].filter((url) => !prior.has(url));
}

export type CleanupPlan = { remove: string[]; blocked: string[] };

/**
 * Decides which old files may be deleted. Nothing is removed unless every new
 * replacement lives in personal storage and was confirmed present there.
 */
export function planReplacementCleanup(input: {
  before: unknown;
  after: unknown;
  references: unknown;
  origin: string;
  verifiedPaths: Set<string>;
}): CleanupPlan {
  const blocked = addedMedia(input.before, input.after).filter((url) => {
    const path = personalObjectPath(url, input.origin);
    return !path || !input.verifiedPaths.has(path);
  });
  if (blocked.length) return { remove: [], blocked };
  const remove = replacedMediaPaths(input.before, input.after, input.references, input.origin)
    .filter((path) => !path.startsWith("branding/"));
  return { remove, blocked: [] };
}
