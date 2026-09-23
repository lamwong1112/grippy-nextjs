/** Shared constants and scoring for Grippy chalk blend blind tests. */

export const BLEND_RATIOS = [
  "0:100",
  "10:90",
  "20:80",
  "30:70",
  "40:60",
  "50:50",
  "60:40",
  "70:30",
  "80:20",
  "90:10",
  "100:0",
] as const;

export type BlendRatio = (typeof BLEND_RATIOS)[number];
export type TestRound = "R1" | "R2" | "R3";

export const GYM_SCORE_WEIGHTS = {
  friction: 25,
  moisture: 20,
  particle_feel: 15,
  dust: 10,
  longevity: 10,
} as const;

export type GymScoreKey = keyof typeof GYM_SCORE_WEIGHTS;

/** Full R&D weights from the scorecard (total 100). */
export const LAB_SCORE_WEIGHTS = {
  friction: 25,
  moisture: 20,
  caking: 15,
  particle: 15,
  dust: 10,
  longevity: 10,
  cost: 5,
} as const;

export type LabScoreKey = keyof typeof LAB_SCORE_WEIGHTS;

export type GateStatus = "pass" | "fail" | "pending" | null;

export interface BlindScoreEntry {
  id: number;
  sample_code: string;
  round: string;
  gym: string;
  tester_code: string;
  session_id: string;
  friction: number | null;
  moisture: number | null;
  particle_feel: number | null;
  dust: number | null;
  longevity: number | null;
  preference_rank: number | null;
  notes: string;
  weighted: number | null;
  created_at: string;
}

export interface LabMeasurementEntry {
  id: number;
  ratio: string;
  round: string;
  friction_coef: number | null;
  d50: number | null;
  particle_sd: number | null;
  moist_pct: number | null;
  abs_s: number | null;
  pm25: number | null;
  caking_30d: number | null;
  re_chalk: number | null;
  cost_per_g: number | null;
  feel: number | null;
  gate_impurities: GateStatus;
  gate_heavy_metals: GateStatus;
  gate_caking: GateStatus;
  gate_skin_safety: GateStatus;
  gate_overall: GateStatus;
  created_at: string;
  updated_at: string | null;
}

export function gymWeightedScore(
  scores: Partial<Record<GymScoreKey, number | null | undefined>>
): number | null {
  let sum = 0;
  let weightSum = 0;
  for (const key of Object.keys(GYM_SCORE_WEIGHTS) as GymScoreKey[]) {
    const value = scores[key];
    if (value == null) continue;
    const w = GYM_SCORE_WEIGHTS[key];
    sum += value * w;
    weightSum += w;
  }
  if (weightSum === 0) return null;
  return round3(sum / weightSum);
}

/** Higher-is-better min-max normalize to 1–5. */
export function normalizeHigherBetter(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 3;
  return 1 + (4 * (value - min)) / (max - min);
}

/** Lower-is-better min-max normalize to 1–5. */
export function normalizeLowerBetter(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 3;
  return 1 + (4 * (max - value)) / (max - min);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return values.length === 1 ? 0 : null;
  const m = mean(values);
  if (m == null) return null;
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export interface GymAggregateRow {
  sampleCode: string;
  ratio: string | null;
  n: number;
  avgFriction: number | null;
  avgMoisture: number | null;
  avgParticleFeel: number | null;
  avgDust: number | null;
  avgLongevity: number | null;
  avgWeighted: number | null;
  sdWeighted: number | null;
  rank: number | null;
}

export function aggregateGymScores(
  scores: BlindScoreEntry[],
  mapping: Record<string, string>,
  roundFilter?: string | null
): GymAggregateRow[] {
  const filtered = roundFilter
    ? scores.filter((s) => s.round === roundFilter)
    : scores;

  const bySample = new Map<string, BlindScoreEntry[]>();
  for (const entry of filtered) {
    const code = entry.sample_code;
    if (!code) continue;
    const list = bySample.get(code) ?? [];
    list.push(entry);
    bySample.set(code, list);
  }

  const rows: GymAggregateRow[] = [];
  for (const [sampleCode, list] of bySample) {
    const weighted = list
      .map((e) => e.weighted ?? gymWeightedScore(e))
      .filter((v): v is number => v != null);

    const avgOf = (key: GymScoreKey) =>
      mean(list.map((e) => e[key]).filter((v): v is number => v != null));

    rows.push({
      sampleCode,
      ratio: mapping[sampleCode] || null,
      n: list.length,
      avgFriction: avgOf("friction"),
      avgMoisture: avgOf("moisture"),
      avgParticleFeel: avgOf("particle_feel"),
      avgDust: avgOf("dust"),
      avgLongevity: avgOf("longevity"),
      avgWeighted: mean(weighted),
      sdWeighted: stdDev(weighted),
      rank: null,
    });
  }

  rows.sort((a, b) => (b.avgWeighted ?? -1) - (a.avgWeighted ?? -1));
  rows.forEach((row, i) => {
    row.rank = row.avgWeighted == null ? null : i + 1;
  });
  return rows;
}

export interface LabNormalizedScores {
  friction: number | null;
  particle: number | null;
  moisture: number | null;
  dust: number | null;
  caking: number | null;
  longevity: number | null;
  feel: number | null;
  cost: number | null;
  weighted: number | null;
}

/**
 * Normalize a set of lab rows that share the same round (or all rounds pooled).
 * Direction: higher better — friction_coef, re_chalk, feel
 * Lower better — particle_sd, moist_pct, abs_s, pm25, caking_30d, cost_per_g, d50 deviation handled via particle_sd
 */
export function normalizeLabBatch(
  rows: LabMeasurementEntry[]
): Map<number, LabNormalizedScores> {
  const result = new Map<number, LabNormalizedScores>();
  if (!rows.length) return result;

  const collect = (getter: (r: LabMeasurementEntry) => number | null) =>
    rows.map(getter).filter((v): v is number => v != null);

  const ranges = {
    friction_coef: collect((r) => r.friction_coef),
    particle_sd: collect((r) => r.particle_sd),
    moist_pct: collect((r) => r.moist_pct),
    abs_s: collect((r) => r.abs_s),
    pm25: collect((r) => r.pm25),
    caking_30d: collect((r) => r.caking_30d),
    re_chalk: collect((r) => r.re_chalk),
    cost_per_g: collect((r) => r.cost_per_g),
  };

  const minMax = (vals: number[]) =>
    vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : null;

  const mm = {
    friction_coef: minMax(ranges.friction_coef),
    particle_sd: minMax(ranges.particle_sd),
    moist_pct: minMax(ranges.moist_pct),
    abs_s: minMax(ranges.abs_s),
    pm25: minMax(ranges.pm25),
    caking_30d: minMax(ranges.caking_30d),
    re_chalk: minMax(ranges.re_chalk),
    cost_per_g: minMax(ranges.cost_per_g),
  };

  for (const row of rows) {
    const friction =
      row.friction_coef != null && mm.friction_coef
        ? normalizeHigherBetter(
            row.friction_coef,
            mm.friction_coef.min,
            mm.friction_coef.max
          )
        : null;

    const particle =
      row.particle_sd != null && mm.particle_sd
        ? normalizeLowerBetter(
            row.particle_sd,
            mm.particle_sd.min,
            mm.particle_sd.max
          )
        : row.feel != null
          ? row.feel
          : null;

    const moistureParts: number[] = [];
    if (row.moist_pct != null && mm.moist_pct) {
      moistureParts.push(
        normalizeLowerBetter(row.moist_pct, mm.moist_pct.min, mm.moist_pct.max)
      );
    }
    if (row.abs_s != null && mm.abs_s) {
      moistureParts.push(
        normalizeLowerBetter(row.abs_s, mm.abs_s.min, mm.abs_s.max)
      );
    }
    const moisture = mean(moistureParts);

    const dust =
      row.pm25 != null && mm.pm25
        ? normalizeLowerBetter(row.pm25, mm.pm25.min, mm.pm25.max)
        : null;

    const caking =
      row.caking_30d != null && mm.caking_30d
        ? normalizeLowerBetter(
            row.caking_30d,
            mm.caking_30d.min,
            mm.caking_30d.max
          )
        : null;

    const longevity =
      row.re_chalk != null && mm.re_chalk
        ? normalizeHigherBetter(row.re_chalk, mm.re_chalk.min, mm.re_chalk.max)
        : null;

    const cost =
      row.cost_per_g != null && mm.cost_per_g
        ? normalizeLowerBetter(
            row.cost_per_g,
            mm.cost_per_g.min,
            mm.cost_per_g.max
          )
        : null;

    const feel = row.feel;

    const parts: Array<{ key: LabScoreKey; value: number }> = [];
    if (friction != null) parts.push({ key: "friction", value: friction });
    if (moisture != null) parts.push({ key: "moisture", value: moisture });
    if (caking != null) parts.push({ key: "caking", value: caking });
    // particle weight covers particle consistency + feel
    const particleCombined =
      particle != null && feel != null
        ? (particle + feel) / 2
        : (particle ?? feel);
    if (particleCombined != null)
      parts.push({ key: "particle", value: particleCombined });
    if (dust != null) parts.push({ key: "dust", value: dust });
    if (longevity != null) parts.push({ key: "longevity", value: longevity });
    if (cost != null) parts.push({ key: "cost", value: cost });

    let weighted: number | null = null;
    if (parts.length) {
      let sum = 0;
      let wSum = 0;
      for (const p of parts) {
        const w = LAB_SCORE_WEIGHTS[p.key];
        sum += p.value * w;
        wSum += w;
      }
      weighted = wSum ? round3(sum / wSum) : null;
    }

    result.set(row.id, {
      friction: friction == null ? null : round3(friction),
      particle: particleCombined == null ? null : round3(particleCombined),
      moisture: moisture == null ? null : round3(moisture),
      dust: dust == null ? null : round3(dust),
      caking: caking == null ? null : round3(caking),
      longevity: longevity == null ? null : round3(longevity),
      feel: feel,
      cost: cost == null ? null : round3(cost),
      weighted,
    });
  }

  return result;
}

export interface MultiRoundRow {
  key: string;
  ratio: string | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  avg: number | null;
  sd: number | null;
  rank: number | null;
  stability: "high" | "medium" | "low" | null;
  recommended: boolean;
  gateFailed: boolean;
}

function stabilityFromSd(sd: number | null): MultiRoundRow["stability"] {
  if (sd == null) return null;
  if (sd < 0.2) return "high";
  if (sd < 0.4) return "medium";
  return "low";
}

export function multiRoundFromGym(
  scores: BlindScoreEntry[],
  mapping: Record<string, string>
): MultiRoundRow[] {
  const codes = [...new Set(scores.map((s) => s.sample_code).filter(Boolean))];
  const rows: MultiRoundRow[] = [];

  for (const code of codes) {
    const byRound = (round: TestRound) => {
      const list = scores.filter(
        (s) => s.sample_code === code && s.round === round
      );
      const weighted = list
        .map((e) => e.weighted ?? gymWeightedScore(e))
        .filter((v): v is number => v != null);
      return mean(weighted);
    };
    const r1 = byRound("R1");
    const r2 = byRound("R2");
    const r3 = byRound("R3");
    const vals = [r1, r2, r3].filter((v): v is number => v != null);
    const avg = mean(vals);
    const sd = stdDev(vals);
    rows.push({
      key: code,
      ratio: mapping[code] || null,
      r1,
      r2,
      r3,
      avg: avg == null ? null : round3(avg),
      sd: sd == null ? null : round3(sd),
      rank: null,
      stability: stabilityFromSd(sd),
      recommended: false,
      gateFailed: false,
    });
  }

  rows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  rows.forEach((row, i) => {
    row.rank = row.avg == null ? null : i + 1;
  });
  return rows;
}

export function multiRoundFromLab(lab: LabMeasurementEntry[]): MultiRoundRow[] {
  // Normalize per round separately for fair comparison within round
  const roundScores = new Map<string, Map<string, number>>();
  for (const round of ["R1", "R2", "R3"] as TestRound[]) {
    const roundRows = lab.filter((r) => r.round === round);
    const normalized = normalizeLabBatch(roundRows);
    const map = new Map<string, number>();
    for (const row of roundRows) {
      const n = normalized.get(row.id);
      if (n?.weighted != null) map.set(row.ratio, n.weighted);
    }
    roundScores.set(round, map);
  }

  const ratios = [...new Set(lab.map((r) => r.ratio).filter(Boolean))];
  const gateFailed = new Set<string>();
  for (const row of lab) {
    if (row.gate_overall === "fail") gateFailed.add(row.ratio);
  }

  const rows: MultiRoundRow[] = ratios.map((ratio) => {
    const r1 = roundScores.get("R1")?.get(ratio) ?? null;
    const r2 = roundScores.get("R2")?.get(ratio) ?? null;
    const r3 = roundScores.get("R3")?.get(ratio) ?? null;
    const vals = [r1, r2, r3].filter((v): v is number => v != null);
    const avg = mean(vals);
    const sd = stdDev(vals);
    return {
      key: ratio,
      ratio,
      r1: r1 == null ? null : round3(r1),
      r2: r2 == null ? null : round3(r2),
      r3: r3 == null ? null : round3(r3),
      avg: avg == null ? null : round3(avg),
      sd: sd == null ? null : round3(sd),
      rank: null,
      stability: stabilityFromSd(sd),
      recommended: false,
      gateFailed: gateFailed.has(ratio),
    };
  });

  const eligible = rows.filter((r) => !r.gateFailed && r.avg != null);
  eligible.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  eligible.forEach((row, i) => {
    row.rank = i + 1;
  });
  for (const row of rows) {
    if (row.gateFailed) row.rank = null;
  }
  return rows;
}

export interface DecisionRecommendation {
  type:
    | "highest_avg"
    | "lowest_sd"
    | "best_balance"
    | "lowest_cost_ok";
  label: string;
  description: string;
  key: string | null;
  ratio: string | null;
  score: number | null;
  meaning: string;
}

const NO_SIGNIFICANT_DIFF = 0.3;

export function buildDecisionMatrix(
  multiRound: MultiRoundRow[],
  lab: LabMeasurementEntry[],
  options?: { costScoreThreshold?: number }
): DecisionRecommendation[] {
  const threshold = options?.costScoreThreshold ?? 3.5;
  const eligible = multiRound.filter((r) => !r.gateFailed && r.avg != null);

  const highest = [...eligible].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))[0];
  const lowestSd = [...eligible]
    .filter((r) => r.sd != null)
    .sort((a, b) => (a.sd ?? 99) - (b.sd ?? 99))[0];
  const bestBalance = [...eligible]
    .filter((r) => r.avg != null && r.sd != null)
    .sort((a, b) => (b.avg! - b.sd!) - (a.avg! - a.sd!))[0];

  // Lowest cost among those with avg >= threshold
  const costByRatio = new Map<string, number>();
  for (const row of lab) {
    if (row.cost_per_g == null || !row.ratio) continue;
    const prev = costByRatio.get(row.ratio);
    if (prev == null || row.cost_per_g < prev) {
      costByRatio.set(row.ratio, row.cost_per_g);
    }
  }

  const costOk = eligible
    .filter((r) => (r.avg ?? 0) >= threshold && r.ratio && costByRatio.has(r.ratio))
    .sort(
      (a, b) =>
        (costByRatio.get(a.ratio!) ?? 999) - (costByRatio.get(b.ratio!) ?? 999)
    )[0];

  const tieNote = (row: MultiRoundRow | undefined) => {
    if (!row?.avg) return "";
    const close = eligible.filter(
      (r) =>
        r.key !== row.key &&
        r.avg != null &&
        Math.abs(r.avg - row.avg!) < NO_SIGNIFICANT_DIFF
    );
    if (!close.length) return "";
    return ` Diff < ${NO_SIGNIFICANT_DIFF} vs ${close.map((c) => c.key).join(", ")} — prefer stability/cost.`;
  };

  return [
    {
      type: "highest_avg",
      label: "Highest Avg",
      description: "Best overall performance",
      key: highest?.key ?? null,
      ratio: highest?.ratio ?? null,
      score: highest?.avg ?? null,
      meaning: "Best overall blend" + tieNote(highest),
    },
    {
      type: "lowest_sd",
      label: "Lowest SD",
      description: "Most stable across rounds",
      key: lowestSd?.key ?? null,
      ratio: lowestSd?.ratio ?? null,
      score: lowestSd?.sd ?? null,
      meaning: "Highest batch consistency" + tieNote(lowestSd),
    },
    {
      type: "best_balance",
      label: "Best Balance",
      description: "High score + low SD (avg − SD)",
      key: bestBalance?.key ?? null,
      ratio: bestBalance?.ratio ?? null,
      score:
        bestBalance?.avg != null && bestBalance?.sd != null
          ? round3(bestBalance.avg - bestBalance.sd)
          : null,
      meaning: "Performance + stability" + tieNote(bestBalance),
    },
    {
      type: "lowest_cost_ok",
      label: "Lowest Cost OK",
      description: `Lowest cost with score ≥ ${threshold}`,
      key: costOk?.key ?? null,
      ratio: costOk?.ratio ?? null,
      score: costOk?.ratio ? (costByRatio.get(costOk.ratio) ?? null) : null,
      meaning: "Commercial backup" + tieNote(costOk),
    },
  ];
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}
