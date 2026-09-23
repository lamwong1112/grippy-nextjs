import { cn } from "@/lib/utils";

interface ProductPlaceholderProps {
  name?: string;
  className?: string;
}

/** Brand chalk/salt visual used when WooCommerce has no product image. */
export function ProductPlaceholder({
  name = "Grippy chalk",
  className,
}: ProductPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-end overflow-hidden bg-ink p-4",
        className
      )}
      aria-hidden={!name}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(242,245,244,0.22),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(91,168,160,0.28),transparent_50%),linear-gradient(160deg,#071a1f_0%,#0d2a31_55%,#143840_100%)]" />
      <div className="grain absolute inset-0 opacity-[0.18] mix-blend-overlay" />
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-chalk/15 blur-2xl" />
      <div className="absolute bottom-8 left-1/2 h-24 w-32 -translate-x-1/2 rounded-[40%] bg-chalk/25 blur-md" />
      <p className="relative font-heading text-sm font-medium tracking-tight text-chalk/90 line-clamp-2">
        {name}
      </p>
    </div>
  );
}
