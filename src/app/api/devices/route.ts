import { NextResponse } from "next/server";
import { z } from "zod";
import { createDevice, listDevices } from "@/lib/store";
import { DeviceInputSchema } from "@/lib/types";

export async function GET() {
  const devices = await listDevices();
  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = DeviceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }
  const device = await createDevice(parsed.data);
  return NextResponse.json(device, { status: 201 });
}
