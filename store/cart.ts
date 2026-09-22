"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

function lineKey(item: Pick<CartItem, "productId" | "variationId" | "attributes">) {
  const attrs = item.attributes
    ? Object.entries(item.attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
    : "";
  return `${item.productId}:${item.variationId ?? 0}:${attrs}`;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (item) =>
        set((state) => {
          const key = lineKey(item);
          const existing = state.items.find((i) => lineKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, item], isOpen: true };
        }),
      removeItem: (productId, variationId) =>
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (variationId === undefined || i.variationId === variationId)
              )
          ),
        })),
      updateQuantity: (productId, quantity, variationId) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) =>
                    !(
                      i.productId === productId &&
                      (variationId === undefined || i.variationId === variationId)
                    )
                )
              : state.items.map((i) =>
                  i.productId === productId &&
                  (variationId === undefined || i.variationId === variationId)
                    ? { ...i, quantity }
                    : i
                ),
        })),
      clearCart: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + Number.parseFloat(item.price || "0") * item.quantity,
          0
        ),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "grippy-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
