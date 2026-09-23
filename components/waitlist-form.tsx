"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  className?: string;
  dark?: boolean;
}

export function WaitlistForm({ className, dark = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        alreadyJoined?: boolean;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
        return;
      }

      setStatus("ok");
      setMessage(
        data.alreadyJoined
          ? "You are already on the list."
          : "You are on the list. We will write when packs ship."
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex w-full max-w-md flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className={cn(
            "h-11 rounded-none border-border bg-background",
            dark && "border-white/25 bg-white/10 text-white placeholder:text-white/50"
          )}
          aria-label="Email address"
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === "loading"}
          className={cn(
            "h-11 shrink-0 rounded-none",
            dark && "bg-chalk text-ink hover:bg-chalk/90"
          )}
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </Button>
      </div>
      {message && (
        <p
          className={cn(
            "text-sm",
            status === "error"
              ? "text-destructive"
              : dark
                ? "text-white/70"
                : "text-muted-foreground"
          )}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
