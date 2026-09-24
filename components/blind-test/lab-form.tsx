"use client";

import { useCallback, useEffect, useState } from "react";

import { AccessGate } from "@/components/blind-test/access-gate";
import { BlindTestNav } from "@/components/blind-test/blind-test-nav";
import {
  BLEND_RATIOS,
  type LabMeasurementEntry,
  type TestRound,
} from "@/lib/blind-test/scoring";
import { cn } from "@/lib/utils";

type GateField =
  | "gate_impurities"
  | "gate_heavy_metals"
  | "gate_caking"
  | "gate_skin_safety";

type LabDraft = {
  id?: number;
  ratio: string;
  round: TestRound;
  friction_coef: string;
  d50: string;
  particle_sd: string;
  moist_pct: string;
  abs_s: string;
  pm25: string;
  caking_30d: string;
  re_chalk: string;
  cost_per_g: string;
  feel: string;
  gate_impurities: string;
  gate_heavy_metals: string;
  gate_caking: string;
  gate_skin_safety: string;
};

const EMPTY_NUM = "";

type FieldGuide = {
  key: keyof LabDraft | "feel" | GateField | "ratio";
  label: string;
  unit: string;
  meaning: string;
  example: string;
  better: string;
  notThis: string;
};

/** Shown above the table so staff know raw values vs 1–5 scores. */
const FIELD_GUIDE: FieldGuide[] = [
  {
    key: "friction_coef",
    label: "Friction",
    unit: "coefficient (instrument)",
    meaning: "Lab friction coefficient from your test method.",
    example: "0.72",
    better: "Higher is better",
    notThis: "Do not enter a 1–5 score here.",
  },
  {
    key: "d50",
    label: "D50",
    unit: "μm",
    meaning: "Median particle size (D50).",
    example: "30",
    better: "Reference; scoring leans on PSD SD + Feel",
    notThis: "Not a blend ratio (e.g. not 30:70).",
  },
  {
    key: "particle_sd",
    label: "PSD SD",
    unit: "same scale as D50",
    meaning: "Particle-size spread (standard deviation). More uniform → lower SD.",
    example: "9",
    better: "Lower is better",
    notThis: "Do not enter a 1–5 score.",
  },
  {
    key: "moist_pct",
    label: "Moist%",
    unit: "% moisture",
    meaning: "Moisture content as a percent. Use one convention for the whole table.",
    example: "0.5 (= 0.5%)",
    better: "Lower is better",
    notThis: "Do not enter 50 if you mean 0.5%.",
  },
  {
    key: "abs_s",
    label: "Abs(s)",
    unit: "seconds",
    meaning: "Time to recover dryness after sweat / humidity challenge.",
    example: "40",
    better: "Lower is better (recovers faster)",
    notThis: "Seconds, not minutes.",
  },
  {
    key: "pm25",
    label: "PM2.5",
    unit: "your meter’s unit",
    meaning: "Dust / airborne particulate reading. Same instrument for every row.",
    example: "14",
    better: "Lower is better",
    notThis: "Do not mix units across rows.",
  },
  {
    key: "caking_30d",
    label: "Caking",
    unit: "your 30-day scale (e.g. 0–5)",
    meaning: "Caking severity after aging. Pick one scale and use it for every ratio.",
    example: "0=none … 5=severe",
    better: "Lower is better",
    notThis: "Do not switch between % and 0–5 mid-study.",
  },
  {
    key: "re_chalk",
    label: "Re-chalk",
    unit: "attempts per application",
    meaning: "How many climbing attempts one chalking lasts.",
    example: "7",
    better: "Higher is better",
    notThis: "Count of attempts, not a 1–5 score.",
  },
  {
    key: "cost_per_g",
    label: "Cost/g",
    unit: "currency per gram (e.g. HKD/g)",
    meaning: "Ingredient / production cost per gram. Same currency for every row.",
    example: "0.16",
    better: "Lower is better",
    notThis: "Per gram — not total bag cost.",
  },
  {
    key: "feel",
    label: "Feel",
    unit: "1–5 only",
    meaning: "Lab hand-feel rating. This is the only column that uses the scorecard 1–5 scale directly.",
    example: "4",
    better: "Higher is better",
    notThis: "Do not put instrument readings here.",
  },
  {
    key: "gate_impurities",
    label: "Impurities",
    unit: "Pass / Fail",
    meaning: "Hard gate: Cl+K+S+Na within limit.",
    example: "Pass",
    better: "Must Pass to be recommended",
    notThis: "Fail excludes the blend from recommendations.",
  },
  {
    key: "gate_heavy_metals",
    label: "Metals",
    unit: "Pass / Fail",
    meaning: "Hard gate: Pb / As / Cd under regulatory limits.",
    example: "Pass",
    better: "Must Pass to be recommended",
    notThis: "Leave blank if not tested yet.",
  },
  {
    key: "gate_caking",
    label: "Caking gate",
    unit: "Pass / Fail",
    meaning: "Hard gate: no severe caking after 30-day aging.",
    example: "Pass",
    better: "Must Pass to be recommended",
    notThis: "Different from the numeric Caking column.",
  },
  {
    key: "gate_skin_safety",
    label: "Skin",
    unit: "Pass / Fail",
    meaning: "Hard gate: no allergy / irritation in the agreed skin-safety check.",
    example: "Pass",
    better: "Must Pass to be recommended",
    notThis: "Leave blank if pending.",
  },
];

const GUIDE_BY_KEY = Object.fromEntries(
  FIELD_GUIDE.map((f) => [f.key, f])
) as Record<string, FieldGuide>;

function entryToDraft(entry: LabMeasurementEntry): LabDraft {
  const str = (v: number | null) => (v == null ? EMPTY_NUM : String(v));
  return {
    id: entry.id,
    ratio: entry.ratio,
    round: (entry.round as TestRound) || "R1",
    friction_coef: str(entry.friction_coef),
    d50: str(entry.d50),
    particle_sd: str(entry.particle_sd),
    moist_pct: str(entry.moist_pct),
    abs_s: str(entry.abs_s),
    pm25: str(entry.pm25),
    caking_30d: str(entry.caking_30d),
    re_chalk: str(entry.re_chalk),
    cost_per_g: str(entry.cost_per_g),
    feel: entry.feel == null ? "" : String(entry.feel),
    gate_impurities: entry.gate_impurities || "",
    gate_heavy_metals: entry.gate_heavy_metals || "",
    gate_caking: entry.gate_caking || "",
    gate_skin_safety: entry.gate_skin_safety || "",
  };
}

function blankDraft(ratio: string, round: TestRound): LabDraft {
  return {
    ratio,
    round,
    friction_coef: EMPTY_NUM,
    d50: EMPTY_NUM,
    particle_sd: EMPTY_NUM,
    moist_pct: EMPTY_NUM,
    abs_s: EMPTY_NUM,
    pm25: EMPTY_NUM,
    caking_30d: EMPTY_NUM,
    re_chalk: EMPTY_NUM,
    cost_per_g: EMPTY_NUM,
    feel: "",
    gate_impurities: "",
    gate_heavy_metals: "",
    gate_caking: "",
    gate_skin_safety: "",
  };
}

function parseNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function LabEntryApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [round, setRound] = useState<TestRound>("R1");
  const [drafts, setDrafts] = useState<LabDraft[]>(() =>
    BLEND_RATIOS.map((r) => blankDraft(r, "R1"))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingRatio, setSavingRatio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/blind-test/auth");
      const data = await res.json();
      if (!cancelled) setAuthed(Boolean(data.authenticated));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blind-test/entries");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load lab data.");
        return;
      }
      const lab = (data.lab ?? []) as LabMeasurementEntry[];
      setDrafts(
        BLEND_RATIOS.map((ratio) => {
          const found = lab.find(
            (row) => row.ratio === ratio && row.round === round
          );
          return found ? entryToDraft(found) : blankDraft(ratio, round);
        })
      );
    } catch {
      setError("Could not load lab data.");
    } finally {
      setLoading(false);
    }
  }, [round]);

  useEffect(() => {
    if (authed) void loadEntries();
  }, [authed, loadEntries]);

  function updateDraft(ratio: string, patch: Partial<LabDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.ratio === ratio ? { ...d, ...patch } : d))
    );
  }

  async function saveRow(draft: LabDraft) {
    setSavingRatio(draft.ratio);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        id: draft.id,
        ratio: draft.ratio,
        round,
        friction_coef: parseNum(draft.friction_coef),
        d50: parseNum(draft.d50),
        particle_sd: parseNum(draft.particle_sd),
        moist_pct: parseNum(draft.moist_pct),
        abs_s: parseNum(draft.abs_s),
        pm25: parseNum(draft.pm25),
        caking_30d: parseNum(draft.caking_30d),
        re_chalk: parseNum(draft.re_chalk),
        cost_per_g: parseNum(draft.cost_per_g),
        feel: draft.feel === "" ? null : Number(draft.feel),
        gate_impurities: draft.gate_impurities || null,
        gate_heavy_metals: draft.gate_heavy_metals || null,
        gate_caking: draft.gate_caking || null,
        gate_skin_safety: draft.gate_skin_safety || null,
      };
      const res = await fetch("/api/blind-test/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Save failed for ${draft.ratio}`);
        return;
      }
      setMessage(`Saved ${draft.ratio} (${round})`);
      updateDraft(draft.ratio, { id: data.id });
    } catch {
      setError(`Network error saving ${draft.ratio}`);
    } finally {
      setSavingRatio(null);
    }
  }

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
        title="Lab data entry"
        description="Password-protected. Same key as the results page."
        onUnlocked={() => setAuthed(true)}
      />
    );
  }

  const numFields: Array<{ key: keyof LabDraft; label: string }> = [
    { key: "friction_coef", label: "Friction" },
    { key: "d50", label: "D50" },
    { key: "particle_sd", label: "PSD SD" },
    { key: "moist_pct", label: "Moist%" },
    { key: "abs_s", label: "Abs(s)" },
    { key: "pm25", label: "PM2.5" },
    { key: "caking_30d", label: "Caking" },
    { key: "re_chalk", label: "Re-chalk" },
    { key: "cost_per_g", label: "Cost/g" },
  ];

  const gates: Array<{ key: GateField; label: string }> = [
    { key: "gate_impurities", label: "Impurities" },
    { key: "gate_heavy_metals", label: "Metals" },
    { key: "gate_caking", label: "Caking gate" },
    { key: "gate_skin_safety", label: "Skin" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-salt">
              Internal
            </p>
            <BlindTestNav current="lab" />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-ink">
            Lab measurements
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Enter <strong className="font-medium text-ink">raw instrument values</strong>
            {" "}
            (not 1–5 scores), except <strong className="font-medium text-ink">Feel</strong>.
            Leave untested cells empty. Same units across every ratio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(["R1", "R2", "R3"] as TestRound[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRound(r)}
              className={cn(
                "h-11 min-w-14 px-4 text-sm font-semibold",
                round === r ? "bg-ink text-chalk" : "bg-secondary text-ink"
              )}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="h-11 border border-border px-4 text-sm"
          >
            {showGuide ? "Hide field guide" : "Show field guide"}
          </button>
          <button
            type="button"
            onClick={() => void loadEntries()}
            className="h-11 border border-border px-4 text-sm"
          >
            Reload
          </button>
        </div>
      </div>

      {showGuide ? (
        <div className="mt-6 border border-border bg-chalk/60">
          <div className="border-b border-border bg-secondary/80 px-4 py-3">
            <p className="font-heading text-lg font-semibold text-ink">
              Field guide — what to type
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hover a column header in the table for a short tip. Examples below
              are illustrative only.
            </p>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {FIELD_GUIDE.map((f) => (
              <article
                key={f.key}
                className="border-b border-border px-4 py-4 sm:border-r last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-ink">{f.label}</h3>
                  <span className="font-mono text-[11px] text-mist">{f.unit}</span>
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  {f.meaning}
                </p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-mist">Example</dt>
                    <dd className="font-mono text-ink">{f.example}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-mist">Direction</dt>
                    <dd className="text-ink">{f.better}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-mist">Avoid</dt>
                    <dd className="text-ink">{f.notThis}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-salt" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="min-w-[1100px] w-full border-collapse text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="sticky left-0 z-10 bg-secondary px-3 py-3">
                Ratio
                <span className="mt-0.5 block text-[10px] font-normal text-mist">
                  sea:mineral
                </span>
              </th>
              {numFields.map((f) => {
                const guide = GUIDE_BY_KEY[f.key];
                return (
                  <th
                    key={f.key}
                    className="px-2 py-3 font-medium"
                    title={
                      guide
                        ? `${guide.meaning} Example: ${guide.example}. ${guide.notThis}`
                        : undefined
                    }
                  >
                    {f.label}
                    {guide ? (
                      <span className="mt-0.5 block text-[10px] font-normal text-mist">
                        e.g. {guide.example}
                      </span>
                    ) : null}
                  </th>
                );
              })}
              <th
                className="px-2 py-3"
                title={
                  GUIDE_BY_KEY.feel
                    ? `${GUIDE_BY_KEY.feel.meaning} ${GUIDE_BY_KEY.feel.notThis}`
                    : undefined
                }
              >
                Feel
                <span className="mt-0.5 block text-[10px] font-normal text-mist">
                  1–5 only
                </span>
              </th>
              {gates.map((g) => {
                const guide = GUIDE_BY_KEY[g.key];
                return (
                  <th
                    key={g.key}
                    className="px-2 py-3"
                    title={
                      guide
                        ? `${guide.meaning} ${guide.notThis}`
                        : undefined
                    }
                  >
                    {g.label}
                    <span className="mt-0.5 block text-[10px] font-normal text-mist">
                      Pass/Fail
                    </span>
                  </th>
                );
              })}
              <th className="px-3 py-3">Save</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.ratio} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-semibold">
                  {draft.ratio}
                </td>
                {numFields.map((f) => {
                  const guide = GUIDE_BY_KEY[f.key];
                  return (
                    <td key={f.key} className="px-1 py-1">
                      <input
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) =>
                          updateDraft(draft.ratio, {
                            [f.key]: e.target.value,
                          } as Partial<LabDraft>)
                        }
                        inputMode="decimal"
                        placeholder={guide?.example.split(" ")[0] ?? ""}
                        aria-label={`${f.label} for ${draft.ratio}`}
                        title={
                          guide
                            ? `${guide.meaning} Example: ${guide.example}`
                            : undefined
                        }
                        className="h-10 w-20 border border-border bg-chalk px-2 outline-none focus:ring-1 focus:ring-salt"
                      />
                    </td>
                  );
                })}
                <td className="px-1 py-1">
                  <select
                    value={draft.feel}
                    onChange={(e) =>
                      updateDraft(draft.ratio, { feel: e.target.value })
                    }
                    aria-label={`Feel for ${draft.ratio}`}
                    title={GUIDE_BY_KEY.feel?.meaning}
                    className="h-10 border border-border bg-chalk px-1"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                {gates.map((g) => (
                  <td key={g.key} className="px-1 py-1">
                    <select
                      value={draft[g.key]}
                      onChange={(e) =>
                        updateDraft(draft.ratio, {
                          [g.key]: e.target.value,
                        } as Partial<LabDraft>)
                      }
                      aria-label={`${g.label} for ${draft.ratio}`}
                      title={GUIDE_BY_KEY[g.key]?.meaning}
                      className="h-10 border border-border bg-chalk px-1"
                    >
                      <option value="">—</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </td>
                ))}
                <td className="px-2 py-1">
                  <button
                    type="button"
                    disabled={savingRatio === draft.ratio}
                    onClick={() => void saveRow({ ...draft, round })}
                    className="h-10 bg-ink px-3 text-xs font-medium text-chalk disabled:opacity-50"
                  >
                    {savingRatio === draft.ratio ? "…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Hard-gate Fail marks a ratio as “not recommended” in analysis.{" "}
        <a href="/blind-test/results" className="underline">
          Open results
        </a>
      </p>
    </div>
  );
}
