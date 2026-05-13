import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VersionEntrySchema,
  lookupReleases,
  setManualReleases,
} from "@/lib/version-lookup";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const family = url.searchParams.get("family");
  const refresh = url.searchParams.get("refresh") === "1";
  if (!family) {
    return NextResponse.json({ error: "Missing family" }, { status: 400 });
  }
  const result = await lookupReleases(family, { refresh });
  return NextResponse.json({ family, ...result });
}

const ManualBodySchema = z.object({
  family: z.string().min(1),
  entries: z.array(VersionEntrySchema),
});

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ManualBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  await setManualReleases(parsed.data.family, parsed.data.entries);
  return NextResponse.json({ ok: true });
}
