import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabase, RECEIPTS_BUCKET } from "@/lib/supabase";

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const deviceId = form.get("deviceId");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }
  const id = typeof deviceId === "string" && deviceId ? deviceId : nanoid(10);
  const filename = `${id}.${EXT[file.type]}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(filename, buf, {
      contentType: file.type,
      upsert: true,
    });
  if (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ filename, path: `receipts/${filename}` });
}
