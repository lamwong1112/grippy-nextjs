import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import {
  getProductBySlug,
  getProductVariations,
  getProducts,
} from "@/lib/woocommerce";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const products = await getProducts({ perPage: 50, orderby: "date" });
    return products.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.short_description?.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const variations =
    product.type === "variable"
      ? await getProductVariations(product.id).catch(() => [])
      : [];

  const stockLabel =
    product.stock_status === "instock"
      ? "In stock"
      : product.stock_status === "onbackorder"
        ? "Backorder"
        : "Sold out";

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
      <ProductGallery images={product.images} productName={product.name} />

      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge
              variant={
                product.stock_status === "instock" ? "default" : "secondary"
              }
              className="rounded-sm"
            >
              {stockLabel}
            </Badge>
            {product.on_sale && (
              <Badge className="rounded-sm" variant="secondary">
                Sale
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-xl tabular-nums">
            {product.price ? formatPrice(product.price) : "—"}
          </p>
        </div>

        {product.short_description && (
          <div
            className="prose-wp text-sm"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}

        <AddToCartButton product={product} variations={variations} />

        {product.description && (
          <div className="border-t border-border pt-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider">
              Details
            </h2>
            <div
              className="prose-wp mt-3 text-sm"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
