import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { trackAddToCart, trackRemoveFromCart, type AnalyticsItem } from "@/lib/analytics";

export type CartLine = {
  slug: string;
  name: string;
  product: string;
  price: number;
  weightKg: number;
  image: string;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  count: number;
  total: number;
  totalWeight: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);
const KEY = "objekthaus.cart.v1";

/** Shape a cart line for the Google Tag Manager ecommerce dataLayer. */
export const toAnalyticsItem = (
  line: Pick<CartLine, "slug" | "name" | "product" | "price">,
  qty: number,
): AnalyticsItem => ({
  item_id: line.slug,
  item_name: line.product,
  item_variant: line.name,
  price: line.price,
  quantity: qty,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota errors */
    }
  }, [lines]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.slug === line.slug);
      if (found)
        return prev.map((l) => (l.slug === line.slug ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { ...line, qty }];
    });
    trackAddToCart(toAnalyticsItem(line, qty));
    setOpen(true);
  }, []);

  const setQty = useCallback(
    (slug: string, qty: number) => {
      const line = lines.find((l) => l.slug === slug);
      if (line && qty < line.qty) trackRemoveFromCart(toAnalyticsItem(line, line.qty - qty));
      if (line && qty > line.qty) trackAddToCart(toAnalyticsItem(line, qty - line.qty));
      setLines((prev) =>
        qty <= 0
          ? prev.filter((l) => l.slug !== slug)
          : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
      );
    },
    [lines],
  );

  const remove = useCallback(
    (slug: string) => {
      const line = lines.find((l) => l.slug === slug);
      if (line) trackRemoveFromCart(toAnalyticsItem(line, line.qty));
      setLines((prev) => prev.filter((l) => l.slug !== slug));
    },
    [lines],
  );

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
      totalWeight: lines.reduce((n, l) => n + l.qty * (l.weightKg || 0), 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, open, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatPrice = (n: number) =>
  `৳ ${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;