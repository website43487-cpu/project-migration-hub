/** Google Tag Manager ecommerce dataLayer helpers (GA4 event schema). */

export const CURRENCY = "BDT";

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
  }
}

function push(event: DataLayerObject) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // Clear the previous ecommerce object so values never bleed between events.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(event);
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

export function trackViewItem(item: AnalyticsItem) {
  push({
    event: "view_item",
    ecommerce: { currency: CURRENCY, value: item.price * item.quantity, items: [item] },
  });
}

export function trackAddToCart(item: AnalyticsItem) {
  push({
    event: "add_to_cart",
    ecommerce: { currency: CURRENCY, value: item.price * item.quantity, items: [item] },
  });
}

export function trackRemoveFromCart(item: AnalyticsItem) {
  push({
    event: "remove_from_cart",
    ecommerce: { currency: CURRENCY, value: item.price * item.quantity, items: [item] },
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  push({ event: "begin_checkout", ecommerce: { currency: CURRENCY, value, items } });
}

export function trackPurchase(args: {
  transactionId: string;
  value: number;
  shipping: number;
  items: AnalyticsItem[];
}) {
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: args.transactionId,
      currency: CURRENCY,
      value: args.value,
      shipping: args.shipping,
      items: args.items,
    },
  });
}
