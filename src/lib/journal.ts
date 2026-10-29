import { useSetting } from "@/lib/site";

export type JournalPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  cover: string;
  body: string;
  featured: boolean;
  published: boolean;
};

/** Journal posts live in site settings under "journal", edited from the Studio. */
export function useJournal(all = false) {
  const posts = useSetting<JournalPost[]>("journal", []).data ?? [];
  const list = (Array.isArray(posts) ? posts : []).filter((p) => all || p.published);
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
