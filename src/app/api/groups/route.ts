import { NextResponse } from "next/server";
import { z } from "zod";
import { createGroup, listGroups } from "@/lib/store";
import { GroupInputSchema } from "@/lib/types";

export async function GET() {
  const groups = await listGroups();
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = GroupInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const group = await createGroup(parsed.data);
  return NextResponse.json(group, { status: 201 });
}
