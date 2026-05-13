import { NextResponse } from "next/server";
import { getDevice, getGroup, listDevices } from "@/lib/store";
import { getSettings } from "@/lib/settings";
import { liveConvert } from "@/lib/currency";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const device = await getDevice(id);
  if (!device) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [settings, allDevices] = await Promise.all([
    getSettings(),
    listDevices(),
  ]);
  const group = device.groupId ? await getGroup(device.groupId) : null;
  const siblings = device.groupId
    ? allDevices.filter((d) => d.groupId === device.groupId && d.id !== device.id)
    : [];
  const livePrice =
    device.pricePaid !== null
      ? await liveConvert(
          device.pricePaid,
          device.currency,
          settings.displayCurrency,
        )
      : null;
  return NextResponse.json({
    device,
    group,
    siblings,
    livePrice,
    displayCurrency: settings.displayCurrency,
  });
}
