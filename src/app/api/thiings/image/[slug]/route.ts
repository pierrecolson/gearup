import { NextResponse } from "next/server";
import { fetchIconImage } from "@/lib/thiings";

const VALID = new Set([128, 256, 512, 1024]);

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const url = new URL(req.url);
  const sizeRaw = Number(url.searchParams.get("size") ?? 128);
  const size = VALID.has(sizeRaw) ? sizeRaw : 128;
  const result = await fetchIconImage(slug, size);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(result.buffer, {
    headers: {
      "Content-Type": result.contentType,
      // Icons are immutable; cache aggressively. Same TTL as the upstream.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
