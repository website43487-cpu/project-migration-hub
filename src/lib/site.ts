import { useQuery } from "@tanstack/react-query";
import { getSetting } from "@/lib/data.functions";

export type HeroSettings = { videoUrl: string; eyebrow: string; caption: string };
export type ManifestoSettings = { body: string };
export type FeaturedSettings = { slug: string };
export type DeliverySettings = { perKg: number; base: number; freeAbove: number };
export type Panel5Settings = {
  eyebrow: string;
  title: string;
  body: string;
  videoUrl: string;
  caption: string;
};
export type CheckoutSettings = {
  noteEnabled: boolean;
  noteLabel: string;
  noteHint: string;
  notePlaceholder: string;
};
export type ContactSettings = {
  facebook: string;
  instagram: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
};

export const defaultContact: ContactSettings = {
  facebook: "https://www.facebook.com/profile.php?id=61577360109655",
  instagram: "https://www.instagram.com/objekthaus_studio_",
  whatsapp: "+8801635592323",
  email: "objekthaus.studio@gmail.com",
  address: "Mirpur-12, Block-D, Road-09, Dhaka-1216, Bangladesh",
  hours: "Thursday – Saturday, by appointment",
};

export const defaultHero: HeroSettings = { videoUrl: "", eyebrow: "", caption: "" };
export const defaultManifesto: ManifestoSettings = {
  body:
    "Objects shape\nthe spaces\nwe inhabit.\n\nSpaces shape\nthe moments\nwe remember.\n\nWe create\nobjects that\ninvite you\nto notice.",
};
export const defaultFeatured: FeaturedSettings = { slug: "queen-annes-lace" };
export const defaultDelivery: DeliverySettings = { perKg: 80, base: 60, freeAbove: 0 };
export const defaultCheckout: CheckoutSettings = {
  noteEnabled: true,
  noteLabel: "Special note (optional)",
  noteHint: "Anything we should know — delivery timing, gift wrapping, a dedication.",
  notePlaceholder: "",
};
export const defaultPanel5: Panel5Settings = {
  eyebrow: "",
  title: "",
  body: "",
  videoUrl: "",
  caption: "",
};

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  const { value } = await getSetting({ data: { key } });
  // Lists (journal posts, FAQ) must stay lists — spreading them into an object corrupts them.
  if (Array.isArray(fallback) || Array.isArray(value)) return (Array.isArray(value) ? value : fallback) as T;
  return { ...fallback, ...((value ?? {}) as Partial<T>) };
}

export function useSetting<T>(key: string, fallback: T) {
  return useQuery({
    queryKey: ["site_settings", key],
    queryFn: () => fetchSetting<T>(key, fallback),
    initialData: fallback,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export const useHero = (): HeroSettings => useSetting<HeroSettings>("hero", defaultHero).data ?? defaultHero;
export const usePanel5 = (): Panel5Settings =>
  useSetting<Panel5Settings>("panel5", defaultPanel5).data ?? defaultPanel5;
export const useContactInfo = (): ContactSettings =>
  useSetting<ContactSettings>("contact", defaultContact).data ?? defaultContact;
export const useManifesto = (): ManifestoSettings =>
  useSetting<ManifestoSettings>("manifesto", defaultManifesto).data ?? defaultManifesto;
export const useFeatured = (): FeaturedSettings =>
  useSetting<FeaturedSettings>("featured", defaultFeatured).data ?? defaultFeatured;
export const useDelivery = (): DeliverySettings =>
  useSetting<DeliverySettings>("delivery", defaultDelivery).data ?? defaultDelivery;
export const useCheckoutSettings = (): CheckoutSettings =>
  useSetting<CheckoutSettings>("checkout", defaultCheckout).data ?? defaultCheckout;

/** Delivery cost for a basket, rounded up to the next whole kilo. */
export function deliveryCost(d: DeliverySettings, weightKg: number, subtotal: number) {
  if (weightKg <= 0) return 0;
  if (d.freeAbove > 0 && subtotal >= d.freeAbove) return 0;
  return Math.round(d.base + d.perKg * Math.ceil(weightKg));
}

export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
