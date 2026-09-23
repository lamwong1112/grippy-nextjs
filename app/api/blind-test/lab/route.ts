import { NextResponse } from "next/server";

import { BLEND_RATIOS } from "@/lib/blind-test/scoring";
import { hasBlindTestAccess, wpFetch } from "@/lib/blind-test/wp";

export async function POST(request: Request) {
  if (!(await hasBlindTestAccess(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
  const ratio = typeof raw.ratio === "string" ? raw.ratio : "";
  if (!(BLEND_RATIOS as readonly string[]).includes(ratio)) {
    return NextResponse.json({ error: "Invalid blend ratio." }, { status: 400 });
  }

  try {
    const response = await wpFetch("/blind-test/lab", {
      method: "POST",
      body: JSON.stringify(raw),
    });
    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      id?: number;
      gate_overall?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            (response.status === 404
              ? "Blind Test plugin missing."
              : "Could not save lab measurement."),
        },
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
      gate_overall: data?.gate_overall,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach WordPress lab API." },
      { status: 502 }
    );
  }
}
