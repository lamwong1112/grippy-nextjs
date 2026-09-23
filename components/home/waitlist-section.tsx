import { WaitlistForm } from "@/components/waitlist-form";
import { Reveal } from "@/components/reveal";

export function HomeWaitlist() {
  return (
    <section
      id="waitlist"
      className="scroll-mt-20 border-t border-border bg-ink text-chalk"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <Reveal>
          <div className="mx-auto flex max-w-xl flex-col items-start gap-6 md:items-center md:text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Be first when packs drop
            </h2>
            <p className="text-base leading-relaxed text-chalk/70">
              Join the waitlist for launch updates, restocks, and early access.
              Already shopping? Head to the store — we will hold your spot either
              way.
            </p>
            <WaitlistForm dark className="md:mx-auto" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
