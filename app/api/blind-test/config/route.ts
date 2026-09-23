import { NextResponse } from "next/server";

import { wpFetch } from "@/lib/blind-test/wp";

export async function GET() {
  try {
    const response = await wpFetch("/blind-test/public-config", {
      method: "GET",
      auth: false,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            (response.status === 404
              ? "Blind Test plugin missing. Install and activate Grippy Blind Test."
              : "Could not load blind test config."),
        },
        {
          status:
            response.status >= 400 && response.status < 600
              ? response.status
              : 502,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Config unavailable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
