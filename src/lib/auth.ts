/**
 * Single-user password auth. Web Crypto only so it works in both the Node
 * route-handler runtime and the Edge middleware runtime.
 *
 * Session format: `<base64url(JSON{exp})>.<base64url(HMAC-SHA256)>`
 *
 *  - HttpOnly cookie (no JS access)
 *  - Signed with SESSION_SECRET (or HMAC-derived from AUTH_PASSWORD if unset)
 *  - Default lifetime: 7 days
 *  - SameSite=Lax + Secure (in production)
 */

export const COOKIE_NAME = "gearup_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** True iff a password is configured; when false, the app is fully open. */
export function authEnabled(): boolean {
  return !!process.env.AUTH_PASSWORD;
}

/**
 * Derive a stable signing secret. Prefers `SESSION_SECRET`; falls back to a
 * deterministic SHA-256 of the password so a single env var is enough to get
 * going. Setting `SESSION_SECRET` explicitly lets you invalidate all sessions
 * without rotating the password.
 */
async function getSecret(): Promise<string> {
  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const password = process.env.AUTH_PASSWORD ?? "";
  // Derive via SHA-256 — same input always yields same secret, so cookies
  // survive across restarts as long as the password hasn't changed.
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`gearup-session-derive::${password}`) as BufferSource,
  );
  return b64url(new Uint8Array(hash));
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = await getSecret();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Build a fresh signed session cookie value. */
export async function createSession(ttlMs = SESSION_TTL_MS): Promise<string> {
  const exp = Date.now() + ttlMs;
  const payloadStr = JSON.stringify({ exp });
  const payload = b64url(new TextEncoder().encode(payloadStr));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payload) as BufferSource,
  );
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

/** True iff the cookie is well-formed, signature valid, and not expired. */
export async function verifySession(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlDecode(signature) as BufferSource,
      new TextEncoder().encode(payload) as BufferSource,
    );
    if (!ok) return false;
    const decoded = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload) as BufferSource),
    ) as { exp?: number };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time string equality. Length is allowed to leak (negligible). */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Compare a user-submitted password to AUTH_PASSWORD in constant time. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected) return false;
  return constantTimeEqual(input, expected);
}

/** Cookie attributes shared by login + logout endpoints. */
export function cookieOptions(maxAgeSeconds: number) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

// -- In-memory rate limit (per-IP) ------------------------------------------
// Survives the life of one Node process. Fine for single-instance Hostinger.

type Bucket = { count: number; resetAt: number };
const RATE_BUCKETS = new Map<string, Bucket>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = RATE_BUCKETS.get(ip);
  if (!entry || entry.resetAt < now) {
    RATE_BUCKETS.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= RATE_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  // Hostinger / Vercel / reverse proxies set these. Falls back to "unknown" if
  // the request didn't come through a proxy — works for local dev.
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
