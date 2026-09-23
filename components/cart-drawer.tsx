"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ProductPlaceholder } from "@/components/product-placeholder";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    openCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  } = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (items.length === 0) return;
    setCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: items.length === 1 ? "checkout-url" : "create-order",
          items: items.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        paymentUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      const url = data.paymentUrl || data.checkoutUrl;
      if (!url) throw new Error("No checkout URL returned");

      if (items.length > 1) {
        clearCart();
      }
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={openCart}
        aria-label="Open cart"
      >
        <ShoppingBag className="size-5" />
        {totalItems() > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
            {totalItems()}
          </span>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-heading text-lg tracking-tight">
              Cart ({totalItems()})
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <ShoppingBag className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="inline-flex h-8 items-center border border-border px-3 text-sm transition-colors hover:bg-muted"
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variationId ?? 0}`}
                    className="flex gap-3 py-4"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative size-20 shrink-0 overflow-hidden bg-muted"
                      onClick={closeCart}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <ProductPlaceholder name="" className="p-2" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="text-sm font-medium leading-snug hover:underline"
                            onClick={closeCart}
                          >
                            {item.name}
                          </Link>
                          {item.attributes && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {Object.values(item.attributes).join(" / ")}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId, item.variationId)
                          }
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center border border-border w-fit">
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variationId
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variationId
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-auto space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal())}</span>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full rounded-none"
                size="lg"
                disabled={checkingOut}
                onClick={handleCheckout}
              >
                {checkingOut ? "Redirecting…" : "Checkout"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure checkout on grippy.io
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
