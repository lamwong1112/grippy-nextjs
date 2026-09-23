import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getWordpressUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_URL is not set");
  }
  return url.replace(/\/$/, "");
}

function getWpAuthHeader(): string {
  const user = process.env.WP_APPLICATION_USER;
  const password = process.env.WP_APPLICATION_PASSWORD;
  if (!user || !password) {
    throw new Error(
      "WP_APPLICATION_USER and WP_APPLICATION_PASSWORD must be set"
    );
  }
  // Application passwords may include spaces; strip them for Basic auth.
  const token = Buffer.from(`${user}:${password.replace(/\s+/g, "")}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  let authHeader: string;
  let wpUrl: string;
  try {
    authHeader = getWpAuthHeader();
    wpUrl = getWordpressUrl();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Waitlist is not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const response = await fetch(`${wpUrl}/wp-json/grippy/v1/waitlist`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      alreadyJoined?: boolean;
      code?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      const message =
        data?.message ||
        (response.status === 401 || response.status === 403
          ? "WordPress rejected waitlist credentials. Check Application Password and plugin."
          : response.status === 404
            ? "Waitlist endpoint missing. Install and activate the Grippy Waitlist plugin."
            : "Could not save waitlist signup.");
      return NextResponse.json(
        { error: message },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyJoined: Boolean(data?.alreadyJoined),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach WordPress waitlist API." },
      { status: 502 }
    );
  }
}
