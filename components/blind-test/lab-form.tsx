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
          <p className="mt-1 text-sm text-muted-foreground">
            Enter raw values by ratio. Normalization runs on the results page.
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
            onClick={() => void loadEntries()}
            className="h-11 border border-border px-4 text-sm"
          >
            Reload
          </button>
        </div>
      </div>

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
              <th className="sticky left-0 z-10 bg-secondary px-3 py-3">Ratio</th>
              {numFields.map((f) => (
                <th key={f.key} className="px-2 py-3 font-medium">
                  {f.label}
                </th>
              ))}
              <th className="px-2 py-3">Feel</th>
              {gates.map((g) => (
                <th key={g.key} className="px-2 py-3">
                  {g.label}
                </th>
              ))}
              <th className="px-3 py-3">Save</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.ratio} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-semibold">
                  {draft.ratio}
                </td>
                {numFields.map((f) => (
                  <td key={f.key} className="px-1 py-1">
                    <input
                      value={String(draft[f.key] ?? "")}
                      onChange={(e) =>
                        updateDraft(draft.ratio, {
                          [f.key]: e.target.value,
                        } as Partial<LabDraft>)
                      }
                      inputMode="decimal"
                      className="h-10 w-20 border border-border bg-chalk px-2 outline-none focus:ring-1 focus:ring-salt"
                    />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <select
                    value={draft.feel}
                    onChange={(e) =>
                      updateDraft(draft.ratio, { feel: e.target.value })
                    }
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
        Hard-gate fail marks a ratio as “not recommended” in analysis.{" "}
        <a href="/blind-test/results" className="underline">
          Open results
        </a>
      </p>
    </div>
  );
}
