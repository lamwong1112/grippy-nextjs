import { Reveal } from "@/components/reveal";

export function StoryDispenser() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Less cloud, more control
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Our click-press dispenser meters chalk without digging in a bag —
              sealed, portable, and designed to cut airborne dust so gyms stay
              clearer and your hands stay hygienic.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="relative mx-auto mt-14 flex h-56 max-w-lg items-center justify-center md:h-64">
            <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-salt/40" />
            <div className="relative flex h-40 w-24 flex-col items-center rounded-t-[2.5rem] rounded-b-lg border border-salt/50 bg-[linear-gradient(180deg,#0d2a31_0%,#071a1f_100%)] shadow-[0_20px_50px_rgba(7,26,31,0.25)] md:h-48 md:w-28">
              <div className="mt-4 h-3 w-10 rounded-full bg-chalk/30" />
              <div className="mt-auto mb-6 h-8 w-8 rounded-full border border-chalk/40 bg-salt/30" />
              <div className="absolute -bottom-3 h-3 w-16 rounded-full bg-ink/20 blur-sm" />
            </div>
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-chalk/50 blur-[1px]" />
              <span className="absolute right-[22%] top-[38%] h-1.5 w-1.5 rounded-full bg-chalk/40" />
              <span className="absolute left-[28%] top-[55%] h-1 w-1 rounded-full bg-chalk/35" />
              <span className="absolute right-[30%] top-[58%] h-2 w-2 rounded-full bg-chalk/25 blur-[0.5px]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
