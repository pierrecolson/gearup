import { NextResponse } from "next/server";
import { getRate } from "@/lib/currency";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const date = url.searchParams.get("date");
  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing from/to params" },
      { status: 400 },
    );
  }
  const rate = await getRate(from, to, date || undefined);
  if (rate === null) {
    return NextResponse.json({ error: "Rate unavailable" }, { status: 502 });
  }
  return NextResponse.json({ from, to, date: date ?? null, rate });
}
