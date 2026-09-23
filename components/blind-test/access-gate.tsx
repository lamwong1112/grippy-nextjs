"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AccessGateProps = {
  onUnlocked: () => void;
  title?: string;
  description?: string;
};

export function AccessGate({
  onUnlocked,
  title = "Internal access",
  description = "Enter the research access key to continue.",
}: AccessGateProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/blind-test/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "access", key }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error || "Incorrect access key.");
        return;
      }
      onUnlocked();
    } catch {
      setError("Could not verify access key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Access key</span>
          <input
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-2 h-14 w-full border border-border bg-chalk px-4 text-lg text-ink outline-none ring-salt focus:ring-2"
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !key}
          className={cn(
            "h-14 w-full bg-ink text-lg font-medium text-chalk transition-opacity",
            (loading || !key) && "opacity-50"
          )}
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Lost? Read the{" "}
        <Link href="/blind-test/guide" className="text-ink underline">
          Blind Test Protocol
        </Link>
        .
      </p>
    </div>
  );
}
