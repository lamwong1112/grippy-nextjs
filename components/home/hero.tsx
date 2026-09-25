import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brandImages } from "@/lib/brand-images";

export function HomeHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-ink text-chalk">
      <Image
        src={brandImages.hero.src}
        alt={brandImages.hero.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,26,31,0.45)_0%,rgba(7,26,31,0.55)_40%,rgba(7,26,31,0.88)_100%)]" />
      <div className="grain absolute inset-0 opacity-20 mix-blend-overlay" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:pb-24">
        <p className="font-heading animate-in fade-in slide-in-from-bottom-3 fill-mode-both text-6xl font-semibold tracking-tight text-chalk duration-700 md:text-8xl lg:text-9xl">
          Grippy
        </p>
        <h1 className="mt-4 max-w-xl animate-in fade-in slide-in-from-bottom-3 fill-mode-both text-lg text-chalk/85 delay-100 duration-700 md:text-xl">
          High-friction chalk, harvested from the sea. Engineered for 80%+
          humidity.
        </h1>
        <p className="mt-3 max-w-md animate-in fade-in slide-in-from-bottom-3 fill-mode-both text-sm leading-relaxed text-chalk/65 delay-150 duration-700">
          Premium grip upcycled from desalination brine. Maximum friction on
          micro-edges, zero open-pit mining. Packs and a click-press dispenser
          made for sticky air and long sessions.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-3 fill-mode-both delay-200 duration-700">
          <Button
            render={<Link href="/shop" />}
            size="lg"
            className="rounded-none bg-chalk text-ink hover:bg-chalk/90"
          >
            Shop chalk
          </Button>
          <Button
            render={<Link href="/#waitlist" />}
            size="lg"
            variant="outline"
            className="rounded-none border-chalk/35 bg-transparent text-chalk hover:bg-chalk/10"
          >
            Join the waitlist
          </Button>
        </div>
      </div>
    </section>
  );
}
