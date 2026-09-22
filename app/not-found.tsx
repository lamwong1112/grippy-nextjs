import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-heading text-5xl font-semibold tracking-tight">404</p>
      <p className="mt-3 text-muted-foreground">
        This page could not be found.
      </p>
      <Button render={<Link href="/" />} className="mt-8 rounded-none">
        Back home
      </Button>
    </div>
  );
}
