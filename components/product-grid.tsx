import { ProductCard } from "@/components/product-card";
import { WaitlistForm } from "@/components/waitlist-form";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  showWaitlistWhenEmpty?: boolean;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found.",
  showWaitlistWhenEmpty = false,
}: ProductGridProps) {
  if (products.length === 0) {
    if (showWaitlistWhenEmpty) {
      return (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <p className="max-w-md text-muted-foreground">{emptyMessage}</p>
          <WaitlistForm />
        </div>
      );
    }
    return (
      <p className="py-16 text-center text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
