"use client";

import { useCallback, useEffect, useState } from "react";

import { AccessGate } from "@/components/blind-test/access-gate";
import { BlindTestNav } from "@/components/blind-test/blind-test-nav";
import {
  toCsv,
  type BlindScoreEntry,
  type DecisionRecommendation,
  type GymAggregateRow,
  type LabMeasurementEntry,
  type MultiRoundRow,
} from "@/lib/blind-test/scoring";
import { cn } from "@/lib/utils";

type AnalysisPayload = {
  gymAggAll: GymAggregateRow[];
  gymMulti: MultiRoundRow[];
  labMulti: MultiRoundRow[];
  decisionGym: DecisionRecommendation[];
  decisionLab: DecisionRecommendation[];
};

type EntriesResponse = {
  mapping: Record<string, string>;
  scores: BlindScoreEntry[];
  lab: LabMeasurementEntry[];
  analysis: AnalysisPayload;
};

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function ResultsDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<EntriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"gym" | "lab" | "decision">("gym");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/blind-test/auth");
      const json = await res.json();
      if (!cancelled) setAuthed(Boolean(json.authenticated));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blind-test/entries");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load.");
        return;
      }
      setData(json);
    } catch {
      setError("Could not load analysis data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  if (authed === null) {
    return (
      <div className="px-4 py-16 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!authed) {
    return (
      <AccessGate
        title="Blind test results"
        description="Internal analysis — sample codes are decoded to ratios here."
        onUnlocked={() => setAuthed(true)}
      />
    );
  }

  const analysis = data?.analysis;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-salt">
              Internal
            </p>
            <BlindTestNav current="results" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-ink">
            Analysis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gym aggregates, multi-round stability, lab decision matrix. Diff
            &lt; 0.3 = no significant difference.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="h-11 border border-border px-4 text-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              if (!data) return;
              downloadCsv(
                "grippy-gym-scores.csv",
                data.scores.map((s) => ({
                  ...s,
                  ratio: data.mapping[s.sample_code] ?? "",
                }))
              );
            }}
            className="h-11 bg-secondary px-4 text-sm font-medium"
          >
            Export gym CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (!data) return;
              downloadCsv("grippy-lab-measurements.csv", data.lab as unknown as Record<string, unknown>[]);
            }}
            className="h-11 bg-secondary px-4 text-sm font-medium"
          >
            Export lab CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (!analysis) return;
              downloadCsv(
                "grippy-gym-summary.csv",
                analysis.gymMulti as unknown as Record<string, unknown>[]
              );
            }}
            className="h-11 bg-ink px-4 text-sm font-medium text-chalk"
          >
            Export summary
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mt-6 flex gap-2 border-b border-border">
            {(
              [
                ["gym", "Gym scores"],
                ["lab", "Lab multi-round"],
                ["decision", "Decision matrix"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "h-11 px-4 text-sm font-medium",
                  tab === id
                    ? "border-b-2 border-ink text-ink"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "gym" && analysis ? (
            <div className="mt-6 space-y-10">
              <section>
                <h2 className="font-heading text-xl font-semibold">
                  Aggregate by sample (all rounds)
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.scores.length} submissions · mapping from WP settings
                </p>
                <div className="mt-4 overflow-x-auto border border-border">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-3 py-3">Rank</th>
                        <th className="px-3 py-3">Sample</th>
                        <th className="px-3 py-3">Ratio</th>
                        <th className="px-3 py-3">n</th>
                        <th className="px-3 py-3">Avg weighted</th>
                        <th className="px-3 py-3">SD</th>
                        <th className="px-3 py-3">Grip</th>
                        <th className="px-3 py-3">Moisture</th>
                        <th className="px-3 py-3">Feel</th>
                        <th className="px-3 py-3">Dust</th>
                        <th className="px-3 py-3">Longevity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.gymAggAll.map((row) => (
                        <tr
                          key={row.sampleCode}
                          className="border-t border-border"
                        >
                          <td className="px-3 py-2">{row.rank ?? "—"}</td>
                          <td className="px-3 py-2 font-semibold">
                            {row.sampleCode}
                          </td>
                          <td className="px-3 py-2">{row.ratio ?? "—"}</td>
                          <td className="px-3 py-2">{row.n}</td>
                          <td className="px-3 py-2">{fmt(row.avgWeighted)}</td>
                          <td className="px-3 py-2">{fmt(row.sdWeighted)}</td>
                          <td className="px-3 py-2">{fmt(row.avgFriction)}</td>
                          <td className="px-3 py-2">{fmt(row.avgMoisture)}</td>
                          <td className="px-3 py-2">
                            {fmt(row.avgParticleFeel)}
                          </td>
                          <td className="px-3 py-2">{fmt(row.avgDust)}</td>
                          <td className="px-3 py-2">{fmt(row.avgLongevity)}</td>
                        </tr>
                      ))}
                      {!analysis.gymAggAll.length ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-3 py-8 text-center text-muted-foreground"
                          >
                            No gym scores yet. Use /blind-test at the gym.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="font-heading text-xl font-semibold">
                  Multi-round (gym weighted)
                </h2>
                <MultiRoundTable rows={analysis.gymMulti} />
              </section>

              <section>
                <h2 className="font-heading text-xl font-semibold">
                  Blind code mapping
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(data.mapping).map(([code, ratio]) => (
                    <li
                      key={code}
                      className="border border-border bg-secondary/40 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">Sample {code}</span>
                      <span className="text-muted-foreground"> → </span>
                      {ratio || "—"}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}

          {tab === "lab" && analysis ? (
            <div className="mt-6">
              <h2 className="font-heading text-xl font-semibold">
                Multi-round lab (normalized weighted)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Gate fails are excluded from ranking.
              </p>
              <MultiRoundTable rows={analysis.labMulti} showGate />
              <p className="mt-4 text-sm">
                <a href="/blind-test/lab" className="underline">
                  Edit lab measurements
                </a>
              </p>
            </div>
          ) : null}

          {tab === "decision" && analysis ? (
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <DecisionPanel
                title="From gym multi-round"
                items={analysis.decisionGym}
              />
              <DecisionPanel
                title="From lab multi-round"
                items={analysis.decisionLab}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function MultiRoundTable({
  rows,
  showGate,
}: {
  rows: MultiRoundRow[];
  showGate?: boolean;
}) {
  return (
    <div className="mt-4 overflow-x-auto border border-border">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="px-3 py-3">Rank</th>
            <th className="px-3 py-3">Key</th>
            <th className="px-3 py-3">Ratio</th>
            <th className="px-3 py-3">R1</th>
            <th className="px-3 py-3">R2</th>
            <th className="px-3 py-3">R3</th>
            <th className="px-3 py-3">Avg</th>
            <th className="px-3 py-3">SD</th>
            <th className="px-3 py-3">Stability</th>
            {showGate ? <th className="px-3 py-3">Gate</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                "border-t border-border",
                row.gateFailed && "bg-destructive/5"
              )}
            >
              <td className="px-3 py-2">{row.rank ?? "—"}</td>
              <td className="px-3 py-2 font-semibold">{row.key}</td>
              <td className="px-3 py-2">{row.ratio ?? "—"}</td>
              <td className="px-3 py-2">{fmt(row.r1)}</td>
              <td className="px-3 py-2">{fmt(row.r2)}</td>
              <td className="px-3 py-2">{fmt(row.r3)}</td>
              <td className="px-3 py-2">{fmt(row.avg)}</td>
              <td className="px-3 py-2">{fmt(row.sd)}</td>
              <td className="px-3 py-2">{row.stability ?? "—"}</td>
              {showGate ? (
                <td className="px-3 py-2">
                  {row.gateFailed ? "Fail / 不建议" : "OK"}
                </td>
              ) : null}
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td
                colSpan={showGate ? 10 : 9}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                No data yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function DecisionPanel({
  title,
  items,
}: {
  title: string;
  items: DecisionRecommendation[];
}) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.type}
            className="border border-border bg-secondary/30 px-4 py-4"
          >
            <p className="text-xs uppercase tracking-wide text-mist">
              {item.label}
            </p>
            <p className="mt-1 font-heading text-2xl font-semibold text-ink">
              {item.key
                ? item.ratio
                  ? `${item.key} (${item.ratio})`
                  : item.key
                : "Pending"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
              {item.score != null ? ` · ${fmt(item.score)}` : ""}
            </p>
            <p className="mt-2 text-sm">{item.meaning}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
