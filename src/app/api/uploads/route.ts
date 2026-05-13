import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads", "receipts");
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
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = typeof deviceId === "string" && deviceId ? deviceId : nanoid(10);
  const filename = `${id}.${EXT[file.type]}`;
  const dest = path.join(UPLOAD_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buf);
  return NextResponse.json({ filename, path: `receipts/${filename}` });
}
