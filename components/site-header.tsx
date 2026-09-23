import Link from "next/link";
import { CartDrawer } from "@/components/cart-drawer";

interface SiteHeaderProps {
  siteTitle?: string;
}

const brandNav = [
  { href: "/shop", label: "Shop" },
  { href: "/#story", label: "Story" },
  { href: "/#waitlist", label: "Waitlist" },
];

export function SiteHeader({ siteTitle = "Grippy" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {brandNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-semibold tracking-tight md:text-2xl"
        >
          {siteTitle || "Grippy"}
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/shop"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            About
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
