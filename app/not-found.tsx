import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <p className="font-heading text-6xl font-semibold tracking-tight text-ink">
        404
      </p>
      <p className="mt-4 text-muted-foreground">
        This route is off the wall. Head back and keep climbing.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          render={<Link href="/" />}
          className="rounded-none bg-ink text-chalk hover:bg-ink/90"
        >
          Back home
        </Button>
        <Button
          render={<Link href="/shop" />}
          variant="outline"
          className="rounded-none"
        >
          Shop chalk
        </Button>
      </div>
    </div>
  );
}
