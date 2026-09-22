import Link from "next/link";
import { CartDrawer } from "@/components/cart-drawer";
import type { WPMenuItem } from "@/types";

interface SiteHeaderProps {
  siteTitle: string;
  menuItems?: WPMenuItem[];
}

const fallbackNav = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ siteTitle, menuItems = [] }: SiteHeaderProps) {
  const nav =
    menuItems.length > 0
      ? menuItems
          .filter((item) => !item.parentId)
          .map((item) => ({
            href: item.path?.startsWith("http")
              ? item.path
              : item.path || "/",
            label: item.label,
            external: item.path?.startsWith("http"),
          }))
      : fallbackNav.map((item) => ({ ...item, external: false }));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {nav.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-semibold tracking-tight md:text-2xl"
        >
          {siteTitle || "Grippy"}
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/shop"
            className="mr-1 hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Shop
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
