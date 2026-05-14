import { NextResponse } from "next/server";
import { supabase, RECEIPTS_BUCKET } from "@/lib/supabase";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h — long enough for an open tab to keep rendering.

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  // Defend against traversal — only allow plain filenames.
  if (file.includes("/") || file.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(file, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl, 302);
}
