import { notFound } from "next/navigation";
import { getGroup, listDevices } from "@/lib/store";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/currency-format";
import { PageHeader } from "@/components/page-header";
import { DeviceCard } from "@/components/devices/device-card";
import { DeleteGroupButton } from "@/components/groups/delete-group-button";

type Ctx = { params: Promise<{ id: string }> };

export default async function GroupDetailPage({ params }: Ctx) {
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();
  const [devices, settings] = await Promise.all([listDevices(), getSettings()]);
  const members = devices.filter((d) => d.groupId === id);
  const total = members.reduce(
    (s, m) => s + (m.pricePaidBaseSnapshot ?? 0),
    0,
  );
  const baseCurrency =
    members.find((m) => m.baseCurrencyAtSnapshot)?.baseCurrencyAtSnapshot ??
    settings.displayCurrency;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title={
          <div className="space-y-2">
            <div>{group.name}</div>
            {total > 0 && (
              <div className="flex items-baseline gap-2 text-3xl font-semibold tabular-nums tracking-tight">
                {formatMoney(total, baseCurrency)}
                <span className="text-sm font-normal text-muted-foreground">
                  {members.length}{" "}
                  {members.length === 1 ? "device" : "devices"}
                </span>
              </div>
            )}
          </div>
        }
        description={group.notes ?? undefined}
        actions={<DeleteGroupButton id={group.id} name={group.name} />}
      />
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No devices in this group yet. Edit a device and assign it to this group.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      )}
    </div>
  );
}
