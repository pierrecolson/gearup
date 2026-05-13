import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_TTL_MS,
  authEnabled,
  checkRateLimit,
  clientIp,
  cookieOptions,
  createSession,
  verifyPassword,
} from "@/lib/auth";

const BodySchema = z.object({ password: z.string().min(1).max(1024) });

export async function POST(req: Request) {
  if (!authEnabled()) {
    return NextResponse.json(
      { error: "Auth not configured on this server" },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts, slow down" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.password)) {
    // Deliberately vague — don't leak whether the password was wrong vs.
    // some other failure.
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    ...cookieOptions(Math.floor(SESSION_TTL_MS / 1000)),
    value: token,
  });
  return res;
}
