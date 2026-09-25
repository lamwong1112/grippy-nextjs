import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-ink text-chalk">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-2xl font-semibold tracking-tight">
            Grippy
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-chalk/65">
            Seawater-led chalk for humid gyms — less mining, direct to climbers.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-chalk/70">
          <Link href="/shop" className="hover:text-chalk">
            Shop
          </Link>
          <Link href="/#story" className="hover:text-chalk">
            Story
          </Link>
          <Link href="/#waitlist" className="hover:text-chalk">
            Waitlist
          </Link>
          <Link href="/about" className="hover:text-chalk">
            About
          </Link>
        </div>
      </div>
      <div className="border-t border-chalk/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-chalk/45">
          © {new Date().getFullYear()} Grippy
        </p>
      </div>
    </footer>
  );
}
