import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AddCategoryInputSchema,
  addCategory,
  loadCategories,
  removeCategory,
} from "@/lib/categories-store";

export async function GET() {
  return NextResponse.json(await loadCategories());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AddCategoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const created = await addCategory(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const ok = await removeCategory(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found or built-in" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
