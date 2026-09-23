import { Suspense } from "react";
import { ProductGrid } from "@/components/product-grid";
import { ShopFilters } from "@/components/shop-filters";
import { ProductGridSkeleton } from "@/components/skeletons/product-skeletons";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
} from "@/lib/woocommerce";
import type { ProductsQuery } from "@/types";

export const revalidate = 60;

type SearchParams = Promise<{
  category?: string;
  sort?: string;
}>;

function parseSort(sort?: string): Pick<ProductsQuery, "orderby" | "order"> {
  switch (sort) {
    case "price-asc":
      return { orderby: "price", order: "asc" };
    case "price-desc":
      return { orderby: "price", order: "desc" };
    case "date":
      return { orderby: "date", order: "desc" };
    case "popularity":
    default:
      return { orderby: "popularity", order: "desc" };
  }
}

async function ShopCatalog({
  categorySlug,
  sort,
}: {
  categorySlug?: string;
  sort?: string;
}) {
  const { orderby, order } = parseSort(sort);
  let categoryId: number | undefined;

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug).catch(() => null);
    categoryId = category?.id;
  }

  const products = await getProducts({
    perPage: 24,
    category: categoryId,
    orderby,
    order,
  }).catch(() => []);

  return (
    <ProductGrid
      products={products}
      showWaitlistWhenEmpty
      emptyMessage="Nothing in the shop right now. Join the waitlist for the next drop."
    />
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categories = await getCategories({ hideEmpty: true }).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Shop chalk
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Climate-ready packs for humid gyms. Filter by category or sort by
          price.
        </p>
      </div>

      <div className="mb-8">
        <Suspense fallback={null}>
          <ShopFilters categories={categories} />
        </Suspense>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ShopCatalog categorySlug={params.category} sort={params.sort} />
      </Suspense>
    </div>
  );
}
