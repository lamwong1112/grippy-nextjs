import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { brandImages } from "@/lib/brand-images";

export function StoryHumidity() {
  return (
    <section id="story" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:gap-14 md:py-28">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]">
            <Image
              src={brandImages.humidity.src}
              alt={brandImages.humidity.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-ink/15" />
          </div>
        </Reveal>
        <Reveal delayMs={80}>
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Grip when it gets wet
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Hong Kong air often sits above 80% humidity. Ordinary chalk can
              clump, then turn slick on holds. Grippy is shaped for that climate —
              a sponge-like structure that soaks sweat so you stay connected on
              micro-edges and slopers.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
