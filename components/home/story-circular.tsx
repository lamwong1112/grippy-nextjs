import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { brandImages } from "@/lib/brand-images";

export function StoryCircular() {
  return (
    <section className="border-t border-border bg-ink text-chalk">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:gap-14 md:py-28">
        <Reveal className="order-2 md:order-1">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              From brine to chalk
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-chalk/70">
              We capture mineral-rich brine from seawater desalination and upcycle
              it into high-purity magnesium carbonate. To hit the ideal tactile
              grit on rock and plastic, we blend it with mineral chalk for
              balanced moisture absorption. The result: pure friction, zero heavy
              footprint.
            </p>
          </div>
        </Reveal>
        <Reveal className="order-1 md:order-2" delayMs={80}>
          <div className="relative aspect-[5/4] overflow-hidden md:aspect-[4/3]">
            <Image
              src={brandImages.circular.src}
              alt={brandImages.circular.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,26,31,0.35),rgba(91,168,160,0.2))]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
