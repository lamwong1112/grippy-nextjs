"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BlindTestNav } from "@/components/blind-test/blind-test-nav";
import { cn } from "@/lib/utils";

type RoleId = "all" | "lead" | "climber" | "lab" | "decision";

const ROLES: Array<{ id: RoleId; label: string; blurb: string }> = [
  {
    id: "all",
    label: "Overview",
    blurb: "What this system is and how the three tools fit together",
  },
  {
    id: "lead",
    label: "Test lead",
    blurb: "Set PIN, samples, and mappings before the session",
  },
  {
    id: "climber",
    label: "Climber / scribe",
    blurb: "Score blind samples on your phone at the gym",
  },
  {
    id: "lab",
    label: "Lab / R&D",
    blurb: "Enter instrument data and hard gates",
  },
  {
    id: "decision",
    label: "Analysis",
    blurb: "Rank blends, check stability, export CSV",
  },
];

const TOOLS = [
  {
    href: "/blind-test",
    code: "01",
    title: "Gym scoring",
    path: "/blind-test",
    who: "Climbers & scribes",
    purpose: "Rate Sample A/B/C… with chalky hands. Blind codes only.",
    key: "4-digit session PIN",
    tone: "ink" as const,
  },
  {
    href: "/blind-test/lab",
    code: "02",
    title: "Lab entry",
    path: "/blind-test/lab",
    who: "R&D",
    purpose: "Log raw measurements and Pass/Fail gates by true ratio.",
    key: "Access key",
    tone: "salt" as const,
  },
  {
    href: "/blind-test/results",
    code: "03",
    title: "Results",
    path: "/blind-test/results",
    who: "Decision team",
    purpose: "Aggregates, multi-round stability, decision matrix, CSV.",
    key: "Same access key",
    tone: "mist" as const,
  },
];

const SECTIONS: Array<{
  id: string;
  title: string;
  roles: RoleId[];
}> = [
  { id: "tools", title: "Three tools", roles: ["all", "lead", "climber", "lab", "decision"] },
  { id: "blind", title: "Blindness rules", roles: ["all", "lead", "climber"] },
  { id: "lead", title: "Lead checklist", roles: ["all", "lead"] },
  { id: "gym", title: "Gym flow", roles: ["all", "climber", "lead"] },
  { id: "lab", title: "Lab flow", roles: ["all", "lab", "lead"] },
  { id: "results", title: "Analysis flow", roles: ["all", "decision", "lead"] },
  { id: "rounds", title: "Test rounds", roles: ["all", "lead", "decision"] },
  { id: "which", title: "Which page?", roles: ["all", "lead", "climber", "lab", "decision"] },
  { id: "faq", title: "Troubleshooting", roles: ["all", "lead", "climber", "lab"] },
];

export function BlindTestGuide() {
  const [role, setRole] = useState<RoleId>("all");
  const [activeSection, setActiveSection] = useState("tools");

  const visibleSections = useMemo(
    () => SECTIONS.filter((s) => s.roles.includes(role)),
    [role]
  );

  useEffect(() => {
    const nodes = visibleSections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [visibleSections]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 80% at 0% 50%, rgba(91, 168, 160, 0.22), transparent 55%),
              radial-gradient(ellipse 50% 60% at 100% 0%, rgba(7, 26, 31, 0.12), transparent 50%),
              linear-gradient(135deg, #071a1f 0%, #0d2a32 48%, #143840 100%)
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f2f5f4' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-salt">
            Grippy research · Knowledge base
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-chalk md:text-6xl">
            Blind Test Protocol
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-chalk/75 md:text-lg">
            One playbook for the floor, the lab, and the decision table — so
            nobody mixes up PIN, access key, or what Sample A really is.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/blind-test"
              className="inline-flex h-12 items-center bg-salt px-6 text-sm font-semibold text-ink transition-transform hover:translate-y-px"
            >
              Start gym scoring
            </Link>
            <button
              type="button"
              onClick={() => scrollTo("tools")}
              className="inline-flex h-12 items-center border border-chalk/30 px-6 text-sm font-medium text-chalk transition-colors hover:bg-chalk/10"
            >
              Read the playbook
            </button>
          </div>
          <BlindTestNav
            current="guide"
            tone="onDark"
            className="mt-10 border-t border-chalk/15 pt-6"
          />
        </div>
      </section>

      {/* Role picker */}
      <section className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-mist">
            I am a…
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "group border px-4 py-4 text-left transition-all duration-300",
                  role === r.id
                    ? "border-ink bg-ink text-chalk shadow-[0_12px_40px_-20px_rgba(7,26,31,0.6)]"
                    : "border-border bg-chalk/60 text-ink hover:border-salt/60 hover:bg-accent/40"
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="block font-heading text-lg font-semibold tracking-tight">
                  {r.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-xs leading-snug",
                    role === r.id ? "text-chalk/70" : "text-muted-foreground"
                  )}
                >
                  {r.blurb}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[220px_1fr]">
        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-mist">
              On this page
            </p>
            {visibleSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "block w-full border-l-2 py-1.5 pl-3 text-left text-sm transition-colors",
                  activeSection === s.id
                    ? "border-salt text-ink"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-ink"
                )}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-16 pb-24">
          {visibleSections.some((s) => s.id === "tools") ? (
            <GuideSection id="tools" title="Three tools" kicker="Start here">
              <p className="text-muted-foreground">
                Same research stack, three jobs. Pick the tool that matches your
                role — not the one that looks interesting.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {TOOLS.map((tool, i) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="animate-guide-rise group relative flex flex-col overflow-hidden border border-border bg-chalk/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="font-mono text-xs text-mist">{tool.code}</span>
                    <h3 className="mt-3 font-heading text-2xl font-semibold text-ink">
                      {tool.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-salt">{tool.path}</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {tool.purpose}
                    </p>
                    <dl className="mt-6 space-y-2 border-t border-border/80 pt-4 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-mist">Who</dt>
                        <dd className="text-right text-ink">{tool.who}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-mist">Unlock</dt>
                        <dd className="text-right font-medium text-ink">{tool.key}</dd>
                      </div>
                    </dl>
                    <span className="mt-4 text-sm font-medium text-salt group-hover:underline">
                      Open →
                    </span>
                  </Link>
                ))}
              </div>
              <Callout title="Do not mix keys">
                Session <strong>PIN</strong> unlocks the gym form.{" "}
                <strong>Access key</strong> unlocks lab &amp; results. Neither is
                your WordPress password.
              </Callout>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "blind") ? (
            <GuideSection id="blind" title="Blindness rules" kicker="Non-negotiable">
              <ol className="space-y-4">
                {[
                  "Bags show only Sample A, B, C… — never the blend ratio.",
                  "The code→ratio map lives only in WordPress → Settings → Blind Test.",
                  "No “this is 30:70” talk on the floor.",
                  "Decode ratios only on /blind-test/results (internal).",
                  "One PIN + enabled-sample set per session. Change samples → update WP and ping the team.",
                ].map((item, i) => (
                  <li key={item} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink font-mono text-sm text-chalk">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-sm leading-relaxed text-ink md:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "lead") ? (
            <GuideSection id="lead" title="Lead checklist" kicker="Before the session">
              <p className="text-muted-foreground">
                In WordPress Admin → <strong>Settings → Blind Test</strong>
              </p>
              <Checklist
                items={[
                  "Set a 4-digit session PIN",
                  "Enable only the sample codes you brought to the gym",
                  "Map each enabled code to a seawater:mineral ratio",
                  "Confirm gym list and default round (R1/R2/R3)",
                  "Share PIN privately with floor staff",
                  "Share access key only with lab / analysis people",
                  "Confirm Vercel has BLIND_TEST_ACCESS_KEY (Redeploy after adding)",
                ]}
              />
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "gym") ? (
            <GuideSection id="gym" title="Gym flow" kicker="Floor playbook">
              <Steps
                steps={[
                  "Open /blind-test and enter the session PIN on the number pad",
                  "Choose Round and Gym; optional short tester code (e.g. T07)",
                  "Tap the letter printed on the bag",
                  "Score 1–5 (or Skip) for Grip, Moisture, Feel, Dust, Longevity",
                  "Optional preference rank + one-line note",
                  "Save → Test next sample. Do not compare answers mid-session",
                ]}
              />
              <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
                {[
                  { n: "1", l: "Clearly worse" },
                  { n: "3", l: "Average" },
                  { n: "5", l: "Best today" },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="border border-border bg-secondary/50 px-2 py-4"
                  >
                    <p className="font-heading text-3xl font-semibold text-ink">
                      {s.n}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/blind-test"
                  className="inline-flex h-12 items-center bg-ink px-6 text-sm font-semibold text-chalk"
                >
                  Open gym scoring →
                </Link>
              </div>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "lab") ? (
            <GuideSection id="lab" title="Lab flow" kicker="R&D playbook">
              <Steps
                steps={[
                  "Open /blind-test/lab and unlock with the access key",
                  "Select the round (R1 / R2 / R3)",
                  "Fill raw values per true ratio (friction, D50, PM2.5, cost…)",
                  "Set hard gates: Impurities / Metals / Caking / Skin → Pass or Fail",
                  "Save each row. Gate fails are marked “not recommended” in analysis",
                ]}
              />
              <div className="mt-8">
                <Link
                  href="/blind-test/lab"
                  className="inline-flex h-12 items-center bg-ink px-6 text-sm font-semibold text-chalk"
                >
                  Open lab entry →
                </Link>
              </div>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "results") ? (
            <GuideSection id="results" title="Analysis flow" kicker="Decision playbook">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    t: "Gym scores",
                    d: "Aggregates by sample (n, mean, SD) with decoded ratios",
                  },
                  {
                    t: "Lab multi-round",
                    d: "Normalized weighted scores, stability, hard gates",
                  },
                  {
                    t: "Decision matrix",
                    d: "Highest Avg · Lowest SD · Best Balance · Lowest Cost OK",
                  },
                ].map((card) => (
                  <div
                    key={card.t}
                    className="border border-border bg-accent/30 px-4 py-5"
                  >
                    <h3 className="font-heading text-lg font-semibold text-ink">
                      {card.t}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{card.d}</p>
                  </div>
                ))}
              </div>
              <Callout title="No significant difference">
                Score gap &lt; <strong>0.3</strong> → treat as a tie. Prefer
                stability and cost when choosing.
              </Callout>
              <div className="mt-8">
                <Link
                  href="/blind-test/results"
                  className="inline-flex h-12 items-center bg-ink px-6 text-sm font-semibold text-chalk"
                >
                  Open results →
                </Link>
              </div>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "rounds") ? (
            <GuideSection id="rounds" title="Test rounds" kicker="Cadence">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { r: "R1", t: "Screen", d: "Test all planned blends; drop clear losers." },
                  { r: "R2", t: "Stabilize", d: "Retest remaining (or all) for consistency." },
                  { r: "R3", t: "Confirm", d: "Only top 3–4 blends; lock the shortlist." },
                ].map((row) => (
                  <div key={row.r} className="border border-ink bg-ink px-5 py-6 text-chalk">
                    <p className="font-mono text-xs text-salt">{row.r}</p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold">
                      {row.t}
                    </h3>
                    <p className="mt-2 text-sm text-chalk/70">{row.d}</p>
                  </div>
                ))}
              </div>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "which") ? (
            <GuideSection id="which" title="Which page?" kicker="Quick lookup">
              <div className="overflow-x-auto border border-border">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 font-medium">Situation</th>
                      <th className="px-4 py-3 font-medium">Go to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Scoring bags at the gym", "/blind-test"],
                      ["Entering instrument readings", "/blind-test/lab"],
                      ["Seeing winners / exporting CSV", "/blind-test/results"],
                      ["Learning this protocol", "/blind-test/guide"],
                      ["Changing PIN / samples", "WP → Settings → Blind Test"],
                      ["Checking raw submissions", "WP → Blind Scores / Lab Data"],
                    ].map(([sit, go]) => (
                      <tr key={sit} className="border-t border-border">
                        <td className="px-4 py-3 text-muted-foreground">{sit}</td>
                        <td className="px-4 py-3 font-medium text-ink">{go}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GuideSection>
          ) : null}

          {visibleSections.some((s) => s.id === "faq") ? (
            <GuideSection id="faq" title="Troubleshooting" kicker="Unstuck">
              <div className="space-y-3">
                {[
                  {
                    q: "Wrong PIN",
                    a: "Check WP Settings → Blind Test. Do not type the access key here.",
                  },
                  {
                    q: "BLIND_TEST_ACCESS_KEY is not set",
                    a: "Add the env var on Vercel (or .env.local), then Redeploy / restart dev.",
                  },
                  {
                    q: "Incorrect access key",
                    a: "Env is set, but what you typed does not match the value.",
                  },
                  {
                    q: "No sample buttons on gym form",
                    a: "Enable sample codes in WP Settings → Blind Test.",
                  },
                  {
                    q: "Climber asks “what ratio is A?”",
                    a: "Do not answer. Decode later on /blind-test/results.",
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group border border-border bg-chalk/40 open:bg-accent/20"
                  >
                    <summary className="cursor-pointer list-none px-4 py-4 font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center justify-between gap-3">
                        {item.q}
                        <span className="text-mist transition-transform group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </GuideSection>
          ) : null}
        </div>
      </div>

    </div>
  );
}

function GuideSection({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-salt">
        {kicker}
      </p>
      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="mt-8 border-l-4 border-salt bg-accent/40 px-5 py-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </aside>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 border border-border bg-chalk/50 px-4 py-3 text-sm text-ink"
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-salt text-[10px] text-salt"
          >
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-2 space-y-0">
      {steps.map((step, i) => (
        <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
            />
          ) : null}
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center bg-salt font-mono text-xs font-semibold text-ink">
            {i + 1}
          </span>
          <p className="pt-1 text-sm leading-relaxed text-ink md:text-base">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}
