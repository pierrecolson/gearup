import { NextResponse } from "next/server";
import { searchIcons } from "@/lib/thiings";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(20, Number(url.searchParams.get("limit") ?? 8));
  const icons = await searchIcons(q, limit);
  return NextResponse.json({
    icons: icons.map((i) => ({
      slug: i.slug,
      title: i.title,
      category: i.category,
    })),
  });
}
