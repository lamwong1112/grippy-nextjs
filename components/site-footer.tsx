import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight">Grippy</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Modern gear for everyday performance.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <a
            href="https://grippy.io"
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            grippy.io
          </a>
        </div>
      </div>
    </footer>
  );
}
