import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const outOfStock = product.stock_status === "outofstock";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.on_sale && (
            <Badge className="rounded-sm bg-foreground text-background">Sale</Badge>
          )}
          {outOfStock && (
            <Badge variant="secondary" className="rounded-sm">
              Sold out
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-sm font-medium tracking-tight text-foreground md:text-base">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {product.price ? formatPrice(product.price) : "—"}
        </p>
      </div>
    </Link>
  );
}
