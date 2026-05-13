import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "uploads", "receipts");

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  // Defend against traversal — only allow plain filenames.
  if (file.includes("/") || file.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const filePath = path.join(ROOT, file);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${file}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
