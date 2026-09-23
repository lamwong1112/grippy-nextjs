import { NextResponse } from "next/server";

import {
  BLIND_TEST_COOKIE,
  GYM_PIN_COOKIE,
  getAccessKey,
  timingSafeEqualString,
  wpFetch,
} from "@/lib/blind-test/wp";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action =
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    typeof (body as { action: unknown }).action === "string"
      ? (body as { action: string }).action
      : "";

  if (action === "access") {
    const key =
      typeof body === "object" &&
      body !== null &&
      "key" in body &&
      typeof (body as { key: unknown }).key === "string"
        ? (body as { key: string }).key
        : "";

    let expected: string;
    try {
      expected = getAccessKey();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Access key not configured.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!key || !timingSafeEqualString(key, expected)) {
      return NextResponse.json({ error: "Incorrect access key." }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(BLIND_TEST_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(BLIND_TEST_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  if (action === "pin") {
    const pin =
      typeof body === "object" &&
      body !== null &&
      "pin" in body &&
      typeof (body as { pin: unknown }).pin === "string"
        ? (body as { pin: string }).pin.replace(/\D/g, "")
        : "";

    if (pin.length !== 4) {
      return NextResponse.json(
        { error: "Enter the 4-digit session PIN." },
        { status: 400 }
      );
    }

    try {
      const response = await wpFetch("/blind-test/verify-pin", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ pin }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok) {
        return NextResponse.json(
          { error: data?.message || "Incorrect session PIN." },
          { status: response.status === 403 ? 403 : 502 }
        );
      }

      const res = NextResponse.json({ ok: true });
      res.cookies.set(GYM_PIN_COOKIE, pin, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      return res;
    } catch {
      return NextResponse.json(
        { error: "Could not verify PIN with WordPress." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function GET() {
  const { hasBlindTestAccess } = await import("@/lib/blind-test/wp");
  const ok = await hasBlindTestAccess();
  return NextResponse.json({ authenticated: ok });
}
