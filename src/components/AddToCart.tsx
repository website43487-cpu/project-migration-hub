import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Flower } from "@/lib/flowers";

/** Compact "Bring it home" that drops a single object into the cart. */
export function QuickAdd({ flower, className = "" }: { flower: Flower; className?: string }) {
  const { add } = useCart();
  return (
    <button
      type="button"
      onClick={() =>
        add({
          slug: flower.slug,
          name: flower.name,
          product: flower.product,
          price: flower.price,
          weightKg: flower.weightKg ?? 0,
          image: flower.images[0]?.src ?? flower.card,
        })
      }
      className={`corner-action caps ${className}`}
    >
      Bring it home
      <svg className="arrow" width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
        <path d="M0 4h20M16.5 1L20 4l-3.5 3" stroke="currentColor" strokeWidth="1" />
      </svg>
    </button>
  );
}

export function AddToCart({ flower, className = "" }: { flower: Flower; className?: string }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className={`flex flex-wrap items-center gap-6 ${className}`}>
      <div className="flex items-center border border-current/25">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-4 py-2 transition-opacity duration-300 hover:opacity-55"
        >
          –
        </button>
        <span className="min-w-7 text-center text-sm">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(9, q + 1))}
          className="px-4 py-2 transition-opacity duration-300 hover:opacity-55"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() =>
          add(
            {
              slug: flower.slug,
              name: flower.name,
              product: flower.product,
              price: flower.price,
              weightKg: flower.weightKg ?? 0,
              image: flower.images[0]?.src ?? flower.card,
            },
            qty,
          )
        }
        className="corner-action font-display text-3xl font-light"
      >
        Bring it home
        <svg className="arrow" width="22" height="8" viewBox="0 0 22 8" fill="none" aria-hidden="true">
          <path d="M0 4h20M16.5 1L20 4l-3.5 3" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>
    </div>
  );
}