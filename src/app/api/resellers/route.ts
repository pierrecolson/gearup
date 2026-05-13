import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createReseller,
  listResellers,
} from "@/lib/resellers-store";
import { ResellerInputSchema } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await listResellers());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ResellerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const created = await createReseller(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
