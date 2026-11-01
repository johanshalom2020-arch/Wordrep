import { NextResponse } from "next/server";
import { getAuthConfiguration, validateCredentials } from "@/lib/auth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Attempt = { count: number; resetAt: number };
const globalForAuth = globalThis as typeof globalThis & {
  __folioLoginAttempts?: Map<string, Attempt>;
};
const attempts = globalForAuth.__folioLoginAttempts ?? new Map<string, Attempt>();
globalForAuth.__folioLoginAttempts = attempts;

function clientKey(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function activeAttempt(key: string): Attempt | null {
  const attempt = attempts.get(key);
  if (!attempt) return null;
  if (attempt.resetAt <= Date.now()) {
    attempts.delete(key);
    return null;
  }
  return attempt;
}

function recordFailure(key: string): Attempt {
  const current = activeAttempt(key);
  const next = current
    ? { ...current, count: current.count + 1 }
    : { count: 1, resetAt: Date.now() + WINDOW_MS };
  attempts.set(key, next);
  return next;
}

function retryAfterSeconds(attempt: Attempt): number {
  return Math.max(1, Math.ceil((attempt.resetAt - Date.now()) / 1000));
}

export async function POST(request: Request) {
  if (!getAuthConfiguration()) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  const key = clientKey(request);
  const existing = activeAttempt(key);
  if (existing && existing.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: "too_many_attempts", retryAfter: retryAfterSeconds(existing) },
      {
        status: 429,
        headers: {
          "cache-control": "no-store",
          "retry-after": String(retryAfterSeconds(existing)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const username =
    typeof body === "object" && body !== null && "username" in body
      ? String(body.username).slice(0, 320)
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String(body.password).slice(0, 1024)
      : "";

  if (!validateCredentials(username, password)) {
    const failed = recordFailure(key);
    const limited = failed.count >= MAX_ATTEMPTS;
    return NextResponse.json(
      {
        ok: false,
        error: limited ? "too_many_attempts" : "invalid_credentials",
        ...(limited ? { retryAfter: retryAfterSeconds(failed) } : {}),
      },
      {
        status: limited ? 429 : 401,
        headers: {
          "cache-control": "no-store",
          ...(limited ? { "retry-after": String(retryAfterSeconds(failed)) } : {}),
        },
      }
    );
  }

  attempts.delete(key);
  const token = await createSessionToken(username);
  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
