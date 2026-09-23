import Link from "next/link";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/blind-test/guide", label: "Protocol" },
  { href: "/blind-test", label: "Gym" },
  { href: "/blind-test/lab", label: "Lab" },
  { href: "/blind-test/results", label: "Results" },
] as const;

type BlindTestNavProps = {
  current?: "guide" | "gym" | "lab" | "results";
  className?: string;
  /** Dark hero variant (chalk text on ink). */
  tone?: "default" | "onDark";
};

export function BlindTestNav({
  current,
  className,
  tone = "default",
}: BlindTestNavProps) {
  return (
    <nav
      aria-label="Blind test tools"
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm",
        className
      )}
    >
      {LINKS.map((link) => {
        const active =
          (current === "guide" && link.href === "/blind-test/guide") ||
          (current === "gym" && link.href === "/blind-test") ||
          (current === "lab" && link.href === "/blind-test/lab") ||
          (current === "results" && link.href === "/blind-test/results");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 transition-colors",
              tone === "onDark"
                ? active
                  ? "bg-chalk text-ink"
                  : "text-chalk/70 hover:bg-chalk/10 hover:text-chalk"
                : active
                  ? "bg-ink text-chalk"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
