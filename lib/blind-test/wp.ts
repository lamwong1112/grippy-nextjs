import "server-only";

import { cookies } from "next/headers";

export const BLIND_TEST_COOKIE = "grippy_blind_test_access";
export const GYM_PIN_COOKIE = "grippy_blind_test_pin";

export function getWordpressUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_URL is not set");
  }
  return url.replace(/\/$/, "");
}

export function getWpAuthHeader(): string {
  const user = process.env.WP_APPLICATION_USER;
  const password = process.env.WP_APPLICATION_PASSWORD;
  if (!user || !password) {
    throw new Error(
      "WP_APPLICATION_USER and WP_APPLICATION_PASSWORD must be set"
    );
  }
  const token = Buffer.from(`${user}:${password.replace(/\s+/g, "")}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

export function getAccessKey(): string {
  const key = process.env.BLIND_TEST_ACCESS_KEY;
  if (!key) {
    throw new Error("BLIND_TEST_ACCESS_KEY is not set");
  }
  return key;
}

export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function hasBlindTestAccess(
  request?: Request
): Promise<boolean> {
  let expected: string;
  try {
    expected = getAccessKey();
  } catch {
    return false;
  }

  const headerKey = request?.headers.get("x-blind-test-key");
  if (headerKey && timingSafeEqualString(headerKey, expected)) {
    return true;
  }

  const jar = await cookies();
  const cookieVal = jar.get(BLIND_TEST_COOKIE)?.value;
  return Boolean(cookieVal && timingSafeEqualString(cookieVal, expected));
}

export async function getGymPinFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GYM_PIN_COOKIE)?.value ?? null;
}

export async function wpFetch(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<Response> {
  const wpUrl = getWordpressUrl();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.auth !== false) {
    headers.set("Authorization", getWpAuthHeader());
  }
  return fetch(`${wpUrl}/wp-json/grippy/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
