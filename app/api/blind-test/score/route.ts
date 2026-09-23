import { NextResponse } from "next/server";

import { getGymPinFromCookie, wpFetch } from "@/lib/blind-test/wp";

const SCORE_KEYS = [
  "friction",
  "moisture",
  "particle_feel",
  "dust",
  "longevity",
] as const;

function scoreOrNull(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined || value === "" || value === "n/a") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "invalid";
  return n;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const cookiePin = await getGymPinFromCookie();
  const pinFromBody =
    typeof raw.pin === "string" ? raw.pin.replace(/\D/g, "") : "";
  const pin = pinFromBody || cookiePin || "";

  if (pin.length !== 4) {
    return NextResponse.json(
      { error: "Session PIN required. Unlock the form first." },
      { status: 401 }
    );
  }

  const sample_code =
    typeof raw.sample_code === "string"
      ? raw.sample_code.trim().toUpperCase()
      : "";
  if (!sample_code) {
    return NextResponse.json(
      { error: "Select a sample code." },
      { status: 400 }
    );
  }

  const scores: Record<string, number | null> = {};
  let hasAny = false;
  for (const key of SCORE_KEYS) {
    const parsed = scoreOrNull(raw[key]);
    if (parsed === "invalid") {
      return NextResponse.json(
        { error: `Invalid score for ${key}. Use 1–5 or skip.` },
        { status: 400 }
      );
    }
    scores[key] = parsed;
    if (parsed != null) hasAny = true;
  }
  if (!hasAny) {
    return NextResponse.json(
      { error: "Rate at least one criterion." },
      { status: 400 }
    );
  }

  const payload = {
    pin,
    sample_code,
    round: typeof raw.round === "string" ? raw.round : "R1",
    gym: typeof raw.gym === "string" ? raw.gym : "",
    tester_code: typeof raw.tester_code === "string" ? raw.tester_code : "",
    session_id: typeof raw.session_id === "string" ? raw.session_id : "",
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 500) : "",
    preference_rank:
      raw.preference_rank === null ||
      raw.preference_rank === undefined ||
      raw.preference_rank === ""
        ? null
        : Number(raw.preference_rank),
    ...scores,
  };

  try {
    const response = await wpFetch("/blind-test/score", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      id?: number;
      weighted?: number;
      message?: string;
      code?: string;
    } | null;

    if (!response.ok) {
      const message =
        data?.message ||
        (response.status === 401 || response.status === 403
          ? data?.code === "invalid_pin"
            ? "Incorrect session PIN."
            : "WordPress rejected credentials. Check Application Password and plugin."
          : response.status === 404
            ? "Blind Test endpoint missing. Install Grippy Blind Test plugin."
            : "Could not save score.");
      return NextResponse.json(
        { error: message },
        {
          status:
            response.status >= 400 && response.status < 600
              ? response.status
              : 502,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      id: data?.id,
      weighted: data?.weighted,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach WordPress blind-test API." },
      { status: 502 }
    );
  }
}
