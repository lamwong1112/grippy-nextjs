import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts, getProducts } from "@/lib/woocommerce";

export const revalidate = 60;

const values = [
  {
    title: "Built to last",
    body: "Materials and construction chosen for daily wear — not disposable trends.",
  },
  {
    title: "Direct to you",
    body: "A focused catalog without the noise. Better products, fewer steps.",
  },
  {
    title: "Ship-ready stock",
    body: "Live inventory from WooCommerce so you only see what is actually available.",
  },
];

export default async function HomePage() {
  let products = await getFeaturedProducts(8).catch(() => []);
  if (products.length === 0) {
    products = await getProducts({ perPage: 8, orderby: "popularity" }).catch(
      () => []
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a0a0a_0%,#171717_50%,#262626_100%)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_20%_20%,#fff_0.5px,transparent_0.5px)] [background-size:12px_12px]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:pb-24">
          <p className="font-heading text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-8xl">
            Grippy
          </p>
          <h1 className="mt-4 max-w-xl text-lg text-white/80 md:text-xl">
            Performance essentials with a clean D2C feel — shop the latest drops.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link href="/shop" />}
              size="lg"
              className="rounded-none bg-white text-foreground hover:bg-white/90"
            >
              Shop collection
            </Button>
            <Button
              render={<Link href="/about" />}
              size="lg"
              variant="outline"
              className="rounded-none border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Our story
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Featured
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hand-picked pieces from the catalog.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>
        <ProductGrid products={products} emptyMessage="Products will appear here once WooCommerce is connected." />
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3 md:py-20">
          {values.map((item, index) => (
            <div
              key={item.title}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
