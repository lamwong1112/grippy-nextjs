import Link from "next/link";
import { HomeHero } from "@/components/home/hero";
import { StoryCircular } from "@/components/home/story-circular";
import { StoryDispenser } from "@/components/home/story-dispenser";
import { StoryHumidity } from "@/components/home/story-humidity";
import { HomeWaitlist } from "@/components/home/waitlist-section";
import { ProductGrid } from "@/components/product-grid";
import { WaitlistForm } from "@/components/waitlist-form";
import { getFeaturedProducts, getProducts } from "@/lib/woocommerce";

export const revalidate = 60;

export default async function HomePage() {
  let products = await getFeaturedProducts(8).catch(() => []);
  if (products.length === 0) {
    products = await getProducts({ perPage: 8, orderby: "popularity" }).catch(
      () => []
    );
  }

  return (
    <div>
      <HomeHero />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Shop the pack
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ~200g climate-ready chalk, priced for everyday sessions.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="flex flex-col items-start gap-6 border border-border bg-card/60 px-6 py-12 md:items-center md:text-center">
            <p className="max-w-md text-muted-foreground">
              Packs are not live in the store yet. Join the waitlist and we will
              ping you when chalk ships.
            </p>
            <WaitlistForm />
          </div>
        )}
      </section>

      <StoryHumidity />
      <StoryCircular />
      <StoryDispenser />
      <HomeWaitlist />
    </div>
  );
}
