import { useSetting } from "./site";

export const defaultMediaCopies: Record<string, string> = {};
export function useMediaCopies() {
  return useSetting<Record<string, string>>("media_copies", defaultMediaCopies).data ?? defaultMediaCopies;
}
export function useMediaUrl(url: string) {
  return useMediaCopies()[url] ?? url;
}