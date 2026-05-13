import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Setting maxAge: 0 with the same name/path tells the browser to drop it.
  res.cookies.set({ ...cookieOptions(0), value: "" });
  return res;
}
