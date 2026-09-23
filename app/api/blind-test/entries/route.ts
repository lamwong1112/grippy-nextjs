import { NextResponse } from "next/server";

import {
  aggregateGymScores,
  buildDecisionMatrix,
  multiRoundFromGym,
  multiRoundFromLab,
  normalizeLabBatch,
  type BlindScoreEntry,
  type LabMeasurementEntry,
} from "@/lib/blind-test/scoring";
import { hasBlindTestAccess, wpFetch } from "@/lib/blind-test/wp";

export async function GET(request: Request) {
  if (!(await hasBlindTestAccess(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await wpFetch("/blind-test/entries", { method: "GET" });
    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      mapping?: Record<string, string>;
      enabledSamples?: string[];
      scores?: BlindScoreEntry[];
      lab?: LabMeasurementEntry[];
      ratios?: string[];
      message?: string;
    } | null;

    if (!response.ok || !data) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            (response.status === 404
              ? "Blind Test plugin missing."
              : "Could not load entries."),
        },
        {
          status:
            response.status >= 400 && response.status < 600
              ? response.status
              : 502,
        }
      );
    }

    const mapping = data.mapping ?? {};
    const scores = data.scores ?? [];
    const lab = data.lab ?? [];

    const gymAggAll = aggregateGymScores(scores, mapping);
    const gymAggR1 = aggregateGymScores(scores, mapping, "R1");
    const gymAggR2 = aggregateGymScores(scores, mapping, "R2");
    const gymAggR3 = aggregateGymScores(scores, mapping, "R3");
    const gymMulti = multiRoundFromGym(scores, mapping);
    const labMulti = multiRoundFromLab(lab);
    const labNormalized = Object.fromEntries(
      [...normalizeLabBatch(lab).entries()].map(([id, n]) => [String(id), n])
    );
    const decisionGym = buildDecisionMatrix(gymMulti, lab);
    const decisionLab = buildDecisionMatrix(labMulti, lab);

    return NextResponse.json({
      ok: true,
      mapping,
      enabledSamples: data.enabledSamples ?? [],
      ratios: data.ratios ?? [],
      scores,
      lab,
      analysis: {
        gymAggAll,
        gymAggR1,
        gymAggR2,
        gymAggR3,
        gymMulti,
        labMulti,
        labNormalized,
        decisionGym,
        decisionLab,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach WordPress entries API." },
      { status: 502 }
    );
  }
}
