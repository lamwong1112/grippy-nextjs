"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { Product, ProductAttribute, ProductVariation } from "@/types";

interface AddToCartButtonProps {
  product: Product;
  variations?: ProductVariation[];
}

function matchVariation(
  variations: ProductVariation[],
  selected: Record<string, string>
): ProductVariation | undefined {
  return variations.find((variation) =>
    variation.attributes.every((attr) => {
      const key = attr.name.toLowerCase();
      return selected[key] === attr.option;
    })
  );
}

export function AddToCartButton({ product, variations = [] }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const variationAttrs = product.attributes.filter((a) => a.variation);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const attr of variationAttrs) {
      const def = product.default_attributes.find(
        (d) => d.name.toLowerCase() === attr.name.toLowerCase()
      );
      initial[attr.name.toLowerCase()] =
        def?.option ?? attr.options[0] ?? "";
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);

  const matched = useMemo(
    () =>
      product.type === "variable"
        ? matchVariation(variations, selected)
        : undefined,
    [product.type, variations, selected]
  );

  const price = matched?.price || product.price;
  const stockStatus = matched?.stock_status || product.stock_status;
  const purchasable =
    product.type === "variable"
      ? Boolean(matched?.purchasable && stockStatus !== "outofstock")
      : product.purchasable && stockStatus !== "outofstock";

  function handleAdd() {
    if (!purchasable) return;
    addItem({
      productId: product.id,
      variationId: matched?.id,
      name: product.name,
      slug: product.slug,
      price,
      quantity,
      image: matched?.image?.src || product.images[0]?.src,
      attributes:
        product.type === "variable" && Object.keys(selected).length
          ? selected
          : undefined,
      stockStatus,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {variationAttrs.map((attr: ProductAttribute) => (
        <div key={attr.id} className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {attr.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {attr.options.map((option) => {
              const key = attr.name.toLowerCase();
              const isActive = selected[key] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({ ...prev, [key]: option }))
                  }
                  className={
                    isActive
                      ? "border border-foreground bg-foreground px-3 py-1.5 text-sm text-background transition-colors"
                      : "border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-foreground"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-border">
          <button
            type="button"
            className="px-3 py-2 text-sm transition-opacity hover:opacity-60"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
          <button
            type="button"
            className="px-3 py-2 text-sm transition-opacity hover:opacity-60"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1 rounded-none"
          disabled={!purchasable}
          onClick={handleAdd}
        >
          {stockStatus === "outofstock" ? "Sold out" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
