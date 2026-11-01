const SESSION_VERSION = 1;
export const SESSION_COOKIE_NAME = "folio_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

type SessionPayload = {
  v: number;
  sub: string;
  iat: number;
  exp: number;
  nonce: string;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function hasValidSessionSecret(): boolean {
  return getSessionSecret() !== null;
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("AUTH_SECRET must contain at least 32 characters");

  const now = Math.floor(Date.now() / 1000);
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    sub: username,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
    nonce: toBase64Url(nonceBytes),
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getSigningKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload)));
  return `${encodedPayload}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret || !token || token.length > 4096) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  const signature = fromBase64Url(encodedSignature);
  const payloadBytes = fromBase64Url(encodedPayload);
  if (!signature || !payloadBytes) return null;

  try {
    const key = await getSigningKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(encodedPayload));
    if (!valid) return null;

    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      parsed.v !== SESSION_VERSION ||
      typeof parsed.sub !== "string" ||
      parsed.sub.length < 1 ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.nonce !== "string" ||
      parsed.iat > now + 60 ||
      parsed.exp <= now ||
      parsed.exp - parsed.iat > SESSION_MAX_AGE_SECONDS
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export function readSessionCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function requestHasValidSession(request: Request): Promise<boolean> {
  const token = readSessionCookie(request.headers.get("cookie"));
  return (await verifySessionToken(token)) !== null;
}

export async function requireApiSession(request: Request): Promise<Response | null> {
  if (await requestHasValidSession(request)) return null;
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "cache-control": "no-store" } }
  );
}
